import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Form, useFetcher } from 'react-router'

import { Loader } from 'lucide-react'

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
	DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { restaurant } from '~/lib/db/schema'

import type { loader } from '../../api/restaurant'
import type { Room } from './room-list'

interface EditRoomFormProps {
	isOpen: boolean
	onClose: () => void
	room: Room | null
}

export function EditRoomForm({ isOpen, onClose, room }: EditRoomFormProps) {
	const fetcher = useFetcher()
	const loadFetcher = useFetcher<typeof loader>()
	const [formData, setFormData] = useState({
		groupName: '',
		groupDescription: '',
		restaurantID: '',
		status: 'active',
		proposedBudget: '',
		foodPreference: '',
		numofPeople: 4,
		date: '',
		time: '',
		spokenLanguage: '',
	})
	const [restaurants, setRestaurants] = useState<
		(typeof restaurant.$inferSelect)[]
	>([])
	const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
		null,
	) // id
	const restaurantFetchedRef = useRef(false)

	const isSubmitting = fetcher.state === 'submitting'
	const isLoading = loadFetcher.state === 'loading'

	// Initialize form data when the room changes
	useEffect(() => {
		if (room) {
			// Split the date and time from startTime if available
			let dateStr = ''
			let timeStr = ''

			if (room.startTime) {
				const date = new Date(room.startTime)
				dateStr = date.toISOString().split('T')[0]
				timeStr = date.toTimeString().split(' ')[0].substring(0, 5)
			}

			setFormData({
				groupName: room.name || '',
				groupDescription: room.description || '',
				restaurantID: room.restaurantID || '',
				status: room.status || 'active',
				proposedBudget: room.proposedBudget?.toString() || '',
				foodPreference: room.foodPreference || '',
				numofPeople: room.numofPeople || 4,
				date: dateStr,
				time: timeStr,
				spokenLanguage: room.spokenLanguage || '',
			})

			setSelectedRestaurant(room.restaurantID || null)
		}
	}, [room])

	useEffect(() => {
		if (loadFetcher.data) {
			setRestaurants(loadFetcher.data?.restaurants || [])
			restaurantFetchedRef.current = true
		}
	}, [loadFetcher.data])

	const fetchRestaurants = () => {
		if (restaurantFetchedRef.current) return // Prevent multiple fetches
		restaurantFetchedRef.current = true
		loadFetcher.load('/api/restaurant/all') // Load restaurants from the API
	}

	useEffect(() => {
		loadFetcher.load('/api/restaurant/all') // Load restaurants from the API
	}, [])

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!room) return

		const submitData = {
			groupName: formData.groupName,
			groupDescription: formData.groupDescription,
			restaurantID: selectedRestaurant || formData.restaurantID,
			status: formData.status,
			proposedBudget: formData.proposedBudget,
			foodPreference: formData.foodPreference,
			numofPeople: formData.numofPeople, // Will be sent as string
			startTime: `${formData.date}T${formData.time}`, // Combined date and time
			spokenLanguage: formData.spokenLanguage,
		}

		fetcher.submit(submitData, {
			method: 'put', // Using PUT for update
			action: `/api/group/${room.id}`, // Use the room ID in the route
		})

		onClose() // Close the dialog after submission
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200">
				<DialogHeader className="text-center">
					<div className="text-4xl mb-2">✏️</div>
					<DialogTitle className="text-orange-800 text-xl font-bold">
						Edit Room Details
					</DialogTitle>
					<DialogDescription className="text-orange-600">
						Update your restaurant meetup details.
					</DialogDescription>
				</DialogHeader>
				<Form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label
								htmlFor="groupName"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">🏷️</span>
								Group Name
							</Label>
							<Input
								id="groupName"
								name="groupName"
								value={formData.groupName}
								onChange={handleChange}
								required
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="groupDescription"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">📝</span>
								Description
							</Label>
							<Textarea
								id="groupDescription"
								name="groupDescription"
								value={formData.groupDescription}
								onChange={handleChange}
								required
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="restaurantID"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">🍽️</span>
								Restaurant {!!selectedRestaurant && ': '}
								{!!selectedRestaurant &&
									(restaurants.find(
										restaurant => restaurant.id === selectedRestaurant,
									)?.name ||
										'查無餐廳')}
							</Label>{' '}
							<Dialog>
								<DialogTrigger asChild>
									<Button
										onClick={fetchRestaurants}
										className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold"
									>
										<span className="mr-2">🔍</span>
										選擇餐廳
									</Button>
								</DialogTrigger>
								<DialogContent className="max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200">
									<DialogHeader>
										<DialogTitle>點擊選擇餐廳</DialogTitle>
										<DialogDescription></DialogDescription>
										<div className="flex flex-col space-y-2">
											{isLoading ? (
												<Loader className="animate-spin text-orange-500" />
											) : restaurants.length > 0 ? (
												<ul className="space-y-2">
													{restaurants.map(restaurant => (
														<DialogClose key={restaurant.id} asChild>
															<li>
																<Card
																	onClick={() => {
																		setSelectedRestaurant(restaurant.id)
																	}}
																	className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-orange-50 border-orange-200 hover:border-orange-300"
																>
																	<CardHeader>
																		<CardTitle>{restaurant.name}</CardTitle>
																		{restaurant.description && (
																			<CardDescription>
																				{restaurant.description}
																			</CardDescription>
																		)}
																	</CardHeader>
																	<CardContent>
																		<p>{restaurant.address}</p>
																	</CardContent>
																	{restaurant.phone && (
																		<CardFooter>
																			<p>{restaurant.phone}</p>
																		</CardFooter>
																	)}
																</Card>
															</li>
														</DialogClose>
													))}
												</ul>
											) : (
												<p>No restaurants available</p>
											)}
										</div>
									</DialogHeader>
								</DialogContent>
							</Dialog>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label
									htmlFor="date"
									className="text-orange-700 font-semibold flex items-center"
								>
									<span className="mr-2">📅</span>
									Date
								</Label>
								<Input
									id="date"
									name="date"
									type="date"
									value={formData.date}
									onChange={handleChange}
									required
									className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
								/>
							</div>
							<div className="grid gap-2">
								<Label
									htmlFor="time"
									className="text-orange-700 font-semibold flex items-center"
								>
									<span className="mr-2">🕒</span>
									Time
								</Label>
								<Input
									id="time"
									name="time"
									type="time"
									value={formData.time}
									onChange={handleChange}
									required
									className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="numofPeople"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">👥</span>
								Maximum People
							</Label>
							<Input
								id="numofPeople"
								name="numofPeople"
								type="number"
								min="2"
								max="20"
								value={formData.numofPeople}
								onChange={handleChange}
								required
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="proposedBudget"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">💰</span>
								Proposed Budget
							</Label>
							<Input
								id="proposedBudget"
								name="proposedBudget"
								value={formData.proposedBudget}
								onChange={handleChange}
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="foodPreference"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">🍴</span>
								Food Preference
							</Label>
							<Input
								id="foodPreference"
								name="foodPreference"
								value={formData.foodPreference}
								onChange={handleChange}
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="spokenLanguage"
								className="text-orange-700 font-semibold flex items-center"
							>
								<span className="mr-2">🗣️</span>
								Spoken Language
							</Label>
							<Input
								id="spokenLanguage"
								name="spokenLanguage"
								value={formData.spokenLanguage}
								onChange={handleChange}
								className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Updating...' : 'Update Room'}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
