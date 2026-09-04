<script setup lang="ts">
import KeyBar from './KeyBar.vue'

withDefaults(
    defineProps<{
        title: string
        /** Omit (or pass null) for the teacher/print view to show "nicht gespeichert". */
        selfAssessment?: string | null
        selfScore?: number | null
        showKeys?: boolean
        /** Default true so teacher view always shows the result without animation. */
        actualRevealed?: boolean
        /** 0 or absent means no data. */
        actualLevel: number
    }>(),
    { showKeys: true, actualRevealed: true },
)
</script>

<template>
    <div class="w-fit rounded-xl border border-gray-600 bg-white p-4 shadow-sm lg:p-5">
        <p class="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase lg:text-base">{{ title }}</p>
        <div class="space-y-3">
            <div>
                <p v-if="selfAssessment != null" class="mb-1 text-sm text-gray-600">
                    Selbsteinschätzung: <span class="font-semibold text-gray-800">{{ selfAssessment }}</span>
                </p>
                <p v-else class="mb-1 text-sm text-gray-400 italic">Selbsteinschätzung: nicht gespeichert</p>
                <KeyBar
                    v-if="selfAssessment != null"
                    :filled="selfScore ?? 0"
                    color="primary"
                    :label="`Selbsteinschätzung ${title}: ${selfAssessment}`"
                    :show-keys="showKeys"
                />
                <div v-else class="opacity-20" aria-hidden="true">
                    <KeyBar :filled="0" color="primary" :label="title" :show-keys="true" />
                </div>
            </div>
            <div
                class="transition-opacity duration-700"
                :class="actualRevealed ? 'opacity-100' : 'invisible opacity-0'"
                :aria-hidden="!actualRevealed"
            >
                <p class="mb-1 text-sm text-gray-600">
                    Ergebnis:
                    <span class="font-semibold text-gray-800">
                        {{ actualLevel ? `Kompetenzstufe ${actualLevel}` : 'keine Daten' }}
                    </span>
                </p>
                <KeyBar
                    v-if="actualLevel"
                    :filled="actualLevel"
                    color="secondary"
                    :label="`Ergebnis ${title}: Kompetenzstufe ${actualLevel}`"
                    :show-keys="showKeys"
                />
            </div>
        </div>
    </div>
</template>
