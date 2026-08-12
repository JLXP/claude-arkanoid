
# Juego de Arkanoid

Juego de Arkanoid hecho con HTML, CSS y JavaScript puro, sin dependencias externas. Se juega directamente en el navegador.

## Cómo jugar

Abrí `index.html` en el navegador (doble click o arrastralo a una pestaña). No requiere instalación ni servidor.

**Controles:**

- Flecha izquierda / derecha: mover la paleta.
- Escape: pausar / reanudar.
- Click: iniciar partida (pantalla de inicio) o reiniciar (pantalla de fin de partida).

**Objetivo:** romper todos los bricks de cada nivel rebotando la bola con la paleta, sin dejarla caer, para acumular la mayor cantidad de puntaje posible.

## Estado actual

- Paleta, bola y colisiones (paredes, paleta, bricks) con rebote según punto de impacto.
- 3 vidas; perder la bola resta una vida y la reinicia sobre la paleta.
- Puntaje: 10 puntos por brick normal, 20 por brick sólido. Highscore persistente en `localStorage`.
- Animación de partículas al romper un brick.
- Niveles infinitos: del nivel 4 en adelante se reciclan los 3 layouts base con dificultad creciente.
- Bricks sólidos (2 golpes): aparecen desde el nivel 1 y aumentan en proporción por nivel; se oscurecen al primer golpe y se rompen (con partículas) al segundo.
- Velocidad de la bola creciente por nivel, con tope máximo.
- Pantalla de Victoria al completar el nivel 10; nivel máximo alcanzado persistente en `localStorage`, mostrado junto al highscore.
- Pausa y pantallas de inicio / game over / victoria.

**Fuera de alcance por ahora:** power-ups, sonido, generación procedural de niveles nuevos, bricks con más de 2 golpes, continuar después de la Victoria.

## Estructura del proyecto

- `index.html` — contenedor del canvas, carga `style.css` y `game.js`.
- `game.js` — toda la lógica del juego: estado, loop de actualización/dibujo, colisiones, niveles, persistencia.
- `style.css` — estilos de la página y el canvas.
- `specs/` — documentos de diseño (specs) que definen cada feature antes de implementarla; ver `CLAUDE.md` para el flujo de trabajo.

## Desarrollo

Sin build ni dependencias: se edita `game.js`/`style.css`/`index.html` directamente y se recarga el navegador. El desarrollo sigue un flujo spec-driven (`/spec` → `/spec-impl`); el detalle está en `CLAUDE.md`.
