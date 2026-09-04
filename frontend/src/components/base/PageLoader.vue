<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigation'

const navigation = useNavigationStore()
</script>

<template>
    <div v-if="navigation.isLoading" class="flex h-full w-full flex-col items-center justify-center" role="status" aria-live="polite">
        <p class="font-semi text-2xl text-gray-500">Seite wird geladen.</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="size-24 text-gray-600" aria-hidden="true">
            <circle cx="4" cy="12" r="3" fill="currentColor" stroke-width="0.5" stroke="currentColor">
                <animate
                    id="SVG7x14Dcom"
                    fill="freeze"
                    attributeName="opacity"
                    begin="0;SVGqSjG0dUp.end-0.25s"
                    dur="0.75s"
                    values="1;0.2"
                />
            </circle>
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4" stroke-width="0.5" stroke="currentColor">
                <animate fill="freeze" attributeName="opacity" begin="SVG7x14Dcom.begin+0.15s" dur="0.75s" values="1;0.2" />
            </circle>
            <circle cx="20" cy="12" r="3" fill="currentColor" opacity="0.3" stroke-width="0.5" stroke="currentColor">
                <animate id="SVGqSjG0dUp" fill="freeze" attributeName="opacity" begin="SVG7x14Dcom.begin+0.3s" dur="0.75s" values="1;0.2" />
            </circle>
        </svg>
    </div>
</template>
