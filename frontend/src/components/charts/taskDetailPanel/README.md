# TaskDetailPanel

Aufklappbares Detail-Panel einer Aufgabe. Zeigt die richtige Lösung, Teilaufgabenmerkmale (Kompetenzstufe, Bildungsstandard, Anforderungsbereich) sowie Aufgaben- und Stimulus-Bilder mit Vollbild-Modal.

## Verwendung

```vue
<TaskDetailPanel
    iqb-id="iDL001A01"
    task-number="1.1"
    name="Sportunterricht"
    :is-expanded="isExpanded"
    competence-level-roman="III"
    comp-lvl-subtitle="Regelstandard"
    comp-lvl-description="..."
    :competence-id="{ name: '...', nameShort: 'L3', description: '...' }"
    :cognitive-demand-level="{ name: '...', nameShort: 'I', description: '...' }"
/>
```

## Props (`TaskDetailPanelProps`)

| Prop                    | Typ       | Beschreibung                                              |
|-------------------------|-----------|-----------------------------------------------------------|
| `iqbId`                 | `string`  | IQB-Aufgaben-ID (wird für Bildpfade verwendet)            |
| `taskNumber`            | `string`  | Aufgabennummer, z. B. `"1.1"`                             |
| `name`                  | `string`  | Aufgabenname                                              |
| `isExpanded`            | `boolean?`| Ob das Panel sichtbar ist (Standard: `false`)             |
| `competenceLevelRoman`  | `string?` | Kompetenzstufe als römische Ziffer, z. B. `"III"`         |
| `compLvlSubtitle`       | `string?` | Kurztitel der Kompetenzstufe, z. B. `"Regelstandard"`     |
| `compLvlDescription`    | `string?` | Beschreibung der Kompetenzstufe                           |
| `competenceId`          | `object?` | Bildungsstandard mit `name`, `nameShort`, `description`   |
| `cognitiveDemandLevel`  | `object?` | Anforderungsbereich mit `name`, `nameShort`, `description`|

## Mock-Daten

```typescript
import { mockTaskDetailPanelProps } from '@/components/charts/taskDetailPanel'
```

## Abhängigkeiten

- `BaseModal` – Vollbild-Bildansicht
- `useDidacticalComment` – lädt didaktische Kommentare und korrekte Lösungen
- Aufgabenbilder unter `assets/images/item-images/2026/dk8/*.webp`
