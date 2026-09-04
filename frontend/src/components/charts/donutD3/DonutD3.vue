<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { DonutD3DataElement } from './types'
import { mockDonutD3Data } from './mockData'

interface Props {
    data?: DonutD3DataElement[]
    width?: number
    height?: number
    margin?: { top: number; right: number; bottom: number; left: number }
    bgBarColor?: string
    fontSize?: string
    showLegend?: boolean
    highlightedIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
    data: () => mockDonutD3Data,
    width: 300,
    height: 300,
    margin: () => ({ top: 20, right: 20, bottom: 20, left: 20 }),
    bgBarColor: '#EFF0F6',
    fontSize: '56px',
    showLegend: true,
})

const svgRef = ref<SVGSVGElement | null>(null)
const cleanupFns: (() => void)[] = []
const activeSegmentId = ref<string | null>(null)
const activeDataElement = ref()
let intervalId: number | null = null
const isPlaying = ref(false)
let currentIndex = 0

function stopInterval() {
    if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
    }
}

function startInterval() {
    stopInterval()
    intervalId = window.setInterval(() => {
        const element = props.data[currentIndex % props.data.length]
        activeSegmentId.value = element.id
        currentIndex++
    }, 2000)
}

function togglePlayPause() {
    if (isPlaying.value) {
        stopInterval()
        isPlaying.value = false
    } else {
        const element = props.data[currentIndex % props.data.length]
        activeSegmentId.value = element.id
        currentIndex++
        startInterval()
        isPlaying.value = true
    }
}

onUnmounted(() => {
    stopInterval()
    cleanupFns.forEach((fn) => fn())
})

onMounted(() => {
    if (!svgRef.value) return

    const innerWidth = props.width - props.margin.left - props.margin.right
    const innerHeight = props.height - props.margin.top - props.margin.bottom
    const outerRadius = Math.min(innerWidth, innerHeight) / 2
    const innerRadius = outerRadius * 0.75
    const highlightThickness = innerRadius * 0.08

    const segmentArcsGenerator = d3.arc<d3.PieArcDatum<DonutD3DataElement>>().innerRadius(innerRadius).outerRadius(outerRadius)
    const highlightArcGenerator = d3
        .arc<d3.PieArcDatum<DonutD3DataElement>>()
        .innerRadius(innerRadius - highlightThickness)
        .outerRadius(outerRadius + highlightThickness)

    const svg = d3
        .select(svgRef.value)
        .attr('width', props.width)
        .attr('height', props.height)
        .append('g')
        .attr('transform', `translate(${props.width / 2},${props.height / 2})`)

    const defs = svg.append('defs')
    defs.append('filter')
        .attr('id', 'drop-shadow')
        .append('feDropShadow')
        .attr('dx', 0)
        .attr('dy', 4)
        .attr('stdDeviation', 3)
        .attr('flood-color', '#000')
        .attr('flood-opacity', 0.7)
    defs.append('filter')
        .attr('id', 'interpret-glow')
        .attr('x', '-30%').attr('y', '-30%')
        .attr('width', '160%').attr('height', '160%')
        .append('feDropShadow')
        .attr('dx', 0).attr('dy', 0)
        .attr('stdDeviation', 8)
        .attr('flood-color', 'var(--color-secondary)')
        .attr('flood-opacity', 1)

    const pieGeneratorSegments = d3
        .pie<DonutD3DataElement>()
        .value((d) => d.value)
        .sort(null)

    let segmentsData: d3.PieArcDatum<DonutD3DataElement>[]

    if (props.data.length > 1) {
        segmentsData = pieGeneratorSegments(props.data)
    } else {
        // Single-value mode: treat value as a percentage (0–100)
        const d = props.data[0]
        const percent = d.value / 100
        segmentsData = [
            {
                data: d,
                index: 0,
                value: d.value,
                startAngle: 0,
                endAngle: 2 * Math.PI * percent,
                padAngle: 0,
            } as d3.PieArcDatum<DonutD3DataElement>,
        ]
    }

    if (props.data.length === 1) {
        const background = d3
            .arc<d3.DefaultArcObject>()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .startAngle(0)
            .endAngle(2 * Math.PI)

        svg.append('path')
            .attr('d', background({} as d3.DefaultArcObject))
            .attr('fill', props.bgBarColor)
    }

    const segments = svg
        .append('g')
        .selectAll('path.segment')
        .data(segmentsData)
        .join('path')
        .attr('class', props.data.length === 1 ? 'segment' : 'segment cursor-pointer')
        .attr('fill', (d) => d.data.color)
        .attr('d', (d) => segmentArcsGenerator(d) ?? '')

    segments
        .attr('d', (d) => segmentArcsGenerator({ ...d, endAngle: d.startAngle }) ?? '')
        .transition()
        .duration(700)
        .attrTween('d', function (d) {
            const interpolate = d3.interpolate(d.startAngle, d.endAngle)
            return function (t: number) {
                return segmentArcsGenerator({ ...d, endAngle: interpolate(t) }) ?? ''
            }
        })

    const highlightLayer = svg.append('g').attr('class', 'highlight-layer')
    const interpretLayer = svg.append('g').attr('class', 'interpret-layer')

    // --- Center text (label + percentage) — adjust all styling here ---
    const centerStyle = {
        groupOffsetPx: -4, // shifts the entire text block up/down in px (positive = down)
        labelFontSize: '24px',
        labelFontWeight: '400',
        labelOffset: '-0.6em', // vertical offset of the label from the midpoint
        valueFontSize: '40px',
        valueFontWeight: 'bold',
        valueOffset: '1.1em', // gap between label baseline and value baseline
    }

    const centerTextGroup = svg
        .append('text')
        .attr('class', 'donut-center-text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(0, ${centerStyle.groupOffsetPx})`)

    const centerLabel =
        props.data.length > 1
            ? centerTextGroup
                  .append('tspan')
                  .attr('x', 0)
                  .attr('dy', centerStyle.labelOffset)
                  .style('font-size', centerStyle.labelFontSize)
                  .style('font-weight', centerStyle.labelFontWeight)
            : null

    const centerText = centerTextGroup
        .append('tspan')
        .attr('x', 0)
        .attr('dy', props.data.length > 1 ? centerStyle.valueOffset : '0.3em')
        .style('font-size', props.data.length > 1 ? centerStyle.valueFontSize : props.fontSize)
        .style('font-weight', props.data.length > 1 ? centerStyle.valueFontWeight : 'bold')
        .text(props.data.length > 1 ? '' : `${props.data[0].value} %`)
    // --- End center text ---

    if (props.data.length > 1) {
        segments.on('click', function (event, d: d3.PieArcDatum<DonutD3DataElement>) {
            stopInterval()
            isPlaying.value = false
            activeSegmentId.value = d.data.id
        })
    } else {
        const d = segmentsData[0]

        highlightLayer
            .append('path')
            .attr('fill', () => {
                const c = d3.color(d.data.color)
                if (!c) return d.data.color
                c.opacity = 0.4
                return c.toString()
            })
            .attr('d', highlightArcGenerator(d) ?? '')
            .attr('filter', 'url(#drop-shadow)')
            .style('pointer-events', 'none')
            .transition()
            .duration(700)
            .attrTween('d', function () {
                const interpolate = d3.interpolate(0, d.endAngle - d.startAngle)
                return function (t: number) {
                    return highlightArcGenerator({ ...d, endAngle: d.startAngle + interpolate(t) }) ?? ''
                }
            })

        centerText.text(`${d.data.value} %`)
    }

    if (props.data.length > 1) {
        svg.append('g')
            .selectAll('text')
            .data(segmentsData.filter((d) => d.data.value > 0))
            .join('text')
            .attr('class', 'donut-print-label')
            .attr('transform', (d) => `translate(${segmentArcsGenerator.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .each(function (d) {
                const t = d3.select(this)
                t.append('tspan')
                    .attr('x', 0)
                    .attr('dy', '-0.5em')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(d.data.labelShort)
                t.append('tspan').attr('x', 0).attr('dy', '1.2em').style('font-size', '12px').text(`${d.data.value} %`)
            })
    }

    if (props.data.length > 1) {
        const printArc = d3
            .arc<d3.PieArcDatum<DonutD3DataElement>>()
            .innerRadius(outerRadius * 0.5)
            .outerRadius(outerRadius)

        const beforePrint = () => {
            segments.attr('d', (d) => printArc(d) ?? '')
            svg.selectAll<SVGTextElement, d3.PieArcDatum<DonutD3DataElement>>('text.donut-print-label').attr(
                'transform',
                (d) => `translate(${printArc.centroid(d)})`,
            )
        }
        const afterPrint = () => {
            segments.attr('d', (d) => segmentArcsGenerator(d) ?? '')
            svg.selectAll<SVGTextElement, d3.PieArcDatum<DonutD3DataElement>>('text.donut-print-label').attr(
                'transform',
                (d) => `translate(${segmentArcsGenerator.centroid(d)})`,
            )
        }

        window.addEventListener('beforeprint', beforePrint)
        window.addEventListener('afterprint', afterPrint)
        cleanupFns.push(
            () => window.removeEventListener('beforeprint', beforePrint),
            () => window.removeEventListener('afterprint', afterPrint),
        )
    }

    function drawHighlight(id: string | null) {
        highlightLayer.selectAll('path').remove()
        if (!id || (props.highlightedIds?.length ?? 0) > 0) return

        const d = segmentsData.find((seg) => seg.data.id === id)
        if (!d) return

        highlightLayer
            .append('path')
            .attr('fill', () => {
                const c = d3.color(d.data.color)
                if (!c) return d.data.color
                c.opacity = 0.4
                return c.toString()
            })
            .attr('d', highlightArcGenerator(d) ?? '')
            .attr('filter', 'url(#drop-shadow)')
            .style('pointer-events', 'none')
            .transition()
            .duration(300)
            .attrTween('d', function () {
                const interpolate = d3.interpolate(0, d.endAngle - d.startAngle)
                return function (t: number) {
                    return highlightArcGenerator({ ...d, endAngle: d.startAngle + interpolate(t) }) ?? ''
                }
            })
    }

    watch(
        () => props.highlightedIds,
        (ids) => {
            interpretLayer.selectAll('path').remove()
            if (!ids || ids.length === 0) {
                segments.transition().duration(200).attr('opacity', 1)
                centerTextGroup.transition().duration(200).style('opacity', '1')
                drawHighlight(activeSegmentId.value)
            } else {
                drawHighlight(null)
                centerTextGroup.transition().duration(200).style('opacity', '0')
                segments.transition().duration(200).attr('opacity', (d) => (ids.includes(d.data.id) ? 1 : 0.1))
                for (const seg of segmentsData.filter((d) => ids.includes(d.data.id))) {
                    interpretLayer
                        .append('path')
                        .attr('fill', 'var(--color-secondary)')
                        .attr('opacity', 0.35)
                        .attr('d', highlightArcGenerator(seg) ?? '')
                        .attr('filter', 'url(#interpret-glow)')
                        .style('pointer-events', 'none')
                }
            }
        },
    )

    watch(activeSegmentId, (id) => {
        drawHighlight(id)
        if (!id) return

        const d = segmentsData.find((seg) => seg.data.id === id)
        if (!d) return

        centerLabel?.text(d.data.labelShort)
        centerText.text(`${d.data.value} %`)
        activeDataElement.value = props.data.find((el) => el.id === activeSegmentId.value) ?? null
    })

    if (props.data.length > 1) {
        const firstNonZero = props.data.find((d) => d.value > 0)
        if (firstNonZero) {
            activeSegmentId.value = firstNonZero.id
            currentIndex = props.data.indexOf(firstNonZero) + 1
        }
    }
})
</script>

<template>
    <div class="flex items-center justify-center gap-2 xl:gap-5">
        <!-- Legend -->
        <div v-if="showLegend" class="text min-w-25 space-y-2 pl-3 lg:space-y-3 print:hidden">
            <button
                v-for="dataElement in data"
                :key="dataElement.id"
                type="button"
                class="mb-1 flex w-full cursor-pointer items-center gap-3 text-gray-700 transition-opacity duration-200 xl:mb-3"
                :class="{ 'opacity-20': props.highlightedIds?.length && !props.highlightedIds.includes(dataElement.id) }"
                :aria-pressed="activeSegmentId === dataElement.id"
                @click="activeSegmentId = dataElement.id"
            >
                <div
                    class="h-4 w-4 rounded-full transition-[background-color,transform] duration-200 ease-in-out xl:h-5 xl:w-5"
                    :style="{
                        backgroundColor:
                            props.highlightedIds?.length && props.highlightedIds.includes(dataElement.id)
                                ? 'var(--color-secondary)'
                                : dataElement.color,
                    }"
                    :class="{ 'scale-120 xl:scale-150': dataElement.id === activeSegmentId && !props.highlightedIds?.length }"
                ></div>
                <div class="lg:text-md flex flex-col text-sm">
                    <span class="font-medium">{{ dataElement.labelShort }}</span>
                    <span>{{ dataElement.value }}&nbsp;%</span>
                </div>
            </button>
        </div>
        <!-- SVG wrapper with play/pause overlay -->
        <div class="relative h-full w-full max-w-md">
            <button
                v-if="data.length > 1"
                type="button"
                @click="togglePlayPause"
                class="text-primary hover:text-primary-dark focus-visible:ring-primary absolute top-0 right-0 z-10 cursor-pointer rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none print:hidden"
                :aria-label="isPlaying ? 'Pausieren' : 'Fortsetzen'"
                v-tippy="isPlaying ? 'Pausieren' : 'Fortsetzen'"
            >
                <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </button>
            <svg
                ref="svgRef"
                :viewBox="`0 0 ${width} ${height}`"
                class="h-full w-full"
                role="img"
                :aria-label="`Donut-Diagramm.`"
                preserveAspectRatio="xMidYMid meet"
            ></svg>
        </div>
    </div>

    <!-- Description (screen only) -->
    <div class="mt-5 min-h-40 w-80 text-xs text-gray-600 md:text-sm lg:mt-2 xl:mt-3 xl:min-h-30 xl:w-100 xl:text-base print:hidden">
        <dl v-if="activeDataElement && !props.highlightedIds?.length">
            <dt class="font-bold">{{ activeDataElement.labelLong }}</dt>
            <dd>{{ activeDataElement.description }}</dd>
        </dl>
    </div>

    <!-- All descriptions (print only) -->
    <dl class="mt-2 hidden space-y-1 text-[0.6rem] text-gray-600 print:block">
        <div v-for="item in data.filter((d) => d.description)" :key="item.id">
            <dt class="font-bold">{{ item.labelLong }}</dt>
            <dd>{{ item.description }}</dd>
        </div>
    </dl>
</template>
