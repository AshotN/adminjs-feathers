import { BaseProperty, PropertyType } from 'adminjs'
import { camelToSnakeCase, isEnum, stripNullable } from './utils/utils'

type PropertyOptions = {
	required: boolean
	idName: string
}

export class Property extends BaseProperty {
	public column: any
	public options: PropertyOptions

	constructor({
		column,
		columnPosition,
		options,
	}: {
		column: any
		columnPosition: number
		options: PropertyOptions
	}) {
		const path = column.propertyPath
		const isId = column.propertyPath === options.idName

		super({ path, isId, position: columnPosition })
		this.column = stripNullable(column)
		this.options = options
	}

	public isEditable(): boolean {
		if (
			this.path().toLowerCase() === 'created_at' ||
			this.path().toLowerCase() === 'createdat' ||
			this.path().toLowerCase() === 'updated_at' ||
			this.path().toLowerCase() === 'updatedat'
		) {
			return false
		}
		return !this.isId() && !this.column.readOnly
	}

	public isSortable(): boolean {
		return this.type() !== 'reference'
	}

	public reference(): string | null {
		const column = this.column

		if (column.type === 'array') {
			if (column.items.$schema) {
				return camelToSnakeCase(column.items.$schema).toLowerCase()
			}
		}
		if (column.anyOf) {
			const schema = column.anyOf.find((v: any) => v.$schema)
			if (schema) {
				return camelToSnakeCase(schema.$schema).toLowerCase()
			}
		}
		if (column.$schema) {
			return camelToSnakeCase(column.$schema).toLowerCase()
		}
		return null
	}

	public availableValues(): Array<any> | null {
		if (this.column.enum) return this.column.enum

		const values: Array<{ type: 'string'; const: string }> =
			this.column.anyOf?.filter(
				(v: any) => v.type === 'string' && v.const
			)
		if (values && values.length > 0) {
			return values.map((val) => val.const)
		}
		return null
	}

	public type(): PropertyType {
		let type: PropertyType | undefined

		let column = this.column

		if (this.column.anyOf) {
			const withoutNull = this.column.anyOf.filter(
				(val: { type: string }) => val.type !== 'null'
			)
			if (withoutNull.length === 1) {
				column = withoutNull[0]
			}
		}

		if (column.type === 'number') {
			return 'number'
		}

		if (column.format === 'date-time' || column.instanceOf === 'Date') {
			return 'datetime'
		}
		if (column.format === 'date') {
			return 'date'
		}
		if (column.type === 'boolean') {
			return 'boolean'
		}

		//Enum
		if (isEnum(column)) {
			return 'string'
		}

		if (column.type === 'object' || column.$ref || column.items?.$ref) {
			return 'key-value'
		}

		if (this.reference()) {
			return 'reference'
		}

		if (column.type === 'array') {
			return column.items.type || 'string'
		}

		if (column.type === 'string') {
			return 'string'
		}

		if (!type) {
			console.warn(
				`Unhandled column: ${JSON.stringify(column, null, '\t')}`
			)
		}

		return 'string'
	}

	public isArray(): boolean {
		if (this.column.anyOf) {
			const withoutNull = this.column.anyOf.filter(
				(val: { type: string }) => val.type !== 'null'
			)
			if (withoutNull.length === 1) {
				return withoutNull[0].type === 'array'
			}
		}
		return this.column.type === 'array'
	}

	public isRequired(): boolean {
		return this.options.required
	}
}
