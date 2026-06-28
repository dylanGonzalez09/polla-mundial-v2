## ADDED Requirements

### Requirement: Ciclo de vida del estado de fase
El sistema DEBE (MUST) registrar un estado para cada ronda del torneo — `locked`, `open` o `closed` — donde `locked` oculta/bloquea la carga de marcadores, `open` permite a los usuarios ingresar marcadores y `closed` congela los marcadores de esa ronda.

#### Scenario: Estados de fase por defecto
- **CUANDO** se inicializa el torneo
- **ENTONCES** la fase de 16avos está `open` y todas las fases posteriores (octavos, 4tos, semis, 3er lugar, final) están `locked`

#### Scenario: El estado gobierna la carga del usuario
- **CUANDO** un usuario solicita el formulario de carga de marcadores de una ronda
- **ENTONCES** el formulario es editable solo si el estado de esa fase es `open`

### Requirement: El admin controla las transiciones de fase
El sistema DEBE (MUST) permitir que solo un admin cambie el estado de una ronda, habilitando el desbloqueo progresivo de la carga de marcadores de rondas posteriores.

#### Scenario: El admin desbloquea una fase
- **CUANDO** un admin pasa una ronda de `locked` a `open`
- **ENTONCES** el sistema actualiza el estado y los usuarios pueden comenzar a ingresar marcadores de esa ronda

#### Scenario: El admin cierra una fase
- **CUANDO** un admin pasa una ronda de `open` a `closed`
- **ENTONCES** el sistema congela los marcadores de esa ronda y rechaza ediciones posteriores de los usuarios

#### Scenario: No-admin denegado
- **CUANDO** un usuario no-admin intenta cambiar cualquier estado de fase
- **ENTONCES** el sistema rechaza la acción

### Requirement: Gating de fase por ventana de tiempo
El sistema DEBE (MUST) derivar el estado efectivo de cada ronda a partir de una fecha/hora de apertura y de cierre configuradas por el admin: antes de la apertura la ronda está efectivamente `locked`, entre la apertura y el cierre está efectivamente `open`, y en o después del cierre está efectivamente `closed`. Las ventanas no configuradas (null) DEBEN tratarse como `locked`.

#### Scenario: Dentro de la ventana
- **CUANDO** la hora actual está en o después de la apertura de una ronda y antes de su cierre, sin override manual
- **ENTONCES** el estado efectivo de la ronda es `open` y los usuarios pueden ingresar marcadores

#### Scenario: Antes de la apertura
- **CUANDO** la hora actual es anterior a la apertura de una ronda, sin override manual
- **ENTONCES** el estado efectivo de la ronda es `locked` y la carga de marcadores está bloqueada

#### Scenario: Después de la fecha límite
- **CUANDO** la hora actual está en o después del cierre de una ronda, sin override manual
- **ENTONCES** el estado efectivo de la ronda es `closed` y la carga de marcadores está bloqueada porque los partidos comenzaron

### Requirement: Precedencia del override manual
El sistema DEBE (MUST) permitir a un admin establecer un override manual (`open` o `closed`) para una ronda que tenga precedencia sobre la ventana de tiempo, y limpiar el override para que el gating vuelva a la ventana de tiempo.

#### Scenario: El override fuerza abierto
- **CUANDO** un admin establece el override manual de una ronda en `open` aunque la hora actual esté fuera de su ventana
- **ENTONCES** el estado efectivo de la ronda es `open`

#### Scenario: El override fuerza cerrado
- **CUANDO** un admin establece el override manual de una ronda en `closed` aunque la hora actual esté dentro de su ventana
- **ENTONCES** el estado efectivo de la ronda es `closed`

#### Scenario: Limpiar el override
- **CUANDO** un admin limpia el override manual de una ronda
- **ENTONCES** el estado efectivo de la ronda se deriva únicamente de su ventana de tiempo
