<script setup lang="ts">
import IconMenu from '@/components/icons/IconMenu.vue'
import IconClose from '@/components/icons/IconClose.vue'

interface Props {
    isOpen: boolean
}

const props = defineProps<Props>()
</script>

<template>
    <button
        type="button"
        class="rounded-md p-2 text-gray-700 hover:bg-gray-200 focus:outline-none"
        :aria-label="props.isOpen ? 'Menü schließen' : 'Menü öffnen'"
        :aria-expanded="props.isOpen"
    >
        <IconMenu v-if="!props.isOpen" />
        <IconClose v-else />
    </button>
</template>
