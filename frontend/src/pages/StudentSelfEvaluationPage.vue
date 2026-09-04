<script setup lang="ts">
/**
 * Guided self-evaluation dialogue for students.
 *
 * The dialogue is organised into phases (arrays of Steps), each started with
 * startPhase(). Three step kinds exist: line (typewriter text in the speech
 * bubble), image (image inside the bubble), and choice (answer buttons).
 * onFinish callbacks on line steps control when entries appear in the result
 * sidebar on the right.
 *
 * Flow: intro → reading-comprehension self-assessment → reading-comprehension
 *       feedback → orthography self-assessment → orthography feedback → end
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import AvatarGuide from '@/components/studentDialogue/AvatarGuide.vue'
import SelfEvaluationResultBox from '@/components/charts/subjectResultBox/SelfEvaluationResultBox.vue'
import SelfEvaluationStudentPrint from './selfEvaluation/SelfEvaluationStudentPrint.vue'
import InfoBox from '@/components/studentDialogue/InfoBox.vue'
import StandardBox from '@/components/studentDialogue/StandardBox.vue'
import SpeechBubble from '@/components/studentDialogue/SpeechBubble.vue'
import { useAuthStore } from '@/stores/auth'
import { useStudentCompetenceLevelsQuery, useDemoStudentCompetenceLevelsQuery, normalizeLevel } from '@/queries/useStudentsQuery'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import { useStudentAggregationsForStudentQuery, useDemoStudentAggregationsQuery } from '@/queries/useGroupsAggregationsQuery'
import { useCompetenceIdDefsQuery } from '@/queries/useItemParamDefsQuery'
import readingComprehensionImage from '@/assets/images/example-item.webp'
import orthographyImage from '@/assets/images/example-item.webp'

// --- Types ---
// onFinish fires once the typewriter animation of a line has completed.
type LineStep = { kind: 'line'; text: string; onFinish?: () => void }
type ImageStep = { kind: 'image'; src: string; alt: string }
type ChoiceStep = { kind: 'choice'; buttons: { label: string | (() => string); disabled?: () => boolean; onSelect: () => void }[] }
type Step = LineStep | ImageStep | ChoiceStep

const router = useRouter()
const auth = useAuthStore()

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'
const isPdfLoading = ref(false)

// The print server navigates to /student/self-evaluation using the student's real role so that
// useAuthHeaders generates the correct auth header (X-API-KEY-SCHOOL for demo students).
// groupId and self-assessment values are passed as parameters so the print component
// can show actual results without relying on state that isn't available in the print context.
async function downloadStudentPdf(groupId: number, selfAssessmentLE: string | null, selfAssessmentRS: string | null) {
    if (!auth.studentCode) return
    isPdfLoading.value = true
    try {
        const response = await fetch('/api/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: 'student-self-evaluation',
                token: auth.token,
                role: auth.role,
                expiresAt: localStorage.getItem('expires-at'),
                groupId,
                studentCode: auth.studentCode,
                selfAssessmentLE: selfAssessmentLE ?? undefined,
                selfAssessmentRS: selfAssessmentRS ?? undefined,
            }),
        })
        if (!response.ok) throw new Error('PDF konnte nicht erstellt werden.')
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Selbsteinschätzung_${auth.studentCode}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    } catch (e) {
        console.error('PDF-Download fehlgeschlagen:', e)
    } finally {
        isPdfLoading.value = false
    }
}

function logout() {
    auth.logout()
    router.push({ name: 'login' })
}

// --- State ---
const showContent = ref(false)
// announceText is read by the screen-reader live region; displayedText drives the visible speech bubble.
// They are separate so the SR only announces complete lines, not every typed character.
const announceText = ref('')
const displayedText = ref('')
const isTyping = ref(false)
const currentSteps = ref<Step[]>([])
const currentStepIndex = ref(0)
const choiceContainerRef = ref<HTMLDivElement | null>(null)

// Result sidebar: each flag/value controls whether a card is visible on the right.
// selfAssessment holds the chosen rating label; actualRevealed flips once the
// actual competence level has been read out loud by the avatar.
const readingComprehension = reactive({ selfAssessment: null as string | null, actualRevealed: false })
const orthography = reactive({ selfAssessment: null as string | null, actualRevealed: false })
const keyExplanationRevealed = ref(false) // "keys" metaphor explanation card
const teacherHintRevealed = ref(false) // "talk to your teacher" card
const normalHintRevealed = ref(false) // "not finishing everything is normal" card
const unsolvedTasksRevealed = ref(false)
const solvedTasksRevealed = ref(false)
function triggerConfetti() {
    if (prefersReducedMotion) return
    confetti({
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
        particleCount: 60,
        scalar: 1.2,
        shapes: ['star'],
    })
}

const hasAnyResult = computed(() => readingComprehension.selfAssessment !== null || orthography.selfAssessment !== null)

const currentStep = computed(() => currentSteps.value[currentStepIndex.value] as Step | undefined)
const isChoiceStep = computed(() => currentStep.value?.kind === 'choice')
const isImageStep = computed(() => currentStep.value?.kind === 'image')
const showWeiterHint = computed(() => !isTyping.value && !isChoiceStep.value && currentStepIndex.value < currentSteps.value.length - 1)
const advanceLabel = computed(() => {
    if (isChoiceStep.value) return undefined
    if (isTyping.value) return 'Text vollständig anzeigen'
    return 'Weiter'
})

// Checked once at module init — the preference doesn't change during a session.
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Plain variable (not reactive) — mutating it must never trigger a re-render.
let typeInterval: ReturnType<typeof setInterval> | null = null

// --- Dialog engine ---
// Core loop: startPhase → activateStep → startTyping → finishLine → (repeat or auto-advance to choice)
function finishLine(text: string) {
    isTyping.value = false
    announceText.value = text
    const step = currentStep.value
    if (step?.kind === 'line' && step.onFinish) step.onFinish()
    // Choice steps are never "clicked through" — advance automatically so the
    // buttons appear right after the preceding line finishes typing.
    const nextStep = currentSteps.value[currentStepIndex.value + 1]
    if (nextStep?.kind === 'choice') {
        currentStepIndex.value++
        activateStep(nextStep)
    }
}

function startTyping(text: string) {
    displayedText.value = ''
    isTyping.value = true
    if (prefersReducedMotion) {
        displayedText.value = text
        finishLine(text)
        return
    }
    let charIndex = 0
    typeInterval = setInterval(() => {
        if (charIndex < text.length) {
            displayedText.value += text[charIndex]
            charIndex++
        } else {
            clearInterval(typeInterval!)
            typeInterval = null
            finishLine(text)
        }
    }, 40)
}

function activateStep(step: Step) {
    if (step.kind === 'line') {
        startTyping(step.text)
    } else if (step.kind === 'image') {
        isTyping.value = false
        announceText.value = step.alt
    } else {
        // choice: displayedText stays visible (shows the question), focus is moved to the first button
        isTyping.value = false
    }
}

function startPhase(steps: Step[]) {
    currentSteps.value = steps
    currentStepIndex.value = 0
    displayedText.value = ''
    activateStep(steps[0])
}

function advance() {
    if (isChoiceStep.value) return
    const step = currentStep.value
    if (!step) return
    // Clicking while still typing skips to the end of the current line immediately.
    if (isTyping.value) {
        clearInterval(typeInterval!)
        typeInterval = null
        displayedText.value = (step as LineStep).text
        finishLine((step as LineStep).text)
        return
    }
    const nextIndex = currentStepIndex.value + 1
    if (nextIndex < currentSteps.value.length) {
        currentStepIndex.value = nextIndex
        activateStep(currentSteps.value[nextIndex])
    }
}

// Move focus to the first button when a choice step becomes active
watch(isChoiceStep, (val) => {
    if (val) {
        nextTick(() => {
            const firstBtn = choiceContainerRef.value?.querySelector('button') as HTMLButtonElement | null
            firstBtn?.focus()
        })
    }
})

// --- Phases ---

const { data: participatedGroups } = useParticipatedGroupsQuery()
const groupIds = computed(() => participatedGroups.value?.map((g) => g.groupId) ?? [])

const isDemo = computed(() => auth.role === 'demo-student')

// Demo students use separate queries that aggregate across all their groups
// instead of a single group ID, so both query variants run in parallel and
// studentData picks the appropriate one reactively.
const { data: realStudentData } = useStudentCompetenceLevelsQuery(
    computed(() => auth.studentCode),
    computed(() => auth.studentGroupId),
)
const { data: demoStudentData, groupId: demoStudentGroupId } = useDemoStudentCompetenceLevelsQuery(
    computed(() => auth.studentCode),
    groupIds,
)

const studentData = computed(() => (isDemo.value ? demoStudentData.value : realStudentData.value))

const studentGroupId = computed(() => auth.studentGroupId)
const { data: realStudentAggsData } = useStudentAggregationsForStudentQuery(
    studentGroupId,
    computed(() => auth.studentCode),
)
const { data: demoStudentAggsData } = useDemoStudentAggregationsQuery(
    groupIds,
    computed(() => auth.studentCode),
)
const studentAggregations = computed(() => (isDemo.value ? demoStudentAggsData.value : realStudentAggsData.value) ?? [])

const qualifyingStandards = computed(() =>
    studentAggregations.value.filter((a) => a.type === 'competenceId' && a.includedIqbIds.length >= 3),
)

const worstStandard = computed(() => {
    const candidates = qualifyingStandards.value.filter((a) => a.descriptiveStatistics.mean !== null)
    if (!candidates.length) return null
    return candidates.reduce((worst, a) => (a.descriptiveStatistics.mean! < worst.descriptiveStatistics.mean! ? a : worst))
})

const bestStandard = computed(() => {
    const candidates = qualifyingStandards.value.filter((a) => a.descriptiveStatistics.mean !== null)
    if (!candidates.length) return null
    return candidates.reduce((best, a) => (a.descriptiveStatistics.mean! > best.descriptiveStatistics.mean! ? a : best))
})

const noStandardToImprove = computed(() => worstStandard.value === null)

const { data: competenceIdDefs } = useCompetenceIdDefsQuery()
const competenceDescriptions = computed(() => Object.fromEntries((competenceIdDefs.value ?? []).map((d) => [d.id, d.description])))

// The API returns competence levels as Roman numerals (I–V); parse to integers for arithmetic.
const romanToNumber: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
function toLevelNumber(raw: string | null | undefined): number | null {
    if (!raw) return null
    const normalized = normalizeLevel(raw)
    return romanToNumber[normalized] ?? (parseInt(normalized) || null)
}

const studentEntry = computed(() => studentData.value?.[0])

const actualReadingComprehensionLevel = computed(() => {
    const entry = studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'le')
    return toLevelNumber(entry?.value) ?? 0
})
const actualOrthographyLevel = computed(() => {
    const entry = studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'rs')
    return toLevelNumber(entry?.value) ?? 0
})

// Maps the rating label shown to the student to a numeric score for comparison
// with the actual competence level (also 1–5).
const ratingScores: Record<string, number> = {
    'gar nicht gut': 1,
    mittel: 2,
    gut: 3,
    hervorragend: 4,
    perfekt: 5,
}

const ratingLabels = ['gar nicht gut', 'mittel', 'gut', 'hervorragend', 'perfekt'] as const

function buildRatingButtons(onSelect: (label: string) => void): ChoiceStep['buttons'] {
    return ratingLabels.map((label) => ({ label, onSelect: () => onSelect(label) }))
}

// A difference of ±1 is treated as "roughly matches" to account for the coarse
// 5-point self-rating scale vs. the finer competence level scale.
function buildComparisonLine(actual: number, self: number): LineStep {
    const diff = actual - self
    if (diff === 0) return { kind: 'line', text: 'Das entspricht deiner eigenen Einschätzung.' }
    if (Math.abs(diff) <= 1) return { kind: 'line', text: 'Das entspricht etwa deiner eigenen Einschätzung.' }
    if (diff < 0) return { kind: 'line', text: 'Du hast dich selbst besser eingeschätzt.' }
    return { kind: 'line', text: 'Du hast dich nicht so gut eingeschätzt.' }
}

// Both subjects share the same opening sequence: record the self-assessment,
// reveal the actual level, then show the comparison. Subject-specific dialogue
// continues via continuationSteps.
function buildFeedbackPhase(
    subject: { selfAssessment: string | null; actualRevealed: boolean },
    subjectLabel: string,
    preposition: string,
    actualLevel: number,
    selfScore: number,
    selfLabel: string,
    continuationSteps: Step[],
    openingText = 'Okay! Ich halte deine Selbsteinschätzung mal fest.',
): Step[] {
    return [
        {
            kind: 'line',
            text: openingText,
            onFinish: () => {
                subject.selfAssessment = selfLabel
            },
        },
        {
            kind: 'line',
            text: (() => {
                switch (actualLevel) {
                    case 1:
                        return 'Jetzt dein tatsächliches Ergebnis: Man sieht, dass du die Grundlagen teilweise verstanden hast. Aktuell bewegst du dich auf Kompetenzstufe 1. Das Ziel in der achten Klasse ist Kompetenzstufe 3 – dahin fehlt noch einiges, aber das kannst du mit gezieltem Üben erreichen. Sprich mit deiner Lehrkraft. Sie kann dich dabei unterstützen, die nächsten Schritte zu gehen.'
                    case 2:
                        return 'Jetzt dein tatsächliches Ergebnis: In diesem Test hast du Kompetenzstufe 2 erreicht und damit gezeigt, dass du die grundlegenden Anforderungen schon gut bewältigen kannst. Um den erwarteten Bereich für die achte Klasse, nämlich Kompetenzstufe 3, zu erreichen, brauchst du noch etwas mehr Sicherheit und Übung im Umgang mit anspruchsvolleren Aufgaben. Sprich mit deiner Lehrkraft. Sie kann dich dabei unterstützen, die nächsten Schritte zu gehen.'
                    case 3:
                        return 'Jetzt dein tatsächliches Ergebnis: Deine Ergebnisse zeigen, dass du die Anforderungen auf Kompetenzstufe 3 erfüllst. Du bist damit genau auf dem richtigen Stand. Bleib weiter dran, um deine Sicherheit und dein Können noch weiter zu steigern.'
                    case 4:
                        return 'Jetzt dein tatsächliches Ergebnis: Deine Arbeit zeigt, dass du Inhalte nicht nur verstehst, sondern auch sicher anwenden und weiterdenken kannst. Damit liegst du über dem erwarteten Niveau – das ist eine tolle Entwicklung. Diese Leistung zeigt dein großes Potenzial. Es lohnt sich, daran anzuknüpfen und dich weiterhin herauszufordern.'
                    case 5:
                        return 'Jetzt dein tatsächliches Ergebnis: Du hast nicht nur die erwartete Kompetenzstufe 3 sicher erreicht, sondern bist bis zur höchsten Kompetenzstufe 5 gegangen. Das zeigt, dass du die Inhalte nicht nur verstanden hast, sondern sie auch sehr sicher anwenden, verknüpfen und weiterdenken kannst. Wenn du diese Herangehensweise beibehältst, kannst du deine Stärken noch weiter ausbauen.'
                    default:
                        return `Du hast ${preposition} ${subjectLabel} Kompetenzstufe ${actualLevel} erreicht.`
                }
            })(),
            onFinish: () => {
                subject.actualRevealed = true
            },
        },
        buildComparisonLine(actualLevel, selfScore),
        ...continuationSteps,
    ]
}

// --- Orthography ---
// Defined before reading comprehension because the RC feedback phase references
// orthographyWithoutRefreshPhase in one of its continuation steps.

function selectOrthographyRating(label: string) {
    startPhase(
        buildFeedbackPhase(
            orthography,
            'Orthografie',
            'in der',
            actualOrthographyLevel.value,
            ratingScores[label],
            label,
            [
                {
                    kind: 'line',
                    text: 'Wie kannst du dich nun verbessern bzw. mehr „Schlüssel erhalten‟?',
                },
                {
                    kind: 'line',
                    text: 'Am besten ist es, darüber mit deiner Lehrkraft zu sprechen.',
                    onFinish: () => {
                        teacherHintRevealed.value = true
                    },
                },
                {
                    kind: 'line',
                    text: 'Sie hat auch Zugang zu deinen Ergebnissen und kann dir dabei helfen.',
                },
                {
                    kind: 'line',
                    text: 'Grundsätzlich hilft es, die Dinge zu üben, die du noch nicht geschafft hast.',
                },
                {
                    kind: 'line',
                    text: noStandardToImprove.value
                        ? 'Ich kann dir nichts vorschlagen – du hast alle Bildungsstandards gemeistert. Herzlichen Glückwunsch!'
                        : 'Ich zeige dir, bei welchem Bildungsstandard du noch Übungsbedarf hast.',
                    onFinish: () => {
                        if (!noStandardToImprove.value) unsolvedTasksRevealed.value = true
                    },
                },
                {
                    kind: 'line',
                    text: 'Natürlich dürfen deine Erfolge nicht fehlen!',
                },
                {
                    kind: 'line',
                    text: 'Im neuen Kasten siehst du, bei welchem Bildungsstandard du besonders stark warst. Super!',
                    onFinish: () => {
                        solvedTasksRevealed.value = true
                        triggerConfetti()
                    },
                },
                {
                    kind: 'line',
                    text: 'Das wars von meiner Seite. Wenn du Fragen hast, wende dich am besten an deine Lehrerin / deinen Lehrer.',
                },
                { kind: 'line', text: 'Du kannst dich jetzt abmelden. Tschüss!' },
                {
                    kind: 'choice',
                    buttons: [
                        {
                            label: 'Abmelden',
                            onSelect: () => logout(),
                        },
                        {
                            label: 'Halt! Ich möchte nochmal von vorn anfangen.',
                            onSelect: () => {
                                readingComprehension.selfAssessment = null
                                readingComprehension.actualRevealed = false
                                orthography.selfAssessment = null
                                orthography.actualRevealed = false
                                keyExplanationRevealed.value = false
                                teacherHintRevealed.value = false
                                normalHintRevealed.value = false
                                unsolvedTasksRevealed.value = false
                                solvedTasksRevealed.value = false
                                showContent.value = false
                                startPhase(introPhase)
                            },
                        },
                        ...(pdfEnabled
                            ? [
                                  {
                                      label: () => (isPdfLoading.value ? 'PDF wird generiert …' : 'Ergebnisse als PDF herunterladen'),
                                      disabled: () => isPdfLoading.value,
                                      onSelect: () => {
                                          const gid = isDemo.value ? demoStudentGroupId.value : auth.studentGroupId
                                          if (gid) downloadStudentPdf(gid, readingComprehension.selfAssessment, orthography.selfAssessment)
                                      },
                                  },
                              ]
                            : []),
                        {
                            label: 'Hier findest du passende Aufgaben zum Üben.',
                            onSelect: () => window.open('https://aufgabenbrowser.de', '_blank', 'noopener,noreferrer'),
                        },
                        ...(!prefersReducedMotion ? [{ label: 'Konfetti!!!', onSelect: () => triggerConfetti() }] : []),
                    ],
                },
            ],
            'Ich halte auch diese Selbsteinschätzung fest.',
        ),
    )
}

function buildOrthographyWithRefreshPhase(): Step[] {
    return [
        {
            kind: 'line',
            text: 'Du solltest zum Beispiel entscheiden, ob "das" oder "dass" eingesetzt werden muss. Hier ist nochmal das Bild der Aufgabe:',
        },
        { kind: 'image', src: orthographyImage, alt: 'Aufgabe: „das" oder „dass" einsetzen' },
        { kind: 'line', text: 'Was glaubst du, wie gut du bei den Aufgaben zur Orthografie abgeschnitten hast?' },
        { kind: 'choice', buttons: buildRatingButtons((label) => selectOrthographyRating(label)) },
    ]
}

const orthographyWithoutRefreshPhase: Step[] = [
    { kind: 'line', text: 'Was glaubst du, wie gut du bei den Aufgaben zur Orthografie abgeschnitten hast?' },
    { kind: 'choice', buttons: buildRatingButtons((label) => selectOrthographyRating(label)) },
]

// --- Reading comprehension ---

function selectReadingComprehensionRating(label: string) {
    startPhase(
        buildFeedbackPhase(readingComprehension, 'Leseverstehen', 'im', actualReadingComprehensionLevel.value, ratingScores[label], label, [
            {
                kind: 'line',
                text: 'Kompetenzstufen kannst du dir wie Schlüssel vorstellen. Je höher deine Kompetenzstufe, desto mehr Schlüssel hast du in der Hand, um schwierigere Aufgaben lösen zu können.',
                onFinish: () => {
                    keyExplanationRevealed.value = true
                },
            },
            {
                kind: 'line',
                text: 'Wichtig: Unsere Tests sind keine normalen Schultests. Es gibt einige sehr sehr schwere Aufgaben, die nur wenige Schüler:innen schaffen können.',
            },
            {
                kind: 'line',
                text: 'Wenn du nicht alle Aufgaben geschafft hast, ist das ganz normal. Kein Grund zur Sorge!',
                onFinish: () => {
                    normalHintRevealed.value = true
                },
            },
            {
                kind: 'line',
                text: 'Es gab noch einen zweiten Teil des Tests zu Orthografie. Kannst du dich daran erinnern oder brauchst du eine Auffrischung?',
            },
            {
                kind: 'choice',
                buttons: [
                    { label: 'Ich kann mich gut erinnern.', onSelect: () => startPhase(orthographyWithoutRefreshPhase) },
                    { label: 'Ich brauche eine Auffrischung.', onSelect: () => startPhase(buildOrthographyWithRefreshPhase()) },
                ],
            },
        ]),
    )
}

// --- Reading comprehension intro ---

const withRefreshPhase: Step[] = [
    { kind: 'line', text: 'Es gab Aufgaben zu Lesetexten. Sie sollen testen, wie gut du im Leseverstehen bist.' },
    { kind: 'line', text: "Es ging zum Beispiel um eine Studie über Let's Plays und warum sie so beliebt sind." },
    { kind: 'line', text: 'Ich zeige dir jetzt einen Auszug davon. Du musst nichts durchlesen. Es dient nur der Erinnerung an den Test.' },
    { kind: 'image', src: readingComprehensionImage, alt: "Lesetext aus dem Test zum Thema Let's Plays" },
    { kind: 'line', text: 'Und dazu musstest du Fragen beantworten.' },
    { kind: 'line', text: 'Was glaubst du, wie gut du bei den Aufgaben zum Leseverstehen abgeschnitten hast?' },
    { kind: 'choice', buttons: buildRatingButtons((label) => selectReadingComprehensionRating(label)) },
]

const withoutRefreshPhase: Step[] = [
    { kind: 'line', text: 'Es gab Aufgaben zu Lesetexten. Sie sollen testen, wie gut du im Leseverstehen bist.' },
    { kind: 'line', text: 'Was glaubst du, wie gut du bei den Aufgaben zum Leseverstehen abgeschnitten hast?' },
    { kind: 'choice', buttons: buildRatingButtons((label) => selectReadingComprehensionRating(label)) },
]

const introPhase: Step[] = [
    {
        kind: 'line',
        text: 'Hallo, ich bin Luca! Ich leite dich durch die Ergebnisse des Tests, den du in deiner Schule vor einiger Zeit geschrieben hast.',
    },
    { kind: 'line', text: 'Kannst du dich noch an den Test erinnern?' },
    {
        kind: 'choice',
        buttons: [
            { label: 'Ja, ich erinnere mich.', onSelect: () => startPhase(withoutRefreshPhase) },
            { label: 'Frische meine Erinnerungen auf.', onSelect: () => startPhase(withRefreshPhase) },
        ],
    },
]

const printStudentCode = ref<string | null>(null)
const printGroupId = ref<number | null>(null)
const printSelfAssessmentLE = ref<string | null>(null)
const printSelfAssessmentRS = ref<string | null>(null)

onMounted(() => {
    const printCode = localStorage.getItem('print-student-code')
    if (printCode) {
        printStudentCode.value = printCode
        localStorage.removeItem('print-student-code')
        const storedGroupId = localStorage.getItem('view-group-id')
        if (storedGroupId) printGroupId.value = Number(storedGroupId)
        printSelfAssessmentLE.value = localStorage.getItem('print-self-assessment-le')
        printSelfAssessmentRS.value = localStorage.getItem('print-self-assessment-rs')
        localStorage.removeItem('print-self-assessment-le')
        localStorage.removeItem('print-self-assessment-rs')
    }
    startPhase(introPhase)
})
onUnmounted(() => {
    if (typeInterval) clearInterval(typeInterval)
})
</script>

<template>
    <!-- Screen reader announcement: full lines and image alt text only -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">{{ announceText }}</div>

    <div class="flex flex-col-reverse gap-8 lg:flex-row lg:gap-6 lg:p-8 print:hidden">
        <!-- Result log -->
        <Transition name="slide-in-right">
            <aside
                v-if="hasAnyResult"
                class="flex w-full shrink-0 flex-col-reverse items-center justify-end gap-3 pt-2 lg:w-92"
                aria-label="Deine bisherigen Ergebnisse"
            >
                <Transition name="slide-up">
                    <SelfEvaluationResultBox
                        v-if="readingComprehension.selfAssessment"
                        class="w-92"
                        title="Leseverstehen"
                        :self-assessment="readingComprehension.selfAssessment"
                        :self-score="ratingScores[readingComprehension.selfAssessment]"
                        :show-keys="keyExplanationRevealed"
                        :actual-revealed="readingComprehension.actualRevealed"
                        :actual-level="actualReadingComprehensionLevel"
                    />
                </Transition>

                <Transition name="slide-up">
                    <InfoBox v-if="normalHintRevealed" class="w-92" textOption="difficultyHint" />
                </Transition>

                <Transition name="slide-up">
                    <SelfEvaluationResultBox
                        v-if="orthography.selfAssessment"
                        class="w-92"
                        title="Orthografie"
                        :self-assessment="orthography.selfAssessment"
                        :self-score="ratingScores[orthography.selfAssessment]"
                        :show-keys="keyExplanationRevealed"
                        :actual-revealed="orthography.actualRevealed"
                        :actual-level="actualOrthographyLevel"
                    />
                </Transition>

                <Transition name="slide-up">
                    <InfoBox v-if="teacherHintRevealed" class="w-92" textOption="helpHint" />
                </Transition>

                <Transition name="slide-up">
                    <StandardBox
                        v-if="unsolvedTasksRevealed && worstStandard"
                        class="w-92"
                        title="Noch zu üben"
                        :standard="`Bildungsstandard ${worstStandard.value}`"
                        :description="competenceDescriptions[worstStandard.value ?? '']"
                    />
                </Transition>

                <Transition name="slide-up">
                    <StandardBox
                        v-if="solvedTasksRevealed && bestStandard"
                        class="w-92"
                        title="Bereits geschafft"
                        :standard="`Bildungsstandard ${bestStandard.value}`"
                        :description="competenceDescriptions[bestStandard.value ?? '']"
                    />
                </Transition>
            </aside>
        </Transition>

        <!-- Dialogue -->
        <div class="flex flex-1 flex-col items-center">
            <!-- Dialogue scene -->
            <div
                role="button"
                :tabindex="isChoiceStep ? -1 : 0"
                :aria-label="advanceLabel"
                class="flex w-full max-w-2xl items-start justify-center gap-3 rounded-lg select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-700 lg:gap-6"
                :class="isChoiceStep ? 'pointer-events-none cursor-default' : 'cursor-pointer'"
                @click="advance"
                @keydown.enter.prevent="advance"
                @keydown.space.prevent="advance"
            >
                <!-- Avatar: decorative -->
                <div class="relative shrink-0" aria-hidden="true">
                    <div class="avatar -ml-3 w-24 lg:ml-0 lg:w-32">
                        <AvatarGuide />
                    </div>
                </div>

                <!-- Speech bubble (line and choice steps) -->
                <SpeechBubble
                    v-if="!isImageStep && displayedText"
                    class="mt-4 min-h-18 max-w-100 px-4 py-4 lg:px-6"
                    aria-hidden="true"
                    :show-weiter-hint="showWeiterHint"
                >
                    <p class="text-base/5 hyphens-auto text-gray-600 lg:text-lg/6" lang="de">
                        {{ displayedText }}<span v-if="isTyping" class="cursor-blink ml-0.5">|</span>
                    </p>
                </SpeechBubble>

                <!-- Image step: replaces the speech bubble, including the tail -->
                <SpeechBubble v-if="isImageStep" class="mt-4 p-2" :show-weiter-hint="showWeiterHint">
                    <div class="overflow-hidden rounded-xl" style="height: 180px">
                        <img
                            :src="(currentStep as ImageStep).src"
                            :alt="(currentStep as ImageStep).alt"
                            class="w-full object-cover object-top"
                        />
                    </div>
                </SpeechBubble>
            </div>

            <!-- Answer buttons (choice step) -->
            <Transition name="slide-up">
                <div
                    v-if="isChoiceStep"
                    ref="choiceContainerRef"
                    role="group"
                    :aria-label="displayedText || undefined"
                    class="mt-8 flex flex-wrap justify-center gap-4"
                >
                    <button
                        v-for="(btn, i) in (currentStep as ChoiceStep).buttons"
                        :key="i"
                        class="rounded-xl border-2 border-gray-700 bg-white px-6 py-3 text-sm font-medium text-gray-800 shadow-sm transition-all select-none hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 lg:text-lg"
                        :disabled="btn.disabled?.()"
                        @click="btn.onSelect()"
                    >
                        {{ typeof btn.label === 'function' ? btn.label() : btn.label }}
                    </button>
                </div>
            </Transition>
        </div>
        <!-- End dialogue -->
    </div>

    <SelfEvaluationStudentPrint
        v-if="printStudentCode && printGroupId"
        class="hidden print:block"
        :code="printStudentCode"
        :group-id="printGroupId"
        :self-assessment-l-e="printSelfAssessmentLE"
        :self-assessment-r-s="printSelfAssessmentRS"
    />
</template>

<style scoped>
/* Result panel: slide in from the left */
.slide-in-right-enter-active {
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
}
.slide-in-right-enter-from {
    opacity: 0;
    transform: translateX(-16px);
}

/* Blinking cursor */
@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
}
.cursor-blink {
    animation: blink 0.7s step-start infinite;
}

/* Avatar bounce */
@keyframes bounce-idle {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-6px);
    }
}
.avatar {
    animation: bounce-idle 2.5s ease-in-out infinite;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active {
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
}
.slide-up-enter-from {
    opacity: 0;
    transform: translateY(12px);
}

/* Disable animations when prefers-reduced-motion is set */
@media (prefers-reduced-motion: reduce) {
    .avatar {
        animation: none;
    }
    .cursor-blink {
        animation: none;
    }
    .fade-enter-active,
    .fade-leave-active,
    .slide-up-enter-active {
        transition: none;
    }
}
</style>
