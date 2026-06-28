## ADDED Requirements

### Requirement: Reglas de puntaje por partido
El sistema DEBE (MUST) otorgar puntos por cada posición de partido combinando dos dimensiones independientes contra el resultado oficial a 90 minutos (solo 90', no penales):

- **Ganador**: el equipo que el usuario pronosticó como clasificado en esa posición coincide con el oficial, aunque el cruce real haya sido distinto.
- **Marcador**: el marcador exacto a 90' pronosticado coincide con el oficial.

La combinación NO es aditiva simple (hay un bono por acertar ambas):

| Ganador | Marcador exacto | Puntos |
|--------|-----------------|--------|
| ✓ | ✓ | **4** |
| ✓ | ✗ | **1** |
| ✗ | ✓ | **2** |
| ✗ | ✗ | **0** |

Nota: como acertar el equipo de un cruce depende de qué equipos llegaron realmente (resultado oficial de las rondas previas), registrar un resultado oficial DEBE recalcular el puntaje de todos los partidos afectados, incluidos los de rondas posteriores. El marcador puntúa por posición aunque los equipos pronosticados para esa posición hayan quedado eliminados en la realidad (caso "solo marcador" = 2).

#### Scenario: Ganador y marcador exacto
- **CUANDO** el usuario acierta el equipo que avanza en esa posición y además el marcador exacto a 90', incluso si el cruce real fue distinto
- **ENTONCES** el sistema otorga 4 puntos por ese partido

#### Scenario: Solo el ganador
- **CUANDO** el usuario acierta el equipo que avanza en esa posición, pero el marcador no es exacto
- **ENTONCES** el sistema otorga 1 punto por ese partido

#### Scenario: Solo el marcador
- **CUANDO** el marcador exacto a 90' coincide con el oficial, pero el equipo que avanza pronosticado no coincide con el oficial
- **ENTONCES** el sistema otorga 2 puntos por ese partido

#### Scenario: Sin aciertos
- **CUANDO** el usuario no acierta ni el ganador ni el marcador exacto
- **ENTONCES** el sistema otorga 0 puntos por ese partido

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
