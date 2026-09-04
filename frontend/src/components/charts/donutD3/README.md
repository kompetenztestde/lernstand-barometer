# DonutD3

Interaktives Donut-Diagramm auf Basis von D3.js.

**Zwei Modi:**
- **Multi-Segment** (mehrere Datenpunkte): Tortenstücke mit Legende, automatischer Durchlauf und Klick-Interaktion
- **Single-Segment** (ein Datenpunkt): Einzelner Bogen mit Prozentwert in der Mitte (z. B. für individuelle Schüler-Scores)

## Verwendung

```vue
<!-- Multi-Segment -->
<DonutD3 :data="segments" />

<!-- Single-Segment (Prozentwert 0–100) -->
<DonutD3 :data="[{ id: 'score', labelShort: 'Ergebnis', labelLong: 'Erreichte Punktzahl', value: 72, color: 'var(--color-primary)' }]" :show-legend="false" />
```

## Daten-Prop (`DonutD3DataElement[]`)

| Feld          | Typ       | Beschreibung                                                           |
|---------------|-----------|------------------------------------------------------------------------|
| `id`          | `string`  | Eindeutiger Bezeichner für das Segment                                 |
| `labelShort`  | `string`  | Kurzbezeichnung in der Legende                                         |
| `labelLong`   | `string`  | Vollständige Bezeichnung im Beschreibungsbereich                       |
| `description` | `string?` | Optionaler Beschreibungstext (wird beim aktiven Segment angezeigt)     |
| `color`       | `string`  | CSS-Farbwert, z. B. `'var(--color-competence-level-3)'`                |
| `value`       | `number`  | Anteil (relativ im Multi-Modus, Prozentwert 0–100 im Single-Modus)     |

## Weitere Props (Konfiguration)

| Prop         | Typ      | Standard | Beschreibung                   |
|--------------|----------|----------|--------------------------------|
| `width`      | `number` | `300`    | SVG-Breite in Pixel            |
| `height`     | `number` | `300`    | SVG-Höhe in Pixel              |
| `showLegend` | `boolean`| `true`   | Legende links anzeigen         |
| `fontSize`   | `string` | `'56px'` | Schriftgröße des Mittelwerts   |
| `bgBarColor` | `string` | `'#EFF0F6'` | Hintergrundfarbe im Single-Modus |

## Mock-Daten

```typescript
import { mockDonutD3Data } from '@/components/charts/donutD3'
```

## Abhängigkeiten

- `d3` – Visualisierungsbibliothek
