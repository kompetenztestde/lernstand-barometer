<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { ScoreBarGroup } from '@/components/charts/scoreBar'
import BaseHeading from '@/components/base/BaseHeading.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import SubDomainLabel from './subDomainLabel.vue'
import BaseCaret from '@/components/base/BaseCaret.vue'
import type { SubDomainChartData } from './types'
import { useInterpretationSection } from '@/composables/useInterpretationSection'

const props = withDefaults(defineProps<{ data: SubDomainChartData; showInterpretation?: boolean }>(), {
    showInterpretation: true,
})

const competenceLevels = ['I', 'II', 'III', 'IV', 'V'] as const

// ── Collapse state ─────────────────────────────────────────────────────────

const showDomains = ref(true)
const showCompLvls = ref(true)
const showCompetences = ref(true)

const showInterpretationRef = toRef(props, 'showInterpretation')

// ── Kompetenzbereiche ──────────────────────────────────────────────────────

const domainQuestions = [
    { id: 'maxDiff', label: '↕ Größte Differenz zum fairen Vergleichswert' },
    { id: 'above', label: '↑ Klasse über dem fairen Vergleichswert' },
    { id: 'below', label: '↓ Klasse unter dem fairen Vergleichswert' },
]

const { activeQuestion: activeDomainQuestion, rowClass: domainRowClass } = useInterpretationSection((q) => {
    const set = new Set<string>()
    const { domainBars } = props.data
    if (q === 'maxDiff') {
        const diffs = (['le', 'rs'] as const).map((domain) => ({
            id: `domain_${domain}`,
            diff: Math.abs(Math.round(domainBars[domain].mean) - Math.round(domainBars[domain].meanComparison)),
        }))
        const maxDiff = Math.max(...diffs.map((d) => d.diff))
        diffs.filter((d) => d.diff === maxDiff).forEach((d) => set.add(d.id))
    }
    if (q === 'above') {
        for (const domain of ['le', 'rs'] as const) {
            if (Math.round(domainBars[domain].mean) > Math.round(domainBars[domain].meanComparison)) set.add(`domain_${domain}`)
        }
    }
    if (q === 'below') {
        for (const domain of ['le', 'rs'] as const) {
            if (Math.round(domainBars[domain].mean) < Math.round(domainBars[domain].meanComparison)) set.add(`domain_${domain}`)
        }
    }
    return set
}, showInterpretationRef)

// ── Kompetenzstufen ────────────────────────────────────────────────────────

const compLvlQuestions = [
    { id: 'maxDiff', label: '↕ Größte Differenz zum fairen Vergleichswert' },
    { id: 'above', label: '↑ Klasse über dem fairen Vergleichswert' },
    { id: 'below', label: '↓ Klasse unter dem fairen Vergleichswert' },
]

const { activeQuestion: activeCompLvlQuestion, rowClass: compLvlRowClass } = useInterpretationSection((q) => {
    const set = new Set<string>()
    const { compLvlBars } = props.data
    if (q === 'maxDiff') {
        const diffs = (['le', 'rs'] as const).flatMap((domain) =>
            competenceLevels.map((level) => ({
                id: `compLvl_${domain}_${level}`,
                diff: Math.abs(Math.round(compLvlBars[domain][level].mean) - Math.round(compLvlBars[domain][level].meanComparison)),
            })),
        )
        const maxDiff = Math.max(...diffs.map((d) => d.diff))
        diffs.filter((d) => d.diff === maxDiff).forEach((d) => set.add(d.id))
    }
    if (q === 'above') {
        for (const domain of ['le', 'rs'] as const) {
            for (const level of competenceLevels) {
                if (Math.round(compLvlBars[domain][level].mean) > Math.round(compLvlBars[domain][level].meanComparison)) set.add(`compLvl_${domain}_${level}`)
            }
        }
    }
    if (q === 'below') {
        for (const domain of ['le', 'rs'] as const) {
            for (const level of competenceLevels) {
                if (Math.round(compLvlBars[domain][level].mean) < Math.round(compLvlBars[domain][level].meanComparison)) set.add(`compLvl_${domain}_${level}`)
            }
        }
    }
    return set
}, showInterpretationRef)

// ── Bildungsstandards ──────────────────────────────────────────────────────

const competenceQuestions = [
    { id: 'maxDiff', label: '↕ Größte Differenz zum fairen Vergleichswert' },
    { id: 'above', label: '↑ Klasse über dem fairen Vergleichswert' },
    { id: 'below', label: '↓ Klasse unter dem fairen Vergleichswert' },
]

const { activeQuestion: activeCompetenceQuestion, rowClass: competenceRowClass } = useInterpretationSection((q) => {
    const set = new Set<string>()
    const { competenceIdBars, competenceIdDefs } = props.data
    if (q === 'maxDiff') {
        const diffs = competenceIdDefs
            .filter((def) => !!competenceIdBars[def.competenceId])
            .map((def) => ({
                id: `competence_${def.competenceId}`,
                diff: Math.abs(Math.round(competenceIdBars[def.competenceId].mean) - Math.round(competenceIdBars[def.competenceId].meanComparison)),
            }))
        const maxDiff = Math.max(...diffs.map((d) => d.diff))
        diffs.filter((d) => d.diff === maxDiff).forEach((d) => set.add(d.id))
    }
    if (q === 'above') {
        for (const def of competenceIdDefs) {
            const bar = competenceIdBars[def.competenceId]
            if (bar && Math.round(bar.mean) > Math.round(bar.meanComparison)) set.add(`competence_${def.competenceId}`)
        }
    }
    if (q === 'below') {
        for (const def of competenceIdDefs) {
            const bar = competenceIdBars[def.competenceId]
            if (bar && Math.round(bar.mean) < Math.round(bar.meanComparison)) set.add(`competence_${def.competenceId}`)
        }
    }
    return set
}, showInterpretationRef)

const sortedCompetenceIdDefs = computed(() =>
    [...props.data.competenceIdDefs].sort(
        (a, b) => (props.data.competenceIdBars[a.competenceId]?.mean ?? 0) - (props.data.competenceIdBars[b.competenceId]?.mean ?? 0),
    ),
)
</script>

<template>
    <div>
        <!-- Kompetenzbereiche -->
        <div>
            <button
                type="button"
                @click="showDomains = !showDomains"
                :aria-expanded="showDomains"
                class="text-primary hover:bg-primary/5 flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-lg/6 font-semibold tracking-wide uppercase xl:text-xl/7"
            >
                Kompetenzbereiche
                <BaseCaret :is-expanded="showDomains" class="ml-1 size-4 print:hidden" />
            </button>
            <div v-show="showDomains" class="mt-5 flex gap-8 pb-12">
                <div class="min-w-0 flex-1">
                    <div
                        v-for="domain in ['le', 'rs'] as const"
                        :key="domain"
                        class="ml-2 flex items-center gap-5 rounded px-2 py-1 outline outline-transparent transition-all print:break-inside-avoid"
                        :class="domainRowClass(`domain_${domain}`)"
                    >
                        <SubDomainLabel
                            :description-title="
                                'Kompetenzbereich ' + (props.data.domainDefs.find((d) => d.domainId === domain)?.label ?? '')
                            "
                            :description-body="props.data.domainDefs.find((d) => d.domainId === domain)?.description ?? ''"
                        >
                            {{ domain }}
                        </SubDomainLabel>
                        <ScoreBarGroup
                            orientation="row"
                            :showTitle="true"
                            :bars="[
                                {
                                    title: 'Klassen-MW',
                                    barValue: props.data.domainBars[domain].mean,
                                    barLength: props.data.domainBars[domain].mean,
                                    barValueSuffix: '%',
                                    color: 'var(--color-primary)',
                                },
                                {
                                    title: 'Fairer Vergleichswert',
                                    titleTooltip: props.data.fairComparisonTooltip,
                                    titleTooltipUnderlineOffset: '2px',
                                    titleTooltipUnderlineThickness: '1px',
                                    barValue: props.data.domainBars[domain].meanComparison,
                                    barLength: props.data.domainBars[domain].meanComparison,
                                    barValueSuffix: '%',
                                    color: 'var(--color-tertiary)',
                                },
                            ]"
                        />
                    </div>
                </div>
                <InterpretationPanel
                    class="w-60!"
                    :questions="domainQuestions"
                    :show="props.showInterpretation"
                    v-model="activeDomainQuestion"
                />
            </div>
        </div>

        <!-- Kompetenzstufen -->
        <div>
            <button
                type="button"
                @click="showCompLvls = !showCompLvls"
                :aria-expanded="showCompLvls"
                class="hover:bg-primary/5 text-primary flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-lg/6 font-semibold tracking-wide uppercase xl:text-xl/7"
            >
                Kompetenzstufen
                <BaseCaret :is-expanded="showCompLvls" class="ml-1 size-4 print:hidden" />
            </button>
            <div v-show="showCompLvls" class="mt-5 flex gap-8 pb-12">
                <div class="min-w-0 flex-1">
                    <div
                        v-for="(domainLabel, domainId) in { le: 'Leseverstehen', rs: 'Orthografie' }"
                        :key="domainId"
                        class="mt-6 ml-2 first:mt-0"
                    >
                        <BaseHeading level="h3">{{ domainLabel }}</BaseHeading>
                        <div>
                            <div
                                v-for="level in competenceLevels"
                                :key="level"
                                class="flex items-center gap-5 rounded px-2 py-1 outline outline-transparent transition-all print:break-inside-avoid"
                                :class="compLvlRowClass(`compLvl_${domainId}_${level}`)"
                            >
                                <SubDomainLabel
                                    :description-title="
                                        'Kompetenzstufe ' +
                                        level +
                                        ': ' +
                                        (props.data.compLvlDefs[domainId]?.find((cl) => cl.romanNumber === level)?.subtitle ?? '')
                                    "
                                    :description-body="
                                        props.data.compLvlDefs[domainId]?.find((cl) => cl.romanNumber === level)?.description ?? ''
                                    "
                                >
                                    {{ level }}
                                </SubDomainLabel>
                                <ScoreBarGroup
                                    orientation="row"
                                    :showTitle="true"
                                    :bars="[
                                        {
                                            title: 'Klassen-MW',
                                            barValue: props.data.compLvlBars[domainId][level].mean,
                                            barLength: props.data.compLvlBars[domainId][level].mean,
                                            barValueSuffix: '%',
                                            color: 'var(--color-primary)',
                                        },
                                        {
                                            title: 'Fairer Vergleichswert',
                                            titleTooltip: props.data.fairComparisonTooltip,
                                            titleTooltipUnderlineOffset: '2px',
                                            titleTooltipUnderlineThickness: '1px',
                                            barValue: props.data.compLvlBars[domainId][level].meanComparison,
                                            barLength: props.data.compLvlBars[domainId][level].meanComparison,
                                            barValueSuffix: '%',
                                            color: 'var(--color-tertiary)',
                                        },
                                    ]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <InterpretationPanel
                    class="w-60!"
                    :questions="compLvlQuestions"
                    :show="props.showInterpretation"
                    v-model="activeCompLvlQuestion"
                />
            </div>
        </div>

        <!-- Bildungsstandards -->
        <div>
            <button
                type="button"
                @click="showCompetences = !showCompetences"
                :aria-expanded="showCompetences"
                class="hover:bg-primary/5 text-primary flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-lg/6 font-semibold tracking-wide uppercase xl:text-xl/7"
            >
                Bildungsstandards
                <BaseCaret :is-expanded="showCompetences" class="ml-1 size-4 print:hidden" />
            </button>
            <div v-show="showCompetences" class="mt-5 flex gap-8 pb-12">
                <div class="min-w-0 flex-1">
                    <div
                        v-for="def in sortedCompetenceIdDefs"
                        :key="def.competenceId"
                        class="ml-2 flex items-center gap-5 rounded px-2 py-1 outline outline-transparent transition-all print:break-inside-avoid"
                        :class="competenceRowClass(`competence_${def.competenceId}`)"
                    >
                        <SubDomainLabel :description-title="def.label" :description-body="def.description" class="text-xl font-semibold">
                            {{ def.competenceId }}
                        </SubDomainLabel>
                        <ScoreBarGroup
                            orientation="row"
                            :showTitle="true"
                            :bars="[
                                {
                                    title: 'Klassen-MW',
                                    barValue: props.data.competenceIdBars[def.competenceId].mean,
                                    barLength: props.data.competenceIdBars[def.competenceId].mean,
                                    barValueSuffix: '%',
                                    color: 'var(--color-primary)',
                                },
                                {
                                    title: 'Fairer Vergleichswert',
                                    titleTooltip: props.data.fairComparisonTooltip,
                                    titleTooltipUnderlineOffset: '2px',
                                    titleTooltipUnderlineThickness: '1px',
                                    barValue: props.data.competenceIdBars[def.competenceId].meanComparison,
                                    barLength: props.data.competenceIdBars[def.competenceId].meanComparison,
                                    barValueSuffix: '%',
                                    color: 'var(--color-tertiary)',
                                },
                            ]"
                        />
                    </div>
                </div>
                <InterpretationPanel
                    class="w-60!"
                    :questions="competenceQuestions"
                    :show="props.showInterpretation"
                    v-model="activeCompetenceQuestion"
                />
            </div>
            <!-- Explanations for aggregations print-only -->
            <div class="hidden text-xs print:block">
                <h4 class="text-primary mb-6 text-xl font-semibold tracking-wide uppercase">Erläuterungen zu den Teilbereichen</h4>
                <!-- Kompetenzbereiche -->
                <div class="mb-8">
                    <h4 class="text-primary mb-2 font-semibold tracking-wide uppercase">Kompetenzbereiche</h4>
                    <dl>
                        <div class="grid grid-cols-2 gap-4">
                            <div v-for="def in props.data.domainDefs" :key="def.domainId" class="break-inside-avoid">
                                <dt class="font-semibold">{{ def.domainId.toUpperCase() }} {{ def.label }}</dt>
                                <dd class="mt-0.5 text-gray-700">{{ def.description }}</dd>
                            </div>
                        </div>
                    </dl>
                </div>
                <!-- Kompetenzstufen -->
                <div class="mb-8">
                    <h4 class="text-primary mt-4 mb-2 font-semibold tracking-wide uppercase">Kompetenzstufen</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div v-for="(domainLabel, domainId) in { le: 'Leseverstehen', rs: 'Orthografie' }" :key="domainId">
                            <h5 class="mt-3 mb-3 text-sm font-semibold">{{ domainLabel }}</h5>
                            <dl class="space-y-2">
                                <div v-for="def in props.data.compLvlDefs[domainId]" :key="def.romanNumber" class="break-inside-avoid">
                                    <dt class="font-semibold">{{ def.romanNumber }} {{ def.subtitle }}</dt>
                                    <dd class="mt-0.5 text-gray-700">{{ def.description }}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
                <!-- Bildungsstandards -->
                <div>
                    <h4 class="text-primary mt-4 mb-2 font-semibold tracking-wide uppercase">Bildungsstandards</h4>
                    <dl class="space-y-2">
                        <div v-for="def in sortedCompetenceIdDefs" :key="def.competenceId" class="break-inside-avoid">
                            <dt class="font-semibold">{{ def.competenceId }} {{ def.label }}</dt>
                            <dd class="mt-0.5 text-gray-700">{{ def.description }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    </div>
</template>
