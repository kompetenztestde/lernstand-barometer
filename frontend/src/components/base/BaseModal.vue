<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
    isOpen: boolean
    maxWidth?: string
    scrollable?: boolean
    bare?: boolean
    ariaLabel?: string
}>()

const emit = defineEmits(['close'])
const close = () => emit('close')

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.isOpen) close()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                :class="[
                    'fixed inset-0 z-100 flex p-4 print:hidden',
                    scrollable ? 'items-start overflow-y-scroll py-8' : 'items-center justify-center',
                ]"
                role="dialog"
                aria-modal="true"
                :aria-label="ariaLabel"
            >
                <div
                    :class="['fixed inset-0', bare ? 'bg-black/50' : 'bg-white-900/50 backdrop-blur-xs']"
                    @click="close"
                ></div>

                <div v-if="bare" :class="['relative z-10 mx-auto w-full', maxWidth ?? 'max-w-3xl']">
                    <slot></slot>
                </div>
                <div
                    v-else
                    :class="[
                        'relative z-10 mx-auto flex w-full flex-col rounded-lg border border-gray-400 bg-white shadow-xl',
                        scrollable ? '' : 'max-h-[90vh]',
                        maxWidth ?? 'max-w-3xl',
                    ]"
                >
                    <div class="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
                        <div class="flex-1">
                            <slot name="header"></slot>
                        </div>
                        <button
                            type="button"
                            class="ml-4 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                            aria-label="Schließen"
                            @click="close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div class="min-h-0 flex-1 overflow-y-auto p-6">
                        <slot></slot>
                    </div>
                    <div v-if="$slots.footer" class="flex justify-end space-x-2 p-4">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

