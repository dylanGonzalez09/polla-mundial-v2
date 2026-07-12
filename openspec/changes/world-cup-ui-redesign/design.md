# Design — World Cup UI Redesign

## Context

La app es Next.js 16 + Tailwind 4 + React Flow (`@xyflow/react`) + Supabase. Todo el color vive en variables CSS (`app/globals.css`) y casi todas las pantallas se componen de dos primitivas (`Surface`, `Button`), lo que hace el re-theming barato. El look actual es "editorial crema/verde" con serif — tranquilo y genérico. El header es una card con navegación pill; no existe identidad por equipo (solo nombre en texto), ni progresión del jugador, ni jerarquía en el ranking (lista plana). El admin renderiza ~64 formularios de partido en una grilla única.

`Team.code` ya existe en el dominio (código de 3 letras estilo FIFA), lo que habilita banderas sin cambios de datos.

## Goals / Non-Goals

**Goals:**

- Identidad visual "Mundial 2026 vibrante": tricolor con roles semánticos, tipografía display, banderas.
- Remodelación estructural del layout: sidebar desktop / bottom tabs móvil, heros por página — que NO se vea como la app actual con otros colores.
- Gamificación: ligas por puntos totales con insignias progresivas (estilo Clash of Clans).
- Ranking con podio-escalera (top 3, empates agrupados) + emojis por posición.
- Admin navegable sin scroll infinito.

**Non-Goals:**

- Cambiar lógica de dominio (scoring, cascada del bracket, validación de ventanas) — intocable.
- Cambiar el grafo/layout de React Flow (posiciones, edges, zoom) — solo se restylean nodos y fondo.
- Persistir la liga en base de datos — se deriva de puntos en tiempo de render.
- Tema oscuro/claro conmutables — un solo tema.
- Nuevas dependencias de npm.

## Decisions

### D1 — Tokens con rol semántico; datos sobre superficies neutras

Se reemplazan los 9 tokens actuales por un sistema donde cada color del tricolor tiene un rol fijo:

```css
--background: #FAFAF7;     /* fondo general */
--surface: #FFFFFF;        /* cards y slots — donde viven banderas y datos */
--surface-soft: #F1F2EE;
--ink: #111318;
--muted-ink: #5A616E;
--line: #E3E5E0;
--primary: #00A859;        /* verde: acciones, aciertos, "abierta" */
--primary-strong: #008144;
--live: #E0102F;           /* rojo: resultado oficial, "avanzó", errores */
--info: #0047BB;           /* azul: navegación activa, información, ventanas */
--gold: #F5B301;           /* puntos, podio, ligas altas, confirmar cuadro */
--danger: var(--live);     /* alias para compatibilidad con componentes existentes */
```

**Regla de oro**: gradientes tricolor solo en zonas decorativas (sidebar, heros, franjas); nunca dentro de un match card o team slot. La bandera debe ser siempre lo más colorido de su card.

*Alternativa considerada*: paleta libre por pantalla — descartada porque el tricolor competiría con las banderas y rompería consistencia.

Se conserva el alias `--accent` → `--primary` durante la migración para no romper componentes aún no migrados (se elimina al final).

### D2 — Tipografía: display condensada + números tabulares

- **Display**: `Archivo Black` (via `next/font/google`, igual que las fuentes actuales) para títulos de página, nombres de ronda y puntos. Reemplaza al serif (`--font-source-serif` se elimina).
- **Body**: se conserva Bricolage Grotesque.
- **Marcadores**: `font-variant-numeric: tabular-nums` en scores y puntos, tamaño grande.

Token nuevo: `--font-display`. El cambio tipográfico es el 50% del cambio de percepción.

### D3 — Banderas via emoji derivado de `Team.code`, con mapa de códigos FIFA→ISO

Componente `Flag` (`components/ui/flag.tsx`) que convierte código ISO-3166 alpha-2 a emoji flag (offset de code points regionales). Como `Team.code` es FIFA de 3 letras (ARG, BRA, USA...), se incluye un mapa estático FIFA→ISO2 en `lib/domain/flags.ts` con las ~48 selecciones del Mundial 2026. Fallback: círculo con las 3 letras del código si no hay mapeo.

*Alternativa considerada*: SVGs locales en `public/flags/` — más fieles pero requiere descargar/mantener 48 assets; emoji rinde bien, pesa cero y degrada aceptablemente en Windows (Segoe UI Emoji). Si luego se quiere fidelidad, el componente `Flag` es el único punto de cambio.

### D4 — Layout estilo app de juego: sidebar + bottom tabs, sin header-card

`AppShell` se reescribe:

- **Desktop (lg+)**: sidebar fija izquierda (~260px) con: insignia de liga + nombre del jugador + puntos totales arriba; navegación vertical (Bracket, Jugadores, Ranking, Admin si aplica) con ítem activo en `--info`; "Salir" abajo. Contenido a la derecha con `max-w` propio.
- **Móvil**: barra superior mínima (marca + insignia + puntos) y bottom tabs fijos con iconos (emoji/SVG inline) para las mismas rutas.
- **Heros por página**: cada página abre con título display gigante sobre franja con gradiente tricolor + patrón geométrico sutil (CSS puro: `linear-gradient` + `background-image` con triángulos en `conic-gradient`/SVG data-URI).

Implicación: `AppShell` necesita los puntos totales y liga del jugador → el layout `(app)/layout.tsx` pasa a obtener el total de puntos del perfil desde `lib/data/ranking` (consulta existente, sin cambios de esquema). El ítem activo de navegación requiere `usePathname` → la navegación se extrae a un client component (`components/nav.tsx`); `AppShell` sigue siendo server component.

*Alternativa considerada*: top nav renovada — descartada por el usuario; quiere remodelación estructural.

### D5 — Ligas derivadas de puntos, sin persistencia

`lib/domain/leagues.ts` — función pura `getLeague(totalPoints)` con umbrales:

| Liga | Puntos | Estética de insignia |
|---|---|---|
| Bronce | 0–9 | escudo simple cobre |
| Plata | 10–24 | escudo plata con borde |
| Oro | 25–44 | escudo dorado con laureles |
| Diamante | 45–69 | escudo azul-diamante con gemas |
| Leyenda | 70+ | escudo dorado+rojo con corona y brillo |

(Umbrales calibrados al scoring actual: máx. teórico ≈ 4 pts × 32 partidos R32 + rondas siguientes; se ajustan en un solo archivo si el torneo avanza distinto.)

`LeagueBadge` (`components/ui/league-badge.tsx`): SVG inline por liga (escudo con marco progresivamente más ornamentado), tamaños `sm` (ranking/jugadores) y `lg` (sidebar). Sin persistencia: la liga se calcula donde ya hay puntos (sidebar, ranking, jugadores).

*Alternativa considerada*: columna `league` en DB — innecesaria, es función pura de puntos; evita migraciones y desincronización.

### D6 — Podio-escalera con agrupación de empates

`components/ranking/podium.tsx`. Algoritmo:

1. Ordenar por puntos desc; agrupar por puntos iguales → grupos con ranking denso (grupo 1 = máximo puntaje).
2. Los **3 primeros grupos** (no personas) ocupan los escalones: centro-alto = grupo 1, izquierda-medio = grupo 2, derecha-bajo = grupo 3. Un escalón muestra a todos los empatados de su grupo (avatares/nombres apilados).
3. El resto se lista debajo en tabla completa — **todos** los jugadores aparecen también en la tabla (el podio es un resumen visual, la tabla es la fuente completa; evita ambigüedad de "¿en qué puesto voy?").
4. Fila propia resaltada con borde `--info`.

Emojis por posición (mapa en el mismo módulo): escalón 1 `🏆😎`, escalón 2 `🥈🔥`, escalón 3 `🥉💪`; resto rotando graciosos por tramo de tabla (`😅`, `🫠`, `🤡`, `🐢`) y último lugar `💀`. Los empatados comparten emoji de su escalón.

### D7 — Match cards estilo "score bug" y canvas oscuro

- `MatchCard` se reorganiza: fila por equipo `[bandera] [código 3 letras] [nombre] [marcador]`, marcador tabular grande a la derecha; seleccionado = borde `--primary` grueso + fondo verde 8%. El bloque "Resultado oficial" pasa a islote oscuro (`--ink`) con números en `--gold`, estilo tablero electrónico. Los badges de puntos (+4/+3/+2/+1/0) se mantienen con la misma lógica, restyleados como medallas.
- Canvas del bracket: gradiente profundo azul→verde (`#0B1F4B → #0B3D2E`) con patrón geométrico sutil; cards blancas con sombra fuerte encima.
- React Flow: cero cambios en nodos/edges/posiciones como estructura; solo estilos. Opcional (última tarea, prescindible): edges en `--primary` cuando el pick del partido origen está completo.

### D8 — Admin: tabs por ronda + colapso de registrados

- Tabs sticky por ronda (16avos, 8vos, Cuartos, Semis, Final, 3er puesto) — se renderiza solo la ronda activa (estado client, componente `admin-match-browser.tsx`).
- Dentro de la ronda: partidos con resultado oficial ya registrado se muestran colapsados (una línea: código, equipos con banderas, marcador, "editar" para expandir). Pendientes se muestran expandidos.
- Contador por tab: "Cuartos · 2 pendientes".
- Esto elimina el scroll infinito sin virtualización ni paginación (máx. 32 forms por tab, la mayoría colapsados).

*Alternativa considerada*: búsqueda por texto — se pospone; con tabs + colapso el problema real (encontrar el partido a editar) queda resuelto.

### D9 — Auth con hero de identidad

Layout `(auth)`: fondo con "26" gigante en tipografía display como marca de agua en gradiente tricolor, card de formulario blanca centrada. `AuthForm` solo se restylea (misma lógica de actions).

## Risks / Trade-offs

- [Regresión visual en React Flow al restylear nodos] → Los nodos ya renderizan `MatchCard`; se cambia solo el interior de la card, no dimensiones drásticas. Verificar overlaps con zoom/fit-view tras el cambio.
- [Emoji flags se ven planas/inconsistentes en Windows] → Aceptado como trade-off (cero assets); `Flag` es el único punto de cambio si se migra a SVG.
- [Tricolor compite con banderas] → Regla de oro D1: datos sobre superficies neutras, tricolor solo decorativo.
- [Umbrales de liga mal calibrados (todos en Bronce o todos en Leyenda)] → Umbrales centralizados en `lib/domain/leagues.ts`, ajustables en un commit; calibrar contra el ranking real actual durante implementación.
- [Sidebar necesita puntos del jugador → consulta extra por página] → Reusar `getRanking()`/consulta de puntos existente; es una lectura ligera y las páginas ya consultan datos por request.
- [Alias `--accent` olvidado] → Última tarea: grep de `--accent` y eliminación del alias.
- [`AppShell` reescrito rompe el tour de onboarding (`data-tour`)] → Conservar los atributos `data-tour` existentes en la nueva navegación y verificar `onboarding-tour.tsx`.

## Open Questions

- Iconos de bottom tabs: emoji vs SVG inline — decidir en implementación (empezar con emoji, cambiar si se ve pobre).
- Umbrales exactos de liga: calibrar con los puntos reales del ranking al momento de implementar.
