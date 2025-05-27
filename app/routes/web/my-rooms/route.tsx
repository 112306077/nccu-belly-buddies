import { redirect } from 'react-router'

import { auth } from '~/lib/auth/auth.server'
import { db } from '~/lib/db/db.server'

import { AppShell } from '../index/components/app-shell'
import { MyRoomsList } from '../index/components/my-rooms-list'
import type { Route } from './+types/route'

export async function loader({ request }: Route.LoaderArgs) {
	const session = await auth.api.getSession({
		headers: request.headers,
	})

	if (!session || !session.user) {
		throw redirect('/auth')
	}

	const myGroups = await db.transaction(async tx => {
		const groupIds = await tx.query.groupMember.findMany({
			where: (groupMember, { eq }) => eq(groupMember.userId, session.user.id),
		})

		return await tx.query.group.findMany({
			where: (group, { inArray }) =>
				inArray(
					group.id,
					groupIds.map(g => g.groupId),
				),
			with: {
				restaurant: true,
				creator: true,
				groupMembers: true,
			},
		})
	})

	return { myGroups }
}

export default function MyRooms({ loaderData }: Route.ComponentProps) {
	const { myGroups } = loaderData

	return (
		<AppShell>
			<div className="container py-6">
				<h1 className="text-3xl font-bold mb-6">My Rooms</h1>
				<MyRoomsList rooms={myGroups} />
			</div>
		</AppShell>
	)
}
