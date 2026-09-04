import { ref } from 'vue'

const storageKey = 'teacher-welcome-seen'

const isOpen = ref(false)

export function useTeacherWelcomeModal() {
    function showIfFirstTime() {
        if (!localStorage.getItem(storageKey)) {
            isOpen.value = true
        }
    }

    function open() {
        isOpen.value = true
    }

    function close() {
        localStorage.setItem(storageKey, '1')
        isOpen.value = false
    }

    return { isOpen, showIfFirstTime, open, close }
}
