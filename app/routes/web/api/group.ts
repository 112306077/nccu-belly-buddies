/** 群組
 * 網址：http://localhost:5173/api/group/123
 * /api/group 是固定的，後面的 123 是變數，從 params.id 取得這個變數，請見 loader/action 的使用方法
 * 我有在 app/routes/web/routes.ts 設定 /:id
 * （「:id」表示變數名稱是 id 的變數，可以從 params.id 取得，也可以是「:groupId」，那 params 就要用 params.groupId 取得）
 */

import { redirect } from 'react-router'

import { and, asc, eq } from 'drizzle-orm'

import { auth } from '~/lib/auth/auth.server'
import { db } from '~/lib/db/db.server'
import * as schema from '~/lib/db/schema'
import type { ConventionalActionResponse } from '~/lib/utils'
import { validateAdminSession } from '~/routes/papa/auth/utils'

import type { Route } from './+types/group'

// action 負責處理 POST、PUT、DELETE request
export async function action({ request, params }: Route.ActionArgs) {
	// 如果沒有登入，重新導向登入頁面
	const userSession = await validateAdminSession(request)

	if (!userSession) {
		throw redirect('/admin/portal')
	}

	const groupId = params.id // 我有在 app/routes/web/routes.ts 設定 /:id
	const user = userSession.user
	// 以下可以開始處理 user 與 group id
	// ...

	const formData = await request.formData()

	switch (request.method) {
		case 'POST':
			// 從前端 POST 的 formData 中取得資料
			const groupFormData = {
				name: formData.get('groupName'),
				description: formData.get('groupDescription'),
				restaurantID: formData.get('restaurantID'),
				status: formData.get('status'),
				proposedBudget: formData.get('proposedBudget'),
				foodPreference: formData.get('foodPreference'),
				numofPeople: formData.get('numofPeople'),
				startTime: formData.get('startTime'),
				spokenLanguage: formData.get('spokenLanguage'),
			}

			if (
				typeof groupFormData.name !== 'string' ||
				typeof groupFormData.description !== 'string' ||
				typeof groupFormData.restaurantID !== 'string' ||
				typeof groupFormData.status !== 'string' ||
				typeof groupFormData.proposedBudget !== 'string' ||
				typeof groupFormData.foodPreference !== 'string' ||
				Number.isNaN(groupFormData.numofPeople) ||
				typeof groupFormData.startTime !== 'string' ||
				typeof groupFormData.spokenLanguage !== 'string'
			) {
				return {
					err: '請檢查輸入的資料是否正確',
				} satisfies ConventionalActionResponse
			}

			const postGroup = await db
				.insert(schema.group)
				.values({
					creatorId: user.id,
					name: groupFormData.name,
					description: groupFormData.description,
					restaurantID: groupFormData.restaurantID,
					status: groupFormData.status,
					proposedBudget: Number(groupFormData.proposedBudget),
					foodPreference: groupFormData.foodPreference,
					numofPeople: Number(groupFormData.numofPeople),
					startTime: new Date(groupFormData.startTime),
					spokenLanguage: groupFormData.spokenLanguage,
				})
				.returning()

			if (!postGroup[0]) {
				throw new Error('新增群組失敗')
			}

			const newGroup = postGroup[0]

			const [addAdmin] = await db
				// 他回傳會是 array，因為 insert 可以同時新增多筆資料，會是 [groupMember1, groupMember2, ...]
				// 但因為我們只有新增一筆，可以直接使用 [addAdmin] 來取得第一筆資料，同時將 groupMember1 資料設定為變數 addAdmin
				.insert(schema.groupMember)
				.values({
					groupId: newGroup.id,
					userId: user.id,
					role: 'Admin',
				})
				// 這邊要加上 returning 才會有 admin 的資料
				.returning()

			return {
				msg: '群組已創建，管理員已加入',
				data: {
					group: newGroup,
					admin: addAdmin,
				},
			} satisfies ConventionalActionResponse

		case 'PUT':
			// 處理 PUT 請求，通常是用來更新現有的資源
			// 例如：

			const groupFormUpdateData = {
				id: groupId, // 這是從 params.id 取得的群組 ID
				name: formData.get('groupName'),
				description: formData.get('groupDescription'),
				restaurantID: formData.get('restaurantID'),
				status: formData.get('status'),
				proposedBudget: formData.get('proposedBudget'),
				foodPreference: formData.get('foodPreference'),
				numofPeople: formData.get('numofPeople'),
				startTime: formData.get('startTime'),
				spokenLanguage: formData.get('spokenLanguage'),
			}

			if (
				typeof groupFormUpdateData.name !== 'string' ||
				typeof groupFormUpdateData.description !== 'string' ||
				typeof groupFormUpdateData.restaurantID !== 'string' ||
				typeof groupFormUpdateData.status !== 'string' ||
				typeof groupFormUpdateData.proposedBudget !== 'string' ||
				typeof groupFormUpdateData.foodPreference !== 'string' ||
				Number.isNaN(groupFormUpdateData.numofPeople) ||
				typeof groupFormUpdateData.startTime !== 'string' ||
				typeof groupFormUpdateData.spokenLanguage !== 'string'
			) {
				return {
					err: '請檢查輸入的資料是否正確',
				} satisfies ConventionalActionResponse
			}

			const updatedGroup = await db
				.update(schema.group)
				.set({
					name: groupFormUpdateData.name,
					description: groupFormUpdateData.description,
					restaurantID: groupFormUpdateData.restaurantID,
					status: groupFormUpdateData.status,
					proposedBudget: Number(groupFormUpdateData.proposedBudget),
					foodPreference: groupFormUpdateData.foodPreference,
					numofPeople: Number(groupFormUpdateData.numofPeople),
					startTime: new Date(groupFormUpdateData.startTime),
					spokenLanguage: groupFormUpdateData.spokenLanguage,
				})
				.where(eq(schema.group.id, groupId)) // 記得使用 where，不然所有資料都會變成 passed in value
			// .where 的使用方式是：從 schemas 中找到 group 的 schema，然後 group table(schema) 的 id 要等於傳入的 groupId

			return {
				msg: '群組已更新',
				data: updatedGroup,
			} satisfies ConventionalActionResponse
		case 'DELETE':
			console.log('DELETE request received for groupId:', groupId)
			const currentAdmin = await db
				.select({ role: schema.groupMember.role })
				.from(schema.groupMember)
				.where(
					and(
						eq(schema.groupMember.userId, user.id),
						eq(schema.groupMember.groupId, groupId),
					),
				)

			console.log('currentAdmin', currentAdmin)

			if (currentAdmin[0]?.role === 'Admin') {
				console.log('Admin is deleting the group')
				// Check if the admin has chosen to delete the group
				const formData = await request.formData()
				const action = formData.get('action') // 'delete' or 'assign'
				const newAdminId = formData.get('newAdminId') // Optional new admin ID
				// p.s. eraliest member 在 assign 的時候會用到

				if (action === 'delete') {
					// Delete the group
					await db.delete(schema.group).where(eq(schema.group.id, groupId))

					// p.s. 在 groupMember 中有設定 goupId onDelete: 'cascade'，就會在刪除的同時自動刪除 groupMember 中的資料

					return {
						msg: '群組已刪除',
					} satisfies ConventionalActionResponse
				} else if (action === 'assign') {
					let newAdminAssigned: string | undefined = undefined

					if (newAdminId) {
						// p.s. 在使用前檢查 adminId type === string 以避免 type error
						if (typeof newAdminId !== 'string') {
							throw new Error('Invalid new admin ID')
						}

						// Assign the chosen member as the new admin
						await db
							.update(schema.groupMember)
							.set({ role: 'Admin' })
							.where(
								and(
									eq(schema.groupMember.userId, newAdminId),
									eq(schema.groupMember.groupId, groupId),
								),
							)

						newAdminAssigned = newAdminId
					} else {
						// Automatically assign the earliest member as the new admin
						// p.s. 可以參考更簡潔的 asc desc 寫法：https://orm.drizzle.team/docs/select#order-by
						const earliestMember = await db
							.select({ userId: schema.groupMember.userId })
							.from(schema.groupMember)
							.where(eq(schema.groupMember.groupId, groupId))
							.orderBy(asc(schema.groupMember.createdAt))
							.limit(1)

						// 這邊如果沒有找到任何成員，就拋出錯誤，避免後面要刪除 user.id 的時候其實還沒有 update new admin
						if (earliestMember.length === 0) {
							throw new Error('No members found in the group')
						}
						await db
							.update(schema.groupMember)
							.set({ role: 'Admin' })
							.where(
								and(
									eq(schema.groupMember.userId, earliestMember[0].userId),
									eq(schema.groupMember.groupId, groupId),
								),
							)

						newAdminAssigned = earliestMember[0].userId
					}

					// Remove the current admin from the group
					await db
						.delete(schema.groupMember)
						.where(
							and(
								eq(schema.groupMember.userId, user.id),
								eq(schema.groupMember.groupId, groupId),
							),
						)

					return {
						msg: '管理員已更新',
						data: { newAdminAssigned: newAdminAssigned }, // { newAdminAssigned: newAdminAssigned } 其實可以縮寫成 { newAdminAssigned }，因為 key 與 value 一樣
					} satisfies ConventionalActionResponse
				}
			}

			console.log('User is not an admin, cannot delete group')
			return {
				err: '你不是管理員，無法刪除群組',
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

	const groupId = params.id // 我有在 app/routes/web/routes.ts 設定 /:id
	const user = session.user
	// 以下可以開始處理 user 與 group id
	// ...

	// 如果是 route: /api/group/all，則 groupId 會是 all
	if (groupId === 'all') {
		// 回傳所有 group

		// 取得所有狀態為 active 的群組
		const activeGroups = await db.query.group.findMany({
			where: (groupTable, { eq }) => eq(groupTable.status, 'active'),
		})

		console.log('activeGroups', activeGroups)
		// 返回資料給前端第一次頁面顯示所需要的內容，例如用 groupId 取得 group
		return {
			activeGroups: activeGroups,
		}
	} else {
		// 返回指定的 groupId
		const group = await db.query.group.findFirst({
			where: (groupTable, { eq }) => eq(groupTable.id, groupId),
		})

		console.log('group', group)

		return {
			group,
		}
	}
}
