<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import IconInfo from './icons/IconInfo.vue'
import { useTeacherWelcomeModal } from '@/composables/useTeacherWelcomeModal'

const { open } = useTeacherWelcomeModal()
</script>

<template>
    <BaseButton variant="default-outline" size="sm" class="h-8! w-8! rounded-full! p-0!" aria-label="Erklärung anzeigen" @click="open">
        <IconInfo class="size-4!"></IconInfo>
    </BaseButton>
</template>
