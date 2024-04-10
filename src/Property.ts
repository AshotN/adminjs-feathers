import { BaseProperty, PropertyType } from 'adminjs'
import { isEnum } from './utils/utils'

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
		this.column = column
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
		const ref: string | undefined = this.column.$ref
		if (this.column.type === 'array') {
			if (this.column.items.$ref) {
				return this.column.items.$ref.toLowerCase()
			}
		}
		if (this.column.anyOf) {
			const schema = this.column.anyOf.find((v: any) => v.$schema)
			if (schema) {
				return schema.$schema.toLowerCase()
			}
		}
		return ref?.toLowerCase() ?? this.column.$schema?.toLowerCase() ?? null
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

	// public position(): number {
	//   return this.columnPosition || 0
	// }

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
			type = 'number'
		}
		if (column.type === 'string') {
			type = 'string'
		}
		if (column.format === 'date') {
			type = 'date'
		}
		if (column.format === 'date-time' || column.instanceOf === 'Date') {
			type = 'datetime'
		}
		if (column.type === 'boolean') {
			type = 'boolean'
		}
		if (column.type === 'object') {
			type = 'key-value'
		}

		//Enum
		if (isEnum(column)) {
			type = 'string'
		}

		if (column.type === 'array') {
			type = 'string'
		}

		if (this.reference()) {
			return 'reference'
		}

		if (!type) {
			console.warn(
				`Unhandled type: ${column.type} - ${column.propertyPath}`
			)
		}

		return type ?? 'string'
	}

	public isArray(): boolean {
		return this.column.type === 'array'
	}

	public isRequired(): boolean {
		return this.options.required
	}
}
