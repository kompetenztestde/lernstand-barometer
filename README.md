# TBA3 Rückmeldeportal des Projekt kompetenztest.de im Fach Deutsch 8

[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-yellow.svg)](LICENSE)

Eine Webanwendung zur **Aufbereitung VerA-Ergebnisdaten von Schüler:innen**, um **Unterrichtsentwicklung** zu unterstützen.
Das Projekt besteht aus einem **Vue 3 + Vite Frontend** und einem optionalen **Express.js Backend** für die PDF-Generierung.

---

## Entwicklungsumgebung

### Voraussetzungen

- [Docker](https://www.docker.com/) ≥ 24
- [Node.js](https://nodejs.org/) ≥ 20 (nur für lokale Entwicklung ohne Docker)

### Einrichtung

```bash
cp example.env .env
# .env nach Bedarf anpassen (s. Abschnitt „Umgebungsvariablen")
```

### Starten

```bash
# Development mit Hot Reload
docker compose up
```

-   Frontend → [http://localhost:5173](http://localhost:5173)
-   Backend → [http://localhost:3000](http://localhost:3000)

### Production (exemplarisch)

Das Prod-Deployment ist rein exemplarisch beigefügt und muss an die vorhandene Deployment-Architektur angepasst werden.

Relevante Dateien sind: `nginx.conf`, `Dockerfile`, `build.sh`, `gitlab-ci.yml`

---

## Technologien & Bibliotheken

### Frontend

-   [Vue 3](https://vuejs.org/) – JS-Framework, Composition-API
-   [Vite](https://vitejs.dev/) – Dev-Build-Tool
-   [TailwindCSS](https://tailwindcss.com/) – Utility-first CSS Framework
-   [D3.js](https://d3js.org/) – Datenvisualisierung
-   [VueTippy](https://vue-tippy.netlify.app) – Tooltips
-   [Canvas Confetti](https://www.kirilv.com/canvas-confetti/) - Konfetti Effekt in Schüler:innen-Bereich

### Backend

-   [Express.js](https://expressjs.com/) – minimales Node.js-Webframework
-   [Puppeteer](https://pptr.dev/) – Headless Firefox für PDF-Generierung

---

## Projektstruktur

```
.
├── frontend/   # Vue3 + Vite App
├── backend/    # Express.js PDF-Backend
│   ├── routes/
│   │   └── print.js   # POST /print – PDF-Generierung
│   ├── index.js       # Einstiegspunkt
│   ├── .env           # Umgebungsvariablen (s.u.)
│   └── Dockerfile
├── docker-compose.yml          # Basis (Production)
├── docker-compose.override.yml # Dev (Hot Reload)
```

-   **frontend/** → UI, Visualisierungen, User-Interaktion
-   **backend/** → PDF-Erstellung via Headless Firefox (optional via Umgebungsvariable)

### Frontend-Struktur

```
frontend/src/
├── components/
│   ├── base/          # Grundlegende UI-Bausteine (BaseModal, BaseLoadingBox, …) ohne inhaltlichen TBA3-Bezug
│   └── charts/        # Datenvisualisierungen mit inhaltlichem TBA3-Bezug – siehe unten
├── pages/             # Seitenkomponenten; enthalten Fetch-Logik und übergeben Daten an Charts
├── queries/           # TanStack-Query-Composables und Mapping-Funktionen; sprechen mit der TBA3-Daten-API
├── stores/            # Pinia-Stores
```

### Chart-Struktur

Jede Visualisierung lebt in einem **eigenen Unterordner** unter `frontend/src/components/charts/`:

```
charts/
├── competenceLevelBand/
├── conferenceTaskList/
├── donutD3/
├── scoreBar/
├── studentScoreBar/
├── studentsInCompetenceBoxes/
├── subDomainChart/
├── taskBarChart/
├── taskDetailPanel/
└── taskList/
```

Jeder Ordner folgt demselben Muster:

```
chartName/
├── ChartName.vue   # Reine Darstellungskomponente – kein API-Fetch, nur ein data-Prop
├── types.ts        # TypeScript-Typen für den data-Prop
├── mockData.ts     # Beispieldaten zum Entwickeln und Testen ohne Backend
├── index.ts        # Öffentlicher Einstiegspunkt – exportiert Komponente, Typen und Mock
└── README.md       # Dokumentation: Props, Verwendungsbeispiel, Abhängigkeiten
```

**Kernprinzip:** Charts haben keine eigene Fetch-Logik. Alle benötigten Daten kommen über einen einzigen `data`-Prop herein. Das Fetching, Mapping und die Lade-/Fehlerzustände liegen in der einbindenden Page-Komponente.

```vue
<!-- In einer Page-Komponente -->
<TaskList :data="taskListData" />

<!-- Für Entwicklung ohne Backend -->
import { TaskList, mockTaskListData } from '@/components/charts/taskList'
```

Diese Trennung macht die Charts **unabhängig vom Backend** und damit einfach wiederverwendbar, isoliert testbar und für Außenstehende ohne Projektkontext verständlich.

---

## PDF-Generierung

Das Backend stellt einen einzigen Endpunkt zur Verfügung, der eine Seite der Frontend-App mit einem headless Firefox-Browser öffnet und als A4-PDF zurückliefert.

### Funktionsweise

1. Das Frontend sendet per `POST /api/print` (Vite-Proxy → `POST /print` am Backend) einen Request mit Auth-Daten und der gewünschten Seite.
2. Das Backend startet einen Headless-Firefox-Tab via Puppeteer.
3. Vor dem Seitenaufruf werden Auth-Token, Rolle und ggf. Klassen-ID und Schüler:innen-Code per `evaluateOnNewDocument` in den `localStorage` injiziert – so verhält sich der Tab wie ein eingeloggter Nutzer.
4. Das Backend wartet, bis alle Lade-Spinner (`[role="status"]`) verschwunden sind (max. 30 Sekunden).
5. Die Seite wird als A4-PDF gerendert und als Datei-Download zurückgeliefert.

### Unterstützte Seiten

| `page`-Wert       | Seite                  | Benötigt `groupId` | Benötigt `studentCode` |
|-------------------|------------------------|:------------------:|:----------------------:|
| `result-tests`    | Fachbericht            | ✓                  |                        |
| `result-groups`   | Klassenbericht         | ✓                  |                        |
| `conference`      | Fachkonferenz          |                    |                        |
| `self-evaluation` | Selbsteinschätzung     | ✓                  | ✓                      |

### Request-Format

```http
POST /print
Content-Type: application/json

{
  "page": "result-tests",
  "token": "<auth-token>",
  "role": "teacher",
  "expiresAt": 1234567890,
  "groupId": 42,
  "studentCode": null
}
```

### Umgebungsvariablen (backend/.env)

| Variable                    | Standardwert              | Beschreibung                                             |
|-----------------------------|---------------------------|----------------------------------------------------------|
| `PORT`                      | `3000`                    | Port des Express-Servers                                 |
| `FRONTEND_URL`              | `http://localhost:5173`   | URL, die Puppeteer aufruft                               |
| `PUPPETEER_EXECUTABLE_PATH` | _(leer)_                  | Pfad zum Firefox-Binary; wird im Docker-Image gesetzt    |

### Feature-Flag im Frontend

Die PDF-Funktion kann im Frontend deaktiviert werden, ohne das Backend zu stoppen. Dazu in `frontend/.env` setzen:

```env
VITE_PDF_ENABLED=false
```

Ist das Flag `false` oder nicht gesetzt, werden alle PDF-Buttons und die Seite „Berichte downloaden" ausgeblendet.

### Firefox-Abhängigkeit

Das Backend setzt **Firefox** (Open-Source-Anforderung) statt Chromium ein. Im Docker-Image wird `firefox-esr` via `apt` installiert und der Pfad über `PUPPETEER_EXECUTABLE_PATH` übergeben. Lokal kann Puppeteer auch einen selbst verwalteten Firefox nutzen – dazu `PUPPETEER_SKIP_DOWNLOAD=false` setzen und `npx puppeteer browsers install firefox` ausführen.

## Aufgabenbilder komprimieren

Aufgabenbilder werden in zwei Ordnern verwaltet:

- `frontend/src/assets/images/item-images-originals/` – Quell-PNGs, im Repository gespeichert, werden nie verändert
- `frontend/src/assets/images/item-images/` – konvertierte WebP-Dateien, werden von der App verwendet

### Neue Bilder hinzufügen

Neue PNG-Dateien in `item-images-originals/` ablegen und dabei die Ordnerstruktur nach Jahr/Kohorte beibehalten (z.B. `item-images-originals/2026/dk8/`). Danach im `frontend/`-Ordner ausführen:

```sh
npm run compress-images
```

Das Skript konvertiert alle PNGs aus `item-images-originals/`, für die noch kein passendes WebP in `item-images/` existiert. Bereits konvertierte Dateien werden übersprungen.

### Kompressionsqualität ändern

Den Wert `WEBP_QUALITY` am Anfang von `frontend/scripts/compress-images.mjs` anpassen. Beim nächsten Ausführen erkennt das Skript, dass der Wert vom zuletzt gespeicherten Wert in `item-images/.manifest.json` abweicht, löscht alle vorhandenen WebPs und verarbeitet alle Bilder neu.

### Automatische Prüfung vor dem Build

`npm run build` prüft automatisch, ob alle Bilder konvertiert sind. Falls ein PNG in `item-images-originals/` kein WebP-Gegenstück hat – oder sich die Qualitätseinstellung geändert hat – schlägt der Build mit einer entsprechenden Fehlermeldung fehl. Mit `npm run compress-images` lässt sich das beheben.

---

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
