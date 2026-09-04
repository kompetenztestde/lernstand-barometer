<script setup lang="ts">
import { computed } from 'vue'
import IconSortNeutral from '@/components/icons/IconSortNeutral.vue'
import IconSortAsc from '@/components/icons/IconSortAsc.vue'
import IconSortDesc from '@/components/icons/IconSortDesc.vue'

interface Props {
    subject: string
    subdomain: string
    sortKey: { subject: string; subdomain: string }
    sortOrder: 'asc' | 'desc'
}

const props = defineProps<Props>()
const isActive = computed(() => props.sortKey.subject === props.subject && props.sortKey.subdomain === props.subdomain)
</script>

<template>
    <span v-if="!isActive"><IconSortNeutral /></span>
    <span v-else-if="sortOrder === 'asc'"><IconSortAsc /></span>
    <span v-else><IconSortDesc /></span>
</template>
