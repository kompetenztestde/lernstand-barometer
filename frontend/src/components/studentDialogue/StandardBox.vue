<script setup lang="ts">
defineProps<{
    title: string
    standard: string
    description?: string
}>()
</script>

<template>
    <div class="rounded-xl border border-gray-600 bg-white p-5 shadow-sm">
        <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{{ title }}</p>
        <div class="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700">
            <p class="font-medium">{{ standard }}</p>
            <p v-if="description" class="mt-1 text-gray-500">{{ description }}</p>
        </div>
    </div>
</template>
