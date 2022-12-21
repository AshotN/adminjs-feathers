# adminjs-feathers

An adapter to connect [AdminJS](https://github.com/SoftwareBrothers/adminjs) to [FeathersJS](https://github.com/feathersjs/feathers)

## Usage

Register the adapter

`AdminJS.registerAdapter({ Database, Resource })`

Create a resource

```ts
export const CompanyResource: ResourceWithOptions = {
	resource: { service: app.service('company'), schema: companySchema },

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
