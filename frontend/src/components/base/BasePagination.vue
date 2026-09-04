<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'

interface PageSizeOption {
    value: number
    label: string
}

interface Props {
    pageSize: number
    currentPage: number
    totalPages: number
    pageLabels: string[]
    pageSizeOptions?: PageSizeOption[]
}

withDefaults(defineProps<Props>(), {
    pageSizeOptions: () => [
        { value: -1, label: 'Aufgabe' },
        { value: 10, label: '10 Items' },
        { value: 20, label: '20 Items' },
        { value: 50, label: '50 Items' },
        { value: 0, label: 'Alle' },
    ],
})

const emit = defineEmits<{
    'update:pageSize': [value: number]
    'update:currentPage': [value: number]
}>()
</script>

<template>
    <div class="flex items-center gap-8">
        <div v-if="pageSize !== 0" class="flex flex-wrap items-center gap-1">
            <BaseButton
                size="md"
                class="mr-2"
                variant="default-outline"
                :disabled="currentPage <= 1"
                @click="emit('update:currentPage', currentPage - 1)"
                aria-label="Vorherige Seite"
            >
                <IconChevronDown class="size-3 rotate-90" stroke-width="3" />
            </BaseButton>
            <BaseButton
                v-for="page in totalPages"
                :key="page"
                size="sm"
                :variant="page === currentPage ? 'default' : 'default-outline'"
                :class="{ 'min-w-[15ch]': page === currentPage && pageSize === -1 }"
                v-tippy="{
                    content: pageLabels[page - 1],
                    disabled: !pageLabels[page - 1] || (page === currentPage && pageSize === -1),
                }"
                @click="emit('update:currentPage', page)"
            >
                <span v-if="page === currentPage && pageSize === -1" class="inline-block w-[13ch] truncate text-left"
                    >{{ page }} – {{ pageLabels[page - 1] }}</span
                >
                <template v-else>{{ page }}</template>
            </BaseButton>
            <BaseButton
                size="md"
                class="ml-2"
                variant="default-outline"
                :disabled="currentPage >= totalPages"
                @click="emit('update:currentPage', currentPage + 1)"
                aria-label="Nächste Seite"
            >
                <IconChevronDown class="size-3 -rotate-90" stroke-width="3" />
            </BaseButton>
        </div>
        <BaseSelect
            :modelValue="pageSize"
            :options="pageSizeOptions"
            size="sm"
            class="w-fit!"
            aria-label="Einträge pro Seite"
            @update:modelValue="emit('update:pageSize', $event as number)"
        />
    </div>
</template>
