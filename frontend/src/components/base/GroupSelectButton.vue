<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseSelectButton from '@/components/base/BaseSelectButton.vue'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'

const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const route = useRoute()
const router = useRouter()

const allowedTestIds = [import.meta.env.VITE_TEST_ID].filter(Boolean)

const { data: participatedGroups } = useParticipatedGroupsQuery()

const groupOptions = computed(() =>
    (participatedGroups.value ?? [])
        .filter((g) => g.participatedTests.some((t) => allowedTestIds.includes(String(t))))
        .map((g) => ({ value: g.groupId, label: g.groupName })),
)

// On load: prefer ?group URL param, then first group (filtered to testId)
watch(
    groupOptions,
    (options) => {
        if (props.modelValue == null && options.length > 0) {
            const urlId = Number(route.query.group)
            const fromUrl = urlId ? options.find((o) => o.value === urlId) : null
            emit('update:modelValue', fromUrl ? fromUrl.value : options[0].value)
        }
    },
    { immediate: true },
)

// Keep URL in sync when selection changes
watch(
    () => props.modelValue,
    (id) => {
        if (id != null && route.query.group !== String(id)) {
            router.replace({ query: { ...route.query, group: String(id) } })
        }
    },
    { immediate: true },
)

// React to URL changes (browser back/forward or shared link)
watch(
    () => route.query.group,
    (group) => {
        const id = Number(group)
        if (id && id !== props.modelValue && groupOptions.value.some((o) => o.value === id)) {
            emit('update:modelValue', id)
        }
    },
)
</script>

<template>
    <div class="mb-8">
        <p class="mb-3">Ergebnisse anzeigen für Klasse:</p>
        <BaseSelectButton
            v-if="groupOptions.length > 0"
            variant="primary"
            :options="groupOptions"
            :modelValue="props.modelValue ?? undefined"
            @update:modelValue="emit('update:modelValue', $event as number)"
        />
    </div>
</template>
