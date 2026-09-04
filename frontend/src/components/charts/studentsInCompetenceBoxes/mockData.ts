import type { StudentsInCompetenceBoxesData } from './types'

const levels = [
    { arabicNumber: '1', romanNumber: 'I', subtitle: 'Unter Mindeststandard', description: 'Lokalisieren und Wiedergeben prominenter Einzelinformationen' },
    { arabicNumber: '2', romanNumber: 'II', subtitle: 'Mindeststandard', description: 'Informationen miteinander verknüpfen und Textstrukturen erfassen' },
    { arabicNumber: '3', romanNumber: 'III', subtitle: 'Regelstandard', description: 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen' },
    { arabicNumber: '4', romanNumber: 'IV', subtitle: 'Regelstandard plus', description: 'Auf der Ebene des Textes wesentliche Zusammenhänge erkennen' },
    { arabicNumber: '5', romanNumber: 'V', subtitle: 'Maximalstandard', description: 'Interpretieren, Begründen und Bewerten' },
]

export const mockStudentsInCompetenceBoxesData: StudentsInCompetenceBoxesData = {
    domains: [
        {
            domainId: 'le',
            label: 'Leseverstehen',
            total: 0,
            cutoffs: [],
            competenceLevelBoxes: levels.map((lvl, i) => ({
                ...lvl,
                students: i === 1
                    ? [
                        { code: 'S001', leseverstehenMean: 55, orthografieMean: 62, leseverstehenLevel: 'II', orthografieLevel: 'II', leseverstehenScore: null, orthografieScore: null },
                        { code: 'S002', leseverstehenMean: 48, orthografieMean: 71, leseverstehenLevel: 'II', orthografieLevel: 'III', leseverstehenScore: null, orthografieScore: null },
                    ]
                    : i === 2
                    ? [{ code: 'S003', leseverstehenMean: 72, orthografieMean: 68, leseverstehenLevel: 'III', orthografieLevel: 'III', leseverstehenScore: null, orthografieScore: null }]
                    : [],
            })),
        },
        {
            domainId: 'rs',
            label: 'Orthografie',
            total: 0,
            cutoffs: [],
            competenceLevelBoxes: levels.map((lvl, i) => ({
                ...lvl,
                students: i === 2
                    ? [
                        { code: 'S001', leseverstehenMean: 55, orthografieMean: 62, leseverstehenLevel: 'II', orthografieLevel: 'II', leseverstehenScore: null, orthografieScore: null },
                        { code: 'S003', leseverstehenMean: 72, orthografieMean: 68, leseverstehenLevel: 'III', orthografieLevel: 'III', leseverstehenScore: null, orthografieScore: null },
                    ]
                    : i === 1
                    ? [{ code: 'S002', leseverstehenMean: 48, orthografieMean: 71, leseverstehenLevel: 'II', orthografieLevel: 'III', leseverstehenScore: null, orthografieScore: null }]
                    : [],
            })),
        },
    ],
}
