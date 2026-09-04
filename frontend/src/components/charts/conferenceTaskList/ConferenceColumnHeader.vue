<script setup lang="ts">
import { compLvls } from './utils'

defineProps<{ view: 'A' | 'B'; groupNames: string[] }>()
</script>

<template>
    <div class="mb-1 flex items-end justify-center gap-4 px-4 text-xs text-gray-400 xl:justify-start">
        <div class="size-4 shrink-0 print:hidden"></div>
        <div class="w-12 shrink-0"></div>
        <div class="w-49 shrink-0"></div>

        <div v-if="view === 'A'" class="flex shrink-0 items-end gap-2">
            <div v-for="name in groupNames" :key="name" class="w-8 shrink-0">
                <div v-if="name.length <= 3" class="text-center">{{ name }}</div>
                <div v-else class="relative h-14">
                    <span
                        class="absolute bottom-0 left-0 origin-bottom-left -rotate-45 whitespace-nowrap"
                        :title="name.length > 10 ? name : undefined"
                        >{{ name.slice(0, 10) }}<span v-if="name.length > 10"> …</span></span
                    >
                </div>
            </div>
        </div>

        <div v-else class="flex shrink-0 items-end gap-3">
            <div v-for="name in groupNames" :key="name" class="flex flex-col items-center gap-0.5">
                <div class="max-w-35 truncate text-center leading-tight">{{ name }}</div>
                <div class="flex gap-px">
                    <div v-for="lvl in compLvls" :key="lvl" class="w-7 text-center">{{ lvl }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
