const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 48;
const GROUND_Y = HEIGHT - GROUND_HEIGHT;
const GRAVITY = 0.75;
const JUMP_VELOCITY = -14.5;

let lastTime = 0;
let isRunning = false;
let gameOver = false;
let baseSpeed = 8;
let distanceRan = 0;
let frameTimer = 0;
let legFrame = 0;
let obstacleTimer = 0;
let cloudTimer = 0;
const obstacles = [];
const clouds = [];

let storageEnabled = true;
let inMemoryHighScore = 0;
try {
  localStorage.setItem('dino:check', '1');
  localStorage.removeItem('dino:check');
} catch (err) {
  storageEnabled = false;
}

const dino = {
  x: 60,
  y: GROUND_Y - 48,
  width: 44,
  height: 48,
  vy: 0,
  isJumping: false,
  jump() {
    if (!this.isJumping) {
      this.vy = JUMP_VELOCITY;
      this.isJumping = true;
    }
  },
  update() {
    this.y += this.vy;
    this.vy += GRAVITY;

    if (this.y >= GROUND_Y - this.height) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.isJumping = false;
    }
  },
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // body
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, 14, 30, 24);
    ctx.fillRect(24, 18, 16, 20);

    // head
    ctx.fillRect(20, 0, 22, 18);
    ctx.clearRect(32, 6, 6, 6); // eye highlight

    // arms
    ctx.fillRect(12, 22, 14, 6);
    ctx.clearRect(12, 24, 7, 4);

    // legs animation
    ctx.fillRect(4, 36, 10, 12);
    if (this.isJumping) {
      ctx.fillRect(20, 36, 10, 12);
    } else if (legFrame === 0) {
      ctx.fillRect(18, 38, 10, 10);
      ctx.clearRect(22, 42, 4, 6);
    } else {
      ctx.fillRect(26, 38, 10, 10);
      ctx.clearRect(30, 42, 4, 6);
    }
    ctx.restore();
  },
};

function spawnObstacle() {
  const choice = Math.random();
  if (choice < 0.6) {
    obstacles.push({
      x: WIDTH + 40,
      y: GROUND_Y - 40,
      width: 26,
      height: 40,
      type: 'small',
    });
  } else if (choice < 0.85) {
    obstacles.push({
      x: WIDTH + 40,
      y: GROUND_Y - 50,
      width: 36,
      height: 50,
      type: 'tall',
    });
  } else {
    obstacles.push({
      x: WIDTH + 40,
      y: GROUND_Y - 40,
      width: 54,
      height: 40,
      type: 'double',
    });
  }
}

function spawnCloud() {
  const y = Math.random() * (GROUND_Y - 90);
  const speed = 0.2 + Math.random() * 0.3;
  clouds.push({ x: WIDTH + 60, y, speed });
}

function resetGame() {
  obstacles.length = 0;
  clouds.length = 0;
  distanceRan = 0;
  baseSpeed = 8;
  frameTimer = 0;
  legFrame = 0;
  obstacleTimer = 0;
  cloudTimer = 0;
  dino.y = GROUND_Y - dino.height;
  dino.vy = 0;
  dino.isJumping = false;
  updateScore(0);
  message.textContent = 'Press Space to start';
  overlay.classList.remove('hidden');
  gameOver = false;
  isRunning = false;
}

function updateScore(value) {
  scoreEl.textContent = value.toString().padStart(5, '0');
}

function getHighScore() {
  if (!storageEnabled) {
    return inMemoryHighScore;
  }
  return Number(localStorage.getItem('dino:high-score') || 0);
}

function setHighScore(value) {
  if (!storageEnabled) {
    inMemoryHighScore = Math.max(inMemoryHighScore, value);
    return;
  }
  localStorage.setItem('dino:high-score', String(value));
}

function update(delta) {
  if (!isRunning) {
    lastTime = performance.now();
    return;
  }

  dino.update();

  const speedMultiplier = 1 + Math.floor(distanceRan / 1000) * 0.1;
  const currentSpeed = baseSpeed * speedMultiplier;
  distanceRan += currentSpeed * (delta / 16.67);
  const scoreValue = Math.floor(distanceRan);
  updateScore(scoreValue);

  const best = getHighScore();
  if (scoreValue > best) {
    setHighScore(scoreValue);
  }
  highScoreEl.textContent = getHighScore().toString().padStart(5, '0');

  frameTimer += delta;
  if (frameTimer > 120) {
    legFrame = (legFrame + 1) % 2;
    frameTimer = 0;
  }

  obstacleTimer -= delta;
  if (obstacleTimer <= 0) {
    spawnObstacle();
    const interval = Math.max(600 - Math.min(distanceRan, 500), 250);
    obstacleTimer = interval + Math.random() * 200;
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obs = obstacles[i];
    obs.x -= currentSpeed;
    if (obs.x + obs.width < -10) {
      obstacles.splice(i, 1);
    }
  }

  cloudTimer -= delta;
  if (cloudTimer <= 0) {
    spawnCloud();
    cloudTimer = 2000 + Math.random() * 2000;
  }

  for (let i = clouds.length - 1; i >= 0; i -= 1) {
    const cloud = clouds[i];
    cloud.x -= cloud.speed * currentSpeed * 0.3;
    if (cloud.x < -120) {
      clouds.splice(i, 1);
    }
  }

  if (checkCollision()) {
    handleGameOver();
  }
}

function drawGround() {
  ctx.fillStyle = '#d1d1d1';
  ctx.fillRect(0, GROUND_Y, WIDTH, 2);
  ctx.fillStyle = '#b3b3b3';
  ctx.fillRect(0, GROUND_Y + 2, WIDTH, GROUND_HEIGHT);

  ctx.strokeStyle = '#a9a9a9';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 18);
  ctx.lineTo(WIDTH, GROUND_Y + 18);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawObstacles() {
  ctx.fillStyle = '#5a5a5a';
  obstacles.forEach((obs) => {
    const { x, y, width, height, type } = obs;
    ctx.fillRect(x, y, width, height);
    if (type === 'double') {
      ctx.clearRect(x + 10, y + height - 12, 8, 12);
      ctx.clearRect(x + 28, y + height - 12, 8, 12);
    } else {
      ctx.clearRect(x + width / 2 - 4, y + height - 12, 8, 12);
    }
  });
}

function drawClouds() {
  ctx.fillStyle = '#dedede';
  clouds.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x + 18, y - 14, 18, Math.PI, Math.PI * 1.85);
    ctx.arc(x + 36, y, 18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
  });
}

function clearCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function checkCollision() {
  return obstacles.some((obs) => {
    const hit =
      dino.x < obs.x + obs.width - 6 &&
      dino.x + dino.width - 6 > obs.x &&
      dino.y < obs.y + obs.height - 4 &&
      dino.y + dino.height - 6 > obs.y;
    return hit;
  });
}

function handleGameOver() {
  gameOver = true;
  isRunning = false;
  message.textContent = 'Game Over - Press Space to try again';
  overlay.classList.remove('hidden');
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);

  clearCanvas();
  drawClouds();
  drawGround();
  drawObstacles();
  dino.draw();

  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    if (!isRunning) {
      if (gameOver) {
        resetGame();
      }
      overlay.classList.add('hidden');
      message.textContent = '';
      isRunning = true;
    }
    dino.jump();
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
  overlay.classList.add('hidden');
  message.textContent = '';
  isRunning = true;
});

window.addEventListener('blur', () => {
  if (isRunning) {
    isRunning = false;
    overlay.classList.remove('hidden');
    message.textContent = 'Paused - click to resume';
  }
});

overlay.addEventListener('click', () => {
  if (!isRunning) {
    if (gameOver) {
      resetGame();
    }
    overlay.classList.add('hidden');
    message.textContent = '';
    isRunning = true;
  }
});

function init() {
  resetGame();
  const best = getHighScore();
  highScoreEl.textContent = best.toString().padStart(5, '0');
  requestAnimationFrame(loop);
}

init();
