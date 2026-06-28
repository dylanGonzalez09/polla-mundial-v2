## ADDED Requirements

### Requirement: Registro con email, contraseña y nombre visible
El sistema DEBE (MUST) permitir a un visitante crear una cuenta usando un email, una contraseña y un nombre visible (display name) vía Supabase Auth, creando un registro de perfil asociado que almacena ese nombre visible para usarlo en el ranking y en la vista de pronósticos de otros (sin exponer el email).

#### Scenario: Registro exitoso
- **CUANDO** un visitante envía un email válido, una contraseña que cumple el largo mínimo y un nombre visible no vacío
- **ENTONCES** el sistema crea un usuario en Supabase Auth y una fila `profiles` vinculada con el nombre visible, y establece una sesión autenticada

#### Scenario: Email duplicado
- **CUANDO** un visitante se registra con un email que ya existe
- **ENTONCES** el sistema rechaza el registro y muestra un error sin crear una cuenta duplicada

#### Scenario: Datos inválidos
- **CUANDO** un visitante envía un email inválido, una contraseña más corta que el largo mínimo, o un nombre visible vacío
- **ENTONCES** el sistema rechaza el envío y muestra un error de validación

### Requirement: Inicio de sesión
El sistema DEBE (MUST) permitir a un usuario registrado autenticarse con email y contraseña y obtener una sesión utilizable en Server Components y Server Actions.

#### Scenario: Login exitoso
- **CUANDO** un usuario registrado envía credenciales correctas
- **ENTONCES** el sistema establece una sesión y redirige a la página del cuadro

#### Scenario: Credenciales incorrectas
- **CUANDO** un usuario envía un email o contraseña incorrectos
- **ENTONCES** el sistema rechaza el intento y muestra un error de autenticación

### Requirement: Cierre de sesión
El sistema DEBE (MUST) permitir a un usuario autenticado finalizar su sesión.

#### Scenario: Logout
- **CUANDO** un usuario autenticado dispara el cierre de sesión
- **ENTONCES** el sistema limpia la sesión y redirige a la página de login

### Requirement: Protección de rutas
El sistema DEBE (MUST) restringir las áreas autenticadas (cuadro, ranking, admin) a usuarios con sesión iniciada y refrescar la sesión en cada request.

#### Scenario: Acceso no autenticado redirigido
- **CUANDO** un visitante no autenticado solicita una ruta protegida
- **ENTONCES** el sistema lo redirige a la página de login

#### Scenario: Refresco de sesión
- **CUANDO** un usuario autenticado navega la app con una sesión válida
- **ENTONCES** el sistema refresca el token de sesión de forma transparente y mantiene al usuario con sesión iniciada
