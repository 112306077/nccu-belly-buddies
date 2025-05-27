import { redirect } from 'react-router'

import { and, eq, sql } from 'drizzle-orm'

import { auth } from '~/lib/auth/auth.server'
import { db } from '~/lib/db/db.server'
import * as schema from '~/lib/db/schema'
import type { ConventionalActionResponse } from '~/lib/utils'

import type { Route } from './+types/membership'

export async function action({
	request,
	params,
}: {
	request: Request
	params: { id: string }
}) {
	const session = await auth.api.getSession(request)
	if (!session) throw redirect('/auth')

	const groupId = params.id
	// 以下可以開始處理 user 與 membership id
	// ...

	const user = session.user

	switch (request.method) {
		case 'POST': {
			// 1. Get group info (including member limit)
			const group = await db.query.group.findFirst({
				where: eq(schema.group.id, groupId),
				columns: {
					id: true,
					name: true,
					numofPeople: true,
					status: true,
				},
			})

			if (!group) {
				return {
					msg: 'Group not found.',
					data: null,
				} satisfies ConventionalActionResponse
			}

			// 2. Count current members in group
			const userCount = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(schema.groupMember)
				.where(eq(schema.groupMember.groupId, groupId))

			const groupData = await db
				.select({ numOfPeople: schema.group.numofPeople })
				.from(schema.group)
				.where(eq(schema.group.id, groupId))

			// 3. Check if user count >= group's member limit
			if (userCount[0].count >= groupData[0].numOfPeople) {
				console.log(`Group ${groupId} is full. Cannot add more members.`)
				await db
					.update(schema.group)
					.set({ status: 'full' })
					.where(eq(schema.group.id, groupId))

				return {
					msg: '群組已滿，無法新增成員。',
					data: null,
				} satisfies ConventionalActionResponse
			}

			// 4. Check if user is already a member
			const existingMember = await db.query.groupMember.findFirst({
				where: and(
					eq(schema.groupMember.userId, user.id),
					eq(schema.groupMember.groupId, groupId),
				),
			})

			if (existingMember) {
				return {
					msg: '你已經是這個群組的成員了。',
					data: null,
				} satisfies ConventionalActionResponse
			}

			// 5. Insert new member
			await db.insert(schema.groupMember).values({
				groupId: groupId,
				userId: user.id,
			})

			if (userCount[0].count + 1 === groupData[0].numOfPeople) {
				await db
					.update(schema.group)
					.set({ status: 'full' })
					.where(eq(schema.group.id, groupId))
			}

			const updatedGroup = await db.query.group.findFirst({
				where: eq(schema.group.id, groupId),
				with: {
					restaurant: true,
					creator: true,
					groupMembers: true,
				},
			})

			return {
				msg: '新成員已加入',
				data: updatedGroup,
			} satisfies ConventionalActionResponse
		}
		case 'PUT':
			const updatedMember = await db
				.update(schema.groupMember)
				.set({ role: 'Admin' })
				.where(
					and(
						eq(schema.groupMember.userId, user.id),
						eq(schema.groupMember.groupId, groupId),
					),
				)
			return {
				msg: '成員已升級為管理員',
				data: updatedMember,
			} satisfies ConventionalActionResponse

		case 'DELETE':
			const leaveGroup = await db
				.delete(schema.groupMember)
				.where(
					and(
						eq(schema.groupMember.userId, user.id),
						eq(schema.groupMember.groupId, groupId),
					),
				)

			return {
				msg: '成員已退出',
				data: leaveGroup,
			} satisfies ConventionalActionResponse
		default:
			throw new Response('', {
				status: 405,
				statusText: 'Method Not Allowed',
			})
	}
}

// Loader 負責處理 GET request
export async function loader({ request, params }: Route.LoaderArgs) {
	// 如果沒有登入，重新導向登入頁面
	const session = await auth.api.getSession(request)
	if (!session) throw redirect('/auth')

	const membershipId = params.id // 我有在 app/routes/web/routes.ts 設定 /:id
	const user = session.user
	const { groupId } = await request.json()
	// 取得使用者加入的群組
	const userGroups = await db.query.groupMember.findMany({
		where: (groupMemberTable, { eq }) => eq(groupMemberTable.userId, user.id),
		with: {
			group: true, // 連結群組表，拿群組資料
		},
	})

	// 取得群組成員資料
	const membersInGroup = await db.query.groupMember.findMany({
		where: (groupMemberTable, { eq }) => eq(groupMemberTable.groupId, groupId),
		with: {
			user: true, // 一併帶出使用者資料
		},
	})

	// 返回資料
	return {
		api: '成員',
		id: membershipId,
		members: membersInGroup,
		userGroups: userGroups,
	}
}
