<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import IconBook from '@/components/icons/IconBook.vue'
</script>

<template>
    <section class="mb-16">
        <div class="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div class="lg:max-w-140 lg:basis-3/5">
                <h2 class="mb-2 text-3xl font-bold tracking-wide text-gray-900">Kompetenzorientierte Aufgaben für Ihren Unterricht.</h2>
                <p class="mb-4 text-2xl text-gray-600">Der Aufgabenbrowser macht gezielte Übungen möglich.</p>
                <p class="mb-8 text-lg text-gray-700">
                    Der Aufgabenbrowser bietet eine Vielzahl von kompetenzorientierten Aufgaben mit didaktischem Aufgabenkommentar an. Sie
                    können so zielgerichtet Übungsaufgaben heraussuchen und Ihre Schüler:innen auf Basis der Kompetenztestergebnisse gezielt
                    fördern.
                </p>
                <a
                    href="https://aufgabenbrowser.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="bg-primary border-primary hover:bg-primary-light inline-flex items-center gap-2 rounded-md border px-4 py-2 text-base font-medium tracking-wide text-white transition"
                >
                    <IconBook class="size-5" />
                    Zum Aufgabenbrowser
                </a>
            </div>
            <div class="lg:max-w-100 lg:basis-2/5">
                <img
                    src="@/assets/images/task-browser.webp"
                    alt="Screenshot des Aufgabenbrowsers"
                    class="w-full rounded-xl shadow-lg shadow-gray-200"
                />
            </div>
        </div>
    </section>

    <section>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <BaseCard title="Kompetenzorientiert">
                <template #body>
                    <p class="text-gray-600">
                        Alle Aufgaben sind klar definierten Kompetenzen zugeordnet – ideal zur gezielten Förderung nach Kompetenztests.
                    </p>
                </template>
            </BaseCard>
            <BaseCard title="Aufgabenkommentar">
                <template #body>
                    <p class="text-gray-600">
                        Jede Aufgabe enthält einen didaktischen Kommentar, der bei der Einordnung und dem Einsatz im Unterricht hilft.
                    </p>
                </template>
            </BaseCard>
            <BaseCard title="Direkt einsatzbereit">
                <template #body>
                    <p class="text-gray-600">
                        Die Aufgaben lassen sich direkt für den Unterricht nutzen – als Übung, zur Differenzierung oder als Vorbereitung.
                    </p>
                </template>
            </BaseCard>
        </div>
    </section>
</template>
