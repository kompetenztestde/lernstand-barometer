<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconCheckSelected from '@/components/icons/IconCheckSelected.vue'

interface SelectOption {
    value: string | number
    label: string
}

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
    sm: 'px-2 py-1 xl:px-2 xl:py-1 text-sm',
    md: 'px-3 py-1.5 xl:px-4 xl:py-2 text-base',
    lg: 'px-4 py-5 xl:px-6 xl:py-3 text-lg',
}

interface Props {
    id?: string
    ariaLabel?: string
    hasError?: boolean
    disabled?: boolean
    modelValue?: string | number
    options: SelectOption[]
    placeholder?: string
    size?: Size
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Auswählen',
    hasError: false,
    disabled: false,
    size: 'md',
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const selectedLabel = computed(() => props.options.find((o) => o.value === props.modelValue)?.label)
const selectedValue = computed(() => props.options.find((o) => o.value === props.modelValue)?.value)

const activeIndex = ref(-1)

function openDropdown() {
    if (props.disabled) return
    open.value = true
    activeIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
}

function closeDropdown() {
    open.value = false
    activeIndex.value = -1
}

function select(option: SelectOption) {
    emit('update:modelValue', option.value)
    closeDropdown() // activeIndex is also reset
}

// Control via keyboard
function onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
            e.preventDefault()
            if (!open.value) {
                openDropdown()
            } else {
                activeIndex.value =
                    e.key === 'ArrowDown'
                        ? (activeIndex.value + 1) % props.options.length
                        : (activeIndex.value - 1 + props.options.length) % props.options.length
            }
            break

        case 'Enter':
        case ' ':
            e.preventDefault() // prevents scrolling
            if (!open.value) {
                openDropdown()
            } else if (activeIndex.value >= 0) {
                select(props.options[activeIndex.value])
            }
            break

        case 'Escape':
            closeDropdown()
            break
    }
}

// closing the dropdown on outside click
const root = ref<HTMLElement | null>(null)
function handleClickOutside(e: MouseEvent) {
    if (root.value && !root.value.contains(e.target as Node)) {
        open.value = false
    }
}

watch(open, (val) => {
    if (val) {
        activeIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
    }
})

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
    <div
        ref="root"
        class="relative w-full rounded border border-gray-300"
        :class="{ 'border-gray-500!': open && !props.disabled, 'hover:border-gray-500!': !props.disabled }"
    >
        <button
            :id="id"
            :disabled="props.disabled"
            type="button"
            @click="openDropdown"
            :class="[
                sizes[props.size],
                'flex w-full items-center justify-between text-left hover:cursor-pointer',
                {
                    'cursor-not-allowed! bg-gray-200! text-gray-500 hover:border-gray-300!': props.disabled,
                    'rounded border border-red-700!': props.hasError,
                },
            ]"
            @keydown="onKeyDown"
            :aria-activedescendant="activeIndex >= 0 ? `option-${activeIndex}` : undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="!ariaLabel && id ? `${id}-label` : undefined"
        >
            <span class="min-w-0 flex-1 truncate">{{ selectedLabel || placeholder }}</span>
            <IconChevronDown
                stroke-width="3"
                class="ml-1 size-3 shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ '-rotate-180': open }"
            />
        </button>

        <ul
            v-if="open"
            role="listbox"
            class="absolute z-50 mt-1 w-max min-w-full rounded bg-white p-1 shadow-lg outline-1 outline-gray-300"
        >
            <li
                v-for="(option, index) in options"
                :id="`option-${index}`"
                :key="option.value"
                role="option"
                :aria-selected="selectedValue === option.value"
                @click="select(option)"
                :class="[
                    'item-center flex cursor-pointer px-1 py-1 pr-4 whitespace-nowrap hover:bg-gray-200',
                    {
                        'bg-gray-100': activeIndex === index,
                    },
                ]"
            >
                <span class="mr-1 flex items-center">
                    <IconCheckSelected :class="{ 'text-transparent': selectedValue !== option.value }" />
                </span>
                <span>{{ option.label }}</span>
            </li>
        </ul>
    </div>
</template>

