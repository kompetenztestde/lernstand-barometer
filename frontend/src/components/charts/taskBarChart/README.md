# TaskBarChart

Zeigt eine einzelne Aufgabenzeile mit Klassen-Mittelwert und Fairem Vergleichswert als Balkengrafik.
Kann aufgeklappt werden, um Kompetenzstufe, didaktische Details und Aufgabenbilder anzuzeigen.

## Verwendung

```vue
<TaskBarChart
    :data="taskData"
    :is-expanded="isExpanded"
    @click="isExpanded = !isExpanded"
/>
```

## Daten-Prop (`TaskBarChartData`)

| Feld                  | Typ       | Beschreibung                                          |
|-----------------------|-----------|-------------------------------------------------------|
| `iqbId`               | `string`  | IQB-Aufgaben-ID (wird für Bildpfade verwendet)        |
| `taskNumber`          | `string`  | Aufgabennummer, z. B. `"1.1"`                         |
| `name`                | `string`  | Aufgabenname                                          |
| `competenceLevelRoman`| `string`  | Kompetenzstufe als römische Ziffer, z. B. `"III"`     |
| `compLvlSubtitle`     | `string?` | Kurztitel der Kompetenzstufe, z. B. `"Regelstandard"` |
| `compLvlDescription`  | `string?` | Beschreibung der Kompetenzstufe                       |
| `mean`                | `number`  | Klassen-Mittelwert (0–100 %)                          |
| `meanCorrected`       | `number`  | Fairer Vergleichswert (0–100 %)                       |

## Mock-Daten

```typescript
import { mockTaskBarChartData } from '@/components/charts/taskBarChart'
```

## Abhängigkeiten

- `ScoreBarGroup` – Balkenvisualisierung
- `BaseCaret`, `BaseModal` – Base-Komponenten
