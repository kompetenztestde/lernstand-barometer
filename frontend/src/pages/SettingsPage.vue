<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudentNamesStore } from '@/stores/studentNames'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import { usePageReady } from '@/composables/usePageReady'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseHeading from '@/components/base/BaseHeading.vue'

const store = useStudentNamesStore()
const { data: participatedGroups, isPending: groupsIsPending } = useParticipatedGroupsQuery()

usePageReady(groupsIsPending)

function groupName(groupId: number): string {
    return participatedGroups.value?.find((g) => g.groupId === groupId)?.groupName ?? `Klasse ${groupId}`
}

const confirmClearGroup = ref<number | null>(null)
const confirmClearAll = ref(false)

function clearGroup(groupId: number) {
    store.clearGroup(groupId)
    confirmClearGroup.value = null
}

function clearAll() {
    store.clearAll()
    confirmClearAll.value = false
}

function downloadGroup(groupId: number) {
    const entries = store.getGroupEntries(groupId)
    const meta = store.groupMeta[groupId]
    const json = {
        campaignBase: meta?.campaignBase ?? 'kt',
        campaignId: meta?.campaignId ?? 0,
        groupId,
        reserveCodes: '',
        savedAt: new Date().toISOString(),
        codes: entries.map((e) => ({ ident: e.ident, name: e.name, externId: null })),
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Klarnamen-${groupName(groupId).replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    store.markGroupClean(groupId)
}

// Local edits: track per-ident edited values (in-progress, not yet saved)
const edits = ref<Record<string, string>>({})

function editValue(ident: string): string {
    return ident in edits.value ? edits.value[ident] : (store.names[ident] ?? '')
}

function isEditing(ident: string): boolean {
    return ident in edits.value && edits.value[ident] !== (store.names[ident] ?? '')
}

function onInput(ident: string, value: string) {
    edits.value[ident] = value
}

function onBlur(ident: string) {
    if (ident in edits.value) {
        store.updateName(ident, edits.value[ident])
        delete edits.value[ident]
    }
}

const ungroupedEntries = computed(() =>
    Object.entries(store.names)
        .filter(([ident]) => !(ident in store.identGroups))
        .map(([ident, name]) => ({ ident, name }))
        .sort((a, b) => a.ident.localeCompare(b.ident)),
)

const hasAnyNames = computed(() => store.groupIds.length > 0 || ungroupedEntries.value.length > 0)
</script>

<template>
    <BaseHeading level="h2">Gespeicherte Klarnamen</BaseHeading>

    <div v-if="!hasAnyNames" class="mt-4 text-sm text-gray-400 italic">
        Keine Klarnamen gespeichert. Klarnamen können über den Button „Klarnamen" neben der Klassenauswahl importiert werden.
    </div>

    <div v-else class="mt-4 space-y-6">
        <!-- Per-group card -->
        <div
            v-for="groupId in store.groupIds"
            :key="groupId"
            class="overflow-hidden rounded-xl border bg-white shadow-sm"
            :class="store.dirtyGroups.has(groupId) ? 'border-amber-300' : 'border-gray-200'"
        >
            <!-- Card header -->
            <div
                class="flex items-center justify-between border-b px-5 py-3"
                :class="store.dirtyGroups.has(groupId) ? 'border-amber-200 bg-amber-50' : 'border-gray-100'"
            >
                <div class="flex items-center gap-2">
                    <p class="font-semibold text-gray-800">{{ groupName(groupId) }}</p>
                    <span
                        v-if="store.dirtyGroups.has(groupId)"
                        class="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        v-tippy="{
                            content: 'Namen wurden geändert. Bitte JSON erneut herunterladen und Kolleg:innen zur Verfügung stellen.',
                            maxWidth: 280,
                        }"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Geändert
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <BaseButton size="sm" variant="default-outline" @click="downloadGroup(groupId)"> ↓ JSON herunterladen </BaseButton>
                    <BaseButton
                        v-if="confirmClearGroup !== groupId"
                        size="sm"
                        variant="secondary-outline"
                        @click="confirmClearGroup = groupId"
                    >
                        Klasse leeren
                    </BaseButton>
                    <template v-else>
                        <span class="text-sm text-gray-500">Wirklich löschen?</span>
                        <BaseButton size="sm" variant="secondary-outline" @click="clearGroup(groupId)">Ja</BaseButton>
                        <BaseButton size="sm" variant="default-outline" @click="confirmClearGroup = null">Nein</BaseButton>
                    </template>
                </div>
            </div>

            <table class="w-full table-auto text-sm">
                <thead>
                    <tr class="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        <th class="px-5 py-2">Code</th>
                        <th class="px-5 py-2">Klarname</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in store.getGroupEntries(groupId)"
                        :key="entry.ident"
                        class="border-b border-gray-50 last:border-b-0"
                        :class="isEditing(entry.ident) ? 'bg-amber-50' : ''"
                    >
                        <td class="px-5 py-1.5 font-mono text-gray-500">{{ entry.ident }}</td>
                        <td class="px-5 py-1.5">
                            <input
                                type="text"
                                :value="editValue(entry.ident)"
                                placeholder="(kein Name)"
                                class="w-full rounded border px-2 py-0.5 text-gray-800 transition focus:outline-none"
                                :class="
                                    isEditing(entry.ident)
                                        ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                                        : 'border-transparent hover:border-gray-300 focus:border-gray-400'
                                "
                                @input="onInput(entry.ident, ($event.target as HTMLInputElement).value)"
                                @blur="onBlur(entry.ident)"
                                @keydown.enter="($event.target as HTMLInputElement).blur()"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Ungrouped names (imported before group tracking) -->
        <div v-if="ungroupedEntries.length > 0" class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <p class="font-semibold text-gray-800">Ohne Klassenzuordnung</p>
                <p class="text-xs text-gray-400">Beim nächsten Import werden sie einer Klasse zugeordnet.</p>
            </div>
            <table class="w-full table-auto text-sm">
                <thead>
                    <tr class="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        <th class="px-5 py-2">Code</th>
                        <th class="px-5 py-2">Klarname</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in ungroupedEntries"
                        :key="entry.ident"
                        class="border-b border-gray-50 last:border-b-0"
                        :class="isEditing(entry.ident) ? 'bg-amber-50' : ''"
                    >
                        <td class="px-5 py-1.5 font-mono text-gray-500">{{ entry.ident }}</td>
                        <td class="px-5 py-1.5">
                            <input
                                type="text"
                                :value="editValue(entry.ident)"
                                placeholder="(kein Name)"
                                class="w-full rounded border px-2 py-0.5 text-gray-800 transition focus:outline-none"
                                :class="
                                    isEditing(entry.ident)
                                        ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                                        : 'border-transparent hover:border-gray-300 focus:border-gray-400'
                                "
                                @input="onInput(entry.ident, ($event.target as HTMLInputElement).value)"
                                @blur="onBlur(entry.ident)"
                                @keydown.enter="($event.target as HTMLInputElement).blur()"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Clear all -->
        <div class="flex items-center gap-3 pt-2">
            <template v-if="!confirmClearAll">
                <BaseButton variant="secondary-outline" @click="confirmClearAll = true">Alle Klarnamen löschen</BaseButton>
            </template>
            <template v-else>
                <span class="text-sm text-gray-500">Alle Klarnamen unwiderruflich löschen?</span>
                <BaseButton variant="secondary-outline" @click="clearAll()">Ja, alle löschen</BaseButton>
                <BaseButton variant="default-outline" @click="confirmClearAll = false">Abbrechen</BaseButton>
            </template>
        </div>
    </div>
</template>
