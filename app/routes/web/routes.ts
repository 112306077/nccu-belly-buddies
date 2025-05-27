/**
 * This file runs at the same level of your vite.config.ts and is not part of bundle.
 * Therefore, please use relative paths to import your routes, avoiding `~/your/route/config/path`.
 * @see https://github.com/remix-run/react-router/issues/12706
 */
import {
	index,
	layout,
	prefix,
	route,
	type RouteConfig,
} from '@react-router/dev/routes'

import { bbWebRoutes } from '../plugins/bb/routes'
import { blogRoute, indexRoute, splatRoute } from './papa.routes'

// Configure your customized routes here
const customizedRoutes = [
	// Add your customized routes here
	// ...prefix('/hello-world', [
	// layout('./routes/web/hello-world/layout.tsx', [
	// 	index('./routes/web/hello-world/index/route.tsx'),
	// 	route(':whateverParam', './routes/web/hello-world/param/route.tsx'),
	// ]),
	// // This is the same as the above, but using the `route` function
	// // route('/hello-world/hello', './routes/web/hello-world/layout.tsx', [
	// // 	index('./routes/web/hello-world/index/route.tsx'),
	// // 	route(':whateverParam', './routes/web/hello-world/param/route.tsx'),
	// // ])

	...bbWebRoutes,

	route('/auth', './routes/web/auth/route.tsx'),

	...prefix('/api', [
		route('comment/:id', './routes/web/api/comment.ts'),
		route('group/:id', './routes/web/api/group.ts'),
		route('membership/:id', './routes/web/api/membership.ts'),
		route('rating/:id', './routes/web/api/rating.ts'),
		route('report/:id', './routes/web/api/report.ts'),
		route('restaurant/:id', './routes/web/api/restaurant.ts'),
	]),
] satisfies RouteConfig

const systemRoutes = [
	layout('./routes/web/layout.tsx', [
		...(customizedRoutes.length === 0
			? [indexRoute(), blogRoute(), splatRoute()]
			: // Adding customized web routes
				customizedRoutes),
	]),
] satisfies RouteConfig

export const webPage = () => {
	return [...systemRoutes]
}
