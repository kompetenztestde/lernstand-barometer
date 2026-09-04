<script setup lang="ts">
defineProps<{
    textOption: 'difficultyHint' | 'helpHint'
}>()
</script>

<template>
    <div class="rounded-xl border border-gray-600 bg-white p-3 text-sm text-gray-700 shadow-sm lg:p-5">
        <p v-if="textOption === 'difficultyHint'">Der Test hat sehr schwierige Aufgaben. Es ist normal, nicht alles zu schaffen.</p>
        <p v-if="textOption === 'helpHint'">Wende dich an deine Lehrkraft und sprich mit ihr über dein Ergebnis.</p>
    </div>
</template>
