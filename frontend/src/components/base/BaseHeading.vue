<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
    level?: 'h2' | 'h3'
}

const props = defineProps<Props>()
</script>

<template>
    <h2 v-if="props.level === 'h2'" v-bind="$attrs" class="text-primary mb-10 border-b-2 pb-3 text-xl/6 font-bold tracking-wide uppercase xl:text-2xl/7">
        <slot></slot>
    </h2>
    <h3 v-else-if="props.level === 'h3'" v-bind="$attrs" class="text-primary mb-5 text-lg/6 font-semibold tracking-wide uppercase xl:text-xl/7">
        <slot></slot>
    </h3>
    <h3 v-else v-bind="$attrs" class="text-md/6 mb-5 font-semibold text-gray-600 xl:text-lg/7">
        <slot></slot>
    </h3>
</template>

