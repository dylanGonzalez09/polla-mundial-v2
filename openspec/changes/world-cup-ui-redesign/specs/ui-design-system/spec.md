# ui-design-system

## ADDED Requirements

### Requirement: Tokens de color con rol semántico
El sistema SHALL definir la paleta "Mundial 2026" como variables CSS globales donde cada color tiene un rol fijo: verde (`--primary`) para acciones y aciertos, rojo (`--live`) para resultados oficiales y errores, azul (`--info`) para navegación activa e información, dorado (`--gold`) para puntos y logros. Los gradientes tricolor SHALL usarse solo en zonas decorativas (heros, sidebar, franjas), nunca dentro de componentes de datos (match cards, team slots, filas de ranking).

#### Scenario: Componentes de datos sobre superficie neutra
- **WHEN** se renderiza un match card o team slot
- **THEN** su fondo es una superficie neutra (`--surface`) y el único elemento multicolor es la bandera del equipo

#### Scenario: Acción primaria en verde
- **WHEN** se renderiza un botón de acción primaria (guardar, enviar ronda)
- **THEN** usa el token `--primary` (verde) como fondo

### Requirement: Tipografía display y números tabulares
El sistema SHALL usar una tipografía display condensada pesada para títulos de página, nombres de ronda y cifras de puntos, y SHALL renderizar todos los marcadores y puntos con números tabulares (`tabular-nums`). La tipografía serif actual SHALL eliminarse.

#### Scenario: Título de página en display
- **WHEN** se renderiza el título de cualquier página (Bracket, Ranking, Jugadores, Admin)
- **THEN** usa la fuente display en mayúsculas con tamaño grande

#### Scenario: Marcadores alineados
- **WHEN** se muestran dos marcadores uno debajo del otro (ej. 2-1 y 10-0)
- **THEN** los dígitos quedan alineados verticalmente por usar números tabulares

### Requirement: Banderas de equipo derivadas del código
El sistema SHALL mostrar la bandera de cada equipo derivada de `Team.code` (código FIFA de 3 letras) en team slots del bracket, resultados oficiales, ranking y vista de jugadores. Si el código no tiene mapeo a bandera, el sistema SHALL mostrar un fallback con las 3 letras del código.

#### Scenario: Equipo con código conocido
- **WHEN** se renderiza un team slot para un equipo con código FIFA mapeado (ej. ARG)
- **THEN** se muestra la bandera del país junto al nombre del equipo

#### Scenario: Código sin mapeo
- **WHEN** el código del equipo no existe en el mapa FIFA→ISO
- **THEN** se muestra un distintivo circular con las 3 letras del código en lugar de bandera

#### Scenario: Slot sin equipo definido
- **WHEN** el slot no tiene equipo asignado ("Por definir")
- **THEN** se muestra un placeholder neutro sin bandera

### Requirement: Match card estilo score bug
El match card SHALL organizar cada equipo como una fila `[bandera] [código] [nombre] [marcador]` con el marcador en tipografía tabular grande, y SHALL mostrar el resultado oficial (cuando existe) como un bloque oscuro con números dorados, visualmente diferenciado de la predicción del usuario. La lógica de picks, puntos y estados de bloqueo SHALL permanecer sin cambios.

#### Scenario: Equipo seleccionado como ganador
- **WHEN** el usuario ha elegido un equipo como avanzante
- **THEN** la fila de ese equipo muestra borde verde grueso y fondo verde translúcido

#### Scenario: Resultado oficial visible
- **WHEN** un partido tiene resultado oficial registrado
- **THEN** el card muestra un bloque de fondo oscuro con el marcador oficial en dorado y el badge de puntos obtenidos, sin alterar la predicción mostrada

### Requirement: Canvas del bracket con identidad
El canvas de React Flow SHALL tener fondo con gradiente profundo (azul→verde) y patrón geométrico sutil, con los match cards claros flotando encima. La estructura del grafo (posiciones de nodos, edges, zoom, interacciones) SHALL permanecer sin cambios funcionales.

#### Scenario: Bracket renderizado con nuevo fondo
- **WHEN** se abre la página del bracket
- **THEN** el canvas muestra el gradiente oscuro con patrón y todos los nodos/edges existentes funcionan igual que antes (pan, zoom, selección de equipos, edición de marcadores)
