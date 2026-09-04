import type { TaskListData } from './types'

export const mockTaskListData: TaskListData = {
    tasks: [
        { iqbId: 'iDL001A01', position: 1, taskNumber: '1.1', name: 'Sportunterricht', domain: 'le', competenceLevel: 'II', mean: 85, meanCorrected: 81, competenceId: null, cognitiveDemandLevel: null },
        { iqbId: 'iDL001A02', position: 2, taskNumber: '1.2', name: 'Sportunterricht', domain: 'le', competenceLevel: 'III', mean: 72, meanCorrected: 68, competenceId: null, cognitiveDemandLevel: null },
        { iqbId: 'iDL002A01', position: 3, taskNumber: '2.1', name: 'Freizeitpark', domain: 'le', competenceLevel: 'IV', mean: 54, meanCorrected: 59, competenceId: null, cognitiveDemandLevel: null },
        { iqbId: 'iDO001A01', position: 4, taskNumber: '3.1', name: 'Diktat', domain: 'rs', competenceLevel: 'II', mean: 91, meanCorrected: 88, competenceId: null, cognitiveDemandLevel: null },
        { iqbId: 'iDO001A02', position: 5, taskNumber: '3.2', name: 'Diktat', domain: 'rs', competenceLevel: 'III', mean: 63, meanCorrected: 67, competenceId: null, cognitiveDemandLevel: null },
    ],
    domains: [
        {
            domainId: 'le',
            label: 'Leseverstehen',
            competenceLevels: [
                { romanNumber: 'I', subtitle: 'Unter Mindeststandard', description: 'Lokalisieren und Wiedergeben prominenter Einzelinformationen' },
                { romanNumber: 'II', subtitle: 'Mindeststandard', description: 'Informationen miteinander verknüpfen und Textstrukturen erfassen' },
                { romanNumber: 'III', subtitle: 'Regelstandard', description: 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen' },
                { romanNumber: 'IV', subtitle: 'Regelstandard plus', description: 'Auf der Ebene des Textes wesentliche Zusammenhänge erkennen und die Textgestaltung reflektieren' },
                { romanNumber: 'V', subtitle: 'Maximalstandard', description: 'Interpretieren, Begründen und Bewerten' },
            ],
        },
        {
            domainId: 'rs',
            label: 'Orthografie',
            competenceLevels: [
                { romanNumber: 'I', subtitle: 'Unter Mindeststandard', description: 'Phonographische und einfache silbische Schreibungen sowie Großschreibung von Konkreta' },
                { romanNumber: 'II', subtitle: 'Mindeststandard', description: 'Teilweise Beachtung von Morphemkonstanz, Großschreibung von Nominalisierungen und Zeichensetzung' },
                { romanNumber: 'III', subtitle: 'Regelstandard', description: 'Weitgehendes Beherrschen von Wortschreibungs- und Zeichensetzungsregeln' },
                { romanNumber: 'IV', subtitle: 'Regelstandard plus', description: 'Identifizierung von Fehlerschwerpunkten, Ableitung von Rechtschreibregeln und Beherrschen der Zeichensetzung' },
                { romanNumber: 'V', subtitle: 'Maximalstandard', description: 'Korrektur schwer ableitbarer und morphologisch komplexer Wörter sowie sicheres Beherrschen der Zeichensetzung' },
            ],
        },
    ],
}
