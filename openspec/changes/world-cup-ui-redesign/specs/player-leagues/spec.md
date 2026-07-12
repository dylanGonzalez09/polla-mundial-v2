# player-leagues

## ADDED Requirements

### Requirement: Liga derivada de puntos totales
El sistema SHALL asignar a cada jugador una liga (Bronce, Plata, Oro, Diamante, Leyenda) según umbrales de puntos totales definidos en un único módulo de dominio (`getLeague(totalPoints)`), sin persistencia en base de datos. Los umbrales SHALL ser ajustables editando solo ese módulo.

#### Scenario: Jugador sube de liga
- **WHEN** los puntos totales de un jugador cruzan el umbral de la siguiente liga tras registrarse resultados oficiales
- **THEN** su insignia refleja la nueva liga en el siguiente render, sin migración ni acción manual

#### Scenario: Jugador sin puntos
- **WHEN** un jugador tiene 0 puntos
- **THEN** se le asigna la liga Bronce

### Requirement: Insignia de liga con marco progresivo
El sistema SHALL renderizar una insignia visual por liga cuya ornamentación crece con el nivel (Bronce simple → Leyenda con corona y brillo), disponible en al menos dos tamaños, y SHALL mostrarla en la sidebar/barra móvil, en cada fila del ranking y en la vista de jugadores.

#### Scenario: Insignia en el ranking
- **WHEN** se renderiza la lista del ranking
- **THEN** cada jugador muestra la insignia correspondiente a su liga junto a su nombre

#### Scenario: Insignias distinguibles
- **WHEN** dos jugadores de ligas distintas aparecen juntos
- **THEN** sus insignias son visualmente distinguibles de un vistazo (color y ornamento distintos)

### Requirement: Nombre de liga visible
El sistema SHALL mostrar el nombre de la liga junto a la insignia en el perfil del jugador (sidebar desktop y barra móvil).

#### Scenario: Perfil en sidebar
- **WHEN** un jugador en liga Oro abre la app en desktop
- **THEN** la sidebar muestra su insignia de Oro con el texto "Liga Oro" y sus puntos totales
