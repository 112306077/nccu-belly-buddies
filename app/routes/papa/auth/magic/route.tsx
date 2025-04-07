import { type LoaderFunctionArgs, redirect } from 'react-router'

import { MainWrapper } from '~/components/wrappers'
import { authCookie, verifyMagicLink } from '~/lib/db/auth.server'
import { getUserById, updateUser } from '~/lib/db/user.server'
import { UserRole, UserStatus } from '~/lib/db/schema'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const cookie = await authCookie.parse(request.headers.get('Cookie'))
    if (cookie && typeof cookie === 'object' && 'id' in cookie) {
        const { user } = await getUserById(cookie.id)
        if (user && user.status === 'ACTIVE' && user.role === 'ADMIN') {
            return redirect('/admin')
        }
    }

    const searchParams = new URL(request.url).searchParams
    const token = searchParams.get('token')
    if (!token) {
        return null
    }

    const decodedToken = await verifyMagicLink(token)
    if (!decodedToken) {
        return redirect('/admin/signin')
    }

    // Verify invite ADMIN function in /admin/admins
    const role = searchParams.get('role') as UserRole | null
    if (role === 'ADMIN') {
        const status: UserStatus = 'ACTIVE'
        await updateUser({ id: decodedToken.id, data: { status, role } })
    }

    return redirect('/admin', {
        headers: {
            'Set-Cookie': await authCookie.serialize({ id: decodedToken.id }),
        },
    })
}

export default function AdminMagic() {
    return (
        <MainWrapper className="justify-center">
            <h1 className="text-center mx-6">Please checkout your email.</h1>
        </MainWrapper>
    )
}
