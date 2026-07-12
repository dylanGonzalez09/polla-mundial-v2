# app-navigation

## ADDED Requirements

### Requirement: Sidebar de navegación en desktop
En viewports desktop (lg+), el layout autenticado SHALL mostrar una sidebar fija a la izquierda que contiene: la insignia de liga del jugador, su nombre, sus puntos totales, la navegación vertical (Bracket, Jugadores, Ranking, y Admin solo para administradores) y la acción de cerrar sesión. El ítem de navegación activo SHALL resaltarse con el token `--info`.

#### Scenario: Jugador navega en desktop
- **WHEN** un jugador autenticado abre cualquier página en desktop
- **THEN** ve la sidebar con su insignia de liga, nombre, puntos totales y la ruta actual resaltada

#### Scenario: Enlace de admin condicionado
- **WHEN** el usuario no es administrador
- **THEN** la sidebar no muestra el enlace a Admin

### Requirement: Bottom tabs en móvil
En viewports móviles, el layout autenticado SHALL mostrar una barra superior compacta (marca, insignia de liga y puntos) y una barra de tabs fija inferior con las mismas rutas de navegación, cada una con icono y etiqueta.

#### Scenario: Jugador navega en móvil
- **WHEN** un jugador abre la app en un viewport móvil
- **THEN** la navegación aparece como tabs fijos en la parte inferior y la sidebar no se muestra

#### Scenario: Contenido no tapado por tabs
- **WHEN** el usuario hace scroll al final de una página en móvil
- **THEN** el último contenido queda visible por encima de la barra de tabs (padding inferior suficiente)

### Requirement: Hero por página
Cada página principal (Bracket, Jugadores, Ranking, Admin) SHALL abrir con un hero que muestra el título en tipografía display sobre una franja decorativa con gradiente tricolor y patrón geométrico.

#### Scenario: Hero del ranking
- **WHEN** se abre la página de Ranking
- **THEN** se muestra un hero con el título display sobre la franja decorativa antes del contenido

### Requirement: Pantallas de auth con identidad 2026
Las pantallas de login, registro y recuperación de contraseña SHALL mostrar la identidad del torneo (marca de agua "26" en gradiente sobre el fondo) con el formulario en una card neutra centrada. La lógica de autenticación SHALL permanecer sin cambios.

#### Scenario: Usuario abre login
- **WHEN** un usuario no autenticado visita /login
- **THEN** ve el fondo con la marca de agua "26" y el formulario centrado funcional

### Requirement: Onboarding tour preservado
La navegación nueva SHALL conservar los atributos `data-tour` existentes para que el tour de onboarding siga funcionando en ambos layouts (sidebar y tabs).

#### Scenario: Tour en la nueva navegación
- **WHEN** un usuario nuevo dispara el onboarding tour
- **THEN** los pasos del tour anclan correctamente a los ítems de navegación nuevos
