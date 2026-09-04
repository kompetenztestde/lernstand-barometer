<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import { useTeacherWelcomeModal } from '@/composables/useTeacherWelcomeModal'

const { isOpen, close } = useTeacherWelcomeModal()
</script>

<template>
    <BaseModal :is-open="isOpen" aria-label="Willkommen" @close="close">
        <template #header>
            <h2 class="text-lg font-bold">Wichtige Information zum Kompetenzstufenmodell</h2>
        </template>

        <div class="space-y-4 text-gray-700">
            <p>Liebe Lehrkraft,</p>
            <p>
                für Schülerinnen und Schüler der Jahrgangsstufe 8 stellt das Erreichen der Kompetenzstufe 3 (von insgesamt 5) das
                angestrebte Ziel dar. Mit dem Erreichen dieser Kompetenzstufe erfüllen die Lernenden den Erwartungsbereich ihres derzeitigen
                Lernstands. Dieser entspricht in etwa einem Testergebnis von 40–60 %. Der Test umfasst Aufgabenformate und Inhalte, mit
                denen die Schülerinnen und Schüler bis zum Ende der Jahrgangsstufe 10 vertraut sein sollten.
            </p>
            <p>
                Daher enthält er auch Themen und Anforderungen, die möglicherweise im bisherigen Unterricht noch nicht behandelt wurden. Aus
                diesem Grund ist davon auszugehen, dass nur wenige Lernende den Erwartungsbereich deutlich überschreiten werden. Im
                Mittelpunkt des Tests steht nicht die Bewertung einzelner Leistungen, sondern die diagnostische Funktion: Er soll sichtbar
                machen, über welche Kompetenzen die Klasse bereits verfügt und in welchen Bereichen weiterer gemeinsamer Lernbedarf besteht.
            </p>
            <p>
                Bitte berücksichtigen Sie zudem, dass ein einzelner Test den Leistungsstand einer Klasse oder einzelner Schülerinnen und
                Schüler nie vollständig und abschließend abbilden kann. Faktoren wie Tagesform, Konzentration oder individuelle
                Rahmenbedingungen können die Ergebnisse beeinflussen. Die Einordnung und pädagogische Bewertung der Resultate gelingt daher
                letztlich nur durch Sie als Lehrkraft, die die Lernenden und ihre Entwicklung umfassend kennt.
            </p>

            <p class="text-sm text-gray-500">
                Diese Erklärung können Sie jederzeit über die
                <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-sm leading-none font-bold"
                    >i</span
                >
                -Schaltfläche neben der Seitentitel-Zeile wieder aufrufen.
            </p>
        </div>

        <template #footer>
            <button
                type="button"
                class="bg-primary hover:bg-primary-light rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                @click="close"
            >
                Verstanden
            </button>
        </template>
    </BaseModal>
</template>
