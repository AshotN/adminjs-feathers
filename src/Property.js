'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Property = void 0
const adminjs_1 = require('adminjs')
class Property extends adminjs_1.BaseProperty {
	constructor({ column, columnPosition, schema }) {
		const path = column.propertyPath
		const isId = column.propertyPath === 'id'
		super({ path, isId, position: columnPosition })
		this.column = column
		this.schema = schema
	}
	isEditable() {
		return (
			!this.isId() &&
			!this.column.isCreateDate &&
			!this.column.isUpdateDate
		)
	}
	// public isId(): boolean {
	//   return this.column.propertyPath === 'id'
	// }
	isSortable() {
		return this.type() !== 'reference'
	}
	reference() {
		var _a, _b
		const ref = this.column.$ref
		if (this.column.type === 'array') {
			if (this.column.items.$ref) return this.column.items.$ref
		}
		return (_b =
			(_a =
				ref === null || ref === void 0 ? void 0 : ref.toLowerCase()) !==
				null && _a !== void 0
				? _a
				: this.column.$schema) !== null && _b !== void 0
			? _b
			: null
	}
	availableValues() {
		const values = this.column.anyOf
		if (values) {
			return values.map((val) => val.const)
		}
		return null
	}
	// public position(): number {
	//   return this.columnPosition || 0
	// }
	type() {
		let type
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
			type = 'reference'
		}
		//Enum
		if (this.column.anyOf) {
			type = 'string'
		}
		// eslint-disable-next-line no-console
		if (!type) {
			console.warn(`Unhandled type: ${this.column.type}`)
		}
		return type !== null && type !== void 0 ? type : 'string'
	}
	isArray() {
		return this.column.type === 'array'
	}
	isRequired() {
		var _a, _b
		if (
			this.schema.properties[this.column.propertyPath].default !==
			undefined
		)
			return false
		return (_b =
			(_a = this.schema.required) === null || _a === void 0
				? void 0
				: _a.includes(this.column.propertyPath)) !== null &&
			_b !== void 0
			? _b
			: false
	}
}
exports.Property = Property
//# sourceMappingURL=Property.js.map
