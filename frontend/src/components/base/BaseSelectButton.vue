<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import BaseButton from './BaseButton.vue'

type ColorScheme = 'default' | 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Option {
    value: string | number | boolean
    label: string
}

interface Props {
    modelValue?: string | number | boolean
    options: Option[]
    variant?: ColorScheme
    size?: Size
    name?: string
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    size: 'md',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | boolean): void
}>()

const buttonRefs = ref<{ $el: HTMLButtonElement }[]>([])

const selectedIndex = computed(() => props.options.findIndex((o) => o.value === props.modelValue))

const activeVariant = computed(() => props.variant)
const inactiveVariant = computed(() => `${props.variant}-outline` as const)

function select(value: string | number | boolean) {
    emit('update:modelValue', value)
}

function focusIndex(index: number) {
    nextTick(() => {
        ;(buttonRefs.value[index]?.$el as HTMLButtonElement)?.focus()
    })
}

function onKeydown(e: KeyboardEvent) {
    const max = props.options.length - 1
    let next = selectedIndex.value

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            e.preventDefault()
            next = selectedIndex.value >= max ? 0 : selectedIndex.value + 1
            break

        case 'ArrowLeft':
        case 'ArrowUp':
            e.preventDefault()
            next = selectedIndex.value <= 0 ? max : selectedIndex.value - 1
            break

        case 'Home':
            e.preventDefault()
            next = 0
            break

        case 'End':
            e.preventDefault()
            next = max
            break

        default:
            return
    }

    const option = props.options[next]
    select(option.value)
    focusIndex(next)
}
</script>

<template>
    <div class="mb-0 inline-flex" role="radiogroup" @keydown="onKeydown">
        <BaseButton
            v-for="option in options"
            :key="String(option.value)"
            ref="buttonRefs"
            role="radio"
            :aria-checked="modelValue === option.value"
            :tabindex="modelValue === option.value ? 0 : -1"
            :variant="modelValue === option.value ? activeVariant : inactiveVariant"
            :size="size"
            class="relative flex-1 rounded-none! first:rounded-l-md! last:rounded-r-md! not-first:-ml-px hover:z-10"
            @click="select(option.value)"
        >
            {{ option.label }}
        </BaseButton>
    </div>
</template>
