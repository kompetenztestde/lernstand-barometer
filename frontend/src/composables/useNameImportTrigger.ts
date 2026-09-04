import { ref } from 'vue'

const _signal = ref(0)

export function useNameImportTrigger() {
    function triggerImport() {
        _signal.value++
    }
    return { triggerSignal: _signal, triggerImport }
}
