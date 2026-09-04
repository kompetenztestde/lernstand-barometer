<script setup lang="ts">
interface Props {
    title?: string
    subtitle?: string
    titlePlacement?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    titlePlacement: 'left',
})
</script>

<template>
    <section class="overflow-visible rounded-xl border border-gray-200 bg-white p-7 shadow-md shadow-gray-100">
        <div v-if="props.title || props.subtitle" class="mb-5">
            <div
                class="text-primary flex items-center gap-3"
                :class="{
                    'justify-start': props.titlePlacement === 'left',
                    'justify-center': props.titlePlacement === 'center',
                    'justify-end': props.titlePlacement === 'right',
                }"
            >
                <div v-if="$slots.icon">
                    <slot name="icon"></slot>
                </div>
                <h3 v-if="props.title" class="text-xl/6 font-bold tracking-wide uppercase xl:text-2xl/7">
                    {{ props.title }}
                </h3>
            </div>
            <p v-if="props.subtitle" class="subtitle pl-2 tracking-wide text-gray-600">{{ props.subtitle }}</p>
        </div>
        <slot name="body"></slot>
        <slot></slot>
    </section>
</template>
