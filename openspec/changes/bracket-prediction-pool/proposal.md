## Why

Queremos una "polla mundialista" donde personas autenticadas pronostiquen el cuadro de eliminatorias (desde 16avos hasta la final y el 3er lugar), compitiendo por puntos en un ranking global. El torneo ya está en fase de eliminación directa, por lo que necesitamos capturar los pronósticos de equipos que avanzan y los marcadores, persistirlos de forma segura en Supabase y calcular puntajes a medida que el admin libera resultados oficiales fase por fase.

## What Changes

- Nuevos usuarios pueden **registrarse e iniciar sesión** con email + contraseña y un **nombre visible** (display name) que se usa en el ranking y en la vista de otros (sin exponer el email) (Supabase Auth).
- Un usuario llena **una sola vez** su cuadro completo: todos los equipos que avanzan (16avos → octavos → 4tos → semis → final) **y** el ganador del **3er lugar** (que se disputa entre los dos semifinalistas que el usuario predijo como perdedores), **y** el marcador de 16avos. Al confirmar, el pronóstico se **bloquea** (los equipos no se pueden editar nunca más).
- Los **marcadores de fases posteriores** (octavos, 4tos, semis, 3er lugar, final) están bloqueados al inicio y se **abren progresivamente**; cuando una fase está abierta, los usuarios cargan los marcadores de sus matchups predichos. **Una vez enviados los marcadores de una fase, quedan inmutables** (no se pueden volver a modificar, aunque la fase siga abierta).
- **Ventanas de tiempo configurables por el admin (fecha y hora) en vez de un simple switch**: el **primer llenado** (todos los equipos + marcador de 16avos) tiene una **fecha límite**; pasado ese momento ya no se puede crear el pronóstico inicial (se asume que empezaron los juegos). Cada **fase** tiene fecha/hora de **apertura y cierre** para cargar sus marcadores. El admin también puede **forzar manualmente** abrir/cerrar (override) al margen del tiempo.
- **Visibilidad incremental de pronósticos ajenos**: un usuario solo ve los datos de una fase de los demás **después de enviar la suya**. Al enviar el inicial ve el bracket completo de equipos + marcadores de 16avos de todos; luego, al enviar sus marcadores de cada fase posterior, se le revelan los marcadores de esa fase del resto. A los pares que aún no enviaron una fase se los lista como "no enviado" (sin revelar sus marcadores). Se valida también la ventana de tiempo.
- El **admin** carga los **resultados oficiales** por partido y configura el estado/ventanas de cada fase mediante una vista de administración.
- El sistema **calcula puntajes por partido de forma posicional sobre el marcador a 90'** (solo 90', no penales), independiente de qué equipos ocupen realmente la posición: **3 pts** por acertar el marcador exacto, **1 pt** por acertar solo el resultado (local gana / empate / visitante gana) sin marcador exacto, **0** si el resultado es incorrecto. **No se acumulan** (máximo 3 por partido). Nota: como el ganador a 90' es el equipo que avanza, "acertar el resultado" y "acertar el equipo que avanza" son lo mismo (no se cuentan por separado). Por eso, aunque los equipos pronosticados queden eliminados, el marcador de cada posición sigue puntuando.
- **Ranking global** que ordena a todos los usuarios por puntaje total.
- Vista de **cuadro tipo bracket** (estilo imagen de referencia), **100% responsive** para Android, construida React Server Components-first con Server Actions para mutaciones.
- Base de datos, RLS, roles y autenticación se aprovisionan en **Supabase vía MCP** (tablas, políticas de seguridad, seed del bracket).

## Capabilities

### New Capabilities
- `authentication`: Registro, inicio de sesión y cierre de sesión con email/contraseña vía Supabase Auth; gestión de sesión en RSC/Server Actions y protección de rutas.
- `bracket-predictions`: Modelo del cuadro de eliminatorias, captura de equipos que avanzan + marcadores, reglas de bloqueo (fecha límite del primer llenado, confirmación inicial irreversible de equipos, marcadores por fase) y persistencia.
- `phase-management`: Estado efectivo de cada fase del torneo derivado de ventanas de tiempo (apertura/cierre por fecha y hora) más override manual del admin, incluyendo la ventana del primer llenado.
- `official-results`: Carga por el admin del marcador oficial (a 90') por partido como fuente de verdad para el puntaje; el equipo que avanza es opcional y solo para mostrar la progresión oficial del cuadro.
- `scoring-and-ranking`: Reglas de puntaje por partido (3 / 1 / 0) y ranking global agregado por usuario.
- `prediction-visibility`: Reglas de visibilidad incremental por fase de los pronósticos de otros usuarios, gateadas por enviar la fase propia (y la ventana de tiempo).
- `admin-management`: Designación de admin por email, configuración de ventanas de tiempo/override por fase, vista de administración y autorización de acciones administrativas.

### Modified Capabilities
<!-- No existen specs previos en openspec/specs/; todo es nuevo. -->

## Impact

- **Nuevas dependencias**: `@supabase/supabase-js` y `@supabase/ssr` para auth/DB en RSC y Server Actions.
- **Supabase (vía MCP)**: nuevas tablas (`profiles`, `teams`, `tournament_matches`, `predictions`, `prediction_picks`, `match_phase` con ventanas de tiempo/override, `app_settings` para la ventana del primer llenado, `official_results`), políticas RLS, RPC `SECURITY DEFINER` para visibilidad de pares y estado efectivo de fase, rol/flag de admin y datos seed del bracket (partidos P73–P104 y equipos de 16avos).
- **Configuración**: variables de entorno de Supabase (`.env`), cliente server/middleware.
- **App Next.js 16 / React 19**: nuevas rutas (auth, cuadro, ranking, admin), Server Actions, componentes de bracket reutilizables y estilos Tailwind v4 responsive.
- **Estructura de carpetas** por responsabilidad (auth, data/db, domain/scoring, components, actions).
