## ADDED Requirements

### Requirement: Reglas de puntaje por partido
El sistema DEBE (MUST) otorgar puntos por cada posición de partido comparando el marcador a 90 minutos pronosticado por el usuario contra el marcador oficial a 90 minutos de esa posición, independientemente de qué equipos ocupen realmente la posición (solo se consideran los 90', no penales). Las condiciones NO se acumulan, con un máximo de 3 puntos por partido:

- **3 puntos** si se acierta el marcador exacto a 90'.
- **1 punto** si se acierta solo el resultado (local gana, empate, o visitante gana) según el marcador a 90', sin marcador exacto.
- **0 puntos** si el resultado es incorrecto.

Nota: el ganador a 90' es el equipo que avanza, por lo que "acertar el resultado" y "acertar el equipo que avanza" son la misma condición y no se cuentan por separado. El puntaje del marcador se otorga aunque los equipos pronosticados para esa posición hayan quedado eliminados en la realidad.

#### Scenario: Marcador exacto
- **CUANDO** el marcador a 90' pronosticado para una posición es igual al marcador oficial a 90'
- **ENTONCES** el sistema otorga 3 puntos por ese partido

#### Scenario: Resultado correcto pero marcador inexacto
- **CUANDO** el marcador pronosticado no es exacto pero acierta el resultado a 90' (mismo lado ganador, o empate cuando el oficial es empate)
- **ENTONCES** el sistema otorga 1 punto por ese partido

#### Scenario: Resultado incorrecto
- **CUANDO** el marcador pronosticado no acierta el resultado a 90'
- **ENTONCES** el sistema otorga 0 puntos por ese partido

#### Scenario: Marcador puntúa con equipos eliminados
- **CUANDO** los equipos que el usuario pronosticó para una posición de ronda posterior quedaron eliminados en la realidad, pero el marcador pronosticado a 90' coincide (exacto o solo resultado) con el oficial de esa posición
- **ENTONCES** el sistema otorga los puntos del marcador (3 si exacto, 1 si solo resultado) por ese partido

#### Scenario: Solo cuentan partidos puntuados
- **CUANDO** un partido aún no tiene resultado oficial registrado
- **ENTONCES** el sistema otorga 0 puntos por ese partido y lo excluye de los totales hasta que exista un resultado

### Requirement: Ranking global
El sistema DEBE (MUST) proveer un ranking global de todos los usuarios ordenado por puntaje total descendente.

#### Scenario: El ranking refleja los totales
- **CUANDO** un usuario ve el ranking
- **ENTONCES** el sistema lista a todos los usuarios con su puntaje total, ordenados de mayor a menor

#### Scenario: El ranking se actualiza tras puntuar
- **CUANDO** los resultados oficiales cambian el puntaje total de un usuario
- **ENTONCES** el orden del ranking refleja los totales actualizados
