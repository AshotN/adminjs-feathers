import { Filter } from 'adminjs'
import { Property } from '../Property'

const isBool = (val: string) => val === 'true' || val === 'false'
const isUUID = (val: string) =>
	val.match(
		/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
	)

const isEnum = (property: Property) => {
	return !!property.column.anyOf
}
export const convertFilters = (filter: Filter) => {
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
		if (isEnum(f.property as Property)) {
			acc[f.path] = f.value
			return acc
		}
		acc[f.path] = { $like: `%${f.value}%` }
		return acc
	}, {} as Record<string, boolean | string | {}>)
}
