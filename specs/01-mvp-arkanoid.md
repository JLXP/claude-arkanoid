# SPEC 01 — MVP Arkanoid jugable

> **Status:** Aprobado
> **Depends on:** (ninguno, primer spec)
> **Date:** 2026-08-07
> **Objective:** Construir un MVP jugable de Arkanoid en el navegador con paleta, bola, bricks, 3 niveles, vidas, puntaje y highscore persistente, sin dependencias externas.

## Scope

**In:**

- Canvas 2D con paleta controlada por teclado (flechas izquierda/derecha).
- Bola con física de rebote: paredes, paleta (ángulo variable según punto de impacto) y bricks.
- 3 niveles predefinidos con distinto layout de bricks; todos los bricks se rompen de 1 golpe.
- Sistema de vidas: 3 vidas, pierde una al caer la bola, game over al perder la última.
- Puntaje: 10 puntos fijos por brick roto, acumulado durante la partida.
- Highscore persistido en localStorage, visible en pantalla de inicio y en game over/victoria.
- Pantalla de inicio con botón "Start".
- Pausa con tecla Esc.
- Pantalla de "Ganaste" al completar los 3 niveles.
- Pantalla de "Game Over" al perder todas las vidas, con opción de reiniciar.

**Out of scope (for future specs):**

- Power-ups.
- Sonido / música.
- Bricks con distinta resistencia (múltiples golpes).
- Multijugador.
- Editor de niveles o niveles adicionales más allá de 3.
- Soporte táctil / versión mobile.
- Animaciones avanzadas o efectos visuales (partículas, etc.).

## Data model

```js
// Estado del juego
const state = {
  screen: "start", // 'start' | 'playing' | 'paused' | 'gameover' | 'victory'
  level: 1, // 1..3
  score: 0,
  lives: 3,
  highScore: 0, // cargado de localStorage al iniciar
  paddle: { x, y, width, height },
  ball: { x, y, dx, dy, radius },
  bricks: [], // [{ x, y, width, height, broken: false }, ...] del nivel actual
};
```

Niveles: 3 layouts de bricks (filas x columnas) definidos como datos en el código, uno por nivel.

Persistencia: localStorage, key `arkanoid:highscore`, guarda solo el número del mejor puntaje. Sin sufijo de versión (primer spec, no hay formato previo que migrar).

Convenciones: origen de coordenadas arriba-izquierda, velocidades en píxeles/frame, loop con `requestAnimationFrame`.

## Implementation plan

1. Crear `index.html` con `<canvas>`, `style.css` con estilos base, `game.js` vacío enlazado. Verificación: abrir `index.html`, se ve un canvas vacío sin errores en consola.
2. Implementar loop de juego (`requestAnimationFrame`) y estado `screen` con pantalla de inicio (botón Start). Verificación: al cargar se ve la pantalla de inicio; click en Start pasa a `screen: 'playing'`.
3. Implementar paleta: dibujo y movimiento con flechas izquierda/derecha, limitada a los bordes del canvas. Verificación: la paleta se mueve con el teclado sin salir del canvas.
4. Implementar bola: dibujo, movimiento, rebote en paredes (izquierda, derecha, arriba) y en la paleta con ángulo según punto de impacto. Verificación: la bola rebota visualmente en paredes y paleta.
5. Implementar bricks del nivel 1: dibujo de la grilla, colisión bola-brick, brick se elimina al primer golpe, suma 10 puntos. Verificación: al golpear un brick desaparece y el puntaje sube en pantalla.
6. Implementar vidas y pérdida de bola: si la bola cae bajo la paleta, resta una vida y reinicia la bola en la paleta; con 0 vidas, `screen: 'gameover'`. Verificación: dejar caer la bola 3 veces muestra Game Over.
7. Implementar transición entre niveles: al romper todos los bricks del nivel actual, avanza al siguiente (1→2→3); al completar el nivel 3, `screen: 'victory'`. Verificación: romper todos los bricks de cada nivel avanza correctamente y el nivel 3 lleva a victoria.
8. Implementar pausa: tecla Esc alterna `screen` entre `playing` y `paused`, mostrando overlay y deteniendo la física. Verificación: Esc pausa y reanuda el juego.
9. Implementar highscore: leer `arkanoid:highscore` de localStorage al cargar y mostrarlo en la pantalla de inicio; en game over o victory, si `score > highScore`, actualizar y guardar. Verificación: superar el highscore, recargar la página, el nuevo valor se muestra.
10. Pulir pantallas de Game Over y Victory: mostrar puntaje final, highscore, botón para reiniciar partida desde nivel 1. Verificación: desde ambas pantallas se puede reiniciar una partida completa.

## Acceptance criteria

- [ ] El juego carga en el navegador sin errores en consola.
- [ ] La pantalla de inicio muestra un botón Start y el highscore guardado (0 la primera vez).
- [ ] La paleta se mueve con las flechas izquierda/derecha sin salir del canvas.
- [ ] La bola rebota en las paredes y en la paleta, y el ángulo de rebote cambia según el punto de impacto en la paleta.
- [ ] Romper un brick lo elimina del canvas y suma exactamente 10 puntos al puntaje.
- [ ] Perder la bola resta una vida y la reinicia en la paleta.
- [ ] Perder la tercera vida muestra la pantalla de Game Over con el puntaje final.
- [ ] Romper todos los bricks de un nivel avanza al siguiente (1 → 2 → 3).
- [ ] Completar el nivel 3 muestra la pantalla de Victoria.
- [ ] La tecla Esc pausa y reanuda el juego.
- [ ] Al superar el highscore, se guarda en localStorage y persiste tras recargar la página.
- [ ] Desde Game Over o Victoria se puede reiniciar una partida completa desde el nivel 1.

## Decisions

- **Yes:** Canvas 2D para renderizado. Estándar para este tipo de juego, buen control de dibujo y colisiones.
- **No:** DOM + CSS para las entidades. Menos performante y más código para animar múltiples bricks.
- **Yes:** 3 niveles predefinidos hardcodeados en el código. Suficiente para sentir progresión sin necesitar un editor de niveles.
- **No:** Niveles generados dinámicamente o cargados desde JSON externo. Overengineering para un MVP.
- **Yes:** Todos los bricks se rompen de 1 golpe. Simplifica el MVP; resistencia variable queda para spec futuro.
- **Yes:** localStorage sin versionar la key (`arkanoid:highscore`). Primer spec, no hay formato previo que migrar.
- **No:** Power-ups y sonido en este MVP. Amplían mucho el alcance; quedan para specs futuros explícitos.
- **Yes:** Ángulo de rebote variable según punto de impacto en la paleta. Mecánica clásica de Arkanoid, mejora la jugabilidad sin agregar complejidad significativa.
- **Yes:** Pausa con tecla Esc. Básico y esperable, bajo costo de implementación.

## Risks

| Risk                                              | Mitigation                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| localStorage deshabilitado o no disponible (modo privado) | El juego sigue funcionando; el highscore no persiste entre sesiones, queda en memoria con valor 0. |

## What is **not** in this spec

- Power-ups (agrandar paleta, multi-bola, etc.).
- Sonido y música.
- Bricks con distinta resistencia.
- Editor de niveles o niveles adicionales más allá de 3.
- Soporte táctil / versión mobile.
- Multijugador.

Cada uno de estos, si se implementa, va en su propio spec.
