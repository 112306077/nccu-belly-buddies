import { Loader2 } from 'lucide-react'

import { cn } from '~/lib/utils'

export const Loading = ({
	className,
	size = 16,
}: {
	className?: string
	size?: number
}) => {
	return <Loader2 size={size} className={cn('animate-spin', className)} />
}

export const FullScreenLoading = ({
	contained = false,
	className,
}: {
	contained?: boolean
	className?: string
}) => {
	return (
		<div
			className={cn(
				`z-9999 ${
					contained ? 'absolute' : 'fixed'
				} inset-0 flex justify-center items-center backdrop-blur-md`,
				className,
			)}
		>
			<SymmetrySpinner />
		</div>
	)
}

export const SymmetrySpinner = ({
	className,
	white,
}: {
	className?: string
	white?: boolean
}) => {
	return (
		<div
			className={cn(
				'w-16 h-16 z-50 border-4 border-y-primary border-x-transparent rounded-full animate-spin ease-in-out',
				white && 'border-y-primary-foreground',
				className,
			)}
		></div>
	)
}
