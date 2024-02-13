import {
	ActionContext,
	AppError,
	BaseRecord,
	BaseResource,
	Filter,
	flat,
	NotFoundError,
	ValidationError,
} from 'adminjs'

import { Property } from './Property'
import { TObject } from '@feathersjs/typebox'
import { convertFilters } from './utils/featherFilter'
import { prepareForSend } from './utils/featherParse'
import { SupportedDatabasesType } from 'adminjs/src/backend/adapters/resource/supported-databases.type'
import { BadRequest } from '@feathersjs/errors'
import { parseValidationError } from './utils/parseValidationError'
import { FeathersService } from '@feathersjs/feathers'

type ParamsType = Record<string, any>

export class Resource extends BaseResource {
	public service: FeathersService
	public schema: TObject<any>

	private propsObject: Record<string, Property> = {}

	constructor({ service, schema }: { service: any; schema: TObject }) {
		super(service)

		this.service = service
		this.schema = schema
		this.propsObject = this.prepareProps()
	}

	public databaseName(): string {
		return 'FeathersJS'
	}

	public databaseType(): SupportedDatabasesType {
		return 'other'
	}

	public name(): string {
		return this.schema.$id.toLowerCase()
	}

	public id(): string {
		return this.schema.$id.toLowerCase()
	}

	public idName(): string {
		return this.service.id ?? Object.keys(this.schema.properties)[0]
	}

	public properties(): Array<Property> {
		return [...Object.values(this.propsObject)]
	}

	public property(path: string): Property {
		return this.propsObject[path]
	}

	public async count(
		filter: Filter,
		context?: ActionContext
	): Promise<number> {
		const featherFilter = convertFilters(filter)

		const count = await this.service.find({
			query: { $limit: 0, ...featherFilter },
			provider: 'adminJS',
			...(context?.currentAdmin?.feathers ?? { authenticated: true }),
		})
		return count.total
	}

	public async find(
		filter: Filter,
		params: {
			limit?: number
			offset?: number
			sort?: { sortBy?: string; direction?: 'asc' | 'desc' }
		},
		context?: ActionContext
	): Promise<Array<BaseRecord>> {
		const { limit = 10, offset = 0, sort = {} } = params
		const { direction, sortBy } = sort
		const featherFilter = convertFilters(filter)
		const featherSort =
			direction && sortBy
				? { $sort: { [sortBy]: direction === 'asc' ? 1 : -1 } }
				: null
		const instances = await this.service.find({
			query: {
				$limit: limit,
				$skip: offset,
				...featherFilter,
				...featherSort,
			},
			provider: 'adminJS',
			...(context?.currentAdmin?.feathers ?? { authenticated: true }),
		})

		return instances.data.map((instance: any) => {
			return new BaseRecord(instance, this)
		})
	}

	public async findOne(
		id: string | number,
		context?: ActionContext
	): Promise<BaseRecord | null> {
		const instance = await this.service.get(id, {
			provider: 'adminJS',
			...(context?.currentAdmin?.feathers ?? { authenticated: true }),
		})
		return new BaseRecord(instance, this)
	}

	public async findMany(
		ids: Array<string | number>,
		context?: ActionContext
	): Promise<Array<BaseRecord>> {
		const instances = await this.service.find({
			query: { [this.idName()]: { $in: ids } },
			provider: 'adminJS',
			...(context?.currentAdmin?.feathers ?? { authenticated: true }),
		})
		return instances.data.map(
			(instance: any) => new BaseRecord(instance, this)
		)
	}

	public async create(
		params: Record<string, any>,
		context?: ActionContext
	): Promise<ParamsType> {
		const createData = prepareForSend(params, this.schema)

		return this.service
			.create(createData, {
				provider: 'adminJS',
				...(context?.currentAdmin?.feathers ?? { authenticated: true }),
			})
			.catch((e: unknown) => {
				if (e instanceof BadRequest) {
					if (e.data)
						throw new ValidationError(parseValidationError(e))
				}
				if (e instanceof Error) {
					throw new AppError(e.message)
				}
				throw e
			})
	}

	public async update(
		pk: string | number,
		params: any = {},
		context?: ActionContext
	): Promise<ParamsType> {
		const instance = await this.findOne(pk, context)
		if (!instance) throw new NotFoundError('Instance not found.', 'update')

		const preparedParams = flat.unflatten<any, any>(
			this.prepareParams(params)
		)
		const changes = Object.keys(preparedParams).reduce((acc, key) => {
			const oldVal = instance.get(key)
			const newVal = preparedParams[key]

			//Comparison does not compare object values, so objects are always !==
			if (oldVal !== newVal) {
				//If the oldVal is a Date and the new one is not, this means it wasn't edited.
				//An edited date comes to us as a Date object, in which case we compare the underlying time
				if (oldVal instanceof Date) {
					if (!(newVal instanceof Date)) return acc
					if (oldVal.getTime() === newVal.getTime()) return acc
				}
				acc[key] = preparedParams[key]
			}
			return acc
		}, {} as Record<string, any>)

		if (Object.keys(changes).length > 0) {
			await this.service
				.patch(pk, changes, {
					provider: 'adminJS',
					...(context?.currentAdmin?.feathers ?? {
						authenticated: true,
					}),
				})
				.catch((e: unknown) => {
					if (e instanceof BadRequest) {
						if (e.data)
							throw new ValidationError(parseValidationError(e))
					}
					if (e instanceof Error) {
						throw new AppError(e.message)
					}
					throw e
				})
		}
		return preparedParams
	}

	public async delete(
		pk: string | number,
		context?: ActionContext
	): Promise<any> {
		const item = await this.findOne(pk, context)
		if (!item)
			throw new NotFoundError('Failed to find item to delete', 'delete')
		await this.service
			.remove(pk, {
				provider: 'adminJS',
				...(context?.currentAdmin?.feathers ?? { authenticated: true }),
			})
			.catch(() => {
				throw new AppError('Failed to delete: ' + pk)
			})
	}

	private prepareProps(): Record<string, Property> {
		const props = this.schema.properties
		const requiredKeys = this.schema.required ?? []
		const keys = Object.keys(props)
		return keys.reduce((acc, k, index) => {
			const column = { ...props[k], propertyPath: k }
			const property = new Property({
				column,
				columnPosition: index,
				options: {
					required:
						!column.anyOf?.some(
							(val: any) => val.type === 'null'
						) &&
						!column.nullable &&
						requiredKeys.includes(column.propertyPath),
					idName: this.idName(),
				},
			})
			const path = property.path()
			acc[path] = property

			return acc
		}, {} as Record<string, Property>)
	}

	/** Converts params from string to final type */
	private prepareParams(params: Record<string, any>): Record<string, any> {
		const preparedParams: Record<string, any> = {}

		this.properties().forEach((property) => {
			const param = flat.get(params, property.path())
			const key = property.path()

			if (param === undefined || param === null) {
				return
			}

			if (!property.isEditable()) {
				return
			}

			const type = property.type()

			if (type === 'mixed') {
				preparedParams[key] = param
			}

			if (type === 'number') {
				if (property.isArray()) {
					// preparedParams[key] = param ? param.map((p) => safeParseNumber(p)) : param
				} else {
					preparedParams[key] = parseFloat(param)
				}
			}

			if (type === 'reference') {
				const [ref, foreignKey] =
					property.column.propertyPath.split('.')
				const id =
					property.column.type === Number ? Number(param) : param
				preparedParams[ref] = foreignKey
					? {
							[foreignKey]: id,
					  }
					: id
			}

			preparedParams[key] = param
		})

		return preparedParams
	}

	public static isAdapterFor(rawResource: any): boolean {
		return !!(rawResource.schema && rawResource.service)
	}
}
