import { useEffect, useState } from 'react'
import { useFetcher, useLocation, useNavigate } from 'react-router'

import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { authClient } from '~/lib/auth/auth-client'

import type { action } from '../api/membership'
import { AppShell } from '../index/components/app-shell'
import type { Room } from '../index/components/room-list'

export default function RestaurantDetails() {
	const fetcher = useFetcher<typeof action>()
	const navigate = useNavigate()
	const roomFromLocation = useLocation().state as Room
	const [room, setRoom] = useState<Room>(roomFromLocation)
	const [error, setError] = useState<string | null>(null)
	const { data } = authClient.useSession()

	const isSubmitting = fetcher.state === 'submitting'

	useEffect(() => {
		if (fetcher.data) {
			const groupUpdated = fetcher.data.data
			if (groupUpdated && 'groupMembers' in groupUpdated) {
				setRoom(prevRoom => ({
					...prevRoom,
					groupMembers: groupUpdated.groupMembers,
				}))
			}
		}
	}, [fetcher])

	const handleJoinRoom = () => {
		if (!room || !room.id) {
			setError('Room not found or invalid room ID.')
			return
		}

		fetcher.submit(
			{},
			{
				method: 'post',
				action: '/api/membership/' + room.id, // Adjust the action URL as needed
			},
		)
	}

	if (error) {
		return (
			<AppShell>
				<div className="container py-6">
					<p className="text-red-500">{error}</p>
				</div>
			</AppShell>
		)
	}

	if (!room) {
		return (
			<AppShell>
				<div className="container py-6">
					<p>Loading...</p>
				</div>
			</AppShell>
		)
	}

	return (
		<AppShell>
			<div className="container py-6">
				<Button
					variant="ghost"
					className="mb-4 pl-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>

				<div className="grid gap-6 md:grid-cols-3">
					{/* Restaurant Details */}
					<div className="md:col-span-2">
						<Card>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="text-2xl">{room.name}</CardTitle>
										<CardDescription className="text-base mt-1">
											{room.foodPreference} • {room.proposedBudget}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								<div>
									<h3 className="font-medium mb-2">Restaurant Information</h3>
									<p className="text-muted-foreground">{room.description}</p>
								</div>

								<div className="grid gap-3">
									<div className="flex items-center text-sm">
										<MapPin className="mr-2 h-4 w-4 opacity-70" />
										<span>{room.restaurant?.address || 'no address'}</span>
									</div>
									<div className="flex items-center text-sm">
										<Clock className="mr-2 h-4 w-4 opacity-70" />
										<span>Open: {room.restaurant?.openingHours}</span>
									</div>
									<div className="flex items-center text-sm">
										<span className="mr-2 opacity-70">📞</span>
										<span>{room.restaurant?.phone || 'no phone'}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Meetup Details */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle>Meetup Details</CardTitle>
								<CardDescription>
									Organized by {room.creator.name}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center">
									<Avatar className="h-10 w-10 mr-3">
										<AvatarImage
											src={room.creator.image || '/placeholders/avatar.png'}
											alt={room.creator.name}
										/>
										<AvatarFallback>
											{room.creator.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">{room.creator.name}</p>
										<p className="text-sm text-muted-foreground">Host</p>
									</div>
								</div>

								<div>
									<h3 className="font-medium mb-1">Description</h3>
									<p className="text-sm text-muted-foreground">
										{room.description}
									</p>
								</div>

								<div className="space-y-2">
									<div className="flex items-center text-sm">
										<Clock className="mr-2 h-4 w-4 opacity-70" />
										<span>{room.startTime?.toDateString()}</span>
									</div>
									<div className="flex items-center text-sm">
										<Users className="mr-2 h-4 w-4 opacity-70" />
										<span>
											{room.groupMembers.length} / {room.numofPeople} people
										</span>
									</div>
								</div>

								<div className="pt-2">
									<Button
										className="w-full"
										onClick={handleJoinRoom}
										disabled={
											room.groupMembers.length >= room.numofPeople ||
											isSubmitting ||
											room.creatorId === data?.user.id ||
											room.groupMembers.some(
												member => member.userId === data?.user.id,
											)
										}
									>
										Join Meetup
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AppShell>
	)
}
