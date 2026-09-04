import { useQuery } from '@tanstack/vue-query'

type DomainDef = {
    subjectId: string
    domainId: string
    name: string
    description: string
}

type CompLvlDef = {
    subjectId: string
    domainId: string
    competenceLevels: {
        arabicNumber: string
        romanNumber: string
        subtitle: string
        description: string
    }[]
}

type CogDemandLvlDef = {
    level: string
    name: string
    description: string
}

export type CompetenceIdDef = {
    subjectId: string
    id: string
    name: string
    ktColumnName: string
    description: string
}

export function useDomainDefsQuery() {
    return useQuery<DomainDef[], Error>({
        queryKey: ['domainDefs'],
        queryFn: () => mockResDomainDefs,
        retry: 1,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useCompLvlDefsQuery() {
    return useQuery<CompLvlDef[], Error>({
        queryKey: ['competenceLevelDefinitions'],
        queryFn: () => mockResCompLvlDefs,
        retry: 1,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useCompetenceIdDefsQuery() {
    return useQuery<CompetenceIdDef[], Error>({
        queryKey: ['competenceIdDefs'],
        queryFn: () => mockResCompetenceIdDefs,
        retry: 1,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useCogDemandLvlDefsQuery() {
    return useQuery<CogDemandLvlDef[], Error>({
        queryKey: ['cogDemandLvlDef'],
        queryFn: () => mockResCogDemandLvlDefs,
        retry: 1,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

const romanToArabic: Record<string, string> = { I: '1', II: '2', III: '3', IV: '4', V: '5' }

export function getCompLvlDescription(domainId: string, romanLevel: string): string | undefined {
    const arabic = romanToArabic[romanLevel]
    return mockResCompLvlDefs.find((d) => d.domainId === domainId)?.competenceLevels.find((l) => l.arabicNumber === arabic)?.description
}

export function getCompLvlDef(domainId: string, romanLevel: string): { subtitle: string; description: string } | undefined {
    const arabic = romanToArabic[romanLevel]
    return mockResCompLvlDefs.find((d) => d.domainId === domainId)?.competenceLevels.find((l) => l.arabicNumber === arabic)
}

const mockResDomainDefs = [
    {
        subjectId: 'de',
        domainId: 'le',
        name: 'Leseverstehen',
        description:
            'Der Kompetenzbereich Leseverstehen umfasst eine Gruppe von Aufgaben im Bereich Leseverstehen. Schwester-Kompetenzbereiche sind Orthografie, Zuhören und Sprachgebrauch.',
    },
    {
        subjectId: 'de',
        domainId: 'rs',
        name: 'Orthografie',
        description:
            'Der Kompetenzbereich Orthografie umfasst eine Gruppe von Aufgaben im Bereich Orthografie. Schwester-Kompetenzbereiche sind Leseverstehen, Zuhören und Sprachgebrauch.',
    },
]

const mockResCompLvlDefs = [
    {
        subjectId: 'de',
        domainId: 'le',
        competenceLevels: [
            {
                arabicNumber: '1',
                romanNumber: 'I',
                subtitle: 'Unter Mindeststandard',
                description:
                    'Ia: Lokalisieren und Wiedergeben prominenter Einzelinformationen & Ib: Benachbarte Informationen miteinander verknüpfen',
            },
            {
                arabicNumber: '1a',
                romanNumber: 'Ia',
                subtitle: 'Unter Mindeststandard',
                description: 'Lokalisieren und Wiedergeben prominenter Einzelinformationen',
            },
            {
                arabicNumber: '1b',
                romanNumber: 'Ib',
                subtitle: 'Unter Mindeststandard',
                description: 'Benachbarte Informationen miteinander verknüpfen',
            },
            {
                arabicNumber: '2',
                romanNumber: 'II',
                subtitle: 'Mindeststandard',
                description: 'Informationen miteinander verknüpfen und Textstrukturen erfassen',
            },
            {
                arabicNumber: '3',
                romanNumber: 'III',
                subtitle: 'Regelstandard',
                description: 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen',
            },
            {
                arabicNumber: '4',
                romanNumber: 'IV',
                subtitle: 'Regelstandard plus',
                description: 'Auf der Ebene des Textes wesentliche Zusammenhänge erkennen und die Textgestaltung reflektieren',
            },
            { arabicNumber: '5', romanNumber: 'V', subtitle: 'Maximalstandard', description: 'Interpretieren, Begründen und Bewerten' },
        ],
    },
    {
        subjectId: 'de',
        domainId: 'rs',
        competenceLevels: [
            {
                arabicNumber: '1',
                romanNumber: 'I',
                subtitle: 'Unter Mindeststandard',
                description:
                    'Ia: Phonographische und einfache silbische Schreibungen sowie Großschreibung von Konkreta & Ib: Ansatzweise Markierung von Vokalkürze und Vokallänge, Schreibungen mit konsonantischen und vokalischen Ableitungen sowie Großschreibung von Abstrakta',
            },
            {
                arabicNumber: '1a',
                romanNumber: 'Ia',
                subtitle: 'Unter Mindeststandard',
                description: 'Phonographische und einfache silbische Schreibungen sowie Großschreibung von Konkreta',
            },
            {
                arabicNumber: '1b',
                romanNumber: 'Ib',
                subtitle: 'Unter Mindeststandard',
                description:
                    'Ansatzweise Markierung von Vokalkürze und Vokallänge, Schreibungen mit konsonantischen und vokalischen Ableitungen sowie Großschreibung von Abstrakta',
            },
            {
                arabicNumber: '2',
                romanNumber: 'II',
                subtitle: 'Mindeststandard',
                description: 'Teilweise Beachtung von Morphemkonstanz, Großschreibung von Nominalisierungen und Zeichensetzung',
            },
            {
                arabicNumber: '3',
                romanNumber: 'III',
                subtitle: 'Regelstandard',
                description: 'Weitgehendes Beherrschen von Wortschreibungs- und Zeichensetzungsregeln',
            },
            {
                arabicNumber: '4',
                romanNumber: 'IV',
                subtitle: 'Regelstandard plus',
                description: 'Identifizierung von Fehlerschwerpunkten, Ableitung von Rechtschreibregeln und Beherrschen der Zeichensetzung',
            },
            {
                arabicNumber: '5',
                romanNumber: 'V',
                subtitle: 'Maximalstandard',
                description:
                    'Korrektur schwer ableitbarer und morphologisch komplexer Wörter sowie sicheres Beherrschen der Zeichensetzung',
            },
        ],
    },
    {
        subjectId: 'ma',
        domainId: '',
        competenceLevels: [
            {
                arabicNumber: '1',
                romanNumber: 'I',
                subtitle: 'Unter Mindeststandard',
                description:
                    'Ia: Schülerinnen und Schüler in dieser Kompetenzstufe können: einschrittige Operationen mit natürlichen Zahlen durchführen; vorgegebenen natürlichen Maßzahlen (in einfachen Realkontexten) die zugehörigen Maßeinheiten zuordnen; einfache ebene bzw. räumliche Objekte (z. B. Quadrat oder Würfel) benennen und skizzieren; aus kurzen, einfachen mathematikhaltigen Texten oder Darstellungen einzelne Informationen entnehmen; bei inhaltlich gegebenen einfachen Folgen die unmittelbar nächsten Folgenglieder ermitteln; Trefferchancen bei einfachen vertrauten Zufallsexperimenten nach Größe vergleichen. & Ib: (Mindeststandard für den HSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: vorgegebene Argumentationen zu überschaubaren mathematischen Sachverhalten nachvollziehen; einfache Beziehungen zwischen bekannten Polyedern und deren Netzen herstellen; Routineverfahren bei bekannten geometrischen oder algebraischen Objekten und Darstellungen verwenden; mit vertrauten einfachen Formeln und Symbolen umgehen; vertraute und direkt erkennbare arithmetische Modelle in vertrauten Realkontexten anwenden; Wahrscheinlichkeiten für Elementarereignisse bei vertrauten Zufallsexperimenten (z. B. Würfeln, Los ziehen) berechnen.',
            },
            {
                arabicNumber: '1a',
                romanNumber: 'Ia',
                subtitle: 'Unter Mindeststandard',
                description:
                    'Schülerinnen und Schüler in dieser Kompetenzstufe können: einschrittige Operationen mit natürlichen Zahlen durchführen; vorgegebenen natürlichen Maßzahlen (in einfachen Realkontexten) die zugehörigen Maßeinheiten zuordnen; einfache ebene bzw. räumliche Objekte (z. B. Quadrat oder Würfel) benennen und skizzieren; aus kurzen, einfachen mathematikhaltigen Texten oder Darstellungen einzelne Informationen entnehmen; bei inhaltlich gegebenen einfachen Folgen die unmittelbar nächsten Folgenglieder ermitteln; Trefferchancen bei einfachen vertrauten Zufallsexperimenten nach Größe vergleichen.',
            },
            {
                arabicNumber: '1b',
                romanNumber: 'Ib',
                subtitle: 'Unter Mindeststandard',
                description:
                    '(Mindeststandard für den HSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: vorgegebene Argumentationen zu überschaubaren mathematischen Sachverhalten nachvollziehen; einfache Beziehungen zwischen bekannten Polyedern und deren Netzen herstellen; Routineverfahren bei bekannten geometrischen oder algebraischen Objekten und Darstellungen verwenden; mit vertrauten einfachen Formeln und Symbolen umgehen; vertraute und direkt erkennbare arithmetische Modelle in vertrauten Realkontexten anwenden; Wahrscheinlichkeiten für Elementarereignisse bei vertrauten Zufallsexperimenten (z. B. Würfeln, Los ziehen) berechnen.',
            },
            {
                arabicNumber: '2',
                romanNumber: 'II',
                subtitle: 'Mindeststandard',
                description:
                    '(Regelstandard für den HSA, Mindeststandard für den MSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: einfache Standardargumentationen wiedergeben; einfache Problemaufgaben mit bekannten Verfahren lösen; wenigschrittige direkt umsetzbare Operationen mit einfachem Zahlenmaterial (im Realkontext) durchführen; einfache Beziehungen zwischen Mathematik und Realität herstellen; einfache Darstellungen verwenden und Beziehungen zwischen zwei solchen herstellen; einfache geometrische Konstruktionen durchführen; zwischen verschiedenen bekannten Darstellungen übersetzen; elementares begriffliches Wissen wiedergeben; relevante Informationen aus mehreren gegebenen auswählen.',
            },
            {
                arabicNumber: '3',
                romanNumber: 'III',
                subtitle: 'Regelstandard',
                description:
                    '(Regelstandard plus für den HSA, Regelstandard für den MSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: selbstständig einfache Argumentationen in einem überschaubaren mathematischen Kontext durchführen; Probleme bearbeiten, deren Lösung die Anwendung einer naheliegenden Strategie erfordert; einem mathematischen Modell passende Situationen zuordnen; Modellierungen vornehmen, die wenige Schritte erfordern und vertraute Kontexte beinhalten; einfache geometrische Konstellationen analysieren; zwischen verschiedenen Darstellungen übersetzen; einschrittige Operationen mit Variablen, Termen, Gleichungen und Funktionen durchführen; wenigschrittige Operationen mit Zahlen oder Größen vorwärts und rückwärts durchführen; überschaubare Überlegungen, Lösungswege bzw. Ergebnisse verständlich darstellen.',
            },
            {
                arabicNumber: '4',
                romanNumber: 'IV',
                subtitle: 'Regelstandard plus',
                description:
                    '(Optimalstandard für den HSA, Regelstandard plus für den MSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: überschaubare mehrschrittige Argumentationen erläutern bzw. entwickeln; Probleme bearbeiten, deren Lösung die Anwendung einer selbstentwickelten Strategie erfordert; mehrschrittige Modellierungen in komplexen Realkontexten durchführen; eigene Darstellungen zielgerichtet erstellen; mathematische Operationen verständnisorientiert anwenden; mehrschrittige Operationen mit Variablen, Termen, Gleichungen und Funktionen durchführen; Informationen aus längeren mathematikhaltigen Texten zielgerichtet entnehmen.',
            },
            {
                arabicNumber: '5',
                romanNumber: 'V',
                subtitle: 'Maximalstandard',
                description:
                    '(Optimalstandard für den MSA) Schülerinnen und Schüler dieser Kompetenzstufe können zudem: komplexe Argumentationen erläutern bzw. selbst entwickeln und bewerten; anspruchsvolle Probleme bearbeiten und Lösungswege reflektieren; komplexe außermathematische Problemsituationen mit selbst entwickelten Modellen bearbeiten, verwendete mathematische Modelle reflektieren und kritisch beurteilen; verschiedene Formen von Darstellungen beurteilen; Möglichkeiten und Grenzen der Nutzung mathematischer Operationen reflektieren; Algebraisierungen durchführen; Lösungsverfahren bewerten; komplexe mathematische Sachverhalte präsentieren; umfangreiche oder logisch komplexe mathematikhaltige Texte Sinn entnehmend erfassen.',
            },
        ],
    },
]

// prettier-ignore
const mockResCompetenceIdDefs: CompetenceIdDef[] = [
    { subjectId: 'de', id: '2.5', name: 'Bildungsstandard 2.5', ktColumnName: 'cBildStd_2_5', description: 'Richtig schreiben' },
    { subjectId: 'de', id: '3.2', name: 'Bildungsstandard 3.2', ktColumnName: 'cBildStd_3_2', description: 'Strategien zum Leseverstehen kennen und anwenden' },
    { subjectId: 'de', id: '3.3', name: 'Bildungsstandard 3.3', ktColumnName: 'cBildStd_3_3', description: 'Literarische Texte verstehen und nutzen' },
    { subjectId: 'de', id: '3.4', name: 'Bildungsstandard 3.4', ktColumnName: 'cBildStd_3_4', description: 'Sach- und Gebrauchstexte verstehen und nutzen' },
    { subjectId: 'de', id: '3.5', name: 'Bildungsstandard 3.5', ktColumnName: 'cBildStd_3_5', description: 'Medien verstehen und nutzen' },
    { subjectId: 'de', id: '4.3', name: 'Bildungsstandard 4.3', ktColumnName: 'cBildStd_4_3', description: 'Leistungen von Sätzen und Wortarten kennen und für Sprechen, Schreiben (für MSA: und Textuntersuchung) nutzen' },
]

const mockResCogDemandLvlDefs = [
    {
        level: '1',
        name: 'Anforderungsbereich 1',
        description: 'Informationen aus dem Stimulus wiedergegeben',
    },
    {
        level: '2',
        name: 'Anforderungsbereich 2',
        description: 'Verknüpfen von Informationen',
    },
    {
        level: '3',
        name: 'Anforderungsbereich 3',
        description: 'Reflexion und Beurteilung von Informationen aus dem Stimulus',
    },
]
