<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useDidacticalComment } from '@/queries/useDidacticalCommentQuery'
import type { TaskDetailPanelProps } from './types'
import placeholderImage from '@/assets/images/example-item.webp'

const props = withDefaults(defineProps<TaskDetailPanelProps>(), { isExpanded: false })

function imageUrl(filename: string): string | undefined {
    return placeholderImage;
}

const itemImage = computed(() => imageUrl(props.iqbId))
const stimulusImage = computed(() => imageUrl(`${props.iqbId.slice(0, -2)}_stimulus`))

const modalImage = ref<{ src: string; label: string } | null>(null)
function openModal(src: string, label: string) {
    modalImage.value = { src, label }
}

const didacticalComment = computed(() => useDidacticalComment(props.iqbId))
</script>

<template>
    <div v-show="isExpanded" class="@container border-t border-gray-200 bg-white p-8 transition-all">
        <div class="grid gap-8 @[560px]:grid-cols-2 @[560px]:gap-16">
            <!-- Richtige Lösung + Merkmale (always top-left) -->
            <div class="space-y-5">
                <div v-if="didacticalComment?.correction">
                    <p class="mb-1"><strong>Richtige Lösung</strong></p>
                    <div v-html="didacticalComment.correction" class="text-sm"></div>
                </div>

                <div v-if="competenceLevelRoman || competenceId?.nameShort || cognitiveDemandLevel?.nameShort">
                    <p class="mb-2"><strong>Teilaufgabenmerkmale</strong></p>
                    <div class="flex flex-wrap justify-start gap-2">
                        <div
                            v-if="competenceLevelRoman"
                            tabindex="0"
                            class="flex cursor-default items-center justify-center rounded bg-white px-2 py-0.5 text-sm text-gray-500 outline outline-gray-300 hover:outline-gray-400 hover:outline-dashed"
                            v-tippy="{
                                content: compLvlSubtitle
                                    ? `<div class='text-primary font-bold'>Kompetenzstufe ${competenceLevelRoman}: ${compLvlSubtitle}</div><div>${compLvlDescription}</div>`
                                    : undefined,
                                disabled: !compLvlSubtitle,
                            }"
                        >
                            <span class="mr-1">Kompetenzstufe</span><span>{{ competenceLevelRoman }}</span>
                        </div>
                        <div
                            v-if="competenceId"
                            tabindex="0"
                            class="flex cursor-default items-center justify-center rounded bg-white px-2 py-0.5 text-sm text-gray-500 outline outline-gray-300 hover:outline-gray-400 hover:outline-dashed"
                            v-tippy="{
                                content: `<div class='text-primary font-bold'>Bildungsstandard ${competenceId.nameShort}</div><div>${competenceId.description}</div>`,
                            }"
                        >
                            <span class="mr-1">Bildungsstandard</span><span>{{ competenceId.nameShort }}</span>
                        </div>
                        <div
                            v-if="cognitiveDemandLevel"
                            tabindex="0"
                            class="flex cursor-default items-center justify-center rounded bg-white px-2 py-0.5 text-sm text-gray-500 outline outline-gray-300 hover:outline-gray-400 hover:outline-dashed"
                            v-tippy="{
                                content: `<div class='text-primary font-bold'>Anforderungsbereich ${cognitiveDemandLevel.nameShort}</div><div>${cognitiveDemandLevel.description}</div>`,
                            }"
                        >
                            <span class="mr-1">Anforderungsbereich</span><span>{{ cognitiveDemandLevel.nameShort }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Thumbnails: on lg spans both rows so Kommentar can sit below Merkmale in col 1 -->
            <div
                class="grid grid-cols-2 items-start justify-center gap-4"
                :class="{ '@[560px]:row-span-2': didacticalComment?.taskComment }"
            >
                <button
                    v-if="stimulusImage"
                    type="button"
                    class="group flex cursor-pointer flex-col items-center gap-1"
                    :aria-label="'Stimulus für Aufgabe ' + taskNumber + ' vergrößern'"
                    @click.stop="openModal(stimulusImage!, 'Stimulus – ' + name)"
                >
                    <img
                        :src="stimulusImage"
                        :alt="'Stimulus ' + iqbId"
                        class="rounded border border-gray-200 p-3 shadow-lg transition group-hover:border-gray-600"
                    />
                    <p class="mt-1 self-end">
                        <span
                            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-500 transition group-hover:border-gray-600 group-hover:bg-gray-50"
                            >Stimulus</span
                        >
                    </p>
                </button>
                <button
                    v-if="itemImage"
                    type="button"
                    class="group flex cursor-pointer flex-col items-center gap-1"
                    :aria-label="'Aufgabe ' + taskNumber + ' vergrößern'"
                    @click.stop="openModal(itemImage!, 'Aufgabe ' + taskNumber + ' – ' + name)"
                >
                    <img
                        :src="itemImage"
                        :alt="'Aufgabe ' + iqbId"
                        class="rounded border border-gray-200 p-3 shadow-lg transition group-hover:border-gray-600"
                    />
                    <p class="mt-1 self-end">
                        <span
                            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-500 transition group-hover:border-gray-600 group-hover:bg-gray-50"
                            >Aufgabe</span
                        >
                    </p>
                </button>
                <div
                    v-if="!itemImage && !stimulusImage"
                    class="flex items-center justify-center rounded border bg-gray-100 p-4 text-sm text-gray-400"
                >
                    Kein Bild
                </div>
            </div>

            <!-- Kommentar: nach Thumbnails auf schmal, linke Spalte auf breit -->
            <div v-if="didacticalComment?.taskComment">
                <p class="mb-1"><strong>Aufgabenbezogener Kommentar</strong></p>
                <div v-html="didacticalComment.taskComment" class="comment-content text-sm"></div>
            </div>
        </div>
    </div>

    <BaseModal :isOpen="!!modalImage" @close="modalImage = null">
        <template #header>
            <h3 class="font-semibold text-gray-700">{{ modalImage?.label }}</h3>
        </template>
        <div class="max-h-[75vh] overflow-y-auto">
            <img v-if="modalImage" :src="modalImage.src" :alt="modalImage.label" class="mx-auto block h-auto max-w-full rounded" />
        </div>
    </BaseModal>
</template>

<style scoped>
.comment-content :deep(p) {
    margin-bottom: 0.4rem;
}
</style>
