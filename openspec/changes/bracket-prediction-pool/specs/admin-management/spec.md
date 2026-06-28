## ADDED Requirements

### Requirement: Designación de admin
El sistema DEBE (MUST) identificar a los usuarios admin mediante un flag/rol de admin designado en su perfil, configurado por un email de admin conocido al momento del aprovisionamiento.

#### Scenario: El email designado es admin
- **CUANDO** el usuario cuyo email coincide con el email de admin configurado inicia sesión
- **ENTONCES** el sistema lo trata como admin con acceso a las funciones de administración

#### Scenario: Usuario regular no es admin
- **CUANDO** un usuario cuyo email no es el admin configurado inicia sesión
- **ENTONCES** el sistema lo trata como usuario regular sin acceso de admin

### Requirement: Autorización de admin en las acciones
El sistema DEBE (MUST) enforzar la autorización de admin en cada acción administrativa (transiciones de fase, registro de resultados oficiales) a nivel de servidor, independientemente de la visibilidad en la UI.

#### Scenario: Enforcement del lado del servidor
- **CUANDO** un no-admin intenta una Server Action administrativa directamente
- **ENTONCES** el sistema la rechaza con un error de autorización

### Requirement: Panel de administración
El sistema DEBE (MUST) proveer una vista solo para admin para gestionar los estados de fase y registrar resultados oficiales por partido.

#### Scenario: El admin ve el panel
- **CUANDO** un admin navega a la ruta de admin
- **ENTONCES** el sistema muestra controles para alternar el estado de cada ronda y formularios para registrar resultados oficiales

#### Scenario: No-admin bloqueado del panel
- **CUANDO** un no-admin navega a la ruta de admin
- **ENTONCES** el sistema deniega el acceso y lo redirige fuera

### Requirement: El admin configura las ventanas de tiempo
El sistema DEBE (MUST) permitir a un admin configurar, mediante campos de fecha/hora, la fecha límite del envío inicial y la apertura y el cierre de cada ronda, y DEBE persistir estos valores para gobernar el gating.

#### Scenario: Configurar la fecha límite inicial
- **CUANDO** un admin establece la fecha/hora límite del envío inicial
- **ENTONCES** el sistema la persiste y la usa para gatear los pronósticos por primera vez

#### Scenario: Configurar la ventana de una fase
- **CUANDO** un admin establece la fecha/hora de apertura y/o cierre de una ronda
- **ENTONCES** el sistema las persiste y las usa para derivar el estado efectivo de esa ronda

#### Scenario: Establecer o limpiar el override manual
- **CUANDO** un admin establece o limpia un override manual para el envío inicial o una ronda
- **ENTONCES** el sistema persiste el override y lo aplica con precedencia sobre la ventana de tiempo

#### Scenario: No-admin denegado en la configuración
- **CUANDO** un no-admin intenta cambiar cualquier ventana de tiempo u override
- **ENTONCES** el sistema rechaza la acción
