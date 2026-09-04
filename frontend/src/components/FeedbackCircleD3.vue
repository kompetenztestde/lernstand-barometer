<script setup lang="ts">
import * as d3 from 'd3'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useCircleHighlight } from '@/composables/useCircleHighlight'

/**
 * This chart consists of one donut (outer months ring) and a pie (inner segments).
 */

interface Segment {
    monthsLength: number
    label: string // use \n for line breaks
    labelOffsetX?: number
    labelOffsetY?: number
    bgColor: string
}

interface Props {
    width?: number
    height?: number
    margin?: { top: number; right: number; bottom: number; left: number }
    /* D3 starts pie charts from 0 rad.
       But we can have segments starting from e.g. december and span two months or more.
       So we need to rotate the pie and start from a different angle. */
    pieStartAngle?: number
    segments?: Segment[] // The segments will be displayed according to the sorting you provide here clockwise.
    ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
    width: 500,
    height: 500,
    margin: () => ({ top: 10, right: 10, bottom: 10, left: 10 }),
    pieStartAngle: -Math.PI / 6,
    segments: () => [
        {
            monthsLength: 3,
            label: 'Evaluation der Maßnahmen\nund Vorbereitung\nauf den nächsten Test',
            bgColor: 'var(--color-quarternary)',
            labelOffsetY: -25,
            labelOffsetX: 14,
        },
        {
            monthsLength: 2,
            label: 'Testdurchführung und\nKorrektur der Ergebnisse',
            bgColor: 'var(--color-quinary)',
            labelOffsetX: 13,
            labelOffsetY: -7,
        },
        {
            monthsLength: 2,
            label: 'Analyse\nder Rückmeldung',
            bgColor: '#597A80',
            labelOffsetX: 18,
            labelOffsetY: 10,
        },
        {
            monthsLength: 5,
            label: 'Planung und Durchführung\nvon Maßnahmen \nzur Weiterentwicklung\ndes Unterrichts',
            bgColor: 'var(--color-primary)',
            labelOffsetX: -7,
            labelOffsetY: -20,
        },
    ],
    ariaLabel:
        'Diese Grafik veranschaulicht den Feedbackkreislauf der Vergleichsarbeiten. Der Kreislauf ist dargestellt wie eine Uhr, die oben mit Januar startet und mit Dezember endet. Die Darstellung als Uhr bzw. Kreislauf steht sinnbildlich dafür, dass dieser Kreislauf idealerweise wieder von vorn beginnen sollte, sobald der letzte Schritt abgeschlossen ist. Folgende Teilschritte gehören zu diesem Kreislauf: Von Dezember bis Januar: "Evaluation der Maßnahmen und Vorbereitung auf den nächsten Test", von März bis April: "Korrektur und Eingabe der Ergebnisse", von Mai bis Juni: "Analyse der Rückmeldung", von Juli bis Oktober: "Planung und Durchführung von Maßnahmen zur Weiterentwicklung des Unterrichts", November: "kein Teilschritt vorhanden.".',
})

const { highlightedSegments, hoverSegment, leaveSegment, navigateToSegment } = useCircleHighlight()

const svgRef = ref<SVGSVGElement | null>(null)

// Held outside Vue reactivity so D3 can update it imperatively
let segmentPathsSelection: d3.Selection<SVGPathElement, d3.PieArcDatum<Segment>, SVGGElement, unknown> | null = null

watch(highlightedSegments, (highlighted) => {
    if (!segmentPathsSelection) return
    segmentPathsSelection
        .transition()
        .duration(200)
        .style('opacity', (_, i) => (highlighted.length === 0 ? 1 : highlighted.includes(i) ? 1 : 0.35))
        .style('filter', (_, i) => (highlighted.length > 0 && highlighted.includes(i) ? 'brightness(1.0)' : 'none'))
        .style('stroke', (_, i) => (highlighted.length > 0 && highlighted.includes(i) ? 'white' : 'none'))
        .style('stroke-width', (_, i) => (highlighted.length > 0 && highlighted.includes(i) ? '3' : '0'))
})

onUnmounted(() => {
    leaveSegment()
})

onMounted(() => {
    if (!svgRef.value) return

    // Clear previous render (safe on remounts)
    d3.select(svgRef.value).selectAll('*').remove()

    const { width, height, margin, pieStartAngle, segments } = props

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const monthDonutWidth = 30
    const outerRadius = Math.min(innerWidth, innerHeight) / 2
    const innerRadius = outerRadius - monthDonutWidth // innerRadius of the months donut is the outerRadius of the segments pie.

    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

    // --- IMPORTANT: provide the correct generic types so TypeScript knows the shape of `d`
    const monthArcsGenerator = d3.arc<d3.PieArcDatum<number>>().innerRadius(innerRadius).outerRadius(outerRadius)
    const segmentArcsGenerator = d3.arc<d3.PieArcDatum<Segment>>().innerRadius(0).outerRadius(innerRadius)

    // Root svg selection: keep viewBox for responsiveness
    const root = d3.select(svgRef.value).attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet')

    // center group
    const svg = root.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

    // Generators and data for month donut and segments chart.
    const pieGeneratorMonths = d3.pie<number>()
    const monthData = pieGeneratorMonths([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    const pieGeneratorSegments = d3
        .pie<Segment>()
        .value((d) => d.monthsLength)
        .sort(null)
        .startAngle(pieStartAngle) // offset by 1 month: 360° / 12 months = 30° = π/6
    const segmentsData = pieGeneratorSegments(segments)

    // --- inner segments (pie)
    segmentPathsSelection = svg
        .append('g')
        .selectAll<SVGPathElement, d3.PieArcDatum<Segment>>('path.segment')
        .data(segmentsData)
        .join('path')
        .attr('class', 'segment')
        .attr('fill', (d) => d.data.bgColor)
        // arc generator may return null, so coerce to empty string if null
        .attr('d', (d) => segmentArcsGenerator(d) ?? '')
        .style('cursor', 'pointer')
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', (d) => `Kreislaufschritt: ${d.data.label.replace(/\n/g, ' ')}`)
        .on('mouseenter', (_, d) => {
            hoverSegment(segmentsData.indexOf(d))
        })
        .on('mouseleave', () => leaveSegment())
        .on('click', (_, d) => navigateToSegment(segmentsData.indexOf(d)))
        .on('focus', (_, d) => {
            hoverSegment(segmentsData.indexOf(d))
        })
        .on('blur', () => leaveSegment())
        .on('keydown', (event: KeyboardEvent, d) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigateToSegment(segmentsData.indexOf(d))
            }
        })

    // --- segment labels (multi-line using tspans)
    svg.append('g')
        .style('pointer-events', 'none')
        .selectAll('text.segment-label')
        .data(segmentsData)
        .join('text')
        .attr('class', 'segment-label')
        .attr('transform', (d) => {
            // centroid can be null -> default to [0,0]
            const centroid = segmentArcsGenerator.centroid(d) ?? [0, 0]
            const [x, y] = centroid
            const offsetX = d.data.labelOffsetX ?? 0
            const offsetY = d.data.labelOffsetY ?? 0
            return `translate(${x + offsetX}, ${y + offsetY})`
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '15px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .each(function (d) {
            const lines = d.data.label ? d.data.label.split('\n') : []
            const el = d3.select(this)
            el.selectAll('tspan')
                .data(lines)
                .join('tspan')
                .attr('x', 0)
                .attr('dy', (_, i) => (i === 0 ? '0' : '1.2em'))
                .attr('text-anchor', 'middle')
                .text((line) => line)
        })

    // --- months donut (outer ring)
    svg.append('g')
        .attr('stroke', '#005160')
        .attr('stroke-width', 3)
        .selectAll('path.month')
        .data(monthData)
        .join('path')
        .attr('class', 'month')
        .attr('fill', 'white')
        .attr('d', (d) => monthArcsGenerator(d) ?? '')

    // --- months labels (rotated along the arc). Flip if upside-down.
    const labels = svg
        .append('g')
        .selectAll('text')
        .data(monthData)
        .join('text')
        .attr('transform', (d) => {
            const angle = (d.startAngle + d.endAngle) / 2
            const r = outerRadius - monthDonutWidth / 2 - 1
            const x = Math.cos(angle - Math.PI / 2) * r
            const y = Math.sin(angle - Math.PI / 2) * r
            const rotation = (angle * 180) / Math.PI
            return `translate(${x},${y}) rotate(${rotation})`
        })
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#005160')
        .style('font-size', '14px')
        .text((_, i) => months[i])

    // center text horizontally using getBBox (cast the element type for TS)
    labels.each(function () {
        const el = this as SVGTextElement
        const bbox = el.getBBox()
        d3.select(this).attr('dx', -bbox.width / 2)
    })
})
</script>

<template>
    <!-- use viewBox from script and an ARIA label (svg doesn't support `alt`) -->
    <svg
        ref="svgRef"
        viewBox="0 0 500 500"
        class="h-full w-full max-w-xl"
        role="img"
        :aria-label="`${props.ariaLabel}`"
        preserveAspectRatio="xMidYMid meet"
    ></svg>
</template>
