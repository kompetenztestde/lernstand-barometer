<script setup lang="ts">
import { computed, toRef } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useViewSelectionStore } from '@/stores/viewSelection'
import GroupSelectButton from '@/components/base/GroupSelectButton.vue'
import PrintPdfButton from '@/components/base/PrintPdfButton.vue'
import NameImportButton from '@/components/base/NameImportButton.vue'
import { useStudentsQuery } from '@/queries/useStudentsQuery'
import { useGroupItemsQuery } from '@/queries/useGroupsItemsQuery'
import { useGroupsAggregationsQuery } from '@/queries/useGroupsAggregationsQuery'
import ResultDonutsSection from './resultTests/ResultDonutsSection.vue'
import ResultCompetenceBoxSection from './resultTests/ResultCompetenceBoxSection.vue'
import ResultSubDomainSection from './resultTests/ResultSubDomainSection.vue'
import ResultTaskListSection from './resultTests/ResultTaskListSection.vue'

const viewSelection = useViewSelectionStore()
const selectedGroupId = computed({
    get: () => viewSelection.selectedGroupId,
    set: (val) => viewSelection.setSelectedGroupId(val),
})
const groupIdRef = toRef(() => selectedGroupId.value)

// queries are cached by TanStack — called here only to drive usePageReady
const { isPending: studentsIsPending } = useStudentsQuery(selectedGroupId)
const { isPending: itemsIsPending } = useGroupItemsQuery(toRef(() => selectedGroupId.value!))
const { isPending: aggsPending } = useGroupsAggregationsQuery(groupIdRef)
usePageReady(computed(() => groupIdRef.value !== null && (studentsIsPending.value || itemsIsPending.value || aggsPending.value)))
</script>

<template>
    <div class="mb-4 flex items-center justify-between print:hidden">
        <GroupSelectButton v-model="selectedGroupId" />
        <div class="flex items-center gap-2">
            <NameImportButton />
            <PrintPdfButton v-if="selectedGroupId" page="result-tests" />
        </div>
    </div>

    <template v-if="selectedGroupId">
        <ResultDonutsSection :group-id="selectedGroupId" />
        <ResultCompetenceBoxSection :group-id="selectedGroupId" class="mt-14 xl:mt-25 print:mt-0" />
        <ResultSubDomainSection :group-id="selectedGroupId" class="mt-14 xl:mt-25 print:mt-0" />
        <ResultTaskListSection :group-id="selectedGroupId" class="mt-14 xl:mt-25 print:mt-0" />
    </template>
</template>
