import { LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node'
import {
    Outlet,
    useLoaderData,
    useLocation,
    useOutletContext,
} from '@remix-run/react'
import { memo, useMemo } from 'react'

import { Breadcrumb, BreadcrumbList } from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import {
    SIDEBAR_COOKIE_NAME,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '~/components/ui/sidebar'
import { userIs } from '~/lib/db/auth.server'
import { generateBreadcrumbs } from '~/lib/utils'
import { AdminSidebar } from '~/routes/_papa.admin/components/admin-sidebar'
import { getPluginConfigs } from '~/routes/plugins/utils/get-plugin-configs.server'

export const meta: MetaFunction = () => {
    return [{ title: 'Admin' }, { name: 'description', content: 'Admin page' }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { user: admin } = await userIs(request, ['ADMIN'])

    const cookieHeader = request.headers.get('Cookie')

    let parsedSidebarStatus = null
    if (cookieHeader) {
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=')
                return [name, decodeURIComponent(value)]
            })
        )
        parsedSidebarStatus = cookies[SIDEBAR_COOKIE_NAME]
    }

    if (!admin) {
        throw redirect('/admin/signin')
    }

    const pluginConfigs = await getPluginConfigs()
    const pluginRoutes = pluginConfigs
        .flatMap(config => config.adminRoutes)
        .filter(routeItem => !!routeItem)

    return {
        admin: admin,
        pluginRoutes: pluginRoutes,
        sidebarStatus: parsedSidebarStatus === 'true',
    }
}

const MemoAdminSidebar = memo(AdminSidebar)

export default function Admin() {
    const { admin, pluginRoutes, sidebarStatus } =
        useLoaderData<typeof loader>()
    const location = useLocation()
    const breadcrumbPaths = generateBreadcrumbs(location.pathname)

    const memoizedUser = useMemo(
        () => ({
            name: admin.name ?? 'u-papa',
            email: admin.email,
            avatar: admin.imageUri ?? '/placeholders/avatar.png',
        }),
        [admin.name, admin.email, admin.imageUri]
    )

    const memoizedPluginRoutes = useMemo(() => pluginRoutes, [pluginRoutes])

    return (
        <SidebarProvider defaultOpen={sidebarStatus}>
            <MemoAdminSidebar
                user={memoizedUser}
                pluginRoutes={memoizedPluginRoutes}
            />
            <SidebarInset className="h-[calc(100svh-theme(spacing.4))] overflow-x-hidden">
                <header className="flex my-3 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>{breadcrumbPaths}</BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <Outlet context={{ admin, pluginRoutes }} />
            </SidebarInset>
        </SidebarProvider>
    )
}

export const useAdminContext = () => {
    return useOutletContext<typeof loader>()
}
