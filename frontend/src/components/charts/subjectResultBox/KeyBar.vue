<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        filled: number // 1–5
        color: 'primary' | 'secondary'
        label: string // for aria-label
        showKeys?: boolean
    }>(),
    { showKeys: true },
)

const total = 5
const colorClass = props.color === 'primary' ? 'bg-primary' : 'bg-secondary'
</script>

<template>
    <div class="flex items-center gap-2" :aria-label="`${label}: ${filled} von ${total}`">
        <img
            src="@/assets/images/key.svg"
            alt=""
            aria-hidden="true"
            class="w-4 shrink-0 transition-opacity duration-700 lg:w-6"
            :class="showKeys ? 'opacity-60' : 'opacity-0'"
        />
        <div class="flex">
            <div
                v-for="i in total"
                :key="i"
                :class="[
                    'h-6 w-10 border border-gray-400 lg:h-8 lg:w-12',
                    i === 1 ? 'rounded-l-lg' : 'border-l-0',
                    i === total ? 'rounded-r-lg' : '',
                    i <= filled ? colorClass : 'bg-white',
                ]"
            />
        </div>
        <img
            src="@/assets/images/keyring.svg"
            alt=""
            aria-hidden="true"
            class="w-8 shrink-0 transition-opacity duration-700 lg:w-12"
            :class="showKeys ? 'opacity-60' : 'opacity-0'"
        />
    </div>
</template>
