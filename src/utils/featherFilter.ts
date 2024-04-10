import { Filter } from 'adminjs'
import { Property } from '../Property'
import { isBool, isEnum, isUUID } from './utils'

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
		if (isEnum((f.property as Property).column)) {
			acc[f.path] = f.value
			return acc
		}
		acc[f.path] = { $like: `%${f.value}%` }
		return acc
	}, {} as Record<string, boolean | string | {}>)
}
