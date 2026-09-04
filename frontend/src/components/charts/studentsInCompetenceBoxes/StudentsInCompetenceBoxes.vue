<script setup lang="ts">
import { computed } from 'vue'
import StudentIcon from './StudentIcon.vue'
import CompetenceLevelBox from './CompetenceLevelBox.vue'
import type { StudentsInCompetenceBoxesData, CompetenceLevelBoxData } from './types'

const props = defineProps<{
    data: StudentsInCompetenceBoxesData
    activeQuestion?: string | null
}>()

const hasStudents = computed(() => props.data.domains.some((d) => d.competenceLevelBoxes.some((b) => b.students.length > 0)))

function isHighlighted(box: CompetenceLevelBoxData, allBoxes: CompetenceLevelBoxData[]): boolean {
    if (!props.activeQuestion) return false
    if (props.activeQuestion === 'mindeststandard-nicht-erreicht') {
        return box.arabicNumber === '1' && box.students.length > 0
    }
    if (props.activeQuestion === 'mindeststandard-erreicht') {
        return box.arabicNumber !== '1' && box.students.length > 0
    }
    if (props.activeQuestion === 'haeufigste') {
        const maxCount = Math.max(...allBoxes.map((b) => b.students.length))
        if (maxCount === 0) return false
        return box.students.length === maxCount
    }
    return false
}
</script>

<template>
    <p v-if="!hasStudents" class="text-sm text-gray-500">Keine Daten vorhanden.</p>
    <div v-else class="grid grid-cols-2 gap-8 space-y-7 xl:grid-cols-1">
        <div v-for="domain in props.data.domains" :key="domain.domainId">
            <h3 class="text-primary mb-2 text-lg/6 font-bold tracking-wide uppercase xl:text-xl/7">{{ domain.label }}</h3>
            <div class="flex flex-col items-stretch gap-2 xl:flex-row print:grid print:grid-flow-col print:grid-cols-1 print:grid-rows-5">
                <CompetenceLevelBox
                    v-for="box in domain.competenceLevelBoxes"
                    :key="box.arabicNumber"
                    :data="box"
                    :highlighted="activeQuestion ? isHighlighted(box, domain.competenceLevelBoxes) : false"
                    class="transition-opacity"
                    :class="activeQuestion && !isHighlighted(box, domain.competenceLevelBoxes) ? 'opacity-40' : ''"
                >
                    <StudentIcon
                        v-for="student in box.students"
                        :key="student.code"
                        :data="student"
                        :domain-id="domain.domainId"
                        :domain-label="domain.label"
                        :cutoffs="domain.cutoffs"
                        :total="domain.total"
                    />
                </CompetenceLevelBox>
            </div>
        </div>
    </div>
</template>
