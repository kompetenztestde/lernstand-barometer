<script setup lang="ts">
import { computed } from 'vue'
import type { StudentScoreBarData } from './types'

const props = defineProps<{ data: StudentScoreBarData }>()

const isConfigured = computed(() => props.data.total > 0)

type Segment = {
    competenceLevel: string
    arabicNumber: string
    subtitle: string
    description?: string
    from: number
    to: number
    leftPct: number
    widthPct: number
}

const segments = computed((): Segment[] => {
    const { cutoffs, total } = props.data
    if (!isConfigured.value || !cutoffs.length) return []
    const sorted = [...cutoffs].sort((a, b) => a.cutoff - b.cutoff)
    return sorted.map((c, i) => {
        // Bar positioning uses continuous scale — boundaries at the cutoff value itself
        const barFrom = i === 0 ? 0 : sorted[i - 1].cutoff
        const barTo = i < sorted.length - 1 ? c.cutoff : total
        // Display range uses integer boundaries for the tooltip
        const from = i === 0 ? 0 : sorted[i - 1].cutoff + 1
        const to = i < sorted.length - 1 ? c.cutoff : total
        return {
            competenceLevel: c.competenceLevel,
            arabicNumber: c.arabicNumber,
            subtitle: c.subtitle,
            description: c.description,
            from,
            to,
            leftPct: (barFrom / total) * 100,
            widthPct: ((barTo - barFrom) / total) * 100,
        }
    })
})

const reachedSegment = computed((): Segment | null => {
    if (props.data.score === null || !isConfigured.value) return null
    return segments.value.find((s) => props.data.score! <= s.to) ?? segments.value[segments.value.length - 1] ?? null
})

const pointsToNextLevel = computed((): number | null => {
    if (props.data.score === null || !reachedSegment.value) return null
    const idx = segments.value.indexOf(reachedSegment.value)
    if (idx === -1 || idx === segments.value.length - 1) return null
    return segments.value[idx + 1].from - props.data.score
})

const scoreMarkerPct = computed((): number | null => {
    if (props.data.score === null || !isConfigured.value) return null
    return Math.min((props.data.score / props.data.total) * 100, 100)
})

const barHeight = 2.5 // bar thickness in rem
const segmentLabelSize = 12 // font size in px for the KS labels inside the bar
const reachedSegmentLabelSize = 20 // font size in px for the reached segment's KS label
const triangleSize = 8 // half-base in px
const triangleHeight = 12 // height in px — increase to make it more pointy
const triangleOffset = 3 // gap in px between bar bottom and triangle tip
const compLevelOffset = -15 // gap in px between competence level label and bar top
const compLevelLabelSize = 14 // font size in px for the "Erreichte Kompetenzstufe" badge
const bracketOffset = 6 // gap in px between bar top and the bracket baseline
const bracketThickness = 3 // line thickness in px for the bracket
const bracketLabelGap = 32 // gap in px between label bottom and connector start
const bracketBaselineGap = 6 // gap in px between connector end and horizontal baseline

const colorClasses: Record<string, string> = {
    '1': 'bg-competence-level-1',
    '2': 'bg-competence-level-2',
    '3': 'bg-competence-level-3',
    '4': 'bg-competence-level-4',
    '5': 'bg-competence-level-5',
}
</script>

<template>
    <div class="w-full">
        <template v-if="isConfigured">
            <!-- Grid layout: [left-label] [bar] [right-label] — aligns all rows to the bar width -->
            <div class="grid w-full" style="grid-template-columns: auto 1fr auto">
                <!-- Row 1: Label above the bar with bracket (middle column only) -->
                <div />
                <div class="relative mb-1" style="height: 2rem">
                    <template v-if="reachedSegment">
                        <!-- Horizontal base line -->
                        <div
                            class="pointer-events-none absolute"
                            :style="{
                                left: `${reachedSegment.leftPct}%`,
                                width: `${reachedSegment.widthPct}%`,
                                bottom: `${bracketOffset}px`,
                                height: `${bracketThickness}px`,
                                backgroundColor: 'var(--color-primary)',
                            }"
                        />
                        <!-- Left tick pointing down -->
                        <div
                            class="pointer-events-none absolute"
                            :style="{
                                left: `${reachedSegment.leftPct}%`,
                                bottom: `${bracketOffset - 6}px`,
                                width: `${bracketThickness}px`,
                                height: '6px',
                                backgroundColor: 'var(--color-primary)',
                            }"
                        />
                        <!-- Right tick pointing down -->
                        <div
                            class="pointer-events-none absolute"
                            :style="{
                                left: `${reachedSegment.leftPct + reachedSegment.widthPct - 0.4}%`,
                                bottom: `${bracketOffset - 6}px`,
                                width: `${bracketThickness}px`,
                                height: '9px',
                                backgroundColor: 'var(--color-primary)',
                            }"
                        />
                        <!-- Center vertical connector from label to baseline -->
                        <div
                            class="pointer-events-none absolute"
                            :style="{
                                left: `${reachedSegment.leftPct + reachedSegment.widthPct / 2}%`,
                                top: `${compLevelOffset + bracketLabelGap}px`,
                                bottom: `${bracketBaselineGap}px`,
                                width: `${bracketThickness}px`,
                                backgroundColor: 'var(--color-primary)',
                            }"
                        />
                        <!-- Label text -->
                        <span
                            class="bg-primary absolute -translate-x-1/2 rounded px-3 py-1 font-medium whitespace-nowrap text-white"
                            :style="{
                                left: `${reachedSegment.leftPct + reachedSegment.widthPct / 2}%`,
                                top: `${compLevelOffset}px`,
                                fontSize: `${compLevelLabelSize}px`,
                            }"
                        >
                            Erreichte Kompetenzstufe: {{ reachedSegment.competenceLevel }}
                        </span>
                    </template>
                </div>
                <div />

                <!-- Row 2: Minimum Points | Bar | Maximum Points -->
                <!-- Minimum Points -->
                <div class="mr-2 flex flex-col items-end justify-center text-sm text-gray-400">
                    <span>0</span><span class="text-xs">Punkte</span>
                </div>
                <!-- Bar: outer wrapper keeps overflow visible so tooltips can escape -->
                <div class="relative w-full" :style="{ height: `${barHeight}rem` }">
                    <!-- Colored segment background — overflow hidden for rounded corners -->
                    <div class="absolute inset-0 flex overflow-hidden rounded border border-gray-300">
                        <div
                            v-for="seg in segments"
                            :key="seg.competenceLevel"
                            class="h-full opacity-80"
                            :class="colorClasses[seg.arabicNumber]"
                            :style="{ width: `${seg.widthPct}%` }"
                        />
                    </div>

                    <!-- Reached competence level outline -->
                    <div
                        v-if="reachedSegment"
                        class="pointer-events-none absolute inset-y-0"
                        :style="{
                            left: `${reachedSegment.leftPct}%`,
                            width: `${reachedSegment.widthPct}%`,
                            outline: '3px solid var(--color-primary)',
                            outlineOffset: '-2px',
                        }"
                    />

                    <!-- Hover interaction layer — sits on top, not overflow-hidden -->
                    <div class="absolute inset-0 flex">
                        <div
                            v-for="seg in segments"
                            :key="seg.competenceLevel"
                            v-tippy="{
                                content: `<p class='font-semibold text-primary mb-1'>Kompetenzstufe ${seg.competenceLevel}: ${seg.subtitle}</p><p>${seg.description ? `${seg.description}` : ''}</p><p class='text-gray-500 mt-1'>${seg.from}–${seg.to} Punkte</p>`,
                            }"
                            class="relative h-full cursor-default"
                            :style="{ width: `${seg.widthPct}%` }"
                        >
                            <!-- Level label -->
                            <span
                                class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden font-bold text-white drop-shadow-sm select-none"
                                :style="{
                                    fontSize: `${seg.competenceLevel === reachedSegment?.competenceLevel ? reachedSegmentLabelSize : segmentLabelSize}px`,
                                }"
                            >
                                KS {{ seg.competenceLevel }}
                            </span>
                        </div>
                    </div>
                </div>
                <!-- Maximum Points -->
                <div class="ml-2 flex flex-col items-start justify-center text-sm text-gray-400">
                    <span>{{ props.data.total }}</span
                    ><span class="text-xs">Punkte</span>
                </div>

                <!-- Row 3: Triangle/score below (middle column only) -->
                <div />
                <div
                    class="relative mt-0.5"
                    :style="{ minHeight: `${triangleOffset + triangleHeight + (pointsToNextLevel !== null ? 40 : 24)}px` }"
                >
                    <template v-if="props.data.score !== null && scoreMarkerPct !== null">
                        <!-- Triangle pointing up at the score position -->
                        <div
                            class="pointer-events-none absolute -translate-x-1/2"
                            :style="{
                                left: `${scoreMarkerPct}%`,
                                top: `${triangleOffset}px`,
                                width: 0,
                                height: 0,
                                borderLeft: `${triangleSize}px solid transparent`,
                                borderRight: `${triangleSize}px solid transparent`,
                                borderBottom: `${triangleHeight}px solid var(--color-secondary)`,
                            }"
                        />
                        <!-- Reached points and Points needed for next level -->
                        <div
                            class="bg-secondary absolute -translate-x-1/2 rounded border px-3 py-1 text-center text-sm whitespace-nowrap text-white"
                            :style="{
                                left: `${scoreMarkerPct}%`,
                                top: `${triangleOffset + triangleHeight + 2}px`,
                                // color: 'var(--color-secondary)',
                            }"
                        >
                            <div class="-mb-0.4 font-medium">Erreichte Punkte: {{ props.data.score }}</div>
                            <div v-if="pointsToNextLevel !== null" class="italic">Nächste Stufe in: {{ pointsToNextLevel }} Punkten</div>
                        </div>
                    </template>
                    <span v-else class="text-xs text-gray-400">Keine Punktzahl verfügbar</span>
                </div>
                <div />
            </div>
            <!-- end grid -->
        </template>

        <!-- Placeholder when cutoffs are not yet configured -->
        <div
            v-else
            class="flex w-full items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
            style="height: 2rem"
        >
            Cutoffs werden noch konfiguriert
        </div>
    </div>
</template>
