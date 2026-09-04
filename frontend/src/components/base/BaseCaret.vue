<script setup lang="ts">
import IconChevronDown from '@/components/icons/IconChevronDown.vue'

interface Props {
    isExpanded: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isExpanded: false,
})
</script>

<template>
    <IconChevronDown
        stroke-width="3"
        class="size-3 transition-transform duration-200"
        :class="{ '-rotate-180': props.isExpanded }"
    />
</template>
