export const isBool = (val: string) => val === 'true' || val === 'false'
export const isUUID = (val: string) =>
	val.match(
		/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
	)
export const isEnum = (column: any) => {
	return !!column.anyOf || column.enum
}

export const stripNullable = (column: any) => {
	if (column.anyOf) {
		const withoutNull = column.anyOf.filter(
			(val: { type: string }) => val.type !== 'null'
		)
		if (withoutNull.length === 1) {
			const { anyOf, ...rest } = column
			return { ...rest, ...withoutNull[0] }
		}
	}
	return column
}
export const camelToSnakeCase = (str: string) =>
	str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
