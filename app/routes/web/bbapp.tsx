import { Outlet, redirect } from 'react-router'

import { auth } from '~/lib/auth/auth.server'

import type { Route } from './+types/layout'

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	})

	if (!session) return redirect('/auth')
	return null
}

export default function Layout() {
	return <Outlet />
}
