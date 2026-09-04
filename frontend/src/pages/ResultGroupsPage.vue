<script setup lang="ts">
import { ref, computed } from 'vue'
import { useViewSelectionStore } from '@/stores/viewSelection'
import { usePageReady } from '@/composables/usePageReady'
import { CompetenceLevelBand } from '@/components/charts/competenceLevelBand'
import SortIcon from '@/components/SortIcon.vue'
import GroupSelectButton from '@/components/base/GroupSelectButton.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import PrintPdfButton from '@/components/base/PrintPdfButton.vue'
import NameImportButton from '@/components/base/NameImportButton.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import { useInterpretationSection } from '@/composables/useInterpretationSection'
import { useStudentsQuery, useMathStudentsQuery, normalizeLevel } from '@/queries/useStudentsQuery'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import { useStudentNamesStore } from '@/stores/studentNames'

const viewSelection = useViewSelectionStore()
const selectedGroupId = computed({
    get: () => viewSelection.selectedGroupId,
    set: (val) => viewSelection.setSelectedGroupId(val),
})

const allowedTestIds = [import.meta.env.VITE_TEST_ID, import.meta.env.VITE_MATH_TEST_ID_A, import.meta.env.VITE_MATH_TEST_ID_B].filter(
    Boolean,
)

const { data: participatedGroups, isPending: groupsPending } = useParticipatedGroupsQuery()
const filteredGroups = computed(() =>
    (participatedGroups.value ?? []).filter((g) => g.participatedTests.some((t) => allowedTestIds.includes(String(t)))),
)
const currentGroupParticipatedTests = computed(() => {
    if (!selectedGroupId.value || !filteredGroups.value.length) return null
    return filteredGroups.value.find((g) => g.groupId === selectedGroupId.value)?.participatedTests ?? null
})

const mathTestIds = [import.meta.env.VITE_MATH_TEST_ID_A, import.meta.env.VITE_MATH_TEST_ID_B].filter(Boolean)
const groupHasMath = computed(() => {
    const tests = currentGroupParticipatedTests.value
    if (tests === null) return null
    return tests.some((t) => mathTestIds.includes(String(t)))
})

const { data: deutschData, isPending: deutschPending } = useStudentsQuery(selectedGroupId)
const { data: mathData, isPending: mathPending } = useMathStudentsQuery(selectedGroupId, currentGroupParticipatedTests)

usePageReady(computed(() => groupsPending.value || (selectedGroupId.value !== null && (deutschPending.value || mathPending.value))))

const romanToNumber: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }

function toLevelNumber(raw: string | null | undefined): number | null {
    if (!raw) return null
    const normalized = normalizeLevel(raw)
    return romanToNumber[normalized] ?? (parseInt(normalized) || null)
}

type TableStudent = { code: string; le: number | null; rs: number | null; ma: number | null }

const mathLevelMap = computed(() => {
    const map = new Map<string, number | null>()
    for (const s of mathData.value ?? []) {
        if (!s.code) continue
        map.set(s.code, toLevelNumber(s.competenceLevels[0]?.value ?? null))
    }
    return map
})

const tableStudents = computed((): TableStudent[] => {
    const deutschStudents = (deutschData.value?.studentsData ?? []).filter((s) => s.code)
    const deutschCodes = new Set(deutschStudents.map((s) => s.code!))

    const fromDeutsch: TableStudent[] = deutschStudents.map((s) => {
        const leEntry = s.competenceLevels.find((cl) => cl.domain?.id === 'le')
        const rsEntry = s.competenceLevels.find((cl) => cl.domain?.id === 'rs')
        return {
            code: s.code!,
            le: toLevelNumber(leEntry?.value),
            rs: toLevelNumber(rsEntry?.value),
            ma: mathLevelMap.value.get(s.code!) ?? null,
        }
    })

    const fromMathOnly: TableStudent[] = (mathData.value ?? [])
        .filter((s) => s.code && !deutschCodes.has(s.code!))
        .map((s) => ({
            code: s.code!,
            le: null,
            rs: null,
            ma: toLevelNumber(s.competenceLevels[0]?.value ?? null),
        }))

    return [...fromDeutsch, ...fromMathOnly]
})

const sortKey = ref({ subject: 'code', subdomain: '' })
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedStudents = computed(() =>
    [...tableStudents.value].sort((a, b) => {
        const field = sortKey.value.subject
        if (field === 'code') {
            return sortOrder.value === 'asc' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code)
        }
        const valA = (a[field as keyof TableStudent] as number | null) ?? -1
        const valB = (b[field as keyof TableStudent] as number | null) ?? -1
        return sortOrder.value === 'asc' ? valA - valB : valB - valA
    }),
)

const namesStore = useStudentNamesStore()
const hasAnyNames = computed(() => tableStudents.value.some((s) => namesStore.getName(s.code)))

const showInterpretation = ref(false)

const questions = [
    { id: 'belowMin', label: 'Mindeststandard nicht erreicht (Kompetenzstufe I)' },
    { id: 'bigDiff', label: 'Große Unterschiede zwischen Domänen/Fächern (≥ 2 Kompetenzstufen)' },
    { id: 'allMin', label: 'In allen Domänen/Fächern den Mindeststandard erreicht' },
]

const { activeQuestion, highlights, rowClass } = useInterpretationSection((q) => {
    const set = new Set<string>()
    for (const s of tableStudents.value) {
        const levels = [s.le, s.rs, s.ma].filter((v): v is number => v !== null)
        if (levels.length === 0) continue
        if (q === 'belowMin' && levels.some((l) => l === 1)) set.add(s.code)
        if (q === 'bigDiff' && Math.max(...levels) - Math.min(...levels) >= 2) set.add(s.code)
        if (q === 'allMin' && levels.every((l) => l >= 2)) set.add(s.code)
    }
    return set
}, showInterpretation)

const rowClassForTable = (code: string): string => {
    if (activeQuestion.value === 'belowMin') {
        if (!highlights.value) return ''
        return highlights.value.has(code) ? '' : 'opacity-20'
    }
    return rowClass(code)
}

const cellClass = (code: string, domain: 'le' | 'rs' | 'ma'): string => {
    if (activeQuestion.value !== 'belowMin' || !highlights.value) return ''
    const level = tableStudents.value.find((s) => s.code === code)?.[domain]
    return level === 1 ? 'bg-interpretation/20' : ''
}

const setSort = (subject: string) => {
    if (sortKey.value.subject === subject) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = { subject, subdomain: '' }
        sortOrder.value = 'asc'
    }
}
</script>

<template>
    <!-- group selection + pdf button -->
    <div class="mb-4 flex items-center justify-between print:hidden">
        <GroupSelectButton v-model="selectedGroupId" />
        <div class="flex items-center gap-2">
            <NameImportButton />
            <PrintPdfButton v-if="selectedGroupId" page="result-groups" />
        </div>
    </div>
    <BaseLoadingBox v-if="selectedGroupId && (deutschPending || mathPending)" class="h-48" />
    <template v-else-if="selectedGroupId">
        <!-- interpretation button above table -->
        <div class="mb-2 print:hidden">
            <InterpretationButton v-model="showInterpretation" />
        </div>
        <!-- result table + interpretation panel side by side -->
        <div class="grid-cols-3 gap-6 2xl:grid">
            <!-- Interpretation panel -->
            <InterpretationPanel
                :questions="questions"
                :show="showInterpretation"
                v-model="activeQuestion"
                orientation="col"
                class="mb-8 2xl:order-last 2xl:my-0"
            />
            <!-- main table -->
            <div class="col-span-2 overflow-x-auto [scrollbar-gutter:stable]">
                <p v-if="groupHasMath === false" class="mb-2 text-sm text-gray-500">
                    Diese Klasse hat nicht an der Mathematik-Überprüfung teilgenommen.
                </p>
                <p v-if="tableStudents.length === 0" class="text-sm text-gray-500">Keine Daten für diese Klasse vorhanden.</p>
                <table v-else class="table-auto border-collapse text-sm">
                    <caption class="sr-only">
                        Kompetenztestergebnisse nach Schüler:in und Fach
                    </caption>
                    <thead>
                        <tr class="bg-primary text-white">
                            <th
                                id="col-student"
                                scope="col"
                                class="border-primary border border-r-white px-2 py-2"
                                :colspan="hasAnyNames ? 2 : 1"
                            >
                                Schüler:in
                            </th>
                            <th id="col-deutsch" scope="colgroup" class="border-primary border border-r-white px-2 py-2" colspan="2">
                                Deutsch
                            </th>
                            <th id="col-mathe" scope="colgroup" class="border-primary border px-2 py-2">Mathematik</th>
                        </tr>
                        <tr>
                            <th scope="col" headers="col-student" class="sortable-header" @click="setSort('code')">
                                <div>
                                    <span>Code</span>
                                    <SortIcon subject="code" subdomain="" :sort-key="sortKey" :sort-order="sortOrder" />
                                </div>
                            </th>
                            <th v-if="hasAnyNames" scope="col" headers="col-student" class="sortable-header">
                                <div><span>Name</span></div>
                            </th>
                            <th id="col-de-lese" scope="col" headers="col-deutsch" class="sortable-header" @click="setSort('le')">
                                <div>
                                    <span>Kompetenzstufe<br />Leseverstehen</span>
                                    <SortIcon subject="le" subdomain="" :sort-key="sortKey" :sort-order="sortOrder" />
                                </div>
                            </th>
                            <th id="col-de-orth" scope="col" headers="col-deutsch" class="sortable-header" @click="setSort('rs')">
                                <div>
                                    <span>Kompetenzstufe<br />Orthografie</span>
                                    <SortIcon subject="rs" subdomain="" :sort-key="sortKey" :sort-order="sortOrder" />
                                </div>
                            </th>
                            <th id="col-ma-gesamt" scope="col" headers="col-mathe" class="sortable-header" @click="setSort('ma')">
                                <div>
                                    <span>Kompetenzstufe<br />Gesamt</span>
                                    <SortIcon subject="ma" subdomain="" :sort-key="sortKey" :sort-order="sortOrder" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="student in sortedStudents"
                            :key="student.code"
                            class="border-b border-gray-300 transition-opacity hover:bg-gray-100"
                            :class="rowClassForTable(student.code)"
                        >
                            <td headers="col-student" class="table-cell px-2 font-mono">{{ student.code }}</td>
                            <td v-if="hasAnyNames" headers="col-student" class="table-cell px-2 text-left text-gray-600">
                                {{ namesStore.getName(student.code) ?? '–' }}
                            </td>
                            <td headers="col-deutsch col-de-lese" class="table-cell" :class="cellClass(student.code, 'le')">
                                <CompetenceLevelBand :data="{ competenceLevel: student.le ?? null, domainId: 'le' }" />
                            </td>
                            <td headers="col-deutsch col-de-orth" class="table-cell" :class="cellClass(student.code, 'rs')">
                                <CompetenceLevelBand :data="{ competenceLevel: student.rs ?? null, domainId: 'rs' }" />
                            </td>
                            <td headers="col-mathe col-ma-gesamt" class="table-cell" :class="cellClass(student.code, 'ma')">
                                <CompetenceLevelBand :data="{ competenceLevel: student.ma ?? null, domainId: '' }" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </template>
</template>

<style scoped>
@reference '../style.css';

.sortable-header {
    @apply cursor-pointer border-b-2 border-gray-300 py-3 text-center align-middle select-none;
}

.sortable-header div {
    @apply inline-flex items-center justify-center gap-2 px-3;
}

.table-cell {
    @apply py-2 text-center;
}
</style>
