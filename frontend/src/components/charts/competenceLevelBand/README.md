# CompetenceLevelBand

Zeigt einen horizontalen Balken mit 5 Kompetenzstufen. Die erreichte Stufe wird farblich hervorgehoben.
Hover auf eine Stufe zeigt den offiziellen Beschreibungstext als Tooltip.

## Verwendung

```vue
<CompetenceLevelBand :data="{ competenceLevel: 3 }" />
```

## Daten-Prop (`CompetenceLevelBandData`)

| Feld               | Typ             | Beschreibung                         |
|--------------------|-----------------|--------------------------------------|
| `competenceLevel`  | `number\|null`  | Erreichte Stufe (1–5), `null` = kein Wert |

## Mock-Daten

```typescript
import { mockCompetenceLevelBandData } from '@/components/charts/competenceLevelBand'
```

## Hinweis

Die eingebetteten Kompetenzstufen-Beschreibungen beziehen sich auf **Deutsch – Leseverstehen**.
Für andere Domänen können die Texte abweichen.

## Abhängigkeiten

- `v-tippy` – Tooltip-Direktive
