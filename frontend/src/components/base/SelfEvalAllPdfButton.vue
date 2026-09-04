<script setup lang="ts">
import { computed, toRef } from 'vue'
import { usePrintPdf } from '@/composables/usePrintPdf'
import { useStudentsQuery } from '@/queries/useStudentsQuery'
import IconDownload from '@/components/icons/IconDownload.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'

const props = defineProps<{ groupId: number }>()

const groupIdRef = toRef(() => props.groupId)
const { data: studentsData } = useStudentsQuery(groupIdRef)

const studentCodes = computed(() => ((studentsData.value?.studentsData ?? []).map((s) => s.code).filter(Boolean) as string[]).sort())

const { downloadAllPdf, isLoadingAll } = usePrintPdf('self-evaluation', {
    groupId: groupIdRef,
})
</script>

<template>
    <BaseButton
        v-if="pdfEnabled"
        variant="primary-outline"
        :loading="isLoadingAll"
        :disabled="studentCodes.length === 0"
        class="gap-1.5 print:hidden"
        @click="downloadAllPdf(studentCodes)"
    >
        <IconDownload class="size-6" aria-hidden="true" />
        <span>{{ isLoadingAll ? 'generiere PDF …' : 'Klasse als PDF' }}</span>
    </BaseButton>
</template>
