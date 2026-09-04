<script setup lang="ts">
import SelfEvaluationStudentPrint from './SelfEvaluationStudentPrint.vue'

defineProps<{ codes: string[]; groupId: number }>()
</script>

<template>
    <div>
        <div v-for="code in codes" :key="code" class="break-before-page! first:break-before-auto!">
            <SelfEvaluationStudentPrint :code="code" :group-id="groupId" />
        </div>
    </div>
</template>
