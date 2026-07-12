# ranking-podium

## ADDED Requirements

### Requirement: Podio-escalera para los tres primeros grupos
La página de ranking SHALL mostrar un podio tipo escalera donde los escalones corresponden a los tres primeros **grupos de puntaje** (ranking denso): el escalón más alto al centro para el puntaje máximo, el segundo a la izquierda y el tercero a la derecha. Jugadores empatados en puntos SHALL compartir el mismo escalón.

#### Scenario: Sin empates
- **WHEN** los tres puntajes más altos pertenecen a tres jugadores distintos
- **THEN** cada uno ocupa su propio escalón (1° centro, 2° izquierda, 3° derecha)

#### Scenario: Empate en el primer lugar
- **WHEN** dos jugadores comparten el puntaje máximo
- **THEN** ambos aparecen juntos en el escalón más alto, y el siguiente puntaje ocupa el segundo escalón

#### Scenario: Menos de tres grupos
- **WHEN** solo existen uno o dos puntajes distintos entre todos los jugadores
- **THEN** el podio muestra solo los escalones correspondientes sin espacios rotos

### Requirement: Tabla completa siempre visible
Debajo del podio, el ranking SHALL listar a **todos** los jugadores (incluidos los del podio) en una tabla completa con posición, insignia de liga, nombre y puntos. La fila del jugador autenticado SHALL resaltarse.

#### Scenario: Jugador del podio en la tabla
- **WHEN** un jugador aparece en el podio
- **THEN** también aparece en la tabla completa con su posición numérica

#### Scenario: Jugador se localiza a sí mismo
- **WHEN** el jugador autenticado ve el ranking
- **THEN** su fila aparece resaltada con un estilo distintivo

### Requirement: Emojis por posición
El ranking SHALL mostrar un emoji junto a cada jugador según su posición: emojis "pro" para los escalones del podio (ej. 🏆, 🥈, 🥉), emojis jocosos para el resto por tramos de tabla, y un emoji distintivo humorístico para el último lugar. Jugadores empatados SHALL compartir el emoji de su escalón o tramo.

#### Scenario: Emoji del campeón
- **WHEN** un jugador está en el escalón más alto del podio
- **THEN** se muestra el emoji pro del primer lugar junto a su nombre

#### Scenario: Emoji del último lugar
- **WHEN** un jugador está en la última posición (sin empatar con tramos superiores)
- **THEN** se muestra el emoji humorístico del último lugar

#### Scenario: Empatados comparten emoji
- **WHEN** dos jugadores tienen los mismos puntos
- **THEN** ambos muestran el mismo emoji
