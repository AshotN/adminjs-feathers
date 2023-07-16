import { TObject } from '@feathersjs/typebox'

const parseByType = (val: any, metadata?: { format: string; type: string }) => {
	if (metadata?.format === 'date') {
		return new Date(val).toISOString().substring(0, 10)
	}

	return val
}

export const prepareForSend = (
	params: Record<string, any>,
	schema: TObject<any>
) => {
	return Object.keys(params).reduce((acc, key) => {
		const type = schema.properties[key]
		acc[key] = parseByType(params[key], type)
		return acc
	}, {} as Record<string, any>)
}
