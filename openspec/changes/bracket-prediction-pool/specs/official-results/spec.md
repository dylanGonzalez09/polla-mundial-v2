## ADDED Requirements

### Requirement: El admin registra resultados oficiales
El sistema DEBE (MUST) permitir a un admin registrar, por cada partido del cuadro, el marcador oficial a 90 minutos, que sirve como fuente de verdad para el cálculo de puntajes. Opcionalmente puede registrar el equipo que avanza únicamente para mostrar la progresión oficial del cuadro (no se usa en el puntaje; no se consideran penales).

#### Scenario: Registrar un resultado
- **CUANDO** un admin envía el marcador oficial a 90 minutos de un partido respetando el lado del feeder (home = slot del feeder de menor orden)
- **ENTONCES** el sistema persiste el resultado oficial de ese partido con esa orientación de lado

#### Scenario: Actualizar un resultado
- **CUANDO** un admin edita un resultado oficial ya registrado
- **ENTONCES** el sistema lo actualiza y el resultado almacenado refleja los nuevos valores

#### Scenario: No-admin denegado
- **CUANDO** un no-admin intenta registrar o editar un resultado oficial
- **ENTONCES** el sistema rechaza la acción

### Requirement: Los resultados disparan el cálculo de puntajes
El sistema DEBE (MUST) (re)calcular los puntos de los usuarios afectados cada vez que se registra o actualiza un resultado oficial.

#### Scenario: Puntaje se actualiza al cargar resultado
- **CUANDO** un admin registra o actualiza un resultado oficial de un partido
- **ENTONCES** el sistema recalcula los puntos que cada usuario obtuvo por ese partido y actualiza los totales

### Requirement: Puntaje posicional por marcador a 90'
El sistema DEBE (MUST) calcular el puntaje comparando el marcador a 90 minutos pronosticado por el usuario para cada posición de partido contra el marcador oficial a 90 minutos de esa posición, de forma independiente de qué equipos ocupen realmente la posición.

#### Scenario: Cuadro divergente puntuado por marcador
- **CUANDO** los equipos pronosticados por un usuario para un partido de ronda posterior fueron eliminados antes en la realidad
- **ENTONCES** el sistema igualmente puntúa ese partido comparando el marcador a 90' pronosticado del usuario contra el marcador oficial de esa posición
