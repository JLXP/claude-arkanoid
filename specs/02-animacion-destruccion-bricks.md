# SPEC 02 — Animación de destrucción de bricks

> **Status:** Aprobado
> **Depends on:** SPEC 01 (mvp-arkanoid)
> **Date:** 2026-08-10
> **Objective:** Al romper un brick, mostrar una animación corta de partículas explotando en vez de que el brick desaparezca instantáneamente.

## Scope

**In:**

- Animación de partículas (rects pequeños) que salen disparadas desde la posición del brick roto y se desvanecen en ~150-200ms.
- 6-8 partículas por brick, color igual al del brick roto (reusa `BRICK_ROW_COLORS`).
- La animación no bloquea el juego: bola, paleta, otros bricks y puntaje siguen funcionando con normalidad mientras las partículas animan.
- La animación respeta la pausa (Esc): se congela y reanuda junto con el resto del juego.
- El avance de nivel no espera a que termine la animación.

**Out of scope (for future specs):**

- Sonido asociado a la destrucción (ya fuera de alcance de SPEC 01).
- Física avanzada de partículas (gravedad, rebote, fricción, colisión entre partículas).
- Animaciones para otros eventos (pérdida de bola, game over, victoria, power-ups).
- Configuración de la animación desde UI (cantidad de partículas, duración, etc.).

## Data model

```js
// Extiende el objeto brick existente (state.bricks[i])
{
  x, y, width, height, row, broken, // ya existentes
  destroying: false, // true mientras tiene partículas activas
  particles: [], // [{ x, y, vx, vy, life, maxLife, color }, ...]
}
```

- `broken` se sigue marcando `true` en el mismo instante del golpe (colisión y puntaje no cambian).
- `destroying` y `particles` son adicionales: controlan solo el efecto visual, no la lógica de colisión/puntaje.
- `life`/`maxLife` en frames (no timestamps), consistente con el loop actual que no usa deltaTime. Duración objetivo ~150-200ms ≈ 9-12 frames a 60fps.
- Cuando `particles` queda vacío, `destroying` pasa a `false` (limpieza, el brick ya no necesita más updates).

No se agrega una lista global `state.particles`: las partículas viven adjuntas a cada brick.

## Implementation plan

1. Agregar `createParticles(brick)` que genera 6-8 partículas dentro de los límites del brick, con velocidad inicial random en distintas direcciones y color de la fila del brick. En `checkBrickCollision`, al marcar `brick.broken = true`, asignar `brick.particles = createParticles(brick)` y `brick.destroying = true`. Verificación: sin salida visual todavía, pero el juego sigue funcionando sin errores en consola y `brick.particles` tiene contenido al romper un brick (verificable con un `console.log` temporal).
2. Implementar `updateParticles()`: recorre los bricks con `destroying`, actualiza posición de cada partícula (`x += vx`, `y += vy`) y decrementa `life`; elimina partículas con `life <= 0`; si `particles` queda vacío, `destroying = false`. Llamarla desde `update()`. Verificación: sin errores en consola, el resto del juego (bola, paleta, puntaje) sigue igual.
3. Implementar `drawParticles()`: dibuja cada partícula activa como un rect pequeño con su color, con opacidad decreciente según `life / maxLife`. Llamarla en `drawPlayingScreen()` después de `drawBricks()`. Verificación: al romper un brick se ven partículas de su color saliendo disparadas y desvaneciéndose en poco tiempo.
4. Verificar que `checkLevelComplete()` sigue basándose solo en `broken` (no en `destroying`), así el avance de nivel no espera a la animación; y que al pausar con Esc las partículas se congelan (por ser parte de `update()`, que ya no corre en pausa) y se reanudan al continuar. Verificación: romper el último brick de un nivel avanza de inmediato aunque las partículas sigan en pantalla; pausar durante una animación la congela visualmente.

## Acceptance criteria

- [ ] Al romper un brick aparecen 6-8 partículas del mismo color que ese brick.
- [ ] Las partículas se mueven hacia afuera desde la posición del brick y desaparecen en aproximadamente 150-200ms.
- [ ] Mientras las partículas animan, la bola sigue rebotando y el resto del juego (paleta, otros bricks, puntaje) funciona con normalidad.
- [ ] Pausar con Esc durante una animación en curso la congela; al reanudar, continúa donde estaba.
- [ ] Romper el último brick de un nivel avanza al siguiente nivel de inmediato, sin esperar a que termine la animación de partículas.
- [ ] No aparecen errores en consola al romper varios bricks seguidos o al mismo tiempo.

## Decisions

- **Yes:** Partículas basadas en contador de frames (`life`/`maxLife`), no en timestamps. Consistente con el loop actual que no usa deltaTime; suficiente para una animación de esta duración.
- **Yes:** Partículas viven adjuntas al brick (`brick.particles`, `brick.destroying`) en vez de una lista global `state.particles`. Decisión del usuario: mantiene todo el estado de un brick roto en el mismo objeto.
- **Yes:** Color de partícula = color de fila del brick, reusando `BRICK_ROW_COLORS` ya existente. Evita introducir una paleta nueva.
- **No:** Esperar a que termine la animación antes de avanzar de nivel. Rompería el ritmo de juego clásico de Arkanoid y agregaría un estado intermedio innecesario.
- **No:** Física de gravedad/fricción en las partículas. Fuera de alcance; movimiento lineal simple con fade alcanza el efecto buscado.
- **No:** Sonido asociado a la destrucción. Ya está fuera de alcance desde SPEC 01.

## What is **not** in this spec

- Sonido de destrucción de bricks.
- Física avanzada de partículas (gravedad, rebote, colisiones entre sí).
- Animaciones para otros eventos del juego (pérdida de bola, game over, victoria, power-ups).
- Configuración/ajuste de la animación desde una UI.

Cada uno de estos, si se implementa, va en su propio spec.
