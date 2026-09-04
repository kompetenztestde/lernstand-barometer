<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupItemsQuery, mapItemsToTaskList } from '@/queries/useGroupsItemsQuery'
import { useCompLvlDefsQuery } from '@/queries/useItemParamDefsQuery'
import { TaskList, type TaskListData } from '@/components/charts/taskList'
import BaseHeading from '@/components/base/BaseHeading.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import IconInfoCircle from '@/components/icons/IconInfoCircle.vue'
import type { InterpretationQuestion } from '@/composables/useInterpretationSection'

const props = defineProps<{ groupId: number }>()

const groupIdRef = computed(() => props.groupId)

const showInterpretation = ref(false)
const activeQuestion = ref<string | null>(null)

// clear active question highlight when the panel closes
watch(showInterpretation, (show) => {
    if (!show) activeQuestion.value = null
})

const questions: InterpretationQuestion[] = [
    { id: 'groesser-fairer', label: 'Klassenwert > fairer Vergleichswert' },
    { id: 'kleiner-fairer', label: 'Klassenwert < fairer Vergleichswert' },
    { id: 'hoechster', label: 'Höchster Klassenwert' },
    { id: 'kleinster', label: 'Kleinster Klassenwert' },
    { id: 'groesster-abstand-groesser', label: 'Größter Abstand zum fairen Vergleichswert (Klassenwert > fairer Vergleichswert)' },
    { id: 'groesster-abstand-kleiner', label: 'Größter Abstand zum fairen Vergleichswert (Klassenwert < fairer Vergleichswert)' },
]

const route = useRoute()
const router = useRouter()

const expandedTaskId = ref<string | null>(typeof route.query['task-id'] === 'string' ? route.query['task-id'] : null)

// two-way sync between the ref and the URL query param so browser back/forward works
watch(expandedTaskId, (id) => {
    const current = route.query['task-id']
    if (id !== null && current !== id) {
        router.replace({ query: { ...route.query, 'task-id': id } })
    } else if (id === null && current !== undefined) {
        const rest = Object.fromEntries(Object.entries(route.query).filter(([k]) => k !== 'task-id'))
        router.replace({ query: rest })
    }
})

watch(
    () => route.query['task-id'],
    (id) => {
        const val = typeof id === 'string' ? id : null
        if (val !== expandedTaskId.value) expandedTaskId.value = val
    },
)

const { data: itemsData, isPending: itemsIsPending, isError: itemsIsError } = useGroupItemsQuery(groupIdRef)
const { data: compLvlDefs } = useCompLvlDefsQuery()

// captured synchronously so the scroll watcher below still works after async data arrives
const initialTaskId = expandedTaskId.value

const taskListData = computed<TaskListData | null>(() => {
    const items = itemsData.value?.groupData?.items
    if (!items || !compLvlDefs.value) return null
    return {
        tasks: mapItemsToTaskList(items),
        domains: compLvlDefs.value.map((def) => ({
            domainId: def.domainId,
            label: def.domainId === 'le' ? 'Leseverstehen' : 'Orthografie',
            competenceLevels: def.competenceLevels.map((cl) => ({
                romanNumber: cl.romanNumber,
                subtitle: cl.subtitle,
                description: cl.description,
            })),
        })),
    }
})

if (initialTaskId) {
    watch(
        taskListData,
        async (data) => {
            if (!data) return
            await nextTick()
            document.querySelector(`[data-iqb-id="${initialTaskId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        },
        { once: true }, // only scroll on initial load, not on every data refresh
    )
}
</script>

<template>
    <section>
        <BaseHeading id="aufgabenliste" level="h2">
            <span class="flex items-center justify-between">
                <span>Aufgabenliste</span>
                <InterpretationButton v-model="showInterpretation" />
            </span>
        </BaseHeading>
        <InterpretationPanel :questions="questions" :show="showInterpretation" v-model="activeQuestion" class="mb-8">
            <template #pre-buttons>
                <div class="flex items-center">
                    <IconInfoCircle class="mr-1 size-5!" /> Die Interpretationshilfen werden nur für die angezeigte Seite berechnet.
                </div>
            </template>
        </InterpretationPanel>
        <BaseLoadingBox v-if="itemsIsPending" class="h-48" />
        <p v-else-if="itemsIsError" role="alert" class="text-sm text-red-600">Fehler beim Laden der Aufgabenliste.</p>
        <TaskList
            v-else-if="taskListData"
            :data="taskListData"
            :expandedTaskId="expandedTaskId"
            :activeQuestion="activeQuestion"
            @update:expandedTaskId="expandedTaskId = $event"
        />
    </section>
</template>
