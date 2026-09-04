<script setup lang="ts">
import { ref, watch } from 'vue'
import FeedBackCircleD3 from '@/components/FeedbackCircleD3.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import { useCircleHighlight } from '@/composables/useCircleHighlight'
import { getGlossaryTerm } from '@/queries/useGlossaryQuery'

const { hoverSegment, leaveSegment, hoverNavItem, leaveNavItem, navigateToSegment, navigateToNavItem } = useCircleHighlight()

const demoQuestions = [
    { id: 'q1', label: 'Wo liegt die Klasse über dem fairen Vergleichswert?' },
    { id: 'q2', label: 'In welchem Bereich hat meine Klasse die meisten Punkte erzielt?' },
]
const demoActiveQuestion = ref<string | null>(null)
const demoShowPanel = ref(true)

watch(demoShowPanel, (show) => {
    if (!show) demoActiveQuestion.value = null
})

const barHighlights: Record<string, string[]> = {
    q1: ['actual', 'fair'],
    q2: ['actual'],
}

function barClass(barId: string): string {
    if (!demoActiveQuestion.value) return 'transition-all duration-200'
    const highlighted = barHighlights[demoActiveQuestion.value] ?? []
    return highlighted.includes(barId)
        ? 'ring-2 ring-secondary/40 bg-secondary/5 transition-all duration-200'
        : 'opacity-20 transition-all duration-200'
}
</script>

<template>
    <section class="mb-20">
        <div class="flex gap-20">
            <div class="max-w-140 basis-3/5">
                <h2 class="mb-1 text-3xl font-bold tracking-wide text-gray-900">Vergleichsarbeiten als Kreislauf.</h2>
                <h3 class="mb-5 text-2xl text-gray-600">Die Menüstruktur bildet den VerA-Kreislauf ab.</h3>
                <p class="text-lg">
                    Er beginnt mit der
                    <span
                        class="text-primary cursor-pointer font-bold hover:underline"
                        tabindex="0"
                        role="link"
                        @mouseenter="hoverSegment(0)"
                        @mouseleave="leaveSegment()"
                        @focus="hoverSegment(0)"
                        @blur="leaveSegment()"
                        @click="navigateToSegment(0)"
                        @keydown.enter="navigateToSegment(0)"
                        >Vorbereitung</span
                    >
                    auf den nächsten Test. Dann werden die Tests durchgeführt. Nach der
                    <span
                        class="text-primary cursor-pointer font-bold hover:underline"
                        tabindex="0"
                        role="link"
                        @mouseenter="hoverSegment(1)"
                        @mouseleave="leaveSegment()"
                        @focus="hoverSegment(1)"
                        @blur="leaveSegment()"
                        @click="navigateToSegment(1)"
                        @keydown.enter="navigateToSegment(1)"
                        >Korrektur</span
                    >
                    der Ergebnisse können diese schließlich
                    <span
                        class="text-primary cursor-pointer font-bold hover:underline"
                        tabindex="0"
                        role="link"
                        @mouseenter="hoverSegment(2)"
                        @mouseleave="leaveSegment()"
                        @focus="hoverSegment(2)"
                        @blur="leaveSegment()"
                        @click="navigateToSegment(2)"
                        @keydown.enter="navigateToSegment(2)"
                        >analysiert</span
                    >
                    werden. Auf dieser Grundlage lassen sich
                    <span
                        class="text-primary cursor-pointer font-bold hover:underline"
                        tabindex="0"
                        role="link"
                        @mouseenter="hoverSegment(3)"
                        @mouseleave="leaveSegment()"
                        @focus="hoverSegment(3)"
                        @blur="leaveSegment()"
                        @click="navigateToSegment(3)"
                        @keydown.enter="navigateToSegment(3)"
                        >Maßnahmen</span
                    >
                    für den Unterricht ableiten. Im neuen Zyklus und bei der
                    <span
                        class="text-primary cursor-pointer font-bold hover:underline"
                        tabindex="0"
                        role="link"
                        @mouseenter="hoverSegment(0)"
                        @mouseleave="leaveSegment()"
                        @focus="hoverSegment(0)"
                        @blur="leaveSegment()"
                        @click="navigateToSegment(0)"
                        @keydown.enter="navigateToSegment(0)"
                        >Planung</span
                    >
                    der nächsten Tests kann darauf zurückgeblickt werden.
                </p>
            </div>
            <div class="max-w-100 basis-2/5">
                <FeedBackCircleD3 />
            </div>
        </div>
    </section>
    <section>
        <div class="flex gap-12 2xl:gap-14">
            <ul class="grid grid-cols-1 gap-2 xl:grid-cols-2 xl:gap-5">
                <li
                    class="border-primary bg-primary flex cursor-pointer items-center justify-center rounded border p-3 text-white transition-transform duration-200 hover:-translate-y-1"
                    tabindex="0"
                    role="link"
                    @mouseenter="hoverNavItem('results-tests')"
                    @mouseleave="leaveNavItem()"
                    @focus="hoverNavItem('results-tests')"
                    @blur="leaveNavItem()"
                    @click="navigateToNavItem('results-tests')"
                    @keydown.enter="navigateToNavItem('results-tests')"
                >
                    <p>Fachlehrkraft</p>
                </li>
                <li
                    class="border-secondary bg-secondary flex cursor-pointer items-center justify-center rounded border p-3 text-white transition-transform duration-200 hover:-translate-y-1"
                    tabindex="0"
                    role="link"
                    @mouseenter="hoverNavItem('results-groups')"
                    @mouseleave="leaveNavItem()"
                    @focus="hoverNavItem('results-groups')"
                    @blur="leaveNavItem()"
                    @click="navigateToNavItem('results-groups')"
                    @keydown.enter="navigateToNavItem('results-groups')"
                >
                    <p>Klassenlehrkraft</p>
                </li>
                <li
                    class="border-tertiary bg-tertiary flex cursor-pointer items-center justify-center rounded border p-3 text-white transition-transform duration-200 hover:-translate-y-1"
                    tabindex="0"
                    role="link"
                    @mouseenter="hoverNavItem('results-conference')"
                    @mouseleave="leaveNavItem()"
                    @focus="hoverNavItem('results-conference')"
                    @blur="leaveNavItem()"
                    @click="navigateToNavItem('results-conference')"
                    @keydown.enter="navigateToNavItem('results-conference')"
                >
                    <p>Fachkonferenz</p>
                </li>
                <li
                    class="border-quinary bg-quinary flex cursor-pointer items-center justify-center rounded border p-3 text-white transition-transform duration-200 hover:-translate-y-1"
                    tabindex="0"
                    role="link"
                    @mouseenter="hoverNavItem('results-school-management')"
                    @mouseleave="leaveNavItem()"
                    @focus="hoverNavItem('results-school-management')"
                    @blur="leaveNavItem()"
                    @click="navigateToNavItem('results-school-management')"
                    @keydown.enter="navigateToNavItem('results-school-management')"
                >
                    <p>Schulleitung</p>
                </li>
                <li
                    class="border-quarternary bg-quarternary flex cursor-pointer items-center justify-center rounded border p-3 text-white transition-transform duration-200 hover:-translate-y-1"
                    tabindex="0"
                    role="link"
                    @mouseenter="hoverNavItem('results-self-evaluation')"
                    @mouseleave="leaveNavItem()"
                    @focus="hoverNavItem('results-self-evaluation')"
                    @blur="leaveNavItem()"
                    @click="navigateToNavItem('results-self-evaluation')"
                    @keydown.enter="navigateToNavItem('results-self-evaluation')"
                >
                    <p class="hyphens-auto" lang="de">SuS-Selbsteinschätzung</p>
                </li>
            </ul>
            <div class="max-w-140">
                <h2 class="mb-1 text-3xl font-bold tracking-wide text-gray-900">Verschiedene Berichte für verschiedene Rollen.</h2>
                <h3 class="mb-5 text-2xl text-gray-600">Analysieren Sie Ergebnisse gezielt.</h3>
                <p class="text-lg">
                    Je nachdem, in welcher Rolle Sie die Ergebnisse sehen möchten, können Sie einen eigenen Bericht auswählen.
                </p>
            </div>
        </div>
    </section>
    <section class="mt-30">
        <div class="flex gap-20">
            <div class="max-w-140 basis-3/5">
                <h2 class="mb-1 text-3xl font-bold tracking-wide text-gray-900">Bedienungshilfen beim Lesen.</h2>
                <h3 class="mb-5 text-2xl text-gray-600">Erklärungen genau dort, wo sie benötigt werden.</h3>
                <p class="text-lg">
                    Fachbegriffe wie
                    <BaseTooltipHint :tooltip="getGlossaryTerm('competence-level')?.description" class="underline decoration-dashed"
                        >„Kompetenzstufen”</BaseTooltipHint
                    >
                    oder
                    <BaseTooltipHint :tooltip="getGlossaryTerm('fair-comparison')?.description" class="underline decoration-dashed"
                        >„faire Vergleichswert”</BaseTooltipHint
                    >
                    sind mit kurzen Erklärungen hinterlegt. Durch Hovern oder Klicken werden diese angezeigt.
                </p>
                <p class="mt-4 text-lg">
                    Zu jedem Bericht gibt es außerdem einen Button mit Interpretationshilfen:
                    <InterpretationButton v-model="demoShowPanel" />
                    Hier finden Sie gezielte Fragen, die dabei helfen, die Ergebnisse einzuordnen. Ein Klick auf eine Frage hebt die
                    relevanten Stellen im Bericht hervor.
                </p>
            </div>
            <div class="flex basis-2/5 items-start">
                <InterpretationPanel :questions="demoQuestions" :show="demoShowPanel" v-model="demoActiveQuestion" />
            </div>
        </div>
    </section>
    <section class="mt-30">
        <div class="flex gap-20">
            <div class="flex max-w-100 basis-2/5 flex-col justify-center gap-4">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-5" :class="barClass('actual')">
                    <dl>
                        <dt class="mb-1 text-sm font-semibold tracking-wide text-gray-500 uppercase">Tatsächliches Ergebnis</dt>
                        <dd class="text-2xl font-bold text-gray-900">68 %</dd>
                    </dl>
                    <div class="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                        <div class="bg-primary h-3 rounded-full" style="width: 68%"></div>
                    </div>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-5" :class="barClass('fair')">
                    <dl>
                        <dt class="mb-1 text-sm font-semibold tracking-wide text-gray-500 uppercase">Fairer Vergleichswert</dt>
                        <dd class="text-2xl font-bold text-gray-900">62 %</dd>
                    </dl>
                    <div class="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                        <div class="bg-tertiary h-3 rounded-full" style="width: 62%"></div>
                    </div>
                </div>
                <p class="text-sm text-gray-500">Beispiel: Die Klasse liegt 6 Prozentpunkte über dem fairen Vergleichswert.</p>
            </div>
            <div class="max-w-140 basis-3/5">
                <h2 class="mb-1 text-3xl font-bold tracking-wide text-gray-900">Fairer Maßstab ermöglicht gerechte Vergleiche.</h2>
                <h3 class="mb-5 text-2xl text-gray-600">Die Klassenzusammensetzung wird berücksichtigt.</h3>
                <p class="text-lg">
                    Klassen unterscheiden sich beispielsweise nach Geschlecht, Förderbedarf oder der zu Hause gesprochenen Sprache. Der
                    faire Vergleichswert berücksichtigt diese Merkmale (sofern sie in den Daten vorhanden sind) und gibt an, welches
                    Ergebnis angesichts der Zusammensetzung der Klasse zu erwarten gewesen wäre. Liegt das tatsächliche Ergebnis über dem
                    fairen Vergleichswert, hat die Klasse besser abgeschnitten als erwartet – und umgekehrt.
                </p>
            </div>
        </div>
    </section>
</template>
