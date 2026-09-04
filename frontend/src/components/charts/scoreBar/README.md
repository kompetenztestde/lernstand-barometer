# ScoreBar / ScoreBarGroup

Horizontale Balkengrafik zur Darstellung von Prozentwerten (0–100 %).
`ScoreBarGroup` zeigt mehrere Balken nebeneinander und berechnet bei Hover die Differenz zwischen den Werten.

## ScoreBar – Verwendung

```vue
<ScoreBar :data="barData" />
```

## ScoreBarGroup – Verwendung

```vue
<ScoreBarGroup :bars="bars" orientation="row" :show-title="true" />
```

## Daten-Prop (`ScoreBarData`)

| Feld                          | Typ            | Beschreibung                                               |
|-------------------------------|----------------|------------------------------------------------------------|
| `barValue`                    | `number`       | Wert für Differenzberechnung beim Hover                    |
| `barLength`                   | `number`       | Balkenbreite (0–100)                                       |
| `title`                       | `string?`      | Beschriftung über dem Balken                               |
| `titleTooltip`                | `string?`      | Tooltip-Text beim Hover auf den Titel                      |
| `titleTooltipUnderlineOffset` | `string?`      | CSS `text-underline-offset` für den Tooltip-Unterstrich    |
| `titleTooltipUnderlineThickness`| `string?`    | CSS `text-decoration-thickness` für den Tooltip-Unterstrich|
| `color`                       | `string?`      | CSS-Farbwert, z. B. `'var(--color-primary)'`               |
| `barValuePrefix`              | `string?`      | Präfix vor dem Anzeigewert                                 |
| `barValueSuffix`              | `string?`      | Suffix nach dem Anzeigewert, z. B. `'%'`                   |
| `barDisplayedValue`           | `string?`      | Überschreibt den berechneten Anzeigewert                   |
| `barThickness`                | `string?`      | CSS-Höhe des Balkens, z. B. `'1.4rem'`                     |
| `showValue`                   | `boolean?`     | Wert im Balken anzeigen (Standard: `true`)                 |
| `comingSoon`                  | `boolean?`     | Balken blur + "bald verfügbar" anzeigen                    |

## Mock-Daten

```typescript
import { mockScoreBarData, mockScoreBarGroupData } from '@/components/charts/scoreBar'
```

## Abhängigkeiten

- `BaseTooltipHint` – Tooltip auf dem Balkentitel
