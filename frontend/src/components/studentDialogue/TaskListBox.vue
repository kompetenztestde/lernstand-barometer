<script setup lang="ts">
defineProps<{
    title: string
    tasks: string[]
}>()
</script>

<template>
    <div class="rounded-xl border border-gray-600 bg-white p-5 shadow-sm">
        <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{{ title }}</p>
        <ul class="space-y-1">
            <li v-for="task in tasks" :key="task" class="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700">
                Aufgabe {{ task }}
            </li>
        </ul>
    </div>
</template>
