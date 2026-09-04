import { useQuery } from '@tanstack/vue-query'

export type GlossaryTerm = {
    id: string
    label: string
    description: string
}

// TODO: Replace hardcoded mock data with an API call so non-technical users can manage terms.
const mockGlossaryTerms: GlossaryTerm[] = [
    {
        id: 'fair-comparison',
        label: 'Fairer Vergleich',
        description: 'Ein Vergleichswert, der auf Basis der Klassenzusammensetzung bzw. Merkmale der Schüler:innen berechnet wurde.',
    },
    {
        id: 'distribution',
        label: 'Verteilung',
        description: 'Zeigt, wie häufig bestimmte Ausprägungen in einer Gruppe vorkommen.',
    },
    {
        id: 'competence-level',
        label: 'Kompetenzstufe (pro Schüler:in)',
        description:
            'Kompetenzstufen können als eine Art von Fähigkeitsstufen verstanden werden. Ein:e Schüler:in ist immer genau einer Fähigkeitsstufe pro Test oder Testdomäne zugeordnet.',
    },
    {
        id: 'aggregations',
        label: 'Teilbereiche',
        description:
            'Teilbereiche sind Zusammenfassungen bestimmter Aufgaben nach bestimmten Aufgabenmerkmalen, wie z. B. die Zuordnung einer Aufgabe zu einem Kompetenzbereich oder einer Kompetenzstufe.',
    },
]

export function useGlossaryQuery() {
    return useQuery<GlossaryTerm[], Error>({
        queryKey: ['glossary'],
        queryFn: () => mockGlossaryTerms,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    })
}

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
    return mockGlossaryTerms.find((t) => t.id === id)
}
