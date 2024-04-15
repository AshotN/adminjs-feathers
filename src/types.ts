import { ResourceWithOptions } from 'adminjs'
import { FeathersService } from '@feathersjs/feathers'
import { FeathersApplication } from '@feathersjs/feathers/src/declarations'
import { TObject } from '@feathersjs/typebox'

export interface AdminJSFeathersOptions {
	/**
	 * Should the adapter automatically apply your schemas default value during create/post requests
	 * @default true
	 */
	applyDefaults?: boolean
	/**
	 * When this is true, Nullable properties won't be required.
	 * If this is disabled as well as `applyDefaults` is false, Feathers may throw validation errors
	 * @default true
	 */
	treatNullableAsOptional?: boolean
	/**
	 * The string that is used in as the provider param when making a request to Feathers
	 * @default adminJS
	 */
	provider?: string
	/**
	 * The database name provided to AdminJS, this controls the name used in the navigation
	 * @default FeathersJS
	 */
	databaseName?: string
}

export type FeathersResource = Omit<ResourceWithOptions, 'resource'> & {
	resource: {
		service: FeathersService<FeathersApplication, any>
		schema: TObject
		options?: AdminJSFeathersOptions
	}
}
