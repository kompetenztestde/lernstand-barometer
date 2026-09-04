<script setup lang="ts">
interface Props {
    descriptionTitle: string
    descriptionBody: string
}

const props = defineProps<Props>()
</script>

<template>
    <div
        class="flex h-12 w-12 cursor-pointer items-center justify-center rounded border border-gray-400 text-3xl text-gray-600 hover:border-2 hover:border-dashed"
        tabindex="0"
        v-tippy="{
            content: `<div class='text-primary'>${props.descriptionTitle}</div><div>${props.descriptionBody}</div>`,
            placement: 'left',
        }"
    >
        <slot></slot>
    </div>
</template>
