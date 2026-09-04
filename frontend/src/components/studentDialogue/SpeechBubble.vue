<script setup lang="ts">
import IconArrowRight from '@/components/icons/IconArrowRight.vue'

defineProps<{
    showWeiterHint: boolean
}>()
</script>

<template>
    <div class="speech-bubble relative rounded-2xl border border-gray-700 bg-white shadow-md" :class="showWeiterHint ? 'pb-7' : ''">
        <slot />
        <Transition name="fade">
            <span v-if="showWeiterHint" class="absolute right-4 bottom-1 flex items-center gap-0.5 text-xs text-gray-400">
                <span>weiter</span>
                <IconArrowRight />
            </span>
        </Transition>
    </div>
</template>

<style scoped>
.speech-bubble::before {
    content: '';
    position: absolute;
    left: -14px;
    top: 22px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 14px solid #374151;
}
.speech-bubble::after {
    content: '';
    position: absolute;
    left: -13px;
    top: 23px;
    width: 0;
    height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-right: 13px solid white;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .fade-enter-active,
    .fade-leave-active {
        transition: none;
    }
}
</style>
