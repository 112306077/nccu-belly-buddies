import { useEffect, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'

import { Clock, MapPin, Star, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { authClient } from '~/lib/auth/auth-client'
import type { group, groupMember, restaurant, user } from '~/lib/db/schema'

// Define the new Room type based on user's specification
export type Room = typeof group.$inferSelect & {
	restaurant: typeof restaurant.$inferSelect | null
	creator: typeof user.$inferSelect
	groupMembers: (typeof groupMember.$inferSelect)[]
}

export function RoomList({
	groups,
}: {
	groups: Room[] // Updated prop type to use the new Room interface
}) {
	const navigate = useNavigate()
	const fetcher = useFetcher()
	const { data } = authClient.useSession()
	const [reviewRoomId, setReviewRoomId] = useState<string | null>(null)
	const [selectedRating, setSelectedRating] = useState<number>(0)
	const [hoveredRating, setHoveredRating] = useState<number>(0)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [restaurantRatings, setRestaurantRatings] = useState<
		Record<string, number>
	>({})
	const [loadingRatings, setLoadingRatings] = useState<boolean>(false)

	// 獲取所有不重複的餐廳 ID
	const restaurantIds = groups
		.map(group => group.restaurantID)
		.filter((id): id is string => id !== null && id !== '') // Type guard to ensure non-null
		.filter((id, index, self) => self.indexOf(id) === index) // 移除重複的 restaurant ID

	// 獲取用戶對各餐廳的評分
	useEffect(() => {
		if (!data?.user || restaurantIds.length === 0) return

		setLoadingRatings(true)

		// 對每個餐廳獲取評分
		const fetchRatings = async () => {
			const ratings: Record<string, number> = {}

			// 為每個不同的餐廳 ID 獲取評分
			for (const restaurantId of restaurantIds) {
				try {
					const response = await fetch(
						`/api/rating/find?restaurantId=${restaurantId}&userId=${data.user.id}`,
					)
					if (response.ok) {
						const result = await response.json()
						// 如果找到評分，保存到 state 中
						if (result.rating && result.rating.score) {
							ratings[restaurantId] = result.rating.score
						}
					}
				} catch (error) {
					console.error(
						`Error fetching rating for restaurant ${restaurantId}:`,
						error,
					)
				}
			}

			setRestaurantRatings(ratings)
			setLoadingRatings(false)
		}

		fetchRatings()
	}, [data?.user?.id, JSON.stringify(restaurantIds)])

	const handleJoinRoom = (room: Room) => {
		fetcher.submit(
			{},
			{
				method: 'post',
				action: '/api/membership/' + room.id, // Adjust the action URL as needed
			},
		)
	}

	const handleCardClick = (roomId: string, room: Room) => {
		navigate(`/restaurant/${roomId}`, {
			state: room,
		}) // Assuming roomId still maps to a restaurant detail page
	}

	const handleReviewsClick = (e: React.MouseEvent, restaurantId: string) => {
		e.stopPropagation() // 防止卡片點擊事件觸發

		// 檢查用戶是否已經評過分
		if (restaurantRatings[restaurantId]) {
			toast.info(
				`您已經給這家餐廳評過分: ${restaurantRatings[restaurantId]} 星`,
			)
			return
		}

		setReviewRoomId(restaurantId)
		setSelectedRating(0)
		setHoveredRating(0)
	}

	const handleSubmitRating = () => {
		if (!reviewRoomId || selectedRating === 0) {
			toast.error('請選擇評分星級')
			return
		}

		// 檢查是否已經評過分
		if (restaurantRatings[reviewRoomId]) {
			toast.error('您已經評過分了')
			setReviewRoomId(null)
			return
		}

		setIsSubmitting(true)

		fetcher.submit(
			{
				restaurantId: reviewRoomId,
				score: selectedRating.toString(),
			},
			{
				action: `/api/rating/${reviewRoomId}`,
				method: 'post',
			},
		)

		// 更新本地狀態，這樣用戶就不用等待API響應
		const updatedRatings = { ...restaurantRatings }
		updatedRatings[reviewRoomId] = selectedRating
		setRestaurantRatings(updatedRatings)

		// 成功提交後清空表單狀態
		setReviewRoomId(null)
		setSelectedRating(0)
		setHoveredRating(0)
		setIsSubmitting(false)
	}

	return (
		<>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{groups.map(group => (
					<Card
						key={group.id}
						className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
						onClick={() => handleCardClick(group.id, group)}
					>
						<CardHeader className="pb-3">
							<div className="flex justify-between items-start">
								<div>
									<CardTitle>
										{group.name}
										<span className="text-sm ml-2">
											@ {group.restaurant?.name}
										</span>
									</CardTitle>{' '}
									<CardDescription className="mt-1">
										{group.description ?? 'No description available.'}{' '}
										{/* Handle null description */}
									</CardDescription>
								</div>
								<div className="flex flex-col items-center">
									<Avatar>
										<AvatarImage
											src={'/placeholders/avatar.png'}
											alt={group.name}
										/>
										<AvatarFallback>
											{group.creator.name.charAt(0).toUpperCase()}
										</AvatarFallback>{' '}
									</Avatar>
									<span className="text-xs text-muted-foreground mt-1">
										Host
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3 flex-1">
							<div className="flex items-center text-sm">
								<MapPin className="mr-2 h-4 w-4 opacity-70" />
								{/* Updated to use restaurant address */}
								<span>
									{group.restaurant?.address ?? 'Location not available'}
								</span>{' '}
							</div>
							<div className="flex items-center text-sm">
								<Clock className="mr-2 h-4 w-4 opacity-70" />
								{/* Format startTime (Date object) for display */}
								<span>
									{group.startTime
										? new Date(group.startTime).toLocaleTimeString('en-US', {
												weekday: 'short',
												hour: 'numeric',
												minute: '2-digit',
												hour12: true,
											})
										: 'Time TBD'}
								</span>
							</div>
							<div className="flex items-center text-sm">
								<Users className="mr-2 h-4 w-4 opacity-70" />
								<span>
									{group.groupMembers.length} / {group.numofPeople} people{' '}
								</span>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between items-center pt-3 border-t">
							<Button
								variant="ghost"
								size="sm"
								className={`text-muted-foreground hover:text-foreground p-0 ${
									group.restaurantID && restaurantRatings[group.restaurantID]
										? 'text-yellow-500'
										: ''
								}`}
								onClick={e => handleReviewsClick(e, group.restaurantID || '')}
							>
								<Star
									className={`mr-1 h-4 w-4 ${
										group.restaurantID && restaurantRatings[group.restaurantID]
											? 'fill-yellow-400'
											: ''
									}`}
								/>
								{group.restaurantID && restaurantRatings[group.restaurantID]
									? `已評分 (${restaurantRatings[group.restaurantID]}星)`
									: '評分'}
							</Button>
							<Button
								onClick={e => {
									e.stopPropagation()
									handleJoinRoom(group)
								}}
								disabled={
									group.groupMembers.length >= group.numofPeople ||
									group.creatorId === data?.user.id ||
									group.groupMembers.some(
										member => member.userId === data?.user.id,
									)
								} // Assuming currentPeople and numofPeople are in Room type
							>
								Join
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			<Dialog
				open={!!reviewRoomId}
				onOpenChange={open => !open && setReviewRoomId(null)}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>餐廳評分</DialogTitle>
						<DialogDescription>
							請為該餐廳評分，分享您的用餐體驗
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-center py-8">
						<div className="flex items-center space-x-2">
							{[1, 2, 3, 4, 5].map(rating => (
								<Star
									key={rating}
									className={`h-10 w-10 cursor-pointer transition-all ${
										rating <= (hoveredRating || selectedRating)
											? 'fill-yellow-400 text-yellow-400'
											: 'text-gray-300'
									}`}
									onMouseEnter={() => setHoveredRating(rating)}
									onMouseLeave={() => setHoveredRating(0)}
									onClick={() => setSelectedRating(rating)}
								/>
							))}
						</div>
					</div>
					<div className="text-center text-sm text-muted-foreground">
						{selectedRating === 0 && '請點擊星星進行評分'}
						{selectedRating === 1 && '很差 - 不推薦'}
						{selectedRating === 2 && '不太好 - 有待改進'}
						{selectedRating === 3 && '一般 - 符合基本期望'}
						{selectedRating === 4 && '很好 - 推薦給他人'}
						{selectedRating === 5 && '非常棒 - 強烈推薦！'}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">取消</Button>
						</DialogClose>
						<Button
							onClick={handleSubmitRating}
							disabled={selectedRating === 0 || isSubmitting}
						>
							{isSubmitting ? '提交中...' : '提交評分'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
