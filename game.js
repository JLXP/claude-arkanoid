const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const HIGHSCORE_KEY = 'arkanoid:highscore';

const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const PADDLE_SPEED = 6;
const PADDLE_Y = canvas.height - 30;

const BALL_RADIUS = 7;
const BALL_SPEED = 4.8;

const BRICK_COLS = 8;
const BRICK_WIDTH = 51;
const BRICK_HEIGHT = 18;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT =
  (canvas.width - (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING)) / 2;

const MAX_BOUNCE_ANGLE = (75 * Math.PI) / 180;

const BRICK_ROW_COLORS = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#8e44ad'];

const LEVELS = [
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],
];

const START_BUTTON = { x: canvas.width / 2 - 70, y: 380, width: 140, height: 44 };
const RESTART_BUTTON = { x: canvas.width / 2 - 70, y: 420, width: 140, height: 44 };

const state = {
  screen: 'start',
  level: 1,
  score: 0,
  lives: 3,
  highScore: loadHighScore(),
  paddle: { x: canvas.width / 2 - PADDLE_WIDTH / 2, y: PADDLE_Y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS },
  bricks: [],
};

let leftPressed = false;
let rightPressed = false;

function loadHighScore() {
  try {
    const v = localStorage.getItem(HIGHSCORE_KEY);
    return v ? Number(v) : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch (e) {
    // localStorage no disponible: el highscore queda solo en memoria.
  }
}

function buildBricks(level) {
  const layout = LEVELS[level - 1];
  const bricks = [];
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      if (layout[r][c] === 1) {
        bricks.push({
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          broken: false,
          row: r,
        });
      }
    }
  }
  return bricks;
}

function resetPaddle() {
  state.paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
  state.paddle.y = PADDLE_Y;
}

function resetBall() {
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - BALL_RADIUS;
  const angle = -Math.PI / 3; // sale hacia arriba
  state.ball.dx = BALL_SPEED * Math.cos(angle);
  state.ball.dy = BALL_SPEED * Math.sin(angle);
}

function startLevel(level) {
  state.level = level;
  state.bricks = buildBricks(level);
  resetPaddle();
  resetBall();
}

function startGame() {
  state.score = 0;
  state.lives = 3;
  state.screen = 'playing';
  startLevel(1);
}

function restartGame() {
  startGame();
}

function togglePause() {
  if (state.screen === 'playing') {
    state.screen = 'paused';
  } else if (state.screen === 'paused') {
    state.screen = 'playing';
  }
}

function movePaddle() {
  if (leftPressed) state.paddle.x -= PADDLE_SPEED;
  if (rightPressed) state.paddle.x += PADDLE_SPEED;
  if (state.paddle.x < 0) state.paddle.x = 0;
  if (state.paddle.x + state.paddle.width > canvas.width) {
    state.paddle.x = canvas.width - state.paddle.width;
  }
}

function moveBall() {
  state.ball.x += state.ball.dx;
  state.ball.y += state.ball.dy;
}

function checkWallCollision() {
  const ball = state.ball;
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
  } else if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -ball.dx;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
  }
}

function checkPaddleCollision() {
  const ball = state.ball;
  const paddle = state.paddle;
  if (ball.dy <= 0) return;
  const withinX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
  const withinY = ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height;
  if (withinX && withinY) {
    const paddleCenter = paddle.x + paddle.width / 2;
    let relativeIntersect = (ball.x - paddleCenter) / (paddle.width / 2);
    relativeIntersect = Math.max(-1, Math.min(1, relativeIntersect));
    const bounceAngle = relativeIntersect * MAX_BOUNCE_ANGLE;
    ball.dx = BALL_SPEED * Math.sin(bounceAngle);
    ball.dy = -BALL_SPEED * Math.cos(bounceAngle);
    ball.y = paddle.y - ball.radius;
  }
}

function checkBrickCollision() {
  const ball = state.ball;
  for (const brick of state.bricks) {
    if (brick.broken) continue;
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const diffX = ball.x - closestX;
    const diffY = ball.y - closestY;
    const distSq = diffX * diffX + diffY * diffY;
    if (distSq <= ball.radius * ball.radius) {
      brick.broken = true;
      state.score += 10;
      const overlapX = ball.radius - Math.abs(diffX);
      const overlapY = ball.radius - Math.abs(diffY);
      if (overlapX < overlapY) {
        ball.dx = -ball.dx;
      } else {
        ball.dy = -ball.dy;
      }
      break;
    }
  }
}

function checkBallLost() {
  if (state.ball.y - state.ball.radius > canvas.height) {
    state.lives -= 1;
    if (state.lives <= 0) {
      endGame('gameover');
    } else {
      resetPaddle();
      resetBall();
    }
  }
}

function checkLevelComplete() {
  const allBroken = state.bricks.every((b) => b.broken);
  if (!allBroken) return;
  if (state.level < 3) {
    startLevel(state.level + 1);
  } else {
    endGame('victory');
  }
}

function endGame(screen) {
  state.screen = screen;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore(state.highScore);
  }
}

function update() {
  movePaddle();
  moveBall();
  checkWallCollision();
  checkPaddleCollision();
  checkBrickCollision();
  checkBallLost();
  if (state.screen === 'playing') checkLevelComplete();
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawText(text, x, y, options) {
  const opts = options || {};
  ctx.fillStyle = opts.color || '#fff';
  ctx.font = opts.font || '16px sans-serif';
  ctx.textAlign = opts.align || 'left';
  ctx.fillText(text, x, y);
}

function drawButton(rect, label) {
  drawRect(rect.x, rect.y, rect.width, rect.height, '#2d7dd2');
  drawText(label, rect.x + rect.width / 2, rect.y + rect.height / 2 + 6, {
    align: 'center',
    font: '18px sans-serif',
  });
}

function drawPaddle() {
  drawRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, '#eee');
}

function drawBall() {
  ctx.fillStyle = '#eee';
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  for (const brick of state.bricks) {
    if (brick.broken) continue;
    const color = BRICK_ROW_COLORS[brick.row % BRICK_ROW_COLORS.length];
    drawRect(brick.x, brick.y, brick.width, brick.height, color);
  }
}

function drawLivesIcons() {
  const spacing = BALL_RADIUS * 2 + 6;
  let x = canvas.width - 10 - BALL_RADIUS;
  const y = 20;
  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    x -= spacing;
  }
}

function drawHUD() {
  drawText(`Puntaje: ${state.score}`, 10, 25, { font: '16px sans-serif' });
  drawLivesIcons();
  drawText(`Nivel: ${state.level}`, canvas.width / 2, 25, { align: 'center', font: '16px sans-serif' });
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawStartScreen() {
  clear();
  drawText('ARKANOID', canvas.width / 2, 220, { align: 'center', font: 'bold 36px sans-serif' });
  drawText(`Highscore: ${state.highScore}`, canvas.width / 2, 300, { align: 'center', font: '20px sans-serif' });
  drawButton(START_BUTTON, 'Start');
}

function drawPlayingScreen() {
  clear();
  drawBricks();
  drawPaddle();
  drawBall();
  drawHUD();
}

function drawPausedScreen() {
  drawPlayingScreen();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawText('PAUSA', canvas.width / 2, canvas.height / 2, { align: 'center', font: 'bold 32px sans-serif' });
  drawText('Esc para continuar', canvas.width / 2, canvas.height / 2 + 30, {
    align: 'center',
    font: '16px sans-serif',
  });
}

function drawGameOverScreen() {
  clear();
  drawText('GAME OVER', canvas.width / 2, 220, { align: 'center', font: 'bold 32px sans-serif' });
  drawText(`Puntaje final: ${state.score}`, canvas.width / 2, 270, { align: 'center', font: '18px sans-serif' });
  drawText(`Highscore: ${state.highScore}`, canvas.width / 2, 300, { align: 'center', font: '18px sans-serif' });
  drawButton(RESTART_BUTTON, 'Reiniciar');
}

function drawVictoryScreen() {
  clear();
  drawText('GANASTE!', canvas.width / 2, 220, { align: 'center', font: 'bold 32px sans-serif' });
  drawText(`Puntaje final: ${state.score}`, canvas.width / 2, 270, { align: 'center', font: '18px sans-serif' });
  drawText(`Highscore: ${state.highScore}`, canvas.width / 2, 300, { align: 'center', font: '18px sans-serif' });
  drawButton(RESTART_BUTTON, 'Reiniciar');
}

function render() {
  switch (state.screen) {
    case 'start':
      drawStartScreen();
      break;
    case 'playing':
      drawPlayingScreen();
      break;
    case 'paused':
      drawPausedScreen();
      break;
    case 'gameover':
      drawGameOverScreen();
      break;
    case 'victory':
      drawVictoryScreen();
      break;
  }
}

function loop() {
  if (state.screen === 'playing') {
    update();
  }
  render();
  requestAnimationFrame(loop);
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function getCanvasMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('click', (e) => {
  const pos = getCanvasMousePos(e);
  if (state.screen === 'start' && pointInRect(pos, START_BUTTON)) {
    startGame();
  } else if ((state.screen === 'gameover' || state.screen === 'victory') && pointInRect(pos, RESTART_BUTTON)) {
    restartGame();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') leftPressed = true;
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'Escape') togglePause();
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  if (e.key === 'ArrowRight') rightPressed = false;
});

requestAnimationFrame(loop);
