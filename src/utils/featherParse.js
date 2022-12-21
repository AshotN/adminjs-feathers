'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.prepareForSend = void 0
const parseByType = (val, metadata) => {
	if (
		(metadata === null || metadata === void 0
			? void 0
			: metadata.format) === 'date'
	) {
		return new Date(val).toISOString().substring(0, 10)
	}
	return val
}
const prepareForSend = (params, schema) => {
	return Object.keys(params).reduce((acc, key) => {
		const type = schema.properties[key]
		//@ts-ignore
		const val = parseByType(params[key], type)
		acc[key] = val
		return acc
	}, {})
}
exports.prepareForSend = prepareForSend
//# sourceMappingURL=featherParse.js.map
