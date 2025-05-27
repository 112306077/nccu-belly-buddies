/**
 * 嗨 Dolphin 這邊寫給您。
 * 步驟：
 * 1. 在 <LoginForm> 裡面，有個 onLogin 的變數，必須要傳入一個 Function，
 這邊我已經先定義 function 是在線面的 const onLogin = (email: string)
 * 2. LoginForm 會調用這個 Func 並傳入 email
 * 3. 取得 email 後，您要調用 authClient 裡面的 `emailOtp.sendVerificationOtp`，
 這個是發送驗證碼的 API，你可以看 /app/routes/papa/auth/signin-form.tsx 看到相關內容
 * 4. 在成功傳送 otp 後（onSuccess），要將 opt 輸入框顯示出來（調用 `setOptSent(true)`）
 One-Time Password（一次性密碼）
 * 5. 接下來在 onVerifyOtp 裡面，您要調用 `authClient.signIn.emailOtp`，
 這個是驗證碼登入的 API，並傳入 email 和 otp
 * 6. 如果成功，則跳轉到首頁：/
 * 7. 如果失敗，則調用 `toast.error('驗證碼錯誤')` 顯示錯誤訊息
 *
 * p.s. toast 是一個顯示通知的 function，您可以在這邊使用它來顯示成功或失敗的訊息，
 請見 https://sonner.emilkowal.ski/
 */

import { useState } from 'react'
import { redirect, useNavigate } from 'react-router'

import { Loader2 } from 'lucide-react'
//是否顯示OTP輸入欄
import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
//顯示錯誤或成功的訊息
import { authClient } from '~/lib/auth/auth-client'
import { auth } from '~/lib/auth/auth.server'

import type { Route } from './+types/route'
//驗證API客戶端
import { LoginForm } from './components/form'

//顯示email跟OTP輸入欄位
export async function loader({ request }: Route.LoaderArgs) {
	const session = await auth.api.getSession({
		headers: request.headers,
	})
	if (session) {
		console.log('已經登入，跳轉到首頁')
		return redirect('/')
	}
	console.log('未登入，顯示登入頁面')
	return null
}

// If this is going to be a component route instead of an api route, add a default export component
export default function Auth() {
	const [otpSent, setOtpSent] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [openAlert, setOpenAlert] = useState<boolean>(false)
	const [email, setEmail] = useState<string>('')

	const navigate = useNavigate()
	//第 1 步補完：實作 onLogin 中的 API 呼叫

	const sendOtp = async (email: string) => {
		setIsLoading(true)

		try {
			// 發送 OTP 到使用者的 email
			await authClient.emailOtp.sendVerificationOtp(
				{
					email,
					type: 'sign-in',
				},
				{
					onError(context) {
						console.log('error', context)
					},
				},
			)

			// 成功後顯示 OTP 輸入欄
			toast.success('驗證碼已寄出')
			setOtpSent(true)
		} catch (err) {
			console.error('發送 OTP 失敗：', err)
			toast.error('發送驗證碼失敗，請稍後再試')
		}

		setIsLoading(false)
	}

	const onLogin = async (email: string) => {
		setEmail(email)
		setIsLoading(true)

		const { data: user } = await authClient.admin.listUsers({
			query: {
				searchField: 'email',
				searchValue: email,
			},
		})

		setIsLoading(false)

		if (!user) {
			return setOpenAlert(true)
		}

		await sendOtp(email)
	}

	//第 2 步：實作 onVerifyOtp(email, otp) 的 OTP 驗證邏輯與跳轉首頁

	const onVerifyOtp = async (email: string, otp: string) => {
		setIsLoading(true)

		try {
			// 驗證 OTP
			await authClient.signIn.emailOtp({
				email,
				otp,
			})
			// 成功 → 顯示成功訊息並導向首頁
			toast.success('登入成功')
			navigate('/')
		} catch (err) {
			console.error('OTP 驗證失敗：', err)
			toast.error('驗證碼錯誤，請重新輸入')
		}

		setOtpSent(false)
		setIsLoading(false)
	}

	return (
		<div className="w-full h-screen flex items-center justify-center">
			<div className="mx-auto max-w-2xl">
				<LoginForm
					onLogin={onLogin}
					showOtpInput={otpSent}
					onVerifyOtp={onVerifyOtp}
					isLoading={isLoading}
				/>

				{/* Alert for registration, may include user agreement */}
				<AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>即將使用您的 Email 註冊帳號</AlertDialogTitle>
							<AlertDialogDescription>
								您還不是我們的使用者，我們將使用{' '}
								<span className="font-bold">{email}</span> 為您註冊一個新的帳號
								<p className="text-xs mt-1">
									＊點擊註冊按鈕代表您同意我們的使用者條款
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>取消</AlertDialogCancel>
							<AlertDialogAction
								onClick={async () => {
									await sendOtp(email)
									setOpenAlert(false)
								}}
							>
								{isLoading ? <Loader2 className="animate-spin" /> : '註冊'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	)
}
