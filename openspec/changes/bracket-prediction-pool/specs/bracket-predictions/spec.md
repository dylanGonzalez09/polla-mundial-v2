## ADDED Requirements

### Requirement: Estructura del cuadro

El sistema DEBE (MUST) modelar el cuadro de eliminación directa como un conjunto fijo de partidos a lo largo de las rondas 16avos (Round-of-32), octavos (Round-of-16), 4tos (cuartos), semis, 3er lugar y final, donde cada partido hace avanzar a un ganador a una posición específica de la ronda siguiente.

#### Scenario: El cuadro está sembrado

- **CUANDO** se inicializan los datos del torneo
- **ENTONCES** el sistema contiene todos los partidos del cuadro con su ronda, posición, fecha programada y relaciones de alimentación de posiciones, y los partidos de 16avos referencian sus equipos conocidos

#### Scenario: Posiciones en cascada

- **CUANDO** un usuario selecciona el equipo que pronostica que avanza de un partido
- **ENTONCES** ese equipo ocupa la posición correspondiente del partido siguiente en la vista del cuadro del usuario

### Requirement: Cuadro del partido por el 3er lugar
El sistema DEBE (MUST) poblar el partido por el 3er lugar con los dos equipos semifinalistas que el usuario pronosticó como perdedores de las semifinales (no los ganadores), y registrar como equipo que avanza del 3er lugar al ganador de ese partido.

#### Scenario: Participantes del 3er lugar derivados de los perdedores de semis
- **CUANDO** un usuario ha pronosticado los ganadores de ambas semifinales
- **ENTONCES** el sistema coloca a los dos semifinalistas no elegidos (perdedores) como participantes del partido por el 3er lugar

#### Scenario: Cambio de pronóstico de semis actualiza el 3er lugar
- **CUANDO** un usuario (antes de confirmar) cambia el ganador pronosticado de una semifinal
- **ENTONCES** el sistema actualiza el participante correspondiente del partido por el 3er lugar con el nuevo perdedor

### Requirement: Envío inicial del pronóstico

El sistema DEBE (MUST) requerir que un usuario, en su único envío inicial, complete cada pronóstico de equipo que avanza para todas las rondas Y los marcadores de 16avos, y DEBE rechazar envíos incompletos.

#### Scenario: Envío completo

- **CUANDO** un usuario ha completado todos los pronósticos de equipos que avanzan para cada ronda y todos los marcadores de 16avos, y confirma
- **ENTONCES** el sistema persiste el pronóstico y marca como bloqueados los pronósticos de equipos

#### Scenario: Envío incompleto rechazado

- **CUANDO** un usuario intenta confirmar con cualquier pronóstico de equipo o cualquier marcador de 16avos faltante
- **ENTONCES** el sistema rechaza el envío e indica qué entradas faltan

#### Scenario: Confirmación requerida

- **CUANDO** un usuario envía sin un paso explícito de confirmación
- **ENTONCES** el sistema no bloquea el pronóstico y primero solicita la confirmación

### Requirement: Pronósticos de equipos inmutables tras confirmar

El sistema DEBE (MUST) impedir cualquier modificación de los pronósticos de equipos que avanzan una vez que el pronóstico del usuario ha sido confirmado, incluso a medida que se desarrollan los resultados reales.

#### Scenario: Edición de equipos bloqueados rechazada

- **CUANDO** un usuario con un pronóstico confirmado intenta cambiar cualquier pronóstico de equipo que avanza
- **ENTONCES** el sistema rechaza el cambio y los pronósticos originales permanecen sin alterar

### Requirement: Carga de marcadores gateada por fase

El sistema DEBE (MUST) permitir a un usuario ingresar y enviar los marcadores de una ronda posterior (octavos, 4tos, semis, 3er lugar, final) solo mientras la fase de esa ronda esté abierta, que el usuario aún no haya enviado esa fase, y solo para los enfrentamientos presentes en el propio cuadro pronosticado de ese usuario.

#### Scenario: Carga de marcador con fase abierta

- **CUANDO** el admin ha dejado la fase de una ronda abierta, el usuario aún no la ha enviado, y envía marcadores para sus enfrentamientos pronosticados en esa ronda
- **ENTONCES** el sistema persiste esos marcadores

#### Scenario: Carga de marcador bloqueada con fase cerrada

- **CUANDO** la fase de una ronda está bloqueada o cerrada y un usuario intenta ingresar marcadores de esa ronda
- **ENTONCES** el sistema rechaza la carga

### Requirement: Envío y bloqueo de marcadores por fase

El sistema DEBE (MUST) requerir que, al enviar una fase, el usuario haya completado los marcadores de todos sus enfrentamientos de esa ronda, y registrar el envío como definitivo. Una vez enviada una fase, sus marcadores quedan inmutables y no pueden volver a modificarse, aun cuando la fase siga abierta.

#### Scenario: Envío de fase incompleto rechazado

- **CUANDO** un usuario intenta enviar una fase con algún marcador de esa ronda faltante
- **ENTONCES** el sistema rechaza el envío e indica qué marcadores faltan

#### Scenario: Envío de fase registrado como definitivo

- **CUANDO** un usuario envía una fase con todos sus marcadores completos
- **ENTONCES** el sistema persiste los marcadores y marca la fase como enviada para ese usuario

#### Scenario: Edición tras envío rechazada

- **CUANDO** un usuario que ya envió una fase intenta modificar cualquier marcador de esa ronda (aunque la fase siga abierta)
- **ENTONCES** el sistema rechaza el cambio y los marcadores enviados permanecen sin alterar

### Requirement: Un pronóstico por usuario

El sistema DEBE (MUST) asociar exactamente un conjunto de pronóstico a cada usuario.

#### Scenario: Único pronóstico forzado

- **CUANDO** un usuario que ya tiene un pronóstico intenta crear otro
- **ENTONCES** el sistema impide crear un segundo pronóstico y lo dirige al existente

### Requirement: Fecha límite del envío inicial

El sistema DEBE (MUST) permitir crear/confirmar el pronóstico inicial solo mientras la ventana del primer llenado configurada por el admin esté abierta (hora actual antes de la fecha límite configurada, o mientras un override manual lo permita), y DEBE rechazar envíos iniciales después de ese momento.

#### Scenario: Envío antes de la fecha límite

- **CUANDO** un usuario confirma un pronóstico inicial completo antes de la fecha límite del primer llenado
- **ENTONCES** el sistema lo acepta y persiste

#### Scenario: Envío después de la fecha límite rechazado

- **CUANDO** un usuario intenta crear o confirmar un pronóstico inicial en o después de la fecha límite (sin override que lo permita)
- **ENTONCES** el sistema rechaza el envío e informa al usuario que la ventana de carga se cerró

#### Scenario: Usuario tardío no puede empezar

- **CUANDO** un usuario que nunca creó un pronóstico abre el cuadro después de la fecha límite
- **ENTONCES** el sistema muestra el cuadro como solo lectura y no permite la carga inicial de datos
