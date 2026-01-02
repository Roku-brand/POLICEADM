// Super Police Adventure - 2D Platformer Game Engine
// マリオのような動的プラットフォーマーゲーム

// ===== GAME CONSTANTS =====
const GRAVITY = 0.6;
const FRICTION = 0.85;
const PLAYER_SPEED = 6;
const JUMP_FORCE = -14;
const ENEMY_SPEED = 2;

// ===== GAME STATE =====
let gameState = {
  running: false,
  paused: false,
  gameOver: false,
  lives: 3,
  score: 0,
  coins: 0,
  level: 1,
  cameraX: 0
};

// ===== CANVAS SETUP =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit container
function resizeCanvas() {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth - 40;
  const aspectRatio = 2; // 2:1 aspect ratio
  canvas.width = Math.min(1200, containerWidth);
  canvas.height = canvas.width / aspectRatio;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== PLAYER =====
const player = {
  x: 100,
  y: 300,
  prevX: 100,
  prevY: 300,
  width: 40,
  height: 50,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1, // 1 = right, -1 = left
  frame: 0,
  frameTimer: 0,
  invincible: false,
  invincibleTimer: 0,
  jumpRequested: false,
  
  reset() {
    this.x = 100;
    this.y = 300;
    this.prevX = 100;
    this.prevY = 300;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.jumpRequested = false;
  }
};

// ===== INPUT HANDLING =====
const keys = {
  left: false,
  right: false,
  jump: false
};

document.addEventListener('keydown', (e) => {
  switch(e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = true;
      break;
    case 'Space':
    case 'ArrowUp':
    case 'KeyW':
      // Request jump - will be processed in update loop when on ground
      player.jumpRequested = true;
      break;
    case 'KeyP':
    case 'Escape':
      if (gameState.running && !gameState.gameOver) {
        togglePause();
      }
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch(e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
      break;
    case 'Space':
    case 'ArrowUp':
    case 'KeyW':
      player.jumpRequested = false;
      break;
  }
});

// ===== LEVEL DATA =====
let platforms = [];
let coins = [];
let enemies = [];
let particles = [];
let goal = null;

function generateLevel(levelNum) {
  platforms = [];
  coins = [];
  enemies = [];
  particles = [];
  
  const levelWidth = 3000 + (levelNum * 500);
  const groundY = canvas.height - 50;
  
  // Ground platforms
  let groundX = 0;
  while (groundX < levelWidth) {
    const gapChance = Math.random();
    if (gapChance < 0.15 && groundX > 200) {
      // Create a gap
      groundX += 120 + Math.random() * 80;
    } else {
      const segmentWidth = 150 + Math.random() * 200;
      platforms.push({
        x: groundX,
        y: groundY,
        width: segmentWidth,
        height: 50,
        type: 'ground'
      });
      groundX += segmentWidth;
    }
  }
  
  // Floating platforms
  const numFloating = 15 + levelNum * 5;
  for (let i = 0; i < numFloating; i++) {
    const px = 300 + i * (levelWidth / numFloating) + Math.random() * 100;
    const py = groundY - 100 - Math.random() * 250;
    platforms.push({
      x: px,
      y: py,
      width: 100 + Math.random() * 100,
      height: 20,
      type: 'floating'
    });
  }
  
  // Coins
  const numCoins = 20 + levelNum * 10;
  for (let i = 0; i < numCoins; i++) {
    const cx = 200 + Math.random() * (levelWidth - 400);
    const cy = 100 + Math.random() * (groundY - 200);
    coins.push({
      x: cx,
      y: cy,
      width: 25,
      height: 25,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2
    });
  }
  
  // Enemies
  const numEnemies = 5 + levelNum * 3;
  for (let i = 0; i < numEnemies; i++) {
    const ex = 400 + i * (levelWidth / numEnemies);
    enemies.push({
      x: ex,
      y: groundY - 40,
      width: 35,
      height: 35,
      vx: ENEMY_SPEED * (Math.random() > 0.5 ? 1 : -1),
      type: 'walker',
      frame: 0
    });
  }
  
  // Goal
  goal = {
    x: levelWidth - 150,
    y: groundY - 100,
    width: 60,
    height: 100
  };
}

// ===== COLLISION DETECTION =====
function rectCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ===== PARTICLES =====
function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      size: 3 + Math.random() * 5,
      color: color,
      life: 1
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= 0.03;
    p.size *= 0.97;
    
    if (p.life <= 0 || p.size < 0.5) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - gameState.cameraX, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ===== UPDATE FUNCTIONS =====
function updatePlayer() {
  // Store previous position for collision detection
  player.prevX = player.x;
  player.prevY = player.y;
  
  // Horizontal movement
  if (keys.left) {
    player.vx = -PLAYER_SPEED;
    player.facing = -1;
  } else if (keys.right) {
    player.vx = PLAYER_SPEED;
    player.facing = 1;
  } else {
    player.vx *= FRICTION;
  }
  
  // Jump - process jump request when on ground
  if (player.jumpRequested && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    player.jumpRequested = false;
    createParticles(player.x + player.width/2, player.y + player.height, '#ffffff', 5);
  }
  
  // Apply gravity
  player.vy += GRAVITY;
  
  // Update position
  player.x += player.vx;
  player.y += player.vy;
  
  // Keep player on screen (left boundary)
  if (player.x < 0) player.x = 0;
  
  // Fall death
  if (player.y > canvas.height + 100) {
    loseLife();
    return;
  }
  
  // Platform collision - use stored previous position for accurate detection
  player.onGround = false;
  platforms.forEach(plat => {
    if (rectCollision(player, plat)) {
      // Check if landing on top (was above platform in previous frame)
      if (player.vy > 0 && player.prevY + player.height <= plat.y + 5) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
      // Check if hitting from below (was below platform in previous frame)
      else if (player.vy < 0 && player.prevY >= plat.y + plat.height - 5) {
        player.y = plat.y + plat.height;
        player.vy = 0;
      }
      // Side collision
      else {
        if (player.vx > 0) {
          player.x = plat.x - player.width;
        } else if (player.vx < 0) {
          player.x = plat.x + plat.width;
        }
        player.vx = 0;
      }
    }
  });
  
  // Animation
  if (Math.abs(player.vx) > 0.5) {
    player.frameTimer++;
    if (player.frameTimer > 5) {
      player.frame = (player.frame + 1) % 4;
      player.frameTimer = 0;
    }
  } else {
    player.frame = 0;
  }
  
  // Invincibility timer
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
  
  // Update camera
  const targetCameraX = player.x - canvas.width / 3;
  gameState.cameraX += (targetCameraX - gameState.cameraX) * 0.1;
  gameState.cameraX = Math.max(0, gameState.cameraX);
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    enemy.x += enemy.vx;
    enemy.frame = (enemy.frame + 0.1) % 2;
    
    // Reverse direction at level edges
    if (enemy.x < 50 || enemy.x > goal.x - 100) {
      enemy.vx *= -1;
    }
    
    // Check collision with player
    if (!player.invincible && rectCollision(player, enemy)) {
      // Check if player is stomping from above
      if (player.vy > 0 && player.y + player.height - 10 < enemy.y + enemy.height / 2) {
        // Kill enemy
        enemies.splice(index, 1);
        player.vy = JUMP_FORCE / 2;
        gameState.score += 100;
        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff6b6b', 15);
      } else {
        // Player gets hit
        loseLife();
      }
    }
  });
}

function updateCoins() {
  coins.forEach((coin, index) => {
    if (!coin.collected && rectCollision(player, coin)) {
      coin.collected = true;
      gameState.coins++;
      gameState.score += 10;
      createParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#ffd700', 8);
    }
  });
}

function checkGoal() {
  if (goal && rectCollision(player, goal)) {
    // Level complete! Store goal position before generating new level
    const oldGoalX = goal.x;
    const oldGoalY = goal.y;
    const oldGoalWidth = goal.width;
    const oldGoalHeight = goal.height;
    
    gameState.level++;
    gameState.score += 1000;
    gameState.cameraX = 0;
    player.reset();
    generateLevel(gameState.level);
    
    // Create particles at the old goal position
    createParticles(oldGoalX + oldGoalWidth/2, oldGoalY + oldGoalHeight/2, '#5ce07a', 30);
  }
}

function loseLife() {
  gameState.lives--;
  if (gameState.lives <= 0) {
    endGame();
  } else {
    player.reset();
    player.invincible = true;
    player.invincibleTimer = 120;
    gameState.cameraX = 0;
  }
}

function endGame() {
  gameState.gameOver = true;
  gameState.running = false;
  showOverlay('ゲームオーバー', 'スコア: ' + gameState.score + '\nコイン: ' + gameState.coins + '\nレベル: ' + gameState.level, true);
}

// ===== DRAW FUNCTIONS =====
function drawBackground() {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 50; i++) {
    const sx = (i * 73 + gameState.cameraX * 0.1) % (canvas.width + 100) - 50;
    const sy = (i * 37) % (canvas.height * 0.6);
    const size = (i % 3) + 1;
    ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Mountains (parallax)
  ctx.fillStyle = '#0a0d12';
  for (let i = 0; i < 5; i++) {
    const mx = (i * 400 - gameState.cameraX * 0.2) % (canvas.width + 600) - 200;
    const mHeight = 100 + (i % 3) * 50;
    ctx.beginPath();
    ctx.moveTo(mx, canvas.height);
    ctx.lineTo(mx + 150, canvas.height - mHeight);
    ctx.lineTo(mx + 300, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPlatforms() {
  platforms.forEach(plat => {
    const x = plat.x - gameState.cameraX;
    
    // Skip if off screen
    if (x + plat.width < 0 || x > canvas.width) return;
    
    if (plat.type === 'ground') {
      // Ground style
      const gradient = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
      gradient.addColorStop(0, '#5a9e5a');
      gradient.addColorStop(0.3, '#4a8e4a');
      gradient.addColorStop(1, '#3d6e3d');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, plat.y, plat.width, plat.height);
      
      // Grass on top
      ctx.fillStyle = '#7bc87b';
      ctx.fillRect(x, plat.y, plat.width, 8);
      
      // Border
      ctx.strokeStyle = '#2d4e2d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, plat.y, plat.width, plat.height);
    } else {
      // Floating platform style
      const gradient = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
      gradient.addColorStop(0, '#8b5a2b');
      gradient.addColorStop(1, '#5d3a1a');
      ctx.fillStyle = gradient;
      
      // Draw brick-like pattern
      ctx.fillRect(x, plat.y, plat.width, plat.height);
      ctx.strokeStyle = '#4a2a10';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, plat.y, plat.width, plat.height);
      
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x, plat.y, plat.width, 4);
    }
  });
}

function drawPlayer() {
  const x = player.x - gameState.cameraX;
  
  // Invincibility flashing
  if (player.invincible && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  
  ctx.save();
  ctx.translate(x + player.width / 2, player.y + player.height / 2);
  ctx.scale(player.facing, 1);
  ctx.translate(-player.width / 2, -player.height / 2);
  
  // Body
  const bodyColor = '#4a90d9';
  ctx.fillStyle = bodyColor;
  ctx.fillRect(5, 20, 30, 25);
  
  // Head
  ctx.fillStyle = '#ffcc99';
  ctx.beginPath();
  ctx.arc(20, 15, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Police hat
  ctx.fillStyle = '#1a365d';
  ctx.fillRect(8, 2, 24, 8);
  ctx.fillRect(6, 8, 28, 4);
  
  // Hat badge
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(20, 6, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(22, 14, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Legs animation
  const legOffset = Math.sin(player.frame * Math.PI / 2) * 5;
  ctx.fillStyle = '#1a365d';
  ctx.fillRect(8, 45, 10, 8 + legOffset);
  ctx.fillRect(22, 45, 10, 8 - legOffset);
  
  // Arms
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(0, 22, 8, 15);
  ctx.fillRect(32, 22, 8, 15);
  
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawEnemies() {
  enemies.forEach(enemy => {
    const x = enemy.x - gameState.cameraX;
    
    // Skip if off screen
    if (x + enemy.width < -50 || x > canvas.width + 50) return;
    
    ctx.save();
    ctx.translate(x + enemy.width / 2, enemy.y + enemy.height / 2);
    
    // Body (angry blob)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.width / 2);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = gradient;
    
    // Squish animation
    const squish = 1 + Math.sin(enemy.frame * Math.PI) * 0.1;
    ctx.scale(squish, 2 - squish);
    
    ctx.beginPath();
    ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 10, enemy.y + 10, 6, 0, Math.PI * 2);
    ctx.arc(x + 25, enemy.y + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 12, enemy.y + 12, 3, 0, Math.PI * 2);
    ctx.arc(x + 27, enemy.y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, enemy.y + 5);
    ctx.lineTo(x + 15, enemy.y + 8);
    ctx.moveTo(x + 30, enemy.y + 5);
    ctx.lineTo(x + 20, enemy.y + 8);
    ctx.stroke();
  });
}

function drawCoins() {
  const time = Date.now() / 1000;
  coins.forEach(coin => {
    if (coin.collected) return;
    
    const x = coin.x - gameState.cameraX;
    const y = coin.y + Math.sin(time * 3 + coin.bobOffset) * 5;
    
    // Skip if off screen
    if (x + coin.width < 0 || x > canvas.width) return;
    
    // Coin glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    
    // Coin body
    const gradient = ctx.createRadialGradient(
      x + coin.width/2, y + coin.height/2, 0,
      x + coin.width/2, y + coin.height/2, coin.width/2
    );
    gradient.addColorStop(0, '#ffeaa7');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#f39c12');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + coin.width/2, y + coin.height/2, coin.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#c27c0e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', x + coin.width/2, y + coin.height/2 + 1);
  });
  ctx.shadowBlur = 0;
}

function drawGoal() {
  if (!goal) return;
  
  const x = goal.x - gameState.cameraX;
  
  // Skip if off screen
  if (x + goal.width < 0 || x > canvas.width) return;
  
  // Flag pole
  ctx.fillStyle = '#808080';
  ctx.fillRect(x + goal.width/2 - 3, goal.y, 6, goal.height);
  
  // Flag
  const time = Date.now() / 1000;
  const waveOffset = Math.sin(time * 3) * 5;
  
  ctx.fillStyle = '#5ce07a';
  ctx.beginPath();
  ctx.moveTo(x + goal.width/2 + 3, goal.y + 5);
  ctx.lineTo(x + goal.width/2 + 50 + waveOffset, goal.y + 25);
  ctx.lineTo(x + goal.width/2 + 3, goal.y + 45);
  ctx.closePath();
  ctx.fill();
  
  // Star on flag
  ctx.fillStyle = '#ffd700';
  ctx.font = '20px Arial';
  ctx.fillText('⭐', x + goal.width/2 + 20 + waveOffset/2, goal.y + 30);
  
  // Base
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(x + goal.width/2 - 15, goal.y + goal.height - 10, 30, 10);
}

function drawUI() {
  // Update DOM elements
  document.getElementById('lives').textContent = gameState.lives;
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('coins').textContent = gameState.coins;
  document.getElementById('level').textContent = gameState.level;
}

// ===== GAME LOOP =====
function update() {
  if (!gameState.running || gameState.paused || gameState.gameOver) return;
  
  updatePlayer();
  updateEnemies();
  updateCoins();
  updateParticles();
  checkGoal();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawGoal();
  drawEnemies();
  drawPlayer();
  drawParticles();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== UI FUNCTIONS =====
function showOverlay(title, message, showStats = false) {
  const overlay = document.getElementById('gameOverlay');
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayMessage').innerHTML = message.replace(/\n/g, '<br>');
  
  const finalStats = document.getElementById('finalStats');
  if (showStats) {
    finalStats.classList.remove('hidden');
    document.getElementById('finalScore').textContent = gameState.score;
  } else {
    finalStats.classList.add('hidden');
  }
  
  const startBtn = document.getElementById('startBtn');
  startBtn.textContent = gameState.gameOver ? 'もう一度プレイ' : 'ゲームスタート';
  
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('gameOverlay').classList.add('hidden');
}

function togglePause() {
  gameState.paused = !gameState.paused;
  const pauseMenu = document.getElementById('pauseMenu');
  pauseMenu.classList.toggle('hidden', !gameState.paused);
}

function startGame() {
  gameState = {
    running: true,
    paused: false,
    gameOver: false,
    lives: 3,
    score: 0,
    coins: 0,
    level: 1,
    cameraX: 0
  };
  
  player.reset();
  generateLevel(1);
  hideOverlay();
}

// ===== EVENT LISTENERS =====
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', () => {
  togglePause();
  startGame();
});

// ===== INITIALIZE =====
generateLevel(1);
draw(); // Draw initial state
gameLoop();
