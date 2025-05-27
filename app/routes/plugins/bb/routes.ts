import {
	index,
	layout,
	route,
	type RouteConfig,
} from '@react-router/dev/routes'

// This should be imported and used as `...customizedWebRoutes` in `customizedRoutes` of `/app/routes/web/routes.ts`
export const bbWebRoutes = [
	layout('./routes/web/bbapp.tsx', [
		route('/', './routes/web/index/route.tsx'),
		route('/restaurant/:id', './routes/web/restaurant/route.tsx'),
		route('/my-rooms', './routes/web/my-rooms/route.tsx'),
	]),
] satisfies RouteConfig

// This should be imported and used as `...customizedAdminRoutes` in `customizedRoutes` of `/app/routes/papa/admin/routes.ts`
export const bbAdminRoutes = [
	// write your admin routes here, route should either:
	// 1. relative path: `route('custom-route', './where/your/file.tsx')` , which will automatically render under `/admin/custom-route`.
	// 2. direct path start with `/admin`: `route('/admin/custom-route', './where/your/file.tsx')`

	route('restaurant', './routes/plugins/bb/restaurant/route.tsx'),
] satisfies RouteConfig
