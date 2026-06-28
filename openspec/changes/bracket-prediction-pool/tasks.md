## 1. Setup del proyecto y dependencias

- [ ] 1.1 Agregar `@supabase/supabase-js`, `@supabase/ssr` y `zod` a las dependencias (pnpm)
- [ ] 1.2 Definir variables de entorno en `.env` y `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `ADMIN_EMAIL`
- [ ] 1.3 Crear la estructura de carpetas según el design (`lib/`, `actions/`, `components/`, `supabase/migrations/`) manteniendo la separación de responsabilidades

## 2. Esquema y seguridad en Supabase (vía MCP)

- [ ] 2.1 Crear enums (`round`, `phase_status`, `source_type`) y la tabla `profiles` con `display_name` e `is_admin`, más un trigger que auto-crea el perfil al insertar en `auth.users` (toma `display_name` del metadata del signup; admin si email == `ADMIN_EMAIL`)
- [ ] 2.2 Crear `teams` y `tournament_matches` (códigos P73–P104, ronda, slot_order, match_date; feeders por slot `home_source_match_id`/`home_source_type` y `away_source_match_id`/`away_source_type` con enum `source_type` = `winner`/`loser`; en r32 `home_team_id`/`away_team_id`). El 3er lugar usa `loser` de ambas semis; la final usa `winner`
- [ ] 2.3 Crear `match_phase` (por ronda: `opens_at`, `closes_at`, `manual_override`), `app_settings` singleton (`initial_opens_at`, `initial_deadline`, `initial_override`) y `official_results`
- [ ] 2.3b Crear la función SQL `effective_status(opens_at, closes_at, override)` y las RPC de visibilidad de pares `get_peer_initial()` y `get_peer_round_scores(round)` (SECURITY DEFINER, gate por el envío del usuario actual, sin emails)
- [ ] 2.4 Crear `predictions` (única por usuario, is_confirmed, total_points), `prediction_picks` (pronóstico de equipo + marcadores + puntos, única por predicción+partido) y `prediction_phase_submissions` (prediction_id, round, submitted_at; única por predicción+ronda) para marcar fases enviadas/inmutables
- [ ] 2.5 Habilitar RLS y agregar políticas: lectura para autenticados de datos de referencia, escritura solo admin (incl. `match_phase`/`app_settings`), predicciones por usuario, denegar lectura directa de picks ajenas, inmutabilidad tras confirmar, fuera de fase efectiva-open, y rechazar `update` de picks de una ronda que ya tenga submission (trigger/policy)
- [ ] 2.6 Crear la vista `ranking` (display_name + total_points, sin emails) y la función SQL `recompute_scores(match_id)` (actualización transaccional de picks.points y predictions.total_points)
- [ ] 2.7 Datos seed: equipos de 16avos, todos los partidos con sus feeders y `source_type` (3er lugar = `loser` de semis, final = `winner`), filas de `match_phase` (r32 open, resto null), valores por defecto de `app_settings`
- [ ] 2.8 Guardar todo el DDL/seed como SQL reversible en `supabase/migrations/`

## 3. Clientes Supabase y base de autenticación

- [ ] 3.1 Implementar las factorías `lib/supabase/server.ts`, `client.ts`, `proxy.ts` (cookies vía `await cookies()`)
- [ ] 3.2 Implementar `lib/auth/dal.ts`: `verifySession()` y `getCurrentProfile()` memoizados con React `cache`, más `requireAdmin()`
- [ ] 3.3 Implementar `proxy.ts` (Proxy) para refrescar la sesión y redirigir: no-auth → `/login` en rutas protegidas, auth → `/bracket` en rutas de auth; el matcher excluye assets estáticos

## 4. UI y acciones de autenticación

- [ ] 4.1 Definir esquemas zod en `lib/domain/validation.ts` para registro (email, password, display_name no vacío) y login
- [ ] 4.2 Implementar `lib/auth/actions.ts`: Server Actions `signup` (pasa `display_name` en el metadata del usuario), `login`, `logout` con forma compatible con `useActionState` (devolver errores por campo)
- [ ] 4.3 Construir las páginas `(auth)/register` (con campo nombre visible) y `(auth)/login` (RSC) con formularios client usando `useActionState`, reutilizando primitivos de `components/ui`
- [ ] 4.4 Verificar redirecciones: auth exitosa → `/bracket`; logout → `/login`; email duplicado y credenciales incorrectas muestran errores

## 5. Lógica de dominio (pura, reutilizable)

- [ ] 5.1 Implementar `lib/domain/rounds.ts` (orden/etiquetas de rondas) y `lib/domain/bracket.ts` (cascada por feeder + `source_type`: `winner` usa el equipo que avanza del feeder, `loser` usa el otro participante; puebla el 3er lugar con los perdedores de semis)
- [ ] 5.2 Implementar `lib/domain/scoring.ts` `scoreMatch(pick, official)` posicional sobre marcador a 90' (independiente de equipos): exacto = 3, solo resultado (signo home-away) = 1, incorrecto = 0 (no acumulable, máx. 3); no usa `advancing_team_id`
- [ ] 5.3 Implementar `lib/domain/phase.ts` `effectiveStatus(opens_at, closes_at, override, now)` reflejando la función SQL (para UI/preview)
- [ ] 5.4 Implementar helpers de validación para completitud del envío inicial, gate de fecha límite inicial, completitud por fase (todos los marcadores de la ronda) y bloqueo por confirmación/estado efectivo/submission de fase — compartidos por UI y actions

## 6. Capa de acceso a datos

- [ ] 6.1 Implementar `lib/data/matches.ts` (estructura del cuadro + estados efectivos de fase) y `lib/data/results.ts`
- [ ] 6.2 Implementar `lib/data/predictions.ts` (obtener/crear predicción + picks del usuario, acotado al usuario actual)
- [ ] 6.3 Implementar `lib/data/ranking.ts` (leer la vista `ranking` ordenada desc)
- [ ] 6.4 Implementar `lib/data/settings.ts` (leer/escribir `app_settings` + ventanas de `match_phase`) y `lib/data/peers.ts` (llamar a las RPC de visibilidad)

## 7. UI del cuadro (RSC-first, responsive)

- [ ] 7.1 Construir `components/bracket/{TeamSlot, MatchCard, ScoreInput}` reutilizables (estados solo-lectura y editable, bloqueado/deshabilitado con indicador de candado)
- [ ] 7.2 Construir el layout de escritorio multi-columna `BracketView` (lg+) acorde a la imagen de referencia
- [ ] 7.3 Construir `PhaseTabs` mobile-first de una ronda a la vez (Android), reutilizando el mismo `MatchCard`
- [ ] 7.4 Construir la página `(app)/bracket` (RSC): cargar predicción del usuario + partidos + estado de fase, renderizando editable/bloqueado según corresponda

## 8. Server Actions de pronóstico

- [ ] 8.1 Implementar `actions/predictions.ts` `submitInitialPrediction`: chequeo de auth, gate sobre la ventana inicial (efectivamente abierta), validar todas las picks de equipo de todas las rondas (incluido el ganador del 3er lugar derivado de los perdedores de semis) + marcadores de 16avos completos, persistir, setear `is_confirmed`, rechazar incompleto/sin confirmar/después de la fecha límite
- [ ] 8.2 Forzar una-predicción-por-usuario y rechazar toda edición de pick de equipo tras la confirmación
- [ ] 8.3 Implementar la action `submitRoundScores`: permitida solo si el estado efectivo de la ronda es `open` y el usuario aún no la envió; validar que todos sus marcadores de la ronda estén completos, persistir, insertar fila en `prediction_phase_submissions` (envío definitivo) y rechazar ediciones posteriores
- [ ] 8.4 Cablear las actions con la UI usando `useActionState`, paso de confirmación y `revalidatePath`/`refresh` tras el éxito

## 9. Admin: gestión de fases y resultados oficiales

- [ ] 9.1 Construir la página `admin/` protegida con `requireAdmin()` (redirigir a no-admins)
- [ ] 9.2 Implementar `actions/admin.ts` `setPhaseWindow` (opens_at/closes_at) y `setManualOverride` (open/closed/limpiar) para fases y para la ventana inicial, con autorización de admin
- [ ] 9.3 Implementar la action `recordOfficialResult` (marcador + equipo que avanza) con autorización de admin, luego llamar a la RPC `recompute_scores`
- [ ] 9.4 Construir la UI de admin: `PhaseWindowForm` con campos de fecha/hora + override por ronda y para la fecha límite inicial, más formularios de resultado por partido, reutilizando componentes de bracket/ui

## 10. Ranking

- [ ] 10.1 Construir la página `(app)/ranking` (RSC) listando a todos los usuarios por puntaje total desc
- [ ] 10.2 Verificar que el ranking se actualiza tras que el admin registre/actualice resultados

## 11. Visibilidad de pares

- [ ] 11.1 Construir la página `(app)/players` (RSC): consumir `get_peer_initial`/`get_peer_round_scores` vía `lib/data/peers.ts`, gateada por el envío del observador (is_confirmed / submission de fase)
- [ ] 11.2 Reutilizar `BracketView`/`MatchCard` para renderizar el pronóstico de un par seleccionado en solo-lectura dentro del alcance desbloqueado
- [ ] 11.3 Ocultar/bloquear en la UI las fases aún no desbloqueadas y asegurar que la RPC del servidor también las deniega (sin fuga por request directo)

## 12. Verificación

- [ ] 12.1 Registro con nombre visible → el ranking y la vista de pares muestran ese nombre (nunca el email)
- [ ] 12.2 Flujo manual: registrarse → completar el cuadro completo (incl. ganador del 3er lugar) + marcadores de 16avos → confirmar (bloqueado); confirmar que las ediciones de equipo se rechazan
- [ ] 12.3 3er lugar: los participantes del partido por el 3er puesto son los semifinalistas que el usuario marcó como perdedores; cambiar un ganador de semis (antes de confirmar) actualiza ese participante
- [ ] 12.4 Gate de fecha límite inicial: tras la `initial_deadline` (sin override) un usuario nuevo no puede crear predicción (cuadro solo-lectura); el override la reabre
- [ ] 12.5 Ventanas de fase: una ronda abre/cierra según la fecha/hora configurada; el override del admin fuerza abierto/cerrado y limpiarlo vuelve al modo por tiempo
- [ ] 12.6 Visibilidad: antes de confirmar el inicial, sin datos de pares; tras confirmar, ver equipos + 16avos de los pares; octavos de pares ocultos hasta que el observador envíe sus propios octavos; pares que no enviaron se muestran como "no enviado"
- [ ] 12.7 El admin desbloquea octavos → el usuario envía marcadores de octavos → el admin registra resultados a 90' → los puntos y el ranking se actualizan según las reglas posicionales (exacto=3, solo resultado=1, incorrecto=0), incluso con equipos pronosticados eliminados
- [ ] 12.8 Inmutabilidad por fase: tras enviar una ronda, intentar reeditar sus marcadores (UI y POST directo) es rechazado aunque la fase siga abierta
- [ ] 12.9 Chequeo responsive en viewport Android (PhaseTabs) y cuadro de escritorio; `pnpm lint` y `pnpm build` pasan
