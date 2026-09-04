import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', () => {
    const isNavigating = ref(false)
    const pageLoadingCount = ref(0)

    const pageIsLoading = computed(() => pageLoadingCount.value > 0)
    const isLoading = computed(() => isNavigating.value || pageIsLoading.value)

    function startNavigation() {
        isNavigating.value = true
    }

    function finishNavigation() {
        isNavigating.value = false
    }

    function setPageLoading(value: boolean) {
        pageLoadingCount.value = Math.max(0, pageLoadingCount.value + (value ? 1 : -1))
    }

    return { isNavigating, pageIsLoading, isLoading, startNavigation, finishNavigation, setPageLoading }
})
