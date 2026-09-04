<script setup lang="ts">
import { computed } from 'vue'
import { useTableauQuery } from '@/queries/useTableauQuery'
import { generateOds, triggerDownload } from '@/helpers/generateOds'
import { generateCsv } from '@/helpers/generateCsv'
import IconDownload from '@/components/icons/IconDownload.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps<{
    groupId: number
    groupName: string
    schoolName: string
}>()

const emit = defineEmits<{
    openHtml: [groupId: number]
}>()

const groupIdRef = computed(() => props.groupId)
const { data, isPending } = useTableauQuery(groupIdRef)
const noData = computed(() => !isPending.value && data.value !== undefined && data.value.studentRows.length === 0)

function downloadOds() {
    if (!data.value) return
    const blob = generateOds(data.value, props.groupName, props.schoolName)
    triggerDownload(blob, `Tabellarische Auswertung ${props.groupName}.ods`)
}

function downloadCsv() {
    if (!data.value) return
    const blob = generateCsv(data.value, props.groupName)
    triggerDownload(blob, `Tabellarische Auswertung ${props.groupName}.csv`)
}
</script>

<template>
    <li class="flex items-center justify-between gap-4">
        <span class="text-sm font-medium text-gray-700">{{ groupName }}</span>
        <span v-if="noData" class="border border-transparent px-2 py-2 text-sm text-gray-400">Keine Daten</span>
        <div v-else class="flex shrink-0 gap-2">
            <BaseButton
                variant="primary-outline"
                :disabled="isPending || !data"
                :aria-label="`HTML-Tabelle für ${groupName} anzeigen`"
                @click="emit('openHtml', groupId)"
            >
                HTML
            </BaseButton>
            <BaseButton
                variant="primary-outline"
                :disabled="isPending || !data"
                class="gap-1.5"
                :aria-label="`ODS-Datei für ${groupName} herunterladen`"
                @click="downloadOds"
            >
                <IconDownload class="size-6" aria-hidden="true" />
                <span>ODS</span>
            </BaseButton>
            <BaseButton
                variant="primary-outline"
                :disabled="isPending || !data"
                class="gap-1.5"
                :aria-label="`CSV-Datei für ${groupName} herunterladen`"
                @click="downloadCsv"
            >
                <IconDownload class="size-6" aria-hidden="true" />
                <span>CSV</span>
            </BaseButton>
        </div>
    </li>
</template>
