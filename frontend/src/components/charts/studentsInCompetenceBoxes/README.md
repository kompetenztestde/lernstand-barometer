# StudentsInCompetenceBoxes

Zeigt alle Schüler:innen einer Klasse sortiert nach Kompetenzstufe und Domäne.
Jede Box repräsentiert eine Kompetenzstufe. Ein Klick auf das Schüler-Icon öffnet ein Modal mit individuellen Ergebnissen.

## Verwendung

```vue
<StudentsInCompetenceBoxes :data="chartData" />
```

## Daten-Prop (`StudentsInCompetenceBoxesData`)

```
StudentsInCompetenceBoxesData
└── domains: StudentsInCompetenceBoxesDomainData[]
    ├── domainId: string          (z. B. "le")
    ├── label: string             (z. B. "Leseverstehen")
    └── competenceLevelBoxes: CompetenceLevelBoxData[]
        ├── arabicNumber: string  ("1"–"5", für Farb-CSS-Klasse)
        ├── romanNumber: string   ("I"–"V", im Boxentitel)
        ├── subtitle: string      (z. B. "Regelstandard")
        ├── description: string   (Tooltip-Text)
        └── students: StudentIconData[]
            ├── code: string
            ├── leseverstehenMean: number | null
            ├── orthografieMean: number | null
            ├── leseverstehenLevel: string | null
            └── orthografieLevel: string | null
```

## Mock-Daten

```typescript
import { mockStudentsInCompetenceBoxesData } from '@/components/charts/studentsInCompetenceBoxes'
```

## Abhängigkeiten

- `CompetenceLevelBox`, `StudentIcon` – interne Sub-Komponenten
- `useStudentNamesStore` – löst Schüler-Codes in Anzeigenamen auf (Store, kein Fetch)
- `DonutD3` – Donut-Chart im Schüler-Modal
- `BaseModal` – Modal-Komponente
