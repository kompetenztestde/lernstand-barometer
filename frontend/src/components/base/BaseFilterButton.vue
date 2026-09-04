<script setup lang="ts">
import IconCheckboxEmpty from '@/components/icons/IconCheckboxEmpty.vue'
import IconCheckboxChecked from '@/components/icons/IconCheckboxChecked.vue'

interface Props {
    isFilteredBy: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isFilteredBy: false,
})
</script>

<template>
    <button
        type="button"
        class="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 hover:bg-gray-100"
        :aria-pressed="props.isFilteredBy"
    >
        <IconCheckboxEmpty v-show="!props.isFilteredBy" />
        <IconCheckboxChecked v-show="props.isFilteredBy" />
        <slot></slot>
    </button>
</template>
