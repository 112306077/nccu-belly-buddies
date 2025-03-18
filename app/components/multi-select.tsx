/**
 * @see https://github.com/mxkaske/mxkaske.dev/blob/main/components/craft/fancy-multi-select.tsx
 */
import { Command as CommandPrimitive } from 'cmdk'
import { X } from 'lucide-react'
import * as React from 'react'

import { Badge } from '~/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    GetCommandState,
    GetCommandStateRef,
} from '~/components/ui/command'

type Option = Record<'value' | 'label', string>

interface MultiSelectInputProps {
    options: Option[]
    defaultSelected?: Option[]
    onSelectedChange?: (optionsSelected: Option[]) => void
    onUnSelect?: (option: Option) => void
    onEnterNewValue?: (value: string) => string
    placeholder?: string
    // className?: string  // className is not functional with cn() in div
    // id?: string  // id is controlled by cmdk
}

/**
 * @param options - Array of { value, label } to select from
 * @param defaultSelected - Array of { value, label } to be selected by default
 * @param onSelectedChange - Callback function to be called when the selected options change, returns option selected
 * @param onUnSelect - Callback function to be called when an option is unselected
 * @param onEnterNewValue - Callback function to generate id for when the new value entered, id default to label
 * @param placeholder - Placeholder text for the input field
 * @returns
 */
export const MultiSelect = ({
    options,
    defaultSelected,
    onSelectedChange,
    onUnSelect,
    onEnterNewValue,
    placeholder,
}: MultiSelectInputProps) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const getCommandStateRef = React.useRef<GetCommandStateRef>(null)
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState<Option[]>(
        defaultSelected ?? []
    )
    const [inputValue, setInputValue] = React.useState('')
    const [isComposing, setIsComposing] = React.useState(false)

    const handleUnselect = React.useCallback(
        (option: MultiSelectInputProps['options'][number]) => {
            setSelected(prev => {
                const newSelected = prev.filter(s => s.value !== option.value)

                // This is a workaround to make sure the unselect callback is called after the selected state is updated, prevent Warning: Cannot update a component (PostContent) while rendering a different component (MultiSelect).
                setTimeout(() => {
                    onUnSelect?.(option)
                    onSelectedChange?.(newSelected)
                }, 0)
                return newSelected
            })
        },
        []
    )

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (isComposing) return
            const input = inputRef.current
            if (input) {
                if (e.key === 'Enter') {
                    if (
                        input.value !== '' &&
                        getCommandStateRef.current?.getCommandState().filtered
                            .count === 0
                    ) {
                        const id = onEnterNewValue?.(input.value) ?? input.value
                        setSelected(prev => {
                            return [...prev, { value: id, label: input.value }]
                        })

                        setInputValue('')
                    }
                }
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (input.value === '') {
                        handleUnselect(selected[selected.length - 1])
                    }
                }
                // This is not a default behaviour of the <input /> field
                if (e.key === 'Escape') {
                    input.blur()
                }
            }
        },
        [isComposing, onEnterNewValue]
    )

    const selectables = options.filter(option => {
        return !selected.some(
            selectedOption => selectedOption.value === option.value
        )
    })

    return (
        <Command
            onKeyDown={e => {
                e.stopPropagation()
                handleKeyDown(e)
            }}
            className="overflow-visible bg-transparent"
        >
            <GetCommandState ref={getCommandStateRef} />
            <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset">
                <div className="flex flex-wrap gap-1">
                    {selected.map(option => {
                        return (
                            <Badge key={option.value} variant="secondary">
                                {option.label}
                                <button
                                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleUnselect(option)
                                        }
                                    }}
                                    onMouseDown={e => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    onClick={() => handleUnselect(option)}
                                >
                                    <X className="h-3 w-3 -mr-0.5 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        )
                    })}
                    {/* Avoid having the "Search" Icon */}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        onCompositionStart={() => {
                            setIsComposing(true)
                        }}
                        onCompositionEnd={() => {
                            setIsComposing(false)
                        }}
                        placeholder={placeholder ?? 'Select...'}
                        className={`flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${
                            selected.length > 0 ? 'ml-2' : ''
                        }`}
                    />
                </div>
            </div>
            <div className="relative mt-2">
                <CommandList>
                    {open &&
                        (selectables.length > 0 ? (
                            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                                <CommandEmpty>
                                    No results found. Enter to create one.
                                </CommandEmpty>
                                <CommandGroup className="h-full overflow-auto">
                                    {selectables.map(option => {
                                        return (
                                            <CommandItem
                                                key={option.value}
                                                onMouseDown={e => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                }}
                                                onSelect={value => {
                                                    setInputValue('')
                                                    setSelected(prev => {
                                                        const newSelected = [
                                                            ...prev,
                                                            option,
                                                        ]
                                                        onSelectedChange?.(
                                                            newSelected
                                                        )
                                                        return newSelected
                                                    })
                                                }}
                                                className={'cursor-pointer'}
                                            >
                                                {option.label}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </div>
                        ) : (
                            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                                <CommandGroup className="h-full overflow-auto">
                                    <CommandItem
                                        onMouseDown={undefined}
                                        onSelect={undefined}
                                        className={'cursor-default'}
                                        disabled
                                    >
                                        Add some options...
                                    </CommandItem>
                                </CommandGroup>
                            </div>
                        ))}
                </CommandList>
            </div>
        </Command>
    )
}
