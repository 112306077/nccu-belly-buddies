import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { UnderConstruction } from '~/components/under-construction'
import { getSEO } from '~/lib/db/seo.server'
import { Footer } from '../../_web.plugin/_web/components/footer'
import { Nav } from '../../_web.plugin/_web/components/nav'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return data?.seo
        ? [
              { title: data.seo.metaTitle },
              { name: 'description', content: data.seo.metaDescription },
          ]
        : []
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { seo } = await getSEO(new URL(request.url).pathname)

    try {
        return { seo }
    } catch (error) {
        console.error(error)
        return { seo }
    }
}

export default function CV() {
    const { seo } = useLoaderData<typeof loader>()

    return (
        <>
            <h1 className="visually-hidden">{seo?.metaTitle}</h1>
            <UnderConstruction nav={<Nav />} footer={<Footer />} />
        </>
    )
}
