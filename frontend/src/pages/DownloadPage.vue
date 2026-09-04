<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import BaseModal from '@/components/base/BaseModal.vue'
import PrintPdfButton from '@/components/base/PrintPdfButton.vue'
import TableauCard from '@/components/TableauCard.vue'
import TableauGroupRow from '@/components/TableauGroupRow.vue'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import { useSchoolInformationQuery } from '@/queries/useSchoolInformationQuery'

const { data: participatedGroups, isPending: groupsIsPending } = useParticipatedGroupsQuery()

usePageReady(groupsIsPending)
const { data: schoolInfo } = useSchoolInformationQuery()
const groups = computed(() => participatedGroups.value ?? [])

const tableauModalGroupId = ref<number | null>(null)
const tableauModalGroup = computed(() => groups.value.find((g) => g.groupId === tableauModalGroupId.value) ?? null)

function openTableauModal(groupId: number) {
    tableauModalGroupId.value = groupId
}
function closeTableauModal() {
    tableauModalGroupId.value = null
}
</script>

<template>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <!-- test report -->
        <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div>
                <h3 class="text-primary text-lg font-semibold">Fachbericht</h3>
                <p class="mt-1 text-sm text-gray-500">Kompetenzstufen, Aufgabenanalyse und Schüler:innen-Übersicht für eine Klasse.</p>
            </div>
            <ul class="mt-2 space-y-2">
                <li v-for="group in groups" :key="group.groupId" class="flex items-center justify-between gap-4">
                    <span class="text-sm font-medium text-gray-700">{{ group.groupName }}</span>
                    <PrintPdfButton page="result-tests" :group-id="group.groupId" :group-name="group.groupName" />
                </li>
            </ul>
        </div>

        <!-- group report -->
        <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div>
                <h3 class="text-primary text-lg font-semibold">Klassenbericht</h3>
                <p class="mt-1 text-sm text-gray-500">Übersicht der Kompetenzstufen aller Schüler:innen einer Klasse im Vergleich.</p>
            </div>
            <ul class="mt-2 space-y-2">
                <li v-for="group in groups" :key="group.groupId" class="flex items-center justify-between gap-4">
                    <span class="text-sm font-medium text-gray-700">{{ group.groupName }}</span>
                    <PrintPdfButton page="result-groups" :group-id="group.groupId" :group-name="group.groupName" :participated-tests="group.participatedTests" />
                </li>
            </ul>
        </div>

        <!-- conference report -->
        <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div>
                <h3 class="text-primary text-lg font-semibold">Fachkonferenz</h3>
                <p class="mt-1 text-sm text-gray-500">Klassenvergleich aller teilnehmenden Klassen für die Fachkonferenz.</p>
            </div>
            <div class="mt-2">
                <PrintPdfButton v-if="groupsIsPending || groups.length > 0" page="conference" />
                <p v-else class="text-sm text-gray-400">Keine Daten vorhanden</p>
            </div>
        </div>

        <!-- student self-assessment -->
        <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div>
                <h3 class="text-primary text-lg font-semibold">Selbsteinschätzung</h3>
                <p class="mt-1 text-sm text-gray-500">Berichte für alle Schüler:innen einer Klasse als eine PDF-Datei.</p>
            </div>
            <ul class="mt-2 space-y-2">
                <li v-for="group in groups" :key="group.groupId" class="flex items-center justify-between gap-4">
                    <span class="text-sm font-medium text-gray-700">{{ group.groupName }}</span>
                    <PrintPdfButton page="self-evaluation" :group-id="group.groupId" :group-name="group.groupName" all-students />
                </li>
            </ul>
        </div>

        <!-- tabular report -->
        <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div>
                <h3 class="text-primary text-lg font-semibold">Tabellarische Auswertung</h3>
                <p class="mt-1 text-sm text-gray-500">
                    Alle Einzelaufgaben und Zusammenfassungen je Schüler:in als Tabelle – zum Anschauen, als ODS und als CSV.
                </p>
            </div>
            <ul class="mt-2 space-y-2">
                <TableauGroupRow
                    v-for="group in groups"
                    :key="group.groupId"
                    :group-id="group.groupId"
                    :group-name="group.groupName"
                    :school-name="schoolInfo?.schoolName ?? ''"
                    @open-html="openTableauModal"
                />
            </ul>
        </div>

        <!-- tabular report modal -->
        <BaseModal
            :is-open="tableauModalGroupId !== null"
            scrollable
            max-width="max-w-5xl"
            :aria-label="`Tabellarische Auswertung ${tableauModalGroup?.groupName}`"
            @close="closeTableauModal"
        >
            <template #header>
                <h2 class="text-lg font-semibold text-gray-900">Tabellarische Auswertung – {{ tableauModalGroup?.groupName }}</h2>
            </template>
            <TableauCard
                :group-id="tableauModalGroupId!"
                :group-name="tableauModalGroup?.groupName ?? ''"
                :school-name="schoolInfo?.schoolName ?? ''"
            />
        </BaseModal>
    </div>
</template>
