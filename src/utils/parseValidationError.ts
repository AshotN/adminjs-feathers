import { BadRequest } from '@feathersjs/errors'
import { PropertyErrors } from 'adminjs'

export const parseValidationError: (error: BadRequest) => PropertyErrors = (
	error: BadRequest
) => {
	return error.data.reduce((acc: PropertyErrors, e: any) => {
		if (e.instancePath === '' && e.keyword === 'required') {
			acc[e.params.missingProperty] = { message: e.message }
			return acc
		}

		const propertyName = e.instancePath.replace('/', '')
		acc[propertyName] = { message: e.message }
		return acc
	}, {} as PropertyErrors)
}
