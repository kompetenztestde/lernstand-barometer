<script setup lang="ts">
import IconSortNeutral from '@/components/icons/IconSortNeutral.vue'
import IconSortAsc from '@/components/icons/IconSortAsc.vue'
import IconSortDesc from '@/components/icons/IconSortDesc.vue'

interface Props {
    direction: 'default' | 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
    direction: 'default',
})
</script>

<template>
    <button
        type="button"
        class="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 break-keep hover:bg-gray-100"
        :aria-label="direction === 'asc' ? 'Aufsteigend sortiert' : direction === 'desc' ? 'Absteigend sortiert' : 'Sortierung aufheben'"
    >
        <IconSortNeutral v-if="props.direction === 'default'" />
        <IconSortAsc v-else-if="props.direction === 'asc'" />
        <IconSortDesc v-else-if="props.direction === 'desc'" />
        <slot></slot>
    </button>
</template>
