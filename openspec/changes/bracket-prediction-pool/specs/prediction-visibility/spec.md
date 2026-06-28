## ADDED Requirements

### Requirement: Visibilidad gateada por envío propio
El sistema DEBE (MUST) revelar los datos del pronóstico de otro usuario para una fase dada a un observador solo después de que el observador haya enviado su propia fase correspondiente, y DEBE ocultarlos en caso contrario.

#### Scenario: Sin visibilidad antes de confirmar el inicial propio
- **CUANDO** un observador aún no ha confirmado su propio pronóstico inicial
- **ENTONCES** el sistema no muestra datos de pronóstico de otros usuarios

#### Scenario: Visibilidad desbloqueada al enviar la fase propia
- **CUANDO** un observador ha enviado sus propios marcadores de una fase
- **ENTONCES** el sistema revela los datos de los otros usuarios para esa misma fase

### Requirement: Revelado incremental por fase
El sistema DEBE (MUST) revelar los datos de pares de forma incremental por fase: confirmar el pronóstico inicial revela el cuadro completo de equipos que avanzan de todos los usuarios más sus marcadores de 16avos; completar los marcadores del observador para una fase posterior revela los marcadores de esos usuarios para esa misma fase posterior únicamente.

#### Scenario: Alcance del revelado inicial
- **CUANDO** un observador confirma su pronóstico inicial
- **ENTONCES** el sistema revela los pronósticos completos de equipos que avanzan (todas las rondas) de cada otro usuario y sus marcadores de 16avos

#### Scenario: Alcance del revelado de fase posterior
- **CUANDO** un observador envía sus propios marcadores de una fase posterior (p. ej. octavos)
- **ENTONCES** el sistema revela los marcadores de los otros usuarios para esa fase únicamente, manteniendo ocultas las fases posteriores aún no desbloqueadas

#### Scenario: Fase posterior aún oculta
- **CUANDO** un observador ha confirmado el pronóstico inicial pero no ha enviado sus marcadores de octavos
- **ENTONCES** el sistema oculta los marcadores de octavos de los otros usuarios mientras sigue mostrando los datos iniciales ya desbloqueados

### Requirement: Datos de pares solo de fases enviadas
El sistema DEBE (MUST) exponer los datos de fase de un par solo una vez que ese par haya enviado esa fase; mientras un par no la haya enviado, el sistema NO DEBE revelar sus marcadores de esa fase, pudiendo indicar que aún no la envió.

#### Scenario: Par que no envió la fase
- **CUANDO** un observador es elegible para ver una fase pero un par en particular aún no envió esa fase
- **ENTONCES** el sistema no revela los marcadores de ese par para la fase y puede mostrar que el par aún no la envió

### Requirement: Visibilidad enforzada server-side
El sistema DEBE (MUST) enforzar las reglas de visibilidad en el servidor (capa de acceso a datos / políticas de base de datos), independientemente de la UI, de modo que los datos de pares no puedan obtenerse por requests directos cuando el gate no se cumple.

#### Scenario: Request directo denegado
- **CUANDO** un observador que no ha cumplido el gate solicita datos de pares directamente
- **ENTONCES** el sistema no devuelve datos de pares para el alcance bloqueado
