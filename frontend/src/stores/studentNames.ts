import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const keyNames = 'student-names'
const keyGroups = 'student-names-groups'
const keyMeta = 'student-names-meta'
const keyDirty = 'student-names-dirty'

export type GroupMeta = { campaignBase: string; campaignId: number }

export const useStudentNamesStore = defineStore('studentNames', () => {
    const names = ref<Record<string, string>>(JSON.parse(localStorage.getItem(keyNames) ?? '{}'))
    const identGroups = ref<Record<string, number>>(JSON.parse(localStorage.getItem(keyGroups) ?? '{}'))
    const groupMeta = ref<Record<number, GroupMeta>>(JSON.parse(localStorage.getItem(keyMeta) ?? '{}'))
    const dirtyGroups = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem(keyDirty) ?? '[]')))

    function save() {
        localStorage.setItem(keyNames, JSON.stringify(names.value))
        localStorage.setItem(keyGroups, JSON.stringify(identGroups.value))
        localStorage.setItem(keyMeta, JSON.stringify(groupMeta.value))
        localStorage.setItem(keyDirty, JSON.stringify([...dirtyGroups.value]))
    }

    function setNames(entries: Record<string, string>, groupId?: number, meta?: GroupMeta) {
        names.value = { ...names.value, ...entries }
        if (groupId !== undefined) {
            for (const ident of Object.keys(entries)) {
                identGroups.value[ident] = groupId
            }
            if (meta) groupMeta.value[groupId] = meta
            dirtyGroups.value.delete(groupId)
        }
        save()
    }

    function getName(ident: string): string | undefined {
        return names.value[ident] || undefined
    }

    function updateName(ident: string, name: string) {
        const trimmed = name.trim()
        if (trimmed) {
            names.value[ident] = trimmed
        } else {
            delete names.value[ident]
        }
        const groupId = identGroups.value[ident]
        if (groupId !== undefined) dirtyGroups.value.add(groupId)
        save()
    }

    function markGroupClean(groupId: number) {
        dirtyGroups.value.delete(groupId)
        save()
    }

    function clearGroup(groupId: number) {
        for (const [ident, gid] of Object.entries(identGroups.value)) {
            if (gid === groupId) {
                delete names.value[ident]
                delete identGroups.value[ident]
            }
        }
        delete groupMeta.value[groupId]
        dirtyGroups.value.delete(groupId)
        save()
    }

    function clearAll() {
        names.value = {}
        identGroups.value = {}
        groupMeta.value = {}
        dirtyGroups.value.clear()
        save()
    }

    function getGroupEntries(groupId: number): { ident: string; name: string }[] {
        return Object.entries(identGroups.value)
            .filter(([, gid]) => gid === groupId)
            .map(([ident]) => ({ ident, name: names.value[ident] ?? '' }))
            .sort((a, b) => a.ident.localeCompare(b.ident))
    }

    const groupIds = computed(() => [...new Set(Object.values(identGroups.value))].sort())

    return {
        names,
        identGroups,
        groupMeta,
        dirtyGroups,
        groupIds,
        getName,
        setNames,
        updateName,
        markGroupClean,
        clearGroup,
        clearAll,
        getGroupEntries,
    }
})
