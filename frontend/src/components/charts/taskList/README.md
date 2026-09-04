# TaskList

Filterable und sortierbare Aufgabenliste mit Balkendiagramm pro Aufgabe.
Zeigt Klassen-Mittelwert und Fairen Vergleichswert für jede Aufgabe.

## Verwendung

```vue
<TaskList :data="taskListData" />
```

## Daten-Prop (`TaskListData`)

### `tasks: TaskListTask[]`

| Feld               | Typ            | Beschreibung                                      |
|--------------------|----------------|---------------------------------------------------|
| `iqbId`            | `string`       | IQB-Aufgaben-ID                                   |
| `position`         | `number`       | Numerische Position (für Sortierung)              |
| `taskNumber`       | `string`       | Anzeigetext, z. B. `"1.1"`                        |
| `name`             | `string`       | Aufgabenname                                      |
| `domain`           | `string`       | Domänen-ID, muss einem Eintrag in `domains` entsprechen |
| `competenceLevel`  | `string`       | Kompetenzstufe als römische Ziffer, z. B. `"III"` |
| `mean`             | `number\|null` | Klassen-Mittelwert (0–100 %)                      |
| `meanCorrected`    | `number\|null` | Fairer Vergleichswert (0–100 %)                   |

### `domains: TaskListDomainDef[]`

| Feld                | Typ                           | Beschreibung                                   |
|---------------------|-------------------------------|------------------------------------------------|
| `domainId`          | `string`                      | Identifier, muss mit `TaskListTask.domain` übereinstimmen |
| `label`             | `string`                      | Anzeigename im Filter, z. B. `"Leseverstehen"` |
| `competenceLevels`  | `TaskListCompetenceLevelDef[]`| Für Tooltip im aufgeklappten Bereich           |

## Mock-Daten

```typescript
import { mockTaskListData } from '@/components/charts/taskList'

// Verwendung in der Page/im Parent-Component
const data = mockTaskListData
```

## Abhängigkeiten

- `TaskBarChart` – einzelne Aufgabenzeile
- `BaseFilterButton`, `BaseSortButton` – Base-Komponenten
