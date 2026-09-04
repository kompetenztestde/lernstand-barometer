# SubDomainChart

Zeigt Klassen-Mittelwert und Fairen Vergleichswert für Kompetenzbereiche und Kompetenzstufen als Balkengrafik.
Enthält interaktive Interpretationshilfen zum Hervorheben auffälliger Zeilen.

## Verwendung

```vue
<SubDomainChart :data="chartData" />
```

## Daten-Prop (`SubDomainChartData`)

| Feld                   | Typ                                               | Beschreibung                                              |
|------------------------|---------------------------------------------------|-----------------------------------------------------------|
| `domainBars`           | `Record<string, SubDomainChartBar>`               | Balken pro Domäne, Schlüssel = domainId (z. B. `"le"`)    |
| `compLvlBars`          | `Record<string, Record<string, SubDomainChartBar>>`| Balken pro Kompetenzstufe, Schlüssel = domainId + Roman  |
| `domainDefs`           | `SubDomainChartDomainDef[]`                       | Label + Beschreibung pro Domäne (für Tooltip)             |
| `compLvlDefs`          | `Record<string, SubDomainChartCompLvlDef[]>`      | Kompetenzstufen-Defs pro Domäne (für Tooltip)             |
| `fairComparisonTooltip`| `string?`                                         | Optionaler Tooltip-Text für "Fairer Vergleichswert"       |

### `SubDomainChartBar`

| Feld             | Typ      | Beschreibung               |
|------------------|----------|----------------------------|
| `mean`           | `number` | Klassen-Mittelwert (0–100 %)|
| `meanComparison` | `number` | Fairer Vergleichswert (0–100 %)|

## Mock-Daten

```typescript
import { mockSubDomainChartData } from '@/components/charts/subDomainChart'
```

## Abhängigkeiten

- `ScoreBarGroup` – Balkenvisualisierung
- `SubDomainLabel` – Label mit Tooltip (internes Sub-Element)
- `BaseHeading` – Überschriften-Komponente
