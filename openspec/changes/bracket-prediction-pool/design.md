## Context

Proyecto Next.js **16.2.9** / React **19.2.4** / Tailwind **v4**, App Router, TypeScript. La doc oficial vive en `node_modules/next/dist/docs/` (AGENTS.md exige leerla; tiene breaking changes respecto a versiones previas). Persistencia, auth, roles y RLS se aprovisionan en **Supabase vía MCP**. No hay specs previas (`openspec/specs/` vacío): todo es nuevo.

Notas de la versión relevadas en la doc (vinculan decisiones):

- **Mutaciones** se hacen con Server Functions/Actions (`'use server'`), invocadas desde `<form action={...}>`; estado de envío/errores con `useActionState`. Refresco con `refresh()`/`revalidatePath` de `next/cache`, navegación con `redirect` de `next/navigation`.
- `cookies()` es **async** (`await cookies()`).
- El antiguo _middleware_ ahora es el archivo de convención **`proxy.ts`** (Proxy). Solo se usa para chequeos optimistas (leer sesión de cookie), no para chequeos de DB.
- Patrón recomendado: **DAL** centralizado (`verifySession()` memoizado con `cache`), con autorización dentro de **cada** Server Action (son endpoints públicos vía POST).

## Goals / Non-Goals

**Goals:**

- RSC-first: lectura de datos en Server Components; mutaciones solo vía Server Actions con autorización server-side.
- Reutilización: un único componente de bracket parametrizado por ronda; un set de helpers de dominio (scoring, reglas de bloqueo) compartido entre UI y actions.
- Modelo de datos que separe **pronóstico del usuario** (fijo) de **resultado oficial** (fuente de verdad), permitiendo divergencia.
- Seguridad por RLS en Supabase + autorización en la app (defensa en profundidad).
- Gating por **ventanas de tiempo** (fecha/hora) configurables por admin, con override manual, como fuente única del estado efectivo de cada fase y del primer llenado.
- **Visibilidad incremental por fase** de pronósticos ajenos, gateada por enviar la fase propia, enforzada server-side.
- 100% responsive (mobile-first Android): el bracket de escritorio (columnas) colapsa a navegación por fases en pantallas chicas.
- Separación de responsabilidades por carpetas.

**Non-Goals:**

- Múltiples pollas/ligas privadas (alcance: polla única global).
- OAuth/social login, MFA, recuperación avanzada de contraseña (solo email+password).
- Tiebreakers del ranking, premios, notificaciones, i18n.
- Edición de la estructura del bracket por UI (se siembra vía seed/migración).

## Decisions

### D1. Auth: Supabase Auth (email+password) con `@supabase/ssr`

Usamos `@supabase/supabase-js` + `@supabase/ssr` con tres factorías de cliente: **server** (RSC/actions, lee/escribe cookies via `await cookies()`), **browser** (mínimo, para formularios client) y **proxy** (refresco de sesión). Alternativa descartada: auth casera con Jose/cookies (la doc lo permite pero recomienda librería; Supabase ya da auth+DB+RLS unificados y es requisito del usuario).

### D2. Sesión y protección de rutas: `proxy.ts` (optimista) + DAL (seguro)

`proxy.ts` refresca la sesión Supabase y redirige no autenticados fuera de `/(app)` y `/admin`, y autenticados fuera de `/(auth)`. La autorización real vive en un **DAL** (`lib/auth/dal.ts`) con `verifySession()` y `getCurrentProfile()` memoizados con React `cache`, invocado en cada página protegida y al inicio de cada Server Action. Admin se valida con `requireAdmin()`. Esto sigue la guía: Proxy no es la única línea de defensa.

### D3. Modelo de datos (Supabase / Postgres)

- `profiles` (1–1 con `auth.users`): `id`, `email`, `display_name`, `is_admin`, `created_at`. Trigger `on auth.users insert` crea el profile; `is_admin = true` si email == admin configurado.
- `teams`: `id`, `code` (GER, PAR…), `name`, `flag_emoji`.
- `tournament_matches`: estructura fija del cuadro. `id`, `code` (P73…P104), `round` (enum: `r32`,`r16`,`qf`,`sf`,`third`,`final`), `slot_order`, `match_date`. Cada slot (home/away) se alimenta de un partido feeder con un **tipo de fuente**: `home_source_match_id` + `home_source_type` (enum `winner`/`loser`), `away_source_match_id` + `away_source_type`; en r32 los slots referencian equipos conocidos (`home_team_id`/`away_team_id`, sin feeder). El **partido por el 3er lugar** se modela con ambos slots `source_type = loser` apuntando a las dos semis (los perdedores RU101/RU102), mientras la **final** usa `source_type = winner` de las semis. Esto reemplaza el `advances_to_*` previo (la relación inversa se deriva de los feeders + tipo).
- `match_phase` (config por ronda): `round` (PK), `opens_at timestamptz null`, `closes_at timestamptz null`, `manual_override` (enum `open`/`closed`/null). El **estado efectivo** se deriva (ver D9). Seed: r32 con `opens_at` ya pasado (o override `open`), resto con `opens_at`/`closes_at` null (=`locked`).
- `app_settings` (singleton, `id=1`): `initial_opens_at`, `initial_deadline` (timestamptz), `initial_override` (enum `open`/`closed`/null). Ventana del primer llenado.
- `official_results`: `match_id` (PK→tournament_matches), `home_score`, `away_score` (marcador a 90', fuente de verdad para el puntaje), `advancing_team_id` (opcional, solo para mostrar la progresión oficial del cuadro; NO se usa en el puntaje; no se consideran penales), `updated_at`.
- `predictions`: 1 por usuario. `id`, `user_id` (unique), `is_confirmed`, `confirmed_at`, `total_points`. `is_confirmed` representa el envío inicial (equipos de todas las rondas + marcadores de r32).
- `prediction_picks`: 1 fila por (predicción, match). `prediction_id`, `match_id`, `predicted_advancing_team_id`, `home_score`, `away_score`, `points` (cacheado). Unique (`prediction_id`,`match_id`).
- `prediction_phase_submissions`: registro explícito del envío de una ronda por usuario. `prediction_id`, `round`, `submitted_at`. Unique (`prediction_id`,`round`). Marca una fase como **enviada** (definitiva): habilita el gate de visibilidad de pares y bloquea futuras ediciones de esa ronda. La ronda r32 se considera enviada cuando `predictions.is_confirmed = true`.

Decisión clave: las picks guardan el **equipo predicho por match** (no recalculan cascada), y los scores se llenan por fase. Permite scoring por posición de partido aunque el equipo real difiera. Alternativa descartada: derivar la cascada en tiempo de lectura cada vez (más frágil y costoso).

Cascada de equipos para poblar slots (en `lib/domain/bracket.ts`): cada slot de un partido toma el equipo según su feeder + `source_type`. Para `winner` usa `predicted_advancing_team_id` del feeder; para `loser` usa **el otro participante** del feeder (el que el usuario NO marcó como avanzando). Así el partido por el 3er lugar se puebla con los dos semifinalistas que el usuario predijo como perdedores, y su `predicted_advancing_team_id` es quién gana ese partido (3er puesto). La final usa los ganadores de semis.

### D4. RLS (políticas)

- `profiles`: select propio (y público para ranking de display_name/total via vista); update propio limitado (no `is_admin`).
- `teams`, `tournament_matches`, `match_phase`, `official_results`: `select` para autenticados; `insert/update` solo admin (`is_admin`).
- `predictions`/`prediction_picks`: el usuario solo ve/edita **directamente** lo propio (RLS `user_id = auth.uid()`); **inmutabilidad** de `predicted_advancing_team_id` tras `is_confirmed` y de scores fuera de fase efectiva `open` se refuerza con políticas/trigger además de validación en la action.
- `match_phase` (config) y `app_settings`: `select` para autenticados; `insert/update` solo admin.
- **Visibilidad de pares**: NO se hace con RLS por fila (la condición "el viewer completó su fase X" es difícil de expresar por política). Se sirve mediante RPC `SECURITY DEFINER` (ver D10) que aplican el gate; el `select` directo de `prediction_picks` ajenos queda denegado por RLS.
- Ranking: **vista** `ranking` (o RPC) con `display_name` + `total_points`, legible por autenticados, sin exponer emails.

### D5. Scoring centralizado y determinista

Función pura `scoreMatch(pick, official)` en `lib/domain/scoring.ts` (reutilizada por UI preview y por el recálculo). El puntaje es **posicional sobre el marcador a 90'** (solo 90', no penales), independiente de qué equipos ocupen la posición — compara `(pick.home_score, pick.away_score)` contra `(official.home_score, official.away_score)`:

- `3` si el **marcador exacto** coincide.
- `1` si solo coincide el **resultado** (signo de `home-away`: local gana / empate / visitante gana) sin marcador exacto.
- `0` si el resultado no coincide.
- No acumulable. Resumen: exacto = 3, solo resultado = 1, incorrecto = 0 (máx. 3).

Se elimina el componente separado por "equipo que avanza": como el ganador a 90' es el que avanza, sería redundante; además, esto permite que el marcador puntúe aunque los equipos pronosticados de la posición hayan quedado eliminados. `official.advancing_team_id` no interviene en el puntaje. El recálculo corre en una **RPC/función SQL** (`recompute_scores(match_id)`) disparada por la action de `official_results`, actualizando `prediction_picks.points` y `predictions.total_points` de forma transaccional; así el ranking es una simple lectura ordenada. Alternativa descartada: recomputar todo en JS por request (no escala, condiciones de carrera).

### D6. Reglas de bloqueo

- **Envío inicial**: solo permitido si la ventana inicial está efectivamente abierta (ver D9). Una action valida que TODAS las picks de equipo (todas las rondas) y TODOS los scores de r32 estén completos; setea `is_confirmed=true`. A partir de ahí, equipos inmutables (validación + RLS/trigger). Pasada la `initial_deadline` sin override, nadie puede crear/confirmar el inicial (el bracket se muestra read-only a quien no llenó).
- **Scores por fase**: editar/enviar marcadores de una ronda solo si el **estado efectivo** de su ronda es `open` (ver D9) **y** el usuario aún no envió esa ronda. El admin configura ventanas/override en `/admin`.
- **Envío e inmutabilidad por fase**: la action de enviar una ronda valida que estén completos todos los marcadores de los matchups del usuario en esa ronda, inserta la fila en `prediction_phase_submissions` y, a partir de ahí, los marcadores de esa ronda quedan **inmutables** aunque la fase siga `open`. Se refuerza con validación en la action + RLS/trigger (rechazar `update` de `prediction_picks` cuya ronda ya tenga submission). Resiste POST directo: la action revalida la submission server-side.

### D9. Estado efectivo por tiempo + override (reemplaza el switch)

Una función SQL pura `effective_status(opens_at, closes_at, override)` (y su gemela JS en `lib/domain/phase.ts` para preview/UI) devuelve: `override` si no es null; si no, `locked` cuando `now < opens_at` o `opens_at` es null; `open` cuando `opens_at <= now < closes_at`; `closed` cuando `now >= closes_at`. Se aplica por **fase** (`match_phase`) y a la **ventana inicial** (`app_settings`: `initial_opens_at`/`initial_deadline`/`initial_override`). Granularidad: **una fecha/hora por fase** (no por partido), por decisión del usuario. El estado efectivo se calcula server-side en cada read/mutación; el override del admin tiene precedencia sobre el tiempo.

### D10. Visibilidad incremental por fase (RPC SECURITY DEFINER)

Reglas: un viewer ve datos de la fase X de los demás solo si **envió su propia fase X**. "Enviar inicial" = `predictions.is_confirmed = true` → revela el **bracket de equipos completo + scores de r32** de todos los que ya confirmaron. "Enviar fase posterior X" = existe fila en `prediction_phase_submissions(prediction_id, round=X)` → revela **solo los scores de la ronda X** de los peers que también enviaron esa ronda. Implementación: funciones `SECURITY DEFINER` p. ej. `get_peer_initial()` y `get_peer_round_scores(round)` que (1) verifican el gate del `auth.uid()` actual vía las submissions, (2) devuelven únicamente los datos del scope permitido y solo de peers que enviaron ese scope (los que no, pueden listarse como "no enviado" sin exponer marcadores), (3) nunca exponen emails. La UI consume estas RPC; el `select` directo a tablas ajenas está bloqueado por RLS, así el enforcement es server-side. Alternativa descartada: RLS por fila con subconsultas de completitud (frágil, difícil de auditar y costosa por fila).

### D7. Estructura de carpetas (separación de responsabilidad)

```
app/
  (auth)/login, (auth)/register        # RSC pages + client forms
  (app)/bracket, (app)/ranking          # área autenticada
  (app)/players                         # ver pronósticos de otros (gateado por fase)
  admin/                                # área admin (resultados + ventanas de tiempo)
  layout.tsx, globals.css
lib/
  supabase/{server,client,proxy}.ts    # factorías de cliente
  auth/{dal.ts, actions.ts}            # verifySession/requireAdmin + signup/login/logout
  domain/{rounds.ts, scoring.ts, bracket.ts, phase.ts, validation.ts}  # lógica pura reutilizable (phase.ts = estado efectivo)
  data/{predictions.ts, matches.ts, results.ts, ranking.ts, settings.ts, peers.ts}  # accesos a datos (incl. RPC de visibilidad)
actions/{predictions.ts, admin.ts}     # Server Actions ('use server')
components/bracket/{BracketView, MatchCard, TeamSlot, ScoreInput, PhaseTabs}
components/admin/{PhaseWindowForm, ...} # date/time + override por fase
components/ui/{Button, Field, DateTimeInput, ...}  # primitivos reutilizables
proxy.ts                               # Proxy (sesión + redirects)
supabase/ (migrations/seed SQL aplicadas vía MCP)
```

### D8. UI responsive del bracket

Mobile-first: en móvil se muestra **una ronda a la vez** mediante `PhaseTabs` (r32→final) con scroll vertical de `MatchCard`s; en ≥`lg` se renderiza el layout multi-columna tipo imagen. Un solo `MatchCard`/`TeamSlot` reutilizado en ambos modos. Marcadores bloqueados se muestran deshabilitados con candado; equipos confirmados, read-only.

## Risks / Trade-offs

- **Cascada de equipos vs. realidad** → El puntaje es posicional sobre el marcador a 90' y NO depende de los equipos; un equipo predicho puede estar “eliminado” en la realidad y el marcador de esa posición igual puntúa (1 si acierta resultado / 3 si exacto). Documentarlo en UI para evitar confusión.
- **Convención de lado (home/away) en resultados oficiales** → como el scoring es posicional, el admin DEBE cargar el marcador oficial respetando el lado del feeder (home = slot alimentado por el feeder de menor `slot_order`); de lo contrario un marcador no-empate podría compararse con el lado invertido. Se documenta en la UI de admin y se mantiene consistente con el seed.
- **Doble enforcement (RLS + action)** puede divergir → Centralizar reglas en `lib/domain/validation.ts` y reflejarlas en políticas; tests de la función de scoring y de bloqueo.
- **Inmutabilidad** debe resistir POST directo a la action → toda action revalida `is_confirmed`/estado de fase server-side; no confiar en UI.
- **`@supabase/ssr` + cookies async / Proxy runtime** → seguir factorías oficiales; Proxy solo lectura optimista de sesión (sin llamadas a DB) para no degradar performance.
- **MCP de Supabase** aplica DDL fuera del repo → versionar el SQL en `supabase/migrations` para reproducibilidad y rollback.
- **Recálculo transaccional** ante updates de resultados → hacerlo en RPC SQL idempotente por match para evitar condiciones de carrera.
- **Fugas de visibilidad** (ver el pronóstico ajeno sin haber completado el propio) → servir solo por RPC `SECURITY DEFINER` que validan el gate; mantener `select` directo ajeno bloqueado por RLS; tests de los gates inicial y por fase.
- **Husos horarios** en ventanas de tiempo → almacenar `timestamptz` (UTC) y comparar contra `now()` en el servidor; la UI muestra/edita en hora local.
- **Reloj cliente no confiable** para el gate de tiempo → el estado efectivo se decide siempre server-side (RPC/RSC), nunca con la hora del navegador.

## Migration Plan

1. Instalar deps Supabase; configurar `.env` (URL, anon key, service role solo server, admin email).
2. Vía MCP: crear tablas, enums, `app_settings`, vista de ranking, RLS, triggers, `recompute_scores`, `effective_status` y RPC de visibilidad (`get_peer_initial`, `get_peer_round_scores`); aplicar seed (teams r32, matches P73–P104, `match_phase`, `app_settings`).
3. Implementar factorías de cliente, DAL y `proxy.ts`.
4. Auth (register/login/logout) y guard de rutas.
5. Lectura del bracket (RSC) + componentes reutilizables responsive.
6. Actions de pronóstico (envío inicial con gate de deadline + scores por fase con estado efectivo) con validación/bloqueo.
7. Admin (ventanas de tiempo/override por fase + carga de resultados) → dispara recálculo.
8. Visibilidad de pares (ruta `/players` con gate incremental por fase vía RPC).
9. Ranking (lectura de vista).
   Rollback: las migraciones SQL son reversibles (drop ordenado); el código es aditivo sobre el scaffold Next.

## Open Questions

- ¿Empate a 90' aplica a todas las rondas (con avance por penales) o el dataset siempre tendrá ganador? Se asume que el marcador es a 90' y `advancing_team` lo define el admin.
  R: no se tomara en cuenta los penales, solo los 90'
- ¿El email admin se fija por env var (`ADMIN_EMAIL`) o se promueve manualmente? Se asume `ADMIN_EMAIL` en provisioning.
  R: en var
- ¿Se permite editar scores de r32 antes de confirmar el envío inicial, o quedan fijos al confirmar? Se asume que r32 se fija al confirmar (fase `open` controla solo rondas posteriores).
  R: se quedan fijos
- Granularidad de cierre: **una fecha/hora por fase** (decidido). Cierre por hora de cada partido queda fuera de alcance.
- Control admin: **fecha/hora + override manual** (decidido); el override tiene precedencia sobre el tiempo.
- Visibilidad: **incremental por fase** (decidido); al confirmar el inicial se revela bracket de equipos + r32, y cada fase posterior se revela al completar la propia.
- ¿Mostrar en `/players` a peers que aún no enviaron una fase? **Decidido**: se listan indicando que **no la enviaron** (sin revelar sus marcadores) hasta que la envíen.
