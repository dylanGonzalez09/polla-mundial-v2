# admin-match-navigation

## ADDED Requirements

### Requirement: Filtro por ronda con tabs
El panel de admin SHALL organizar los formularios de resultados oficiales en tabs por ronda (16avos, 8vos, Cuartos, Semifinales, Final, Tercer puesto), renderizando solo la ronda activa. Cada tab SHALL mostrar el número de partidos pendientes de resultado en esa ronda.

#### Scenario: Admin cambia de ronda
- **WHEN** el admin selecciona el tab "Cuartos"
- **THEN** solo se muestran los partidos de cuartos de final y los demás no se renderizan

#### Scenario: Contador de pendientes
- **WHEN** una ronda tiene 3 partidos sin resultado oficial
- **THEN** su tab muestra un indicador con "3" pendientes

### Requirement: Partidos registrados colapsados
Dentro de una ronda, los partidos que ya tienen resultado oficial registrado SHALL mostrarse colapsados en una línea resumen (código del partido, equipos con banderas, marcador oficial) con acción para expandir y editar. Los partidos sin resultado SHALL mostrarse expandidos con su formulario.

#### Scenario: Partido ya registrado
- **WHEN** un partido tiene resultado oficial guardado
- **THEN** aparece colapsado mostrando el marcador, y al pulsarlo se expande el formulario de edición

#### Scenario: Partido pendiente
- **WHEN** un partido no tiene resultado oficial
- **THEN** su formulario aparece expandido y listo para capturar el resultado

### Requirement: Gestión de ventanas accesible sin scroll
El formulario de ventanas de fase (deadline inicial y apertura/cierre de rondas) SHALL permanecer accesible en la parte superior del panel sin necesidad de hacer scroll a través de los partidos.

#### Scenario: Admin abre una fase
- **WHEN** el admin entra al panel para abrir la ventana de una ronda
- **THEN** encuentra el control de ventanas arriba, antes de la lista de partidos
