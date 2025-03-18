import { ActionFunctionArgs, redirect } from '@remix-run/node'
import { Form, Link, useFetcher } from '@remix-run/react'
import { Loader2, PlusCircle, Trash } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { userIs } from '~/lib/db/auth.server'
import { createCategory, createTag } from '~/lib/db/blog-taxonomy.server'
import { createPost } from '~/lib/db/post.server'
import { commitFlashSession, getFlashSession } from '~/lib/sessions.server'
import { ConventionalActionResponse } from '~/lib/utils'
import {
    generatePostSlug,
    PostContent,
    PostContentEdit,
} from '~/routes/_papa.admin.blog.$postId/components/post-content'
import { taxonomySchema } from '~/routes/_papa.admin.blog.taxonomy.resource/route'
import { useAdminBlogContext } from '~/routes/_papa.admin.blog/route'
import {
    AdminActions,
    AdminHeader,
    AdminSectionWrapper,
    AdminTitle,
} from '~/routes/_papa.admin/components/admin-wrapper'
import { PostStatus } from '~/schema/database'

const PostCreateSchema = z.object({
    title: z.string(),
    content: z.string(),
    excerpt: z.string(),
    slug: z.string(),
    status: PostStatus,
    autherId: z.string().optional(),
    tagIDs: z.preprocess(val => {
        return typeof val === 'string' ? val.split(',').filter(Boolean) : []
    }, z.array(z.string()).default([])),
    categoryIDs: z.preprocess(val => {
        return typeof val === 'string' ? val.split(',').filter(Boolean) : []
    }, z.array(z.string()).default([])),
    'seo-title': z.string(),
    'seo-description': z.string(),
    newTags: z.preprocess(val => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val)
            } catch {
                return []
            }
        }
        return Array.isArray(val) ? val : []
    }, z.array(taxonomySchema).default([])),
    newCategories: z.preprocess(val => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val)
            } catch {
                return []
            }
        }
        return Array.isArray(val) ? val : []
    }, z.array(taxonomySchema).default([])),
})

export const action = async ({ request }: ActionFunctionArgs) => {
    const { user: admin } = await userIs(request, ['ADMIN'])

    if (request.method !== 'POST') {
        throw new Response('Method not allowed', { status: 405 })
    }

    const formData = await request.formData()
    const createPostData = Object.fromEntries(formData)

    const zResult = PostCreateSchema.safeParse(createPostData)

    if (!zResult.success || !zResult.data) {
        console.log('createPostData', zResult.error.issues)
        const message = zResult.error.issues
            .map(issue => `${issue.message} ${issue.path[0]}`)
            .join(' & ')
        return Response.json({
            err: message,
        } satisfies ConventionalActionResponse)
    }

    const [newTags, newCategories] = [
        zResult.data.newTags,
        zResult.data.newCategories,
    ]

    if (newCategories.length > 0) {
        await Promise.all(
            newCategories.map(async category => {
                await createCategory({ id: category.id, name: category.name })
            })
        )
    }

    if (newTags.length > 0) {
        await Promise.all(
            newTags.map(async tag => {
                await createTag({ id: tag.id, name: tag.name })
            })
        )
    }

    try {
        const { post } = await createPost({
            title: zResult.data.title,
            content: zResult.data.content,
            excerpt: zResult.data.excerpt,
            slug: zResult.data.slug,
            status: zResult.data.status,
            authorId: admin.id,
            tagIDs: zResult.data.tagIDs,
            categoryIDs: zResult.data.categoryIDs,
            seo: {
                metaTitle: zResult.data['seo-title'],
                metaDescription: zResult.data['seo-description'],
            },
        })

        const flashSession = await getFlashSession()
        flashSession.flash('success', [
            `Post "${post.title}" created successfully`,
        ])

        return redirect(`/admin/blog/${post.id}`, {
            headers: {
                'Set-Cookie': await commitFlashSession(flashSession),
            },
        })
    } catch (error) {
        console.error(error)
        return Response.json({
            err: 'Failed to create post',
        } satisfies ConventionalActionResponse)
    }
}

export default function AdminPost() {
    const fetcher = useFetcher()
    const { tags, categories } = useAdminBlogContext()
    const [isDirty, setIsDirty] = useState(false)
    const isSubmitting = fetcher.state === 'submitting'

    return (
        <AdminSectionWrapper>
            <AdminHeader>
                <AdminTitle title="New Post"></AdminTitle>
                <AdminActions>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size={'sm'} variant={'destructive'}>
                                <Trash height={16} width={16} />
                                <p className="text-xs">Discard</p>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Discard Post
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to discard this post?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Link to="/admin/blog">
                                    <AlertDialogAction
                                        onClick={() => {
                                            window.localStorage.removeItem(
                                                `dirty-post-new`
                                            )
                                        }}
                                    >
                                        Discard
                                    </AlertDialogAction>
                                </Link>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button type="submit" form="new-post" size={'sm'}>
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <PlusCircle size={16} />
                        )}
                        <p className="text-xs">Save</p>
                    </Button>
                </AdminActions>
            </AdminHeader>

            <Form
                id="new-post"
                onSubmit={e => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)

                    let title = formData.get(
                        'title'
                    ) as PostContentEdit['title']
                    let slug = formData.get('slug') as PostContentEdit['slug']

                    if (!title) {
                        title = `new-post-${new Date()
                            .getTime()
                            .toString()
                            .slice(-5)}`
                        formData.set('title', title)
                    }
                    if (!slug) {
                        slug = generatePostSlug(title)
                        formData.set('slug', slug)
                    }

                    fetcher.submit(formData, { method: 'POST' })
                    setIsDirty(false)
                }}
            >
                <PostContent
                    post={newPost}
                    tags={tags}
                    categories={categories}
                    onPostChange={(_, dirty) => setIsDirty(dirty)}
                />
            </Form>
        </AdminSectionWrapper>
    )
}

const newPost: PostContentEdit = {
    id: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    slug: '',
    title: '',
    content: '',
    excerpt: '',
    featuredImage: null,
    status: 'DRAFT',
    authorId: '',
    seoId: '',
    tagIDs: [],
    categoryIDs: [],
    subCategoryIDs: [],
    seo: {
        title: null,
        description: null,
    },
}
