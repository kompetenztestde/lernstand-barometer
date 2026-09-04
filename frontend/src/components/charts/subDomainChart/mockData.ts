import type { SubDomainChartData } from './types'

const compLvlDefs = [
    { romanNumber: 'I', subtitle: 'Unter Mindeststandard', description: 'Lokalisieren und Wiedergeben prominenter Einzelinformationen' },
    { romanNumber: 'II', subtitle: 'Mindeststandard', description: 'Informationen miteinander verknüpfen und Textstrukturen erfassen' },
    { romanNumber: 'III', subtitle: 'Regelstandard', description: 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen' },
    { romanNumber: 'IV', subtitle: 'Regelstandard plus', description: 'Auf der Ebene des Textes wesentliche Zusammenhänge erkennen' },
    { romanNumber: 'V', subtitle: 'Maximalstandard', description: 'Interpretieren, Begründen und Bewerten' },
]

export const mockSubDomainChartData: SubDomainChartData = {
    domainBars: {
        le: { mean: 68, meanComparison: 72 },
        rs: { mean: 74, meanComparison: 70 },
    },
    compLvlBars: {
        le: { I: { mean: 45, meanComparison: 50 }, II: { mean: 60, meanComparison: 65 }, III: { mean: 72, meanComparison: 70 }, IV: { mean: 55, meanComparison: 60 }, V: { mean: 40, meanComparison: 45 } },
        rs: { I: { mean: 50, meanComparison: 48 }, II: { mean: 65, meanComparison: 63 }, III: { mean: 78, meanComparison: 75 }, IV: { mean: 62, meanComparison: 65 }, V: { mean: 48, meanComparison: 50 } },
    },
    competenceIdBars: {
        '2.5': { mean: 63, meanComparison: 67 },
        '3.2': { mean: 71, meanComparison: 68 },
        '3.3': { mean: 58, meanComparison: 62 },
        '4.1': { mean: 76, meanComparison: 73 },
    },
    domainDefs: [
        { domainId: 'le', label: 'Leseverstehen', description: 'Der Kompetenzbereich Leseverstehen umfasst eine Gruppe von Aufgaben im Bereich Leseverstehen.' },
        { domainId: 'rs', label: 'Orthografie', description: 'Der Kompetenzbereich Orthografie umfasst eine Gruppe von Aufgaben im Bereich Orthografie.' },
    ],
    compLvlDefs: {
        le: compLvlDefs,
        rs: compLvlDefs,
    },
    competenceIdDefs: [
        { competenceId: '2.5', label: 'Bildungsstandard 2.5', description: 'Texte lesen und verstehen: wesentliche Informationen entnehmen.' },
        { competenceId: '3.2', label: 'Bildungsstandard 3.2', description: 'Texte schreiben: Schreibziele verfolgen und Texte situationsangemessen verfassen.' },
        { competenceId: '3.3', label: 'Bildungsstandard 3.3', description: 'Texte schreiben: Texte überarbeiten und sprachlich gestalten.' },
        { competenceId: '4.1', label: 'Bildungsstandard 4.1', description: 'Sprache und Sprachgebrauch untersuchen: Sprachliche Strukturen kennen und nutzen.' },
    ],
    fairComparisonTooltip: 'Der faire Vergleichswert berücksichtigt die soziale Zusammensetzung der Klasse.',
}
