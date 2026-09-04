<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import type { InterpretationQuestion } from '@/composables/useInterpretationSection'

const props = defineProps<{
    questions: InterpretationQuestion[]
    show: boolean
    orientation?: 'col' | 'row'
    modelValue: string | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
}>()

const toggle = (id: string) => {
    emit('update:modelValue', props.modelValue === id ? null : id)
}
</script>

<template>
    <Transition name="interp">
        <div
            v-show="props.show"
            class="border-secondary text-secondary bg-secondary/5 h-fit w-fit shrink-0 rounded-lg border p-4 text-sm print:hidden"
        >
            <p class="mb-3 font-semibold tracking-wide uppercase">Interpretationshilfen</p>
            <div v-if="$slots['pre-buttons']" class="mb-2">
                <slot name="pre-buttons"></slot>
            </div>
            <ul
                class="flex flex-wrap gap-1.5"
                :class="[{ 'flex-col': props.orientation === 'col' }, { 'flex-row': props.orientation === 'row' }]"
            >
                <li v-for="q in questions" :key="q.id">
                    <BaseButton
                        variant="secondary-outline"
                        size="sm"
                        :active="modelValue === q.id"
                        class="w-full justify-start text-left font-normal"
                        @click="toggle(q.id)"
                    >
                        {{ q.label }}
                    </BaseButton>
                </li>
            </ul>
            <slot name="post-buttons"></slot>
        </div>
    </Transition>
</template>
