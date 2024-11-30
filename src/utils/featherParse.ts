import { TObject } from '@feathersjs/typebox'
import { stripNullable } from './utils'

const parseByType = (
	val: any,
	metadata?: { format: string; type: string; instanceOf: unknown }
) => {
	if (!metadata) return val
	if (metadata.instanceOf !== 'Date' && metadata.type === 'string') {
		if (metadata.format === 'date-time') {
			return new Date(val).toISOString()
		}
		if (metadata.format === 'date') {
			return new Date(val).toISOString().substring(0, 10)
		}
	}

	if (typeof val === 'function') {
		return undefined
	}

	return val
}

export const prepareForSend = (
	params: Record<string, any>,
	schema: TObject<any>
) => {
	return Object.keys(params).reduce(
		(acc, key) => {
			const type = stripNullable(schema.properties[key])
			acc[key] = parseByType(params[key], type)
			return acc
		},
		{} as Record<string, any>
	)
}
