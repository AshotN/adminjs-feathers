import { BaseProperty, PropertyType } from 'adminjs'

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
		return !this.isId()
	}

	public isSortable(): boolean {
		return this.type() !== 'reference'
	}

	public reference(): string | null {
		const ref: string | undefined = this.column.$ref
		if (this.column.type === 'array') {
			if (this.column.items.$ref) return this.column.items.$ref
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

		if (this.column.type === 'number') {
			type = 'number'
		}
		if (this.column.type === 'string') {
			type = 'string'
		}
		if (this.column.format === 'date') {
			type = 'date'
		}
		if (
			this.column.format === 'date-time' ||
			this.column.instanceOf === 'Date'
		) {
			type = 'datetime'
		}
		if (this.column.type === 'boolean') {
			type = 'boolean'
		}

		if (this.reference()) {
			return 'reference'
		}

		//Enum
		if (this.column.anyOf) {
			type = 'string'
		}

		if (!type) {
			console.warn(
				`Unhandled type: ${this.column.type} - ${this.column.propertyPath}`
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
