<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDomainDefsQuery, useCompLvlDefsQuery, useCompetenceIdDefsQuery } from '@/queries/useItemParamDefsQuery'
import { useGroupsAggregationsQuery, mapAggregationsToChart } from '@/queries/useGroupsAggregationsQuery'
import { SubDomainChart, type SubDomainChartData } from '@/components/charts/subDomainChart'
import BaseHeading from '@/components/base/BaseHeading.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import { getGlossaryTerm } from '@/queries/useGlossaryQuery.ts'

const props = defineProps<{ groupId: number }>()

const groupIdRef = computed(() => props.groupId)

const showInterpretation = ref(false)

const { data: domainDefs } = useDomainDefsQuery()
const { data: compLvlDefs } = useCompLvlDefsQuery()
const { data: competenceIdDefs } = useCompetenceIdDefsQuery()
const { data: aggregationsData, isPending: aggsPending, isError: aggsIsError } = useGroupsAggregationsQuery(groupIdRef)

const subDomainChartData = computed<SubDomainChartData | null>(() => {
    const aggs = aggregationsData.value?.groupData?.aggregations
    if (!aggs?.length || !domainDefs.value || !compLvlDefs.value) return null
    // hide the chart entirely if no aggregation has been published yet (all means null)
    if (aggs.every((a) => a.descriptiveStatistics.mean === null)) return null
    const chart = mapAggregationsToChart(aggs)
    return {
        ...chart,
        competenceIdDefs: chart.competenceIdDefs.map((def) => ({
            ...def,
            description: competenceIdDefs.value?.find((d) => d.id === def.competenceId)?.description ?? '',
        })),
        domainDefs: domainDefs.value.map((d) => ({ domainId: d.domainId, label: d.name, description: d.description })),
        compLvlDefs: Object.fromEntries(
            compLvlDefs.value.map((d) => [
                d.domainId,
                d.competenceLevels.map((cl) => ({ romanNumber: cl.romanNumber, subtitle: cl.subtitle, description: cl.description })),
            ]),
        ),
        // passed inline so SubDomainChart doesn't need its own glossary dependency
        fairComparisonTooltip: getGlossaryTerm('fair-comparison')?.description,
    }
})
</script>

<template>
    <section class="print:break-after-page">
        <BaseHeading level="h2">
            <span class="flex items-center justify-between">
                <span
                    ><BaseTooltipHint :tooltip="getGlossaryTerm('aggregations')?.description">Teilbereichs</BaseTooltipHint>auswertung</span
                >
                <InterpretationButton v-model="showInterpretation" />
            </span>
        </BaseHeading>
        <BaseLoadingBox v-if="aggsPending" class="h-48" />
        <p v-else-if="aggsIsError" role="alert" class="text-sm text-red-600">Fehler beim Laden der Teilbereichsauswertung.</p>
        <p v-else-if="!subDomainChartData" class="text-sm text-gray-500">Keine Daten vorhanden.</p>
        <SubDomainChart v-else :data="subDomainChartData" :show-interpretation="showInterpretation" />
    </section>
</template>
