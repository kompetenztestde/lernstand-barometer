import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useViewSelectionStore = defineStore('viewSelection', () => {
    const storedGroupId = localStorage.getItem('view-group-id')

    const selectedGroupId = ref<number | null>(storedGroupId ? Number(storedGroupId) : null)

    function setSelectedGroupId(groupId: number | null) {
        selectedGroupId.value = groupId
        if (groupId === null) {
            localStorage.removeItem('view-group-id')
        } else {
            localStorage.setItem('view-group-id', groupId.toString())
        }
    }

    return {
        selectedGroupId,
        setSelectedGroupId,
    }
})
