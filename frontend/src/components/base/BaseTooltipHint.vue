<!--
    Renders text with a dashed underline on hover and an optional tooltip.
    - label: displayed text (falls back to slot)
    - tooltip: string for plain text, or a full v-tippy options object for custom formatting
    - underlineOffset: CSS value for text-underline-offset (default: '4px')
    - underlineThickness: CSS value for text-decoration-thickness (default: '2px')
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label?: string
    tooltip?: string | Record<string, unknown>
    underlineOffset?: string
    underlineThickness?: string
}>()

const tippyOptions = computed(() => {
    if (!props.tooltip) return undefined
    if (typeof props.tooltip === 'string') return { content: props.tooltip }
    return props.tooltip
})
</script>

<template>
    <span
        class="hover:underline hover:decoration-dashed"
        tabindex="0"
        :style="{
            textUnderlineOffset: props.underlineOffset ?? '4px',
            textDecorationThickness: props.underlineThickness ?? '2px',
        }"
        v-tippy="tippyOptions"
    >
        <template v-if="label">{{ label }}</template>
        <slot v-else />
    </span>
</template>
