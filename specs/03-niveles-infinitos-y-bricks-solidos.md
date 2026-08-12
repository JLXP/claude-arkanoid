# SPEC 03 — Niveles infinitos y bricks sólidos

> **Status:** Aprobado
> **Depends on:** SPEC 01 (mvp-arkanoid), SPEC 02 (animacion-destruccion-bricks)
> **Date:** 2026-08-10
> **Objective:** Extender el juego más allá de los 3 niveles fijos reciclando sus layouts con dificultad creciente (más bricks sólidos de 2 golpes y bola más rápida) hasta un tope de Victoria en el nivel 10.

## Scope

**In:**

- Niveles más allá del 3: reciclan los 3 layouts existentes de `LEVELS` (nivel 4 = layout 1, nivel 5 = layout 2, nivel 6 = layout 3, nivel 7 = layout 1, ...).
- Bricks sólidos: requieren 2 golpes para romperse. El primer golpe los oscurece sin romperlos ni sumar puntos; el segundo los rompe, dispara la animación de partículas ya existente (SPEC 02) y suma 20 puntos.
- Bricks normales: sin cambios, siguen rompiéndose de 1 golpe y sumando 10 puntos.
- Proporción de bricks sólidos por nivel: 20% en el nivel 1, +10% por cada nivel siguiente, tope 100%. Aplica desde el nivel 1, no solo en niveles reciclados.
- Velocidad de la bola: +5% por nivel respecto a `BALL_SPEED`, tope 2x `BALL_SPEED`. Se recalcula a la base del nivel actual cada vez que la bola se reinicia tras perder una vida (no se acumula entre reinicios).
- Tope de Victoria: completar el nivel 10 muestra la pantalla de Victoria y termina la partida, mismo comportamiento que hoy al completar el nivel 3 (puntaje final, opción de reiniciar desde nivel 1).
- Persistencia del nivel máximo alcanzado en localStorage (`arkanoid:maxlevel`), mostrado en la pantalla de inicio junto al highscore.

**Out of scope (for future specs):**

- Generación procedural de layouts nuevos (solo se reciclan los 3 existentes).
- Bricks con más de 2 golpes de resistencia.
- Continuar jugando después de la pantalla de Victoria en el nivel 10.
- Configuración de dificultad (ratio de sólidos, velocidad) desde una UI.
- Partículas o feedback especial en el primer golpe de un brick sólido — solo cambia de color; la animación de partículas sigue disparándose únicamente al romperse del todo (spec 02, sin cambios).
- Power-ups y sonido (ya fuera de alcance desde SPEC 01).

## Data model

```js
// Resuelve qué layout de LEVELS reciclar para un nivel > 3
function levelLayoutIndex(level) {
  return (level - 1) % LEVELS.length; // 0,1,2,0,1,2,...
}

// Extiende el objeto brick existente (state.bricks[i])
{
  x, y, width, height, row, broken, destroying, particles, // ya existentes (spec 01/02)
  solid: false,  // true si es un brick de 2 golpes
  hits: 1,       // golpes restantes para romperse (normal: 1; sólido sin golpear: 2; sólido golpeado: 1)
  maxHits: 1,    // 1 normal, 2 sólido
}

// Nuevas constantes
const SOLID_BRICK_COLOR = '#7d8597';
const SOLID_BRICK_HIT_COLOR = '#4a4e5c';
const SOLID_BRICK_BASE_RATIO = 0.2;   // 20% en nivel 1
const SOLID_BRICK_RATIO_STEP = 0.1;   // +10% por nivel
const BALL_SPEED_INCREMENT = 0.05;    // +5% por nivel
const BALL_SPEED_CAP_MULTIPLIER = 2;  // tope 2x BALL_SPEED
const MAX_LEVEL_FOR_VICTORY = 10;
const MAXLEVEL_KEY = 'arkanoid:maxlevel';
```

Extiende `state`:

```js
state.maxLevel = loadMaxLevel(); // cargado de localStorage al iniciar
```

Persistencia: localStorage, key `arkanoid:maxlevel`, guarda solo el número entero del nivel máximo alcanzado. Mismo patrón sin versión que `arkanoid:highscore` (SPEC 01): no hay formato previo que migrar.

## Implementation plan

1. Extender `buildBricks(level)` para usar `levelLayoutIndex(level)` al elegir el layout de `LEVELS`, y asignar `solid`/`hits`/`maxHits` a cada brick según `min(SOLID_BRICK_BASE_RATIO + SOLID_BRICK_RATIO_STEP * (level - 1), 1)`, repartido pseudo-aleatoriamente entre los bricks del layout. Verificación: sin cambios visuales todavía; en el nivel 1 aproximadamente 20% de los bricks generados tienen `maxHits === 2` (verificable con un `console.log` temporal), el resto del juego sigue funcionando sin errores.
2. Actualizar la colisión bola-brick: si `brick.hits > 1`, restar 1 a `hits` y no marcar `broken` ni sumar puntos; si `hits` llega a 0, marcar `broken = true`, iniciar `destroying`/`particles` (reusa SPEC 02) y sumar puntos (10 normal, 20 sólido). Verificación: golpear un brick sólido una vez no lo rompe ni suma puntos; el segundo golpe lo rompe, dispara la animación de partículas y suma 20 puntos.
3. Dibujar bricks sólidos con `SOLID_BRICK_COLOR`, y `SOLID_BRICK_HIT_COLOR` cuando `hits < maxHits`, en vez del color por fila (`BRICK_ROW_COLORS`) que usan los bricks normales. Verificación: los bricks sólidos se ven grises y cambian a un gris más oscuro tras el primer golpe.
4. Escalar la velocidad de la bola por nivel: calcular `min(1 + BALL_SPEED_INCREMENT * (state.level - 1), BALL_SPEED_CAP_MULTIPLIER)` y aplicarlo sobre `BALL_SPEED` en `resetBall()` (usado tanto al iniciar nivel como al reiniciar la bola tras perder una vida). Verificación: la bola se percibe más rápida en niveles altos que en el nivel 1; tras perder una vida, vuelve a la velocidad base de ese nivel, sin acumular aceleración entre reinicios.
5. Extender `checkLevelComplete()`: si `state.level < MAX_LEVEL_FOR_VICTORY`, seguir avanzando con `startLevel(state.level + 1)` (ahora reciclando layout); si `state.level === MAX_LEVEL_FOR_VICTORY`, mismo comportamiento actual (`screen: 'victory'`). Verificación: completar el nivel 4 en adelante recicla los layouts 1/2/3 con más bricks sólidos y bola más rápida; completar el nivel 10 muestra Victoria igual que hoy.
6. Persistir el nivel máximo alcanzado: agregar `loadMaxLevel()`/`saveMaxLevel()` siguiendo el mismo patrón que `loadHighScore()`/`saveHighScore()`; actualizar `state.maxLevel` en `startLevel()` cuando el nivel alcanzado supera al guardado, y mostrarlo en la pantalla de inicio junto al highscore. Verificación: alcanzar el nivel 5, recargar la página, la pantalla de inicio muestra el nivel máximo alcanzado (5).

## Acceptance criteria

- [ ] Completar el nivel 3 avanza al nivel 4, que recicla el layout del nivel 1 con bricks sólidos adicionales y bola más rápida.
- [ ] En el nivel 1, aproximadamente 20% de los bricks son sólidos (2 golpes); el porcentaje sube ~10% por nivel hasta un tope de 100%.
- [ ] Golpear un brick sólido por primera vez lo oscurece sin romperlo ni sumar puntos.
- [ ] Golpear un brick sólido por segunda vez lo rompe, dispara la animación de partículas existente y suma exactamente 20 puntos.
- [ ] Romper un brick normal sigue sumando exactamente 10 puntos, sin cambios respecto a SPEC 01.
- [ ] La velocidad de la bola aumenta ~5% por nivel respecto a la base, con un tope de 2x la velocidad inicial.
- [ ] Al perder una vida, la bola se reinicia con la velocidad base del nivel actual, sin mantener aceleración acumulada de reinicios previos.
- [ ] Completar el nivel 10 muestra la pantalla de Victoria y termina la partida, igual que el comportamiento actual al completar el nivel 3.
- [ ] La pantalla de inicio muestra el nivel máximo alcanzado (0 la primera vez), leído de `arkanoid:maxlevel`.
- [ ] Alcanzar un nivel nuevo más alto que el guardado actualiza `arkanoid:maxlevel` y persiste tras recargar la página.
- [ ] No aparecen errores en consola al jugar niveles reciclados con bricks sólidos.

## Decisions

- **Yes:** un solo spec combinando niveles infinitos y bricks sólidos. Decisión del usuario: ambas features están ligadas por la progresión de dificultad y se implementan/verifican juntas.
- **Yes:** los niveles más allá del 3 reciclan los 3 layouts existentes de `LEVELS` (módulo 3) en vez de generación procedural. Reusa lo ya definido en SPEC 01, sin diseñar un generador nuevo.
- **No:** generación procedural de layouts. Fuera de alcance; mucho mayor esfuerzo sin pedido explícito.
- **Yes:** bricks sólidos de exactamente 2 golpes fijos, sin variantes de 3+. Simplifica el modelo de datos y la colisión.
- **Yes:** bricks sólidos aparecen desde el nivel 1 (20% inicial, +10%/nivel, tope 100%). La mecánica se siente desde el arranque, no solo al reciclar niveles.
- **Yes:** bricks sólidos dan 20 puntos al romperse del todo, nada en el primer golpe. El doble de puntos por el doble de golpes, sin lógica de puntaje parcial.
- **Yes:** color gris (`#7d8597` → `#4a4e5c`) para bricks sólidos en vez de reusar `BRICK_ROW_COLORS`. Se distinguen sin ambigüedad de los bricks normales.
- **Yes:** velocidad de bola +5%/nivel con tope 2x `BALL_SPEED`, recalculada a la base del nivel en cada `resetBall()`. Progresión perceptible sin volverse injugable ni acumular velocidad entre vidas perdidas.
- **Yes:** tope de Victoria en el nivel 10, termina la partida igual que hoy. Reusa el flujo de Victoria de SPEC 01 sin agregar un estado nuevo de "seguir jugando".
- **Yes:** se persiste `arkanoid:maxlevel` en localStorage, mismo patrón sin versión que `arkanoid:highscore`. Consistente con la decisión ya tomada en SPEC 01.
- **No:** partículas o feedback especial en el primer golpe de un brick sólido más allá del cambio de color. Fuera de alcance; SPEC 02 ya cubre la animación al romperse del todo.

## Risks

| Risk | Mitigation |
| --- | --- |
| localStorage deshabilitado o no disponible (modo privado) | Mismo comportamiento que el highscore (SPEC 01): el juego sigue funcionando, `maxLevel` no persiste entre sesiones y queda en memoria con valor 0. |
| El reparto pseudo-aleatorio de bricks sólidos podría dejar un nivel con 0% o 100% exacto por redondeo | No es un riesgo funcional: el rango 20%-100% es una guía de proporción, no un valor exacto por nivel; cualquier redondeo cae dentro del rango esperado. |
