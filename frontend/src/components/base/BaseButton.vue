<script setup lang="ts">
import { computed } from 'vue'

type Variant =
    | 'default'
    | 'default-outline'
    | 'primary'
    | 'primary-outline'
    | 'secondary'
    | 'secondary-outline'
    | 'danger'
    | 'danger-outline'

type Size = 'sm' | 'md' | 'lg'

interface Props {
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
    active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    size: 'md',
    disabled: false,
    loading: false,
    active: false,
})

const base = 'inline-flex items-center justify-center font-medium tracking-wide rounded-md transition border-1'

const sizes: Record<Size, string> = {
    sm: 'px-2 py-1 xl:px-2 xl:py-1 text-sm',
    md: 'px-3 py-1.5 xl:px-4 xl:py-2 text-base',
    lg: 'px-4 py-5 xl:px-6 xl:py-3 text-lg',
}

const classes = computed(() => {
    let variantClass = ''

    switch (props.variant) {
        case 'default':
            variantClass = 'bg-gray-200 text-gray-700 hover:bg-gray-200 border-gray-300'
            break
        case 'default-outline':
            variantClass = props.active
                ? 'bg-gray-400 text-white border-gray-600'
                : 'bg-white text-gray-600 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
            break
        case 'primary':
            variantClass = 'bg-primary text-white hover:bg-primary-light border-primary'
            break
        case 'secondary':
            variantClass = 'bg-secondary text-white hover:bg-secondary-light border-secondary'
            break
        case 'danger':
            variantClass = 'bg-danger text-white hover:bg-danger-light border-danger'
            break
        case 'primary-outline':
            variantClass = props.active
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-primary hover:bg-primary-light hover:text-white border-primary'
            break
        case 'secondary-outline':
            variantClass = props.active
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white text-secondary hover:bg-secondary hover:text-white border-secondary'
            break
        case 'danger-outline':
            variantClass = props.active ? 'bg-danger text-white border-danger' : 'bg-white text-danger hover:bg-red-50 border-danger'
            break
    }

    return [
        base,
        variantClass,
        sizes[props.size],
        props.disabled || props.loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    ].join(' ')
})
</script>

<template>
    <button :class="classes" :disabled="disabled || loading" type="button" :aria-busy="loading || undefined">
        <span v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
        <slot />
    </button>
</template>
