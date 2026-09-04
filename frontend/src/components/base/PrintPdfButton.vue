<script setup lang="ts">
import { computed, toRef } from 'vue'
import { usePrintPdf, type PrintPage } from '@/composables/usePrintPdf'
import { useStudentsQuery, useMathStudentsQuery } from '@/queries/useStudentsQuery'
import IconDownload from '@/components/icons/IconDownload.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'

const props = defineProps<{
    page: PrintPage
    text?: string
    studentCode?: string | null
    groupId?: number | null
    groupName?: string | null
    allStudents?: boolean
    participatedTests?: (number | string)[] | null
}>()

const groupIdRef = toRef(() => props.groupId ?? null)
const participatedTestsRef = toRef(() => props.participatedTests ?? null)

const { data: studentsData } = useStudentsQuery(groupIdRef)
const { data: mathStudents } = useMathStudentsQuery(groupIdRef, participatedTestsRef)

const studentCodes = computed(() =>
    props.allStudents ? ((studentsData.value?.studentsData ?? []).map((s) => s.code).filter(Boolean) as string[]).sort() : [],
)

const hasData = computed(() => {
    if (props.groupId == null) return true
    if (studentsData.value === undefined) return true
    const mainCodes = studentsData.value.studentsData?.some((s) => s.code) ?? false
    const mathCodes = props.participatedTests != null && (mathStudents.value?.some((s) => s.code) ?? false)
    return mainCodes || mathCodes
})

const { downloadPdf, downloadAllPdf, isLoading, isLoadingAll } = usePrintPdf(props.page, {
    studentCode: toRef(() => props.studentCode ?? null),
    groupId: groupIdRef,
    name: toRef(() => props.groupName ?? null),
})

const loading = computed(() => (props.allStudents ? isLoadingAll.value : isLoading.value))
const disabled = computed(() => !hasData.value || (props.allStudents && studentCodes.value.length === 0))
const noData = computed(() => props.groupId != null && studentsData.value !== undefined && !hasData.value)

function handleClick() {
    if (props.allStudents) {
        downloadAllPdf(studentCodes.value)
    } else {
        downloadPdf()
    }
}
</script>

<template>
    <span v-if="noData" class="border border-transparent px-2 py-2 text-center text-sm text-gray-400 print:hidden">Keine Daten</span>
    <BaseButton
        v-else-if="pdfEnabled"
        variant="primary-outline"
        :loading="loading"
        :disabled="disabled"
        class="gap-1.5 print:hidden"
        @click="handleClick"
    >
        <IconDownload v-show="!loading" class="size-6" aria-hidden="true" />
        <span :class="[{ 'py-1 text-xs': loading }]">{{
            loading ? 'wird generiert …' : allStudents ? 'Klasse als PDF' : props.text ? props.text : 'PDF'
        }}</span>
    </BaseButton>
</template>
