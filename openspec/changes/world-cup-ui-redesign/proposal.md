# World Cup UI Redesign

## Why

La app funciona bien pero se ve básica y genérica ("revista tranquila"), sin conexión visual con el Mundial 2026 que se está jugando ahora mismo. El usuario quiere una remodelación completa: nueva identidad visual vibrante temática del Mundial, reorganización del layout (no solo colores), gamificación estilo Clash of Clans con ligas por puntos, y un ranking con podio/escalera. Además, la pantalla de admin renderiza ~64 formularios de partidos en una sola grilla, haciendo tedioso encontrar y editar un partido.

## What Changes

- **Nueva identidad visual "Mundial 2026 vibrante"**: reemplazo total de tokens de color (tricolor rojo/verde/azul con roles semánticos + dorado), tipografía display condensada para títulos y números tabulares para marcadores, gradientes decorativos con patrón geométrico.
- **Banderas de equipos**: nuevo componente `Flag` que deriva la bandera desde `Team.code`, visible en slots del bracket, resultados oficiales, ranking y vista de jugadores.
- **Reorganización del layout (estilo app de juego)**: se elimina el header-card actual; sidebar fija en desktop con perfil + liga + puntos + navegación, bottom tabs en móvil, y hero display por página. **BREAKING** (visual): la estructura de `AppShell` cambia por completo.
- **Ligas por puntos (estilo Clash of Clans)**: umbrales de puntos totales definen ligas (Bronce → Plata → Oro → Diamante → Leyenda); cada liga tiene insignia/escudo con marco progresivamente más ornamentado, visible en sidebar/nav, ranking y jugadores.
- **Ranking con podio tipo escalera**: los 3 primeros puestos se muestran en una escalera/podio; jugadores empatados en puntos comparten el mismo escalón; el resto se lista debajo (siempre visible). Emojis jocosos según posición: emojis "pro" para el top 3, emojis graciosos para el resto (incluido último lugar).
- **Restyling de componentes existentes**: Surface, Button, TeamSlot, MatchCard, ScoreInput con el nuevo sistema; canvas del bracket con gradiente profundo y match cards estilo "score bug" de transmisión. La lógica de React Flow y de predicciones NO cambia.
- **Admin sin scroll infinito**: filtros por ronda (tabs), búsqueda/salto rápido al partido, y partidos ya registrados colapsados por defecto. Admin recibe el mismo sistema visual (sin gamificación).
- **Auth renovado**: login/register/forgot con hero de identidad 2026 ("26" gigante como marca de agua).

## Capabilities

### New Capabilities

- `ui-design-system`: identidad visual Mundial 2026 — tokens de color con roles semánticos, tipografía display + tabular, banderas por equipo, estilo de componentes base y canvas del bracket.
- `app-navigation`: layout estilo app de juego — sidebar desktop con perfil/liga/puntos, bottom tabs móvil, heros por página, navegación de auth y admin.
- `player-leagues`: sistema de ligas por umbrales de puntos totales con insignias y marcos progresivos visibles en toda la app.
- `ranking-podium`: podio tipo escalera para el top 3 con agrupación de empates por escalón, lista completa debajo, y emojis por posición.
- `admin-match-navigation`: navegación eficiente del panel admin — filtro por ronda, salto rápido, colapso de partidos registrados.

### Modified Capabilities

<!-- openspec/specs/ está vacío (el cambio anterior nunca se sincronizó); no hay specs principales que modificar. -->

## Impact

- **Código afectado**: `app/globals.css`, `app/layout.tsx` (fuentes), `components/app-shell.tsx` (reescritura), `components/ui/*` (restyling), `components/bracket/*` (restyling, sin cambios de lógica), `app/(app)/ranking/page.tsx` (podio), `app/(app)/players/page.tsx`, `app/(auth)/*`, `app/admin/*` (navegación + restyling), `components/admin/*`.
- **Código NO afectado**: `lib/domain/*` (scoring, bracket, validation), `actions/*`, `lib/data/*` (salvo exponer puntos totales donde haga falta para la liga), esquema de Supabase.
- **Nuevos módulos**: `components/ui/flag.tsx`, `components/ui/league-badge.tsx`, `lib/domain/leagues.ts` (umbrales y mapeo puntos→liga), `components/ranking/podium.tsx`.
- **Assets**: banderas SVG locales en `public/flags/` (derivadas de `Team.code`) o emoji flags; sin dependencias nuevas de npm.
- **Riesgos**: regresión visual en el bracket de React Flow (mitigado: solo se restylean los nodos, no el grafo); legibilidad del tricolor (mitigado: colores con rol semántico, datos siempre sobre superficies neutras).
