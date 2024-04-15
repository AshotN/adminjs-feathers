# adminjs-feathers

An adapter to connect [AdminJS](https://github.com/SoftwareBrothers/adminjs) to [FeathersJS](https://github.com/feathersjs/feathers)

## Usage

Register the adapter

`AdminJS.registerAdapter({ Database, Resource })`

Create a resource

```ts
export const CompanyResource: ResourceWithOptions = {
	resource: {
		service: app.service('company'),
		schema: companySchema,
		options: {
			//Resource level options
			applyDefaults: true,
			databaseName: 'FeathersJS',
			treatNullableAsOptional: true,
			provider: 'adminJS',
		},
	},
	options: {},
}
```

Load your resource into AdminJS

```ts
const admin = new AdminJS({
	resources: [CompanyResource],
	rootPath: '/admin',
})
```

## Options

Since v0.1.0 the following options are available as both global and resource level options

| Property                | Default      | Version |
|-------------------------|--------------|---------|
| applyDefaults           | true         | 0.10.0  |
| treatNullableAsOptional | true         | 0.10.0  |
| provider                | 'adminJS'    | 0.10.0  |
| databaseName            | 'FeathersJS' | 0.10.0  |

### Global options example

```ts
globalOptions.set({
	applyDefaults: true,
	databaseName: 'FeathersJS',
	treatNullableAsOptional: true,
	provider: 'adminJS',
})
```

# Example

[![Example YouTube video](https://img.youtube.com/vi/DNkkZ90KRDo/0.jpg)](https://www.youtube.com/watch?v=DNkkZ90KRDo)
