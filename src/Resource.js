'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Resource = void 0
/* eslint-disable no-param-reassign */
const adminjs_1 = require('adminjs')
const Property_1 = require('./Property')
const featherFilter_1 = require('./utils/featherFilter')
const featherParse_1 = require('./utils/featherParse')
class Resource extends adminjs_1.BaseResource {
	constructor({ service, schema }) {
		super(service)
		this.propsObject = {}
		this.service = service
		this.schema = schema
		this.propsObject = this.prepareProps()
	}
	databaseName() {
		return 'FeatherJS'
	}
	databaseType() {
		return 'other'
	}
	name() {
		return this.service.table
	}
	id() {
		return this.service.table
	}
	idName() {
		return Object.keys(this.schema.properties)[0]
	}
	properties() {
		return [...Object.values(this.propsObject)]
	}
	property(path) {
		return this.propsObject[path]
	}
	async count(filter) {
		//TODO: Filters
		const count = await this.service.find({
			query: { $limit: 0 },
			provider: 'adminJS',
			authenticated: true,
		})
		this.idName()
		return count.total
	}
	async find(
		filter,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		params
	) {
		const { limit = 10, offset = 0, sort = {} } = params
		const { direction, sortBy } = sort
		const featherFilter = (0, featherFilter_1.convertFilters)(filter)
		const featherSort =
			direction && sortBy
				? { $sort: { [sortBy]: direction === 'asc' ? 1 : -1 } }
				: null
		const instances = await this.service.find({
			query: Object.assign(
				Object.assign({ $limit: limit, $skip: offset }, featherFilter),
				featherSort
			),
			provider: 'adminJS',
			authenticated: true,
		})
		return instances.data.map((instance) => {
			return new adminjs_1.BaseRecord(instance, this)
		})
	}
	async findOne(id) {
		const instance = await this.service.get(id, {
			provider: 'adminJS',
			authenticated: true,
		})
		return new adminjs_1.BaseRecord(instance, this)
	}
	async findMany(ids) {
		const instances = await this.service.find(ids, {
			provider: 'adminJS',
			authenticated: true,
		})
		return instances.data.map(
			(instance) => new adminjs_1.BaseRecord(instance, this)
		)
	}
	async create(params) {
		const createData = (0, featherParse_1.prepareForSend)(
			params,
			this.schema
		)
		return this.service.create(createData, {
			provider: 'adminJS',
			authenticated: true,
		})
	}
	async update(pk, params = {}) {
		const instance = await this.findOne(pk)
		if (!instance)
			throw new adminjs_1.NotFoundError('Instance not found.', 'update')
		const preparedParams = adminjs_1.flat.unflatten(
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
		}, {})
		if (Object.keys(changes).length > 0)
			await this.service.patch(pk, changes)
		return preparedParams
	}
	async delete(pk) {
		const item = await this.findOne(pk)
		if (!item)
			throw new adminjs_1.NotFoundError(
				'Failed to find item to delete',
				'delete'
			)
		await this.service
			.remove(pk, { provider: 'adminJS', authenticated: true })
			.catch(() => {
				throw new adminjs_1.AppError('Failed to delete: ' + pk)
			})
	}
	prepareProps() {
		const props = this.schema.properties
		const keys = Object.keys(props)
		return keys.reduce((acc, k, index) => {
			const column = Object.assign(Object.assign({}, props[k]), {
				propertyPath: k,
			})
			const property = new Property_1.Property({
				column,
				columnPosition: index,
				schema: this.schema,
			})
			const path = property.path()
			acc[path] = property
			return acc
		}, {})
	}
	/** Converts params from string to final type */
	prepareParams(params) {
		const preparedParams = Object.assign({}, params)
		this.properties().forEach((property) => {
			const param = adminjs_1.flat.get(preparedParams, property.path())
			const key = property.path()
			// eslint-disable-next-line no-continue
			if (param === undefined) {
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
				if (param === null) {
					preparedParams[property.column.propertyName] = null
				} else {
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
			}
		})
		return preparedParams
	}
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	static isAdapterFor(rawResource) {
		return !!(rawResource.schema && rawResource.service)
	}
}
exports.Resource = Resource
//# sourceMappingURL=Resource.js.map
