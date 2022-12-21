'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.convertFilters = void 0
const isBool = (val) => val === 'true' || val === 'false'
const isUUID = (val) =>
	val.match(
		/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
	)
const convertFilters = (filter) => {
	return filter.reduce((acc, f) => {
		if (typeof f.value !== 'string' || f.value === 'undefined') return acc
		if (isBool(f.value)) {
			acc[f.path] = f.value === 'true'
			return acc
		}
		if (f.property.type() === 'number') {
			acc[f.path] = parseFloat(f.value)
			return acc
		}
		if (isUUID(f.value)) {
			acc[f.path] = f.value
			return acc
		}
		acc[f.path] = { $like: `%${f.value}%` }
		return acc
	}, {})
}
exports.convertFilters = convertFilters
//# sourceMappingURL=featherFilter.js.map
