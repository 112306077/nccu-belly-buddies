import { Outlet, useLoaderData, useOutletContext } from '@remix-run/react'

import { getCategories, getTags } from '~/lib/db/taxonomy.server'
import { getPosts } from '~/lib/db/post.server'
import { useAdminContext } from '~/routes/_papa.admin/route'

export const loader = async () => {
    try {
        const { posts } = await getPosts({ status: 'ALL' })
        const { tags } = await getTags()
        const { categories } = await getCategories()
        return { posts, tags, categories }
    } catch (error) {
        console.error(error)
        return { posts: [], categories: [], tags: [] }
    }
}

export default function AdminBlog() {
    const loaderDate = useLoaderData<typeof loader>()
    const adminContext = useAdminContext()

    return <Outlet context={{ ...loaderDate, ...adminContext }} />
}

export const useAdminBlogContext = () => {
    return useOutletContext<
        ReturnType<typeof useLoaderData<typeof loader>> &
            ReturnType<typeof useAdminContext>
    >()
}
