# Tasks — World Cup UI Redesign

## 1. Fundación: tokens, tipografía y banderas

- [x] 1.1 Reemplazar tokens de color en `app/globals.css` con la paleta Mundial 2026 (D1), manteniendo alias `--accent` → `--primary` temporalmente
- [x] 1.2 Cargar Archivo Black via `next/font/google` en `app/layout.tsx`, exponer `--font-display`, eliminar Source Serif, y definir utilidades de patrón geométrico/gradiente tricolor en `globals.css`
- [x] 1.3 Crear `lib/domain/flags.ts` con mapa FIFA→ISO2 de las 48 selecciones del Mundial 2026 y `components/ui/flag.tsx` (emoji flag + fallback de 3 letras)
- [x] 1.4 Restylear `components/ui/card.tsx` (Surface) y `components/ui/button.tsx` (tones primary/secondary/ghost/danger + nuevo tone `gold`) con el nuevo sistema

## 2. Ligas del jugador

- [x] 2.1 Crear `lib/domain/leagues.ts` con `getLeague(totalPoints)` y umbrales Bronce/Plata/Oro/Diamante/Leyenda, calibrados contra los puntos reales del ranking actual
- [x] 2.2 Crear `components/ui/league-badge.tsx` con SVG inline por liga (marco progresivamente más ornamentado), tamaños `sm` y `lg`

## 3. Layout estilo app de juego

- [x] 3.1 Extraer navegación a client component `components/nav.tsx` con `usePathname` para ítem activo, conservando atributos `data-tour`
- [x] 3.2 Reescribir `components/app-shell.tsx`: sidebar desktop (insignia liga + nombre + puntos + nav vertical + salir) y barra superior + bottom tabs en móvil, con padding inferior para no tapar contenido
- [x] 3.3 Pasar puntos totales del jugador al shell desde `app/(app)/layout.tsx` (reusar consulta de ranking existente)
- [x] 3.4 Crear componente de hero por página (título display sobre franja tricolor con patrón) y aplicarlo en Bracket, Jugadores y Ranking
- [x] 3.5 Verificar que `onboarding-tour.tsx` ancla correctamente en la nueva navegación (desktop y móvil)

## 4. Bracket restyleado

- [x] 4.1 Restylear `components/bracket/team-slot.tsx` como fila score-bug: bandera + código + nombre; seleccionado = borde `--primary` grueso + fondo verde translúcido; placeholder neutro para "Por definir"
- [x] 4.2 Restylear `components/bracket/score-input.tsx` con números tabulares grandes
- [x] 4.3 Reorganizar `components/bracket/match-card.tsx`: filas por equipo con marcador a la derecha, bloque "Resultado oficial" como islote oscuro con números dorados, badges de puntos como medallas (misma lógica de scoring)
- [x] 4.4 Cambiar fondo del canvas del bracket en `bracket-experience.tsx` a gradiente azul→verde con patrón geométrico; verificar pan/zoom/fit-view y que los nodos no se solapen
- [x] 4.5 Restylear las secciones de confirmación inicial y envío por fases de `bracket-experience.tsx` (checklist, badges de estado, botón de confirmar en tone `gold`)

## 5. Ranking con podio

- [x] 5.1 Crear `components/ranking/podium.tsx`: agrupación por puntos (ranking denso), 3 escalones (1° centro-alto, 2° izquierda, 3° derecha), empatados compartiendo escalón, manejo de menos de 3 grupos
- [x] 5.2 Definir mapa de emojis por posición en el mismo módulo (pro para podio, jocosos por tramo, distintivo para el último) con empatados compartiendo emoji
- [x] 5.3 Reescribir `app/(app)/ranking/page.tsx`: hero + podio + tabla completa (todos los jugadores, con posición, insignia de liga, emoji y puntos; fila propia resaltada) — requiere identificar al jugador autenticado en la página
- [x] 5.4 Restylear `app/(app)/players/page.tsx` y `components/players/peer-browser.tsx` con banderas e insignias de liga

## 6. Admin navegable

- [x] 6.1 Crear `components/admin/admin-match-browser.tsx` (client): tabs por ronda con contador de pendientes, render solo de la ronda activa
- [x] 6.2 Agregar modo colapsado a los partidos con resultado registrado (línea resumen con banderas y marcador, expandir para editar); pendientes expandidos
- [x] 6.3 Reorganizar `app/admin/page.tsx`: controles de ventanas arriba, browser de partidos debajo; restylear `phase-window-form.tsx` y `official-result-form.tsx` con el nuevo sistema

## 7. Auth renovado

- [x] 7.1 Crear fondo de identidad en el layout de `(auth)`: marca de agua "26" gigante en gradiente tricolor, card de formulario centrada
- [x] 7.2 Restylear `components/auth/auth-form.tsx` y las páginas login/register/forgot-password/update-password (misma lógica de actions)

## 8. Cierre

- [x] 8.1 Grep de `--accent` y `font-serif` en todo el código; migrar usos restantes y eliminar el alias y la fuente serif
- [x] 8.2 Pasada visual completa: bracket (pan/zoom, picks, marcadores, resultado oficial), ranking (podio con y sin empates), admin (tabs, colapso, ventanas), auth y móvil (bottom tabs, contenido no tapado)
- [x] 8.3 `pnpm lint` y `pnpm build` sin errores
