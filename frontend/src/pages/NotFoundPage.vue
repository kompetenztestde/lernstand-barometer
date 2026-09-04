<script setup lang="ts">
import { useRouter } from 'vue-router'
import IconBarometer from '@/components/icons/IconBarometer.vue'

const router = useRouter()
</script>

<template>
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <IconBarometer aria-hidden="true" focusable="false" class="text-primary size-20 opacity-30" />
        <div>
            <p class="text-primary text-8xl font-bold">404</p>
            <h1 class="mt-2 text-2xl font-semibold text-gray-700">Seite nicht gefunden</h1>
            <p class="mt-2 text-gray-500">Die angeforderte Seite existiert nicht.</p>
        </div>
        <button
            class="text-primary hover:underline focus:underline focus:outline-none"
            @click="router.back()"
        >
            Zurück
        </button>
    </div>
</template>
