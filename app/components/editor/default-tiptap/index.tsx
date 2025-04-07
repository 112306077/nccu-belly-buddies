import 'highlight.js/styles/base16/atelier-dune.min.css'
import './styles.scss'

import { Editor, EditorContent, useEditor } from '@tiptap/react'
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { cn } from '~/lib/utils'
import { type ChatAPICustomBody } from '~/routes/papa/admin/api/ai-chat/route'
import { DefaultBubbleMenu } from '../components/menus/bubble-menu'
// import { DefaultFloatingMenu } from '../components/menus/floating-menu'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { MenuBar } from '../components/menus/menu-bar'
import ExtensionKit from '../extensions/extension-kit'

export interface EditorRef {
    updateContent: (content: string) => void
    getText: () => string
}

interface EditorProps {
    content?: string
    onUpdate?: ({
        toJSON,
        toHTML,
        toText,
    }: {
        toJSON: () => string
        toHTML: () => string
        toText: () => string
    }) => void
    onFocus?: () => void
    onBlur?: () => void
    className?: string
    menuBarClassName?: string
    editorContentClassName?: string
}

export default forwardRef<EditorRef, EditorProps>((props, ref) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [...ExtensionKit()],
        content: props.content ? JSON.parse(props.content) : undefined,
        onFocus: () => {
            props.onFocus && props.onFocus()
        },
        onBlur: () => {
            props.onBlur && props.onBlur()
        },
        onUpdate({ editor }) {
            props.onUpdate &&
                props.onUpdate({
                    toJSON: () => JSON.stringify(editor.getJSON()),
                    toHTML: () => editor.getHTML(),
                    toText: () => editor.getText(),
                })
        },
        editorProps: {
            attributes: {
                class: 'prose tracking-wide leading-loose dark:prose-invert py-5 mx-1 focus:outline-hidden',
            },
        },
    })

    useImperativeHandle(
        ref,
        () => ({
            updateContent(content: string) {
                editor?.commands.setContent(JSON.parse(content))
            },
            getText() {
                return editor?.getText() || ''
            },
        }),
        [editor]
    )

    ////////////////////////
    ///        AI        ///
    ////////////////////////
    const [aiProvider, setAiProvider] = useState<ChatAPICustomBody['provider']>(
        'gemini-1.5-flash-latest'
    )

    const onComplete = useCallback(
        (editor: Editor) => {
            const { selection, doc } = editor.state
            const { $head, from, to } = selection

            const defaultPrompt =
                'Please write a post about human education and its impact on eliminating Inequality Gap between Rich and Poor.'
            if (selection.empty) {
                // Use last 20 "lines" as prompt
                const textBefore = doc.textBetween(
                    0,
                    $head.pos,
                    '[papa | split]'
                )

                const prompt =
                    textBefore
                        .split('[papa | split]')
                        .filter(Boolean)
                        .slice(-20)
                        .join(' | ') || defaultPrompt

                editor.commands.setStreamView({
                    prompt,
                    provider: aiProvider,
                    status: 'loading',
                })
            } else {
                // Use selected text as prompt
                const content = doc.textBetween(from, to, '[papa | split]')
                const prompt =
                    content
                        .split('[papa | split]')
                        .filter(Boolean)
                        .join(' | ') || defaultPrompt

                editor.commands.setStreamView({
                    prompt,
                    provider: aiProvider,
                    status: 'loading',
                })
            }
        },
        [editor]
    )

    return (
        <div
            className={cn(
                'relative max-w-prose grow flex flex-col gap-3',
                props.className
            )}
        >
            {/* Editor part */}
            <div className="grow">
                {editor && (
                    <MenuBar
                        editor={editor}
                        className={props.menuBarClassName}
                        onComplete={() => onComplete(editor)}
                        onAiProviderSelect={ai => setAiProvider(ai)}
                    />
                )}
                {/* TODO: Many bubble menus like image/youtube/link */}
                {editor && (
                    <DefaultBubbleMenu
                        editor={editor}
                        onComplete={() => onComplete(editor)}
                    />
                )}
                {/* {editor && <DefaultFloatingMenu editor={editor} />} */}
                <EditorContent
                    onClick={() => editor?.commands.focus()}
                    editor={editor}
                    className={cn(
                        'grow cursor-text',
                        props.editorContentClassName
                    )}
                />
            </div>

            <footer className="flex justify-end items-center pt-2 px-1 border-t text-xs text-muted-foreground">
                <a
                    href="https://github.com/gjc14/papa"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View source code on GitHub"
                    aria-label="View source code on GitHub"
                >
                    <GitHubLogoIcon />
                </a>
            </footer>
        </div>
    )
})
