import { useState } from 'react'
import { Form } from 'react-router'

import { Loader2 } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

export function LoginForm({
	onLogin,
	showOtpInput,
	onVerifyOtp,
	isLoading,
	className,
	...props
}: React.ComponentProps<'div'> & {
	onLogin: (email: string) => void
	showOtpInput: boolean
	onVerifyOtp: (email: string, otp: string) => void
	isLoading: boolean
}) {
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState('') //新增

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<div className="relative size-32 md:hidden bg-muted mx-auto">
				<img
					src="/logo.png"
					alt="Belly Buddy"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
			<Card className="overflow-hidden">
				<CardContent className="grid p-0 md:grid-cols-2">
					{!showOtpInput ? (
						<Form
							key={'login-form'}
							className="px-8 py-12 lg:px-12 lg:py-20"
							onSubmit={e => {
								e.preventDefault()
								onLogin(email)
							}}
						>
							<div className="flex flex-col gap-6">
								<div className="flex flex-col items-center text-center">
									<h1 className="text-2xl font-bold">歡迎使用 Belly Buddy</h1>
									<p className="text-balance text-muted-foreground">
										立即輸入你的 Email 以登入或註冊，找到你的 Belly Buddy。
									</p>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										placeholder="m@example.com"
										required
									/>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? (
										<Loader2 className="animate-spin" />
									) : (
										'使用 Email 繼續'
									)}
								</Button>
							</div>
						</Form>
					) : (
						<Form
							key={'otp-form'}
							className="px-8 py-12 lg:px-12 lg:py-20"
							onSubmit={e => {
								e.preventDefault()
								onVerifyOtp(email, e.currentTarget.otp.value)
							}}
						>
							<div className="flex flex-col gap-6">
								<div className="flex flex-col items-center text-center">
									<h1 className="text-2xl font-bold">歡迎使用 Belly Buddy</h1>
									<p className="text-balance text-muted-foreground">
										請輸入您收到的 OTP 以登入或註冊，找到你的 Belly Buddy。
									</p>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="otp">輸入 OTP 一次性驗證碼</Label>
									<Input
										id="otp"
										type="text"
										value={otp}
										onChange={e => setOtp(e.target.value)}
										placeholder="123456"
										required
									/>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? <Loader2 className="animate-spin" /> : '登入'}
								</Button>
							</div>
						</Form>
					)}
					<div className="relative hidden bg-muted md:block">
						<img
							src="/logo.png"
							alt="Belly Buddy"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
			<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
				點擊「使用 Email 繼續」代表您同意我們的 <a href="#">服務合約</a> 與{' '}
				<a href="#">使用者政策</a>。
			</div>
		</div>
	)
}
