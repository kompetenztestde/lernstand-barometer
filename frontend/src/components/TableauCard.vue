<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableauQuery, displayGender, displayBlsf, displayDeuKennt, formatNum } from '@/queries/useTableauQuery'
import { generateOds, triggerDownload } from '@/helpers/generateOds'
import { generateCsv } from '@/helpers/generateCsv'
import IconDownload from '@/components/icons/IconDownload.vue'
import IconSpinner from '@/components/icons/IconSpinner.vue'

const props = defineProps<{
    groupId: number
    groupName: string
    schoolName: string
}>()

const groupIdRef = computed(() => props.groupId)
const { data, isPending, isError } = useTableauQuery(groupIdRef)

const legendOpen = ref(false)

// ── Display ───────────────────────────────────────────────────────────────────

const covarHeaders = ['SuS-Code', 'Geschlecht', 'Halbjahresnote', 'BL/SF', 'Ungen. D.Kenntn.']
const bgClassAbsolute = 'bg-primary/5'
const bgClassRelative = 'bg-secondary/5'

function covarValues(sr: NonNullable<typeof data.value>['studentRows'][number]): string[] {
    return [
        sr.code,
        displayGender(sr.covariates.gender),
        sr.covariates.hnote !== null ? String(sr.covariates.hnote) : '',
        displayBlsf(sr.covariates.blsf),
        displayDeuKennt(sr.covariates.DeuKennt),
    ]
}

function fmt(v: number | null): string {
    return formatNum(v)
}

/** For the Ø row: always 2 decimal places. */
function fmtAvg(v: number | null): string {
    if (v === null) return ''
    return v.toFixed(1)
}

// ── Downloads ─────────────────────────────────────────────────────────────────

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
    <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <!-- Header + download buttons -->
        <div class="flex items-start justify-between gap-3">
            <span class="text-sm font-medium text-gray-700">{{ groupName }}</span>
            <div class="flex shrink-0 gap-2">
                <button
                    class="border-primary text-primary hover:bg-primary inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isPending || !data"
                    type="button"
                    :aria-label="`ODS-Datei für ${groupName} herunterladen`"
                    @click="downloadOds"
                >
                    <IconDownload class="size-4" aria-hidden="true" />
                    <span>ODS</span>
                </button>
                <button
                    class="border-primary text-primary hover:bg-primary inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isPending || !data"
                    type="button"
                    :aria-label="`CSV-Datei für ${groupName} herunterladen`"
                    @click="downloadCsv"
                >
                    <IconDownload class="size-4" aria-hidden="true" />
                    <span>CSV</span>
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isPending" class="flex items-center gap-2 py-4 text-sm text-gray-500">
            <IconSpinner class="size-4 animate-spin" aria-hidden="true" />
            <span>Lade Daten…</span>
        </div>

        <!-- Error -->
        <p v-else-if="isError" class="py-2 text-sm text-red-600" role="alert">Fehler beim Laden der Tabellendaten.</p>

        <!-- Table -->
        <template v-else-if="data">
            <div
                class="overflow-x-auto rounded border border-gray-100"
                role="region"
                :aria-label="`Tabellarische Auswertung ${groupName}`"
                tabindex="0"
            >
                <table class="border-collapse text-xs">
                    <thead>
                        <tr>
                            <!-- Sticky covariate headers -->
                            <th
                                v-for="(h, i) in covarHeaders"
                                :key="'ch' + i"
                                scope="col"
                                class="sticky z-10 border border-gray-200 bg-white px-2 py-1 text-left font-semibold whitespace-nowrap text-gray-700"
                                :class="i === 0 ? 'left-0' : ''"
                            >
                                {{ h }}
                            </th>
                            <!-- Item headers -->
                            <th
                                v-for="col in data.itemColumns"
                                :key="'ih' + col.iqbId"
                                scope="col"
                                class="border border-gray-200 px-2 py-1 text-left font-semibold whitespace-nowrap text-gray-700"
                                :title="col.taskNumber + (col.taskName ? ' – ' + col.taskName : '')"
                            >
                                {{ col.taskNumber }}
                            </th>
                            <!-- Aggregation headers -->
                            <th
                                v-for="col in data.aggColumns"
                                :key="'ah' + col.ktColumnName"
                                scope="col"
                                class="border border-gray-200 px-2 py-1 text-left font-semibold whitespace-nowrap text-gray-700"
                                :class="col.isPercent ? bgClassRelative : bgClassAbsolute"
                            >
                                {{ col.displayName }}
                            </th>
                        </tr>
                        <!-- (Max) row -->
                        <tr class="italic">
                            <td class="sticky left-0 z-10 border border-gray-200 bg-gray-50 px-2 py-0.5 whitespace-nowrap text-gray-500">
                                (Max)
                            </td>
                            <td v-for="i in 4" :key="'me' + i" class="border border-gray-200 px-2 py-0.5" />
                            <td
                                v-for="(v, i) in data.itemMaxVals"
                                :key="'mi' + i"
                                class="border border-gray-200 bg-gray-50 px-2 py-0.5 text-right text-gray-500 tabular-nums"
                            >
                                {{ fmt(v) }}
                            </td>
                            <td
                                v-for="(v, i) in data.aggMaxVals"
                                :key="'ma' + i"
                                class="border border-gray-200 px-2 py-0.5 text-right text-gray-500 tabular-nums"
                                :class="data.aggColumns[i].isPercent ? bgClassRelative : bgClassAbsolute"
                            >
                                {{ fmt(v) }}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Student rows -->
                        <tr v-for="(sr, ri) in data.studentRows" :key="sr.code" :class="ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'">
                            <td
                                v-for="(v, ci) in covarValues(sr)"
                                :key="'cv' + ci"
                                class="border border-gray-200 px-2 py-0.5"
                                :class="[
                                    ci === 0 ? 'sticky left-0 z-10 font-medium' : '',
                                    ri % 2 === 0 ? 'bg-white' : ci === 0 ? 'bg-gray-50' : 'bg-gray-50/50',
                                ]"
                            >
                                {{ v }}
                            </td>
                            <td
                                v-for="(v, ii) in sr.itemScores"
                                :key="'is' + ii"
                                class="border border-gray-200 px-2 py-0.5 text-right tabular-nums"
                            >
                                {{ fmt(v) }}
                            </td>
                            <td
                                v-for="(v, ai) in sr.aggScores"
                                :key="'as' + ai"
                                class="border border-gray-200 px-2 py-0.5 text-right tabular-nums"
                                :class="data.aggColumns[ai].isPercent ? bgClassRelative : bgClassAbsolute"
                            >
                                {{ data.aggColumns[ai].isPercent ? fmtAvg(v) : fmt(v) }}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <!-- Ø row -->
                        <tr class="bg-gray-50 italic">
                            <td
                                class="sticky left-0 z-10 border border-gray-200 bg-gray-50 px-2 py-0.5 font-semibold whitespace-nowrap text-gray-700"
                            >
                                Ø
                            </td>
                            <td v-for="i in 4" :key="'ave' + i" class="border border-gray-200 px-2 py-0.5" />
                            <td
                                v-for="(v, i) in data.groupItemScores"
                                :key="'gi' + i"
                                class="border border-gray-200 px-2 py-0.5 text-right font-medium text-gray-700 tabular-nums"
                            >
                                {{ fmtAvg(v) }}
                            </td>
                            <td
                                v-for="(v, i) in data.groupAggScores"
                                :key="'ga' + i"
                                class="border border-gray-200 px-2 py-0.5 text-right font-medium text-gray-700 tabular-nums"
                                :class="data.aggColumns[i].isPercent ? bgClassRelative : bgClassAbsolute"
                            >
                                {{ fmtAvg(v) }}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Legend toggle -->
            <div class="mt-1">
                <button
                    type="button"
                    class="text-primary flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                    :aria-expanded="legendOpen"
                    @click="legendOpen = !legendOpen"
                >
                    <span>{{ legendOpen ? '▲' : '▼' }}</span>
                    <span>Erläuterungen zu den Spalten</span>
                </button>
                <table v-if="legendOpen" class="mt-2 w-full border-collapse text-xs" aria-label="Spaltenerläuterungen">
                    <thead>
                        <tr class="bg-blue-50">
                            <th scope="col" class="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700">Spalte</th>
                            <th scope="col" class="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700">Erläuterung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(leg, i) in data.legend" :key="leg.key" :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'">
                            <td class="border border-gray-200 px-2 py-0.5 font-medium text-gray-700">{{ leg.key }}</td>
                            <td class="border border-gray-200 px-2 py-0.5 text-gray-600">{{ leg.description }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>
