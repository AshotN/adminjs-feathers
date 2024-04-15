import { AdminJSFeathersOptions } from './types'

export class AdminJSFeathersGlobalOptions {
	public static options: AdminJSFeathersOptions

	constructor() {
		AdminJSFeathersGlobalOptions.options = {
			applyDefaults: true,
			treatNullableAsOptional: true,
			provider: 'adminJS',
			databaseName: 'FeathersJS',
		}
	}

	public set(config: Partial<typeof AdminJSFeathersGlobalOptions.options>) {
		AdminJSFeathersGlobalOptions.options = {
			...AdminJSFeathersGlobalOptions.options,
			...config,
		}
	}
}

export const globalOptions = new AdminJSFeathersGlobalOptions()
