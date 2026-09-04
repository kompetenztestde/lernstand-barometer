import { watch, onUnmounted } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useNavigationStore } from '@/stores/navigation'

/**
 * Keeps the layout's loading overlay visible until the page's data has settled.
 * Pass a ref/computed that is true while any critical query is still pending.
 * Uses ref-counting so multiple callers don't interfere with each other.
 * Automatically cleans up on unmount.
 */
export function usePageReady(isPending: Ref<boolean> | ComputedRef<boolean>) {
    const navigation = useNavigationStore()
    let isRegistered = false

    watch(
        isPending,
        (pending) => {
            if (pending && !isRegistered) {
                isRegistered = true
                navigation.setPageLoading(true)
            } else if (!pending && isRegistered) {
                isRegistered = false
                navigation.setPageLoading(false)
            }
        },
        { immediate: true },
    )

    onUnmounted(() => {
        if (isRegistered) {
            isRegistered = false
            navigation.setPageLoading(false)
        }
    })
}
