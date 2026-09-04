<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import TeacherInfoButton from '@/components/TeacherInfoButton.vue'
import { useGroupsItemsQuery, mapItemsToTaskList, type TaskListItem } from '@/queries/useGroupsItemsQuery'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import PrintPdfButton from '@/components/base/PrintPdfButton.vue'
import { ConferenceTaskList } from '@/components/charts/conferenceTaskList'
import { lvlStyle, colors, compLvls } from '@/components/charts/conferenceTaskList/utils'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import { useInterpretationSection, type InterpretationQuestion } from '@/composables/useInterpretationSection'

const allowedTestIds = [import.meta.env.VITE_TEST_ID].filter(Boolean)

const { data: participatedGroups } = useParticipatedGroupsQuery()
const filteredGroups = computed(() =>
    (participatedGroups.value ?? []).filter((g) => g.participatedTests.some((t) => allowedTestIds.includes(String(t)))),
)
const groupIds = computed(() => filteredGroups.value.map((g) => g.groupId))
const groupNames = computed(() => filteredGroups.value.map((g) => g.groupName))

const groupsItems = useGroupsItemsQuery(groupIds)

// Row list: use the first group's items as master, sorted by position
const masterItems = computed(() => mapItemsToTaskList(groupsItems.value[0]?.data?.groupData?.items ?? []))

// Per-group lookup map: iqbId → TaskListItem (for O(1) cell access)
const itemMaps = computed(() =>
    groupsItems.value.map((result) => {
        const map = new Map<string, TaskListItem>()
        for (const item of mapItemsToTaskList(result.data?.groupData?.items ?? [])) {
            map.set(item.iqbId, item)
        }
        return map
    }),
)

const isLoading = computed(() => groupIds.value.length > 0 && groupsItems.value.some((r) => r.isPending))

usePageReady(isLoading)
const isError = computed(() => groupsItems.value.some((r) => r.isError))

type CombinedView = 'A-simple' | 'A-complex' | 'B'
const combinedView = ref<CombinedView>('A-simple')
const view = computed(() => (combinedView.value === 'B' ? 'B' : 'A'))
const viewBDetail = computed(() => (combinedView.value === 'A-complex' ? 'complex' : 'simple'))

const viewOptions = [
    { value: 'A-simple', label: 'Ansicht A (einfach)' },
    { value: 'A-complex', label: 'Ansicht A (komplex)' },
    { value: 'B', label: 'Ansicht B' },
]

const showSubDomainInterpretation = ref(false)

// prettier-ignore
function getCategoryId(mean: number | null, meanComparison: number | null): string | null {
    if (mean === null || meanComparison === null) return null
    const diff = mean - meanComparison
    if (mean > 90 && meanComparison > 90) return 'excellent'
    if (diff > 0)                         return 'better'
    if (diff <= -10)                      return 'worse'
    return 'bad'
}

const categoryRank: Record<string, number> = { excellent: 1, better: 2, worse: 3, bad: 4 }

function itemInterpretation(item: TaskListItem): string {
    const ranks = itemMaps.value
        .map((m) => m.get(item.iqbId))
        .map((g) => (g ? getCategoryId(g.mean, g.meanCorrected) : null))
        .filter((c): c is string => c !== null)
        .map((c) => categoryRank[c])
        .filter((r): r is number => r !== undefined)

    if (ranks.length < 2) return 'kein'
    const minR = Math.min(...ranks)
    const maxR = Math.max(...ranks)
    if (minR === maxR) return 'kein'

    const presentRanks = new Set(ranks)
    for (let r = minR + 1; r < maxR; r++) {
        if (!presentRanks.has(r)) return 'stark'
    }
    return 'leicht'
}

const interpretationQuestions: InterpretationQuestion[] = [
    { id: 'stark', label: '↕ Klassen unterscheiden sich stark' },
    { id: 'leicht', label: '↔ Klassen unterscheiden sich leicht' },
    { id: 'kein', label: '= Kein Unterschied' },
]

const { activeQuestion, highlights } = useInterpretationSection(
    (q) => new Set(masterItems.value.filter((item) => itemInterpretation(item) === q).map((item) => item.iqbId)),
    showSubDomainInterpretation,
)

function cellBg(iqbId: string, defaultBg: string): string {
    if (!highlights.value) return defaultBg
    return highlights.value.has(iqbId) ? 'bg-interpretation/20' : defaultBg
}

function coloredCellClass(iqbId: string, mean: number | null, meanCorrected: number | null): string {
    if (!highlights.value || highlights.value.has(iqbId)) return lvlStyle(mean, meanCorrected)
    return 'bg-gray-200'
}
</script>

<template>
    <div>
        <div class="mb-10 flex items-center justify-between gap-2">
            <h2 class="text-primary text-3xl font-bold tracking-wide uppercase xl:text-4xl">Fachkonferenz</h2>
            <div class="flex items-center gap-2 print:hidden">
                <BaseSelect v-model="combinedView" :options="viewOptions" size="md" class="w-fit!" aria-label="Ansicht" />
                <PrintPdfButton page="conference" />
                <TeacherInfoButton />
            </div>
        </div>

        <BaseCard class="mb-4">
            <template v-slot:body>
                <p>
                    Liebe Fachlehrkräfte, in den folgenden Tabellen finden Sie die Testergebnisse der teilnehmenden Klassen an VerA Deutsch
                    Klasse 8 an Ihrer Schule. Der Vergleich ist ein Angebot zur gemeinsamen Entwicklung von Unterricht. In der
                    Vorbereitungswoche des kommenden Schuljahrs können Sie zum Beispiel mit Ihren Kolleg:innen in der Fachkonferenz
                    vergleichen, welche Unterrichtsthemen erfolgreich und weniger erfolgreich abgeschlossen wurden. So können Analysen
                    durchgeführt und erprobte Methoden übernommen werden.
                </p>
            </template>
        </BaseCard>

        <BaseLoadingBox v-if="isLoading" class="h-48" />
        <p v-else-if="isError" role="alert" class="text-sm text-red-600">Fehler beim Laden der Aufgabendaten.</p>
        <template v-else>
            <!-- Ansicht A: paginated badge rows with expandable details -->
            <ConferenceTaskList
                v-if="view === 'A'"
                :items="masterItems"
                :itemMaps="itemMaps"
                :groupNames="groupNames"
                :view="view"
                :viewBDetail="viewBDetail"
            />

            <!-- Ansicht B: classic 5-column competence-level table -->
            <div v-else>
                <div class="mb-4 print:hidden">
                    <InterpretationButton v-model="showSubDomainInterpretation" />
                </div>
                <InterpretationPanel
                    :questions="interpretationQuestions"
                    :show="showSubDomainInterpretation"
                    v-model="activeQuestion"
                    class="mb-4 print:hidden"
                >
                </InterpretationPanel>
                <div class="flex max-h-200 justify-start gap-8 overflow-y-scroll print:max-h-none print:overflow-visible">
                    <table>
                        <thead class="sticky top-0 z-10 bg-white">
                            <tr>
                                <th></th>
                                <th
                                    v-for="(group, groupIndex) in groupNames"
                                    :key="groupIndex"
                                    :colspan="compLvls.length"
                                    class="text-center"
                                >
                                    <div>{{ group }}</div>
                                    <div>Kompetenzstufe</div>
                                </th>
                            </tr>
                            <tr>
                                <th>Item-Name</th>
                                <template v-for="group in groupNames" :key="group">
                                    <th v-for="compLvl in compLvls" :key="group + compLvl" class="w-8">{{ compLvl }}</th>
                                </template>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in masterItems" :key="item.iqbId" class="border-b border-gray-300">
                                <td class="max-w-60 truncate px-4" :class="cellBg(item.iqbId, '')">
                                    {{ item.taskNumber }} {{ item.name }}
                                </td>
                                <template v-for="(groupMap, groupIndex) in itemMaps" :key="groupIndex">
                                    <td
                                        v-for="(compLvl, compIndex) in compLvls"
                                        :key="groupIndex + compLvl"
                                        :class="[
                                            compIndex === 0 ? 'border-l border-gray-300' : '',
                                            compIndex === compLvls.length - 1 ? 'border-r border-gray-300' : '',
                                            (() => {
                                                const g = groupMap.get(item.iqbId)
                                                if (g?.competenceLevel !== compLvl) return cellBg(item.iqbId, 'bg-gray-50')
                                                return coloredCellClass(item.iqbId, g.mean, g.meanCorrected)
                                            })(),
                                        ]"
                                    ></td>
                                </template>
                            </tr>
                        </tbody>
                    </table>
                    <div class="sticky top-0 z-10 flex max-w-80 flex-col gap-4 bg-white pt-18 text-sm">
                        <div v-for="(color, index) in colors" :key="index" class="flex items-center gap-6">
                            <div :class="color.colorClass" class="size-5 shrink-0 p-1"></div>
                            <div>{{ color.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
