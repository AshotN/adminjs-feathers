import {
	AppError,
	BaseRecord,
	BaseResource,
	Filter,
	flat,
	NotFoundError,
} from 'adminjs'

import { Property } from './Property'
import { TObject } from '@feathersjs/typebox'
import { convertFilters } from './utils/featherFilter'
import { prepareForSend } from './utils/featherParse'
import { SupportedDatabasesType } from 'adminjs/src/backend/adapters/resource/supported-databases.type'

type ParamsType = Record<string, any>

export class Resource extends BaseResource {
	private service: any
	private schema: TObject

	private propsObject: Record<string, Property> = {}

	constructor({ service, schema }: { service: any; schema: TObject }) {
		super(service)

		this.service = service
		this.schema = schema
		this.propsObject = this.prepareProps()
	}

	public databaseName(): string {
		return 'FeatherJS'
	}

	public databaseType(): SupportedDatabasesType {
		return 'other'
	}

	public name(): string {
		return this.service.table
	}

	public id(): string {
		return this.service.table
	}

	public idName(): string {
		return Object.keys(this.schema.properties)[0]
	}

	public properties(): Array<Property> {
		return [...Object.values(this.propsObject)]
	}

	public property(path: string): Property {
		return this.propsObject[path]
	}

	public async count(filter: Filter): Promise<number> {
		const featherFilter = convertFilters(filter)

		const count = await this.service.find({
			query: { $limit: 0, ...featherFilter },
			provider: 'adminJS',
			authenticated: true,
		})
		this.idName()
		return count.total
	}

	public async find(
		filter: Filter,
		params: {
			limit?: number
			offset?: number
			sort?: { sortBy?: string; direction?: 'asc' | 'desc' }
		}
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
			authenticated: true,
		})

		return instances.data.map((instance: any) => {
			return new BaseRecord(instance, this)
		})
	}

	public async findOne(id: string | number): Promise<BaseRecord | null> {
		const instance = await this.service.get(id, {
			provider: 'adminJS',
			authenticated: true,
		})
		return new BaseRecord(instance, this)
	}

	public async findMany(
		ids: Array<string | number>
	): Promise<Array<BaseRecord>> {
		const instances = await this.service.find(ids, {
			provider: 'adminJS',
			authenticated: true,
		})
		return instances.data.map(
			(instance: any) => new BaseRecord(instance, this)
		)
	}

	public async create(params: Record<string, any>): Promise<ParamsType> {
		const createData = prepareForSend(params, this.schema)

		return this.service.create(createData, {
			provider: 'adminJS',
			authenticated: true,
		})
	}

	public async update(
		pk: string | number,
		params: any = {}
	): Promise<ParamsType> {
		const instance = await this.findOne(pk)
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

		if (Object.keys(changes).length > 0)
			await this.service.patch(pk, changes)
		return preparedParams
	}

	public async delete(pk: string | number): Promise<any> {
		const item = await this.findOne(pk)
		if (!item)
			throw new NotFoundError('Failed to find item to delete', 'delete')
		await this.service
			.remove(pk, { provider: 'adminJS', authenticated: true })
			.catch(() => {
				throw new AppError('Failed to delete: ' + pk)
			})
	}

	private prepareProps(): Record<string, Property> {
		const props = this.schema.properties
		const keys = Object.keys(props)
		return keys.reduce((acc, k, index) => {
			const column = { ...props[k], propertyPath: k }
			const property = new Property({
				column,
				columnPosition: index,
				schema: this.schema,
			})
			const path = property.path()
			acc[path] = property

			return acc
		}, {} as Record<string, Property>)
	}

	/** Converts params from string to final type */
	private prepareParams(params: Record<string, any>): Record<string, any> {
		const preparedParams: Record<string, any> = { ...params }

		this.properties().forEach((property) => {
			const param = flat.get(preparedParams, property.path())
			const key = property.path()

			if (param === undefined || param === null) {
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
		})

		return preparedParams
	}

	public static isAdapterFor(rawResource: any): boolean {
		return !!(rawResource.schema && rawResource.service)
	}
}
