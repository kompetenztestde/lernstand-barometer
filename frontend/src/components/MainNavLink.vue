<script setup lang="ts">
import { inject, ref } from 'vue'
import type { ComputedRef } from 'vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'

interface Props {
    url?: string | null
    label?: string
    hasChildren?: boolean
    isOpen?: boolean
    active?: boolean
    highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    url: null,
    label: '',
    hasChildren: false,
    isOpen: false,
    active: false,
    highlighted: false,
})

const emit = defineEmits<{
    (e: 'toggle'): void
}>()

const isCollapsed = inject<ComputedRef<boolean>>('navCollapsed', ref(false) as unknown as ComputedRef<boolean>)
</script>

<template>
    <!-- If URL is set → real RouterLink -->
    <RouterLink
        v-if="props.url"
        active-class="bg-primary hover:bg-primary/90"
        :class="[
            'hover:bg-primary/10 m-0 flex items-center gap-3 rounded-md px-2 py-1 tracking-wide transition-all select-none xl:px-3 xl:py-2',
            isCollapsed ? 'justify-center' : '',
            props.highlighted ? 'bg-primary/10' : '',
        ]"
        :to="props.url"
        v-slot="{ isActive }"
    >
        <span v-if="$slots.default" class="shrink-0" :class="isActive ? 'text-white' : 'text-primary'">
            <slot />
        </span>

        <span v-show="!isCollapsed" :class="['font-medium whitespace-nowrap', isActive ? 'text-white' : 'font-medium text-gray-600']">
            {{ props.label }}
        </span>

        <span v-show="!isCollapsed" class="grow"></span>

        <IconChevronDown
            v-if="props.hasChildren && !isCollapsed"
            :class="[
                'size-4 shrink-0 justify-self-end text-gray-700 transition-transform duration-300',
                props.isOpen ? 'rotate-180' : 'rotate-0',
                isActive ? 'text-white' : '',
            ]"
        />
    </RouterLink>

    <!-- If URL null → static title with optional toggle -->
    <div
        v-else
        :class="[
            'm-0 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 tracking-wide transition-all select-none xl:px-3 xl:py-2',
            isCollapsed ? 'justify-center' : '',
            props.active ? 'bg-primary hover:bg-primary-light' : 'hover:bg-primary/10',
            props.highlighted && !props.active ? 'ring-primary/50 bg-primary/10 ring ring-inset' : '',
        ]"
        @click="emit('toggle')"
    >
        <span v-if="$slots.default" class="shrink-0" :class="props.active ? 'text-white' : 'text-primary'">
            <slot />
        </span>

        <span
            v-show="!isCollapsed"
            :class="['font-medium whitespace-nowrap', props.active ? 'font-extrabold text-white' : 'text-gray-600']"
        >
            {{ props.label }}
        </span>

        <span v-show="!isCollapsed" class="grow"></span>

        <IconChevronDown
            v-if="props.hasChildren && !isCollapsed"
            :class="[
                'size-4 shrink-0 justify-self-end transition-transform duration-300',
                props.isOpen ? 'rotate-180' : 'rotate-0',
                props.active ? 'text-white' : 'text-gray-700',
            ]"
        />
    </div>
</template>
