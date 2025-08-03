// --- Background Image Fade Logic ---
const images = [
  'images/badminton1.jpg',
  'images/badminton2.jpg',
  'images/badminton3.jpg',
  'images/badminton4.jpg'
];

let index = 0;
let showingFirst = true;

const bg1 = document.querySelector('.bg-image-1');
const bg2 = document.querySelector('.bg-image-2');

// Initialize first two background images, hide second initially
bg1.style.backgroundImage = `url('${images[0]}')`;
bg2.style.backgroundImage = `url('${images[1]}')`;
bg2.classList.add('hidden');

function changeBackground() {
  const nextIndex = (index + 1) % images.length;

  if (showingFirst) {
    // Fade in bg2 with next image, hide bg1
    bg2.style.backgroundImage = `url('${images[nextIndex]}')`;
    bg2.classList.remove('hidden');
    bg1.classList.add('hidden');
  } else {
    // Fade in bg1 with next image, hide bg2
    bg1.style.backgroundImage = `url('${images[nextIndex]}')`;
    bg1.classList.remove('hidden');
    bg2.classList.add('hidden');
  }

  showingFirst = !showingFirst;
  index = nextIndex;
}

// Change background every 5 seconds
let bgInterval = null;
if (!bgInterval) {
  bgInterval = setInterval(changeBackground, 5000);
}

// --- Fullscreen Buttons ---
const btnFS = document.querySelector("#btnFS");
const btnWS = document.querySelector("#btnWS");

btnFS.addEventListener("click", enterFullscreen);
btnWS.addEventListener("click", exitFullscreen);

function enterFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) { // Safari
    document.documentElement.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { // Safari
    document.webkitExitFullscreen();
  }
}

// --- Window Resize Reporting ---
const heightOutput = document.querySelector("#height");
const widthOutput = document.querySelector("#width");

function reportWindowSize() {
  heightOutput.textContent = window.innerHeight;
  widthOutput.textContent = window.innerWidth;
}

reportWindowSize();
window.addEventListener("resize", reportWindowSize);

// --- Hamburger Menu Toggle ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active'); // Show/hide mobile nav
});

// --- Section Navigation ---
const navItems = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.page-section');

navItems.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.dataset.target;

    // Show target section, hide others
    sections.forEach(section => {
      section.classList.toggle('active', section.id === targetId);
    });

    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    navLinks.classList.remove('active'); // Close mobile nav after selection
  });
});

// --- Game Logic Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreboard = document.getElementById('scoreboard');
const shuttleSprite = document.getElementById('shuttleSprite');

const courtWidth = canvas.width;
const courtHeight = canvas.height;

const racketWidth = 20;
const racketHeight = 80;
const racketSpeed = 6;

let playerY = courtHeight / 2 - racketHeight / 2;
let aiY = courtHeight / 2 - racketHeight / 2;

let shuttleX = courtWidth / 2;
let shuttleY = courtHeight / 2;
let shuttleRadius = 12;

let shuttleSpeedX = 0;
let shuttleSpeedY = 0;

let playerScore = 0;
let aiScore = 0;

let isGameRunning = false;
let animationFrameId = null;

const SHUTTLE_SPEED = 4;

const racketImg = new Image();
racketImg.src = 'images/racket.png';

const catchSound = new Audio('audio/hit.mp3');

// Reset shuttle position and randomize initial direction/speed
function resetShuttle() {
  shuttleX = courtWidth / 2;
  shuttleY = courtHeight / 2;

  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // random angle ±45°
  const directionX = Math.random() > 0.5 ? 1 : -1; // left or right

  shuttleSpeedX = Math.cos(angle) * SHUTTLE_SPEED * directionX;
  shuttleSpeedY = Math.sin(angle) * SHUTTLE_SPEED;
}

// Update shuttle position and handle collisions with walls and rackets
function updateShuttle() {
  shuttleX += shuttleSpeedX;
  shuttleY += shuttleSpeedY;

  // Bounce off top/bottom walls
  if (shuttleY - shuttleRadius < 0) {
    shuttleY = shuttleRadius;
    shuttleSpeedY = -shuttleSpeedY;
  }
  if (shuttleY + shuttleRadius > courtHeight) {
    shuttleY = courtHeight - shuttleRadius;
    shuttleSpeedY = -shuttleSpeedY;
  }

  // Player racket collision
  if (
    shuttleX - shuttleRadius < racketWidth &&
    shuttleY > playerY &&
    shuttleY < playerY + racketHeight
  ) {
    shuttleX = racketWidth + shuttleRadius;
    let offset = (shuttleY - (playerY + racketHeight / 2)) / (racketHeight / 2);
    let angle = offset * Math.PI / 4;
    shuttleSpeedX = Math.cos(angle) * SHUTTLE_SPEED;
    shuttleSpeedY = Math.sin(angle) * SHUTTLE_SPEED;
    catchSound.play();
  }

  // AI racket collision
  if (
    shuttleX + shuttleRadius > courtWidth - racketWidth &&
    shuttleY > aiY &&
    shuttleY < aiY + racketHeight
  ) {
    shuttleX = courtWidth - racketWidth - shuttleRadius;
    let offset = (shuttleY - (aiY + racketHeight / 2)) / (racketHeight / 2);
    let angle = offset * Math.PI / 4;
    shuttleSpeedX = -Math.cos(angle) * SHUTTLE_SPEED;
    shuttleSpeedY = Math.sin(angle) * SHUTTLE_SPEED;
  }

  // Score updates and shuttle reset
  if (shuttleX - shuttleRadius < 0) {
    aiScore++;
    resetShuttle();
    checkGameOver();
  } else if (shuttleX + shuttleRadius > courtWidth) {
    playerScore++;
    resetShuttle();
    checkGameOver();
  }
}

// Check if either player has reached winning score (11)
function checkGameOver() {
  if (playerScore >= 11) {
    alert("You win! 🎉");
    endGame();
  } else if (aiScore >= 11) {
    alert("Opponent wins! 😞");
    endGame();
  }
}

// Stop game and reset UI buttons
function endGame() {
  isGameRunning = false;
  startButton.style.display = 'inline-block';
  restartButton.style.display = 'none';
  shuttleSprite.classList.add('hidden');
  shuttleSprite.classList.remove('rotate');
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

// Draw court background and center line
function drawCourt() {
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, courtWidth, courtHeight);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(courtWidth / 2, 0);
  ctx.lineTo(courtWidth / 2, courtHeight);
  ctx.stroke();
}

// Draw racket image or fallback rectangle
function drawRacket(x, y) {
  if (racketImg.complete) {
    ctx.drawImage(racketImg, x, y, racketWidth, racketHeight);
  } else {
    ctx.fillStyle = 'blue';
    ctx.fillRect(x, y, racketWidth, racketHeight);
  }
}

// Position shuttle sprite on screen based on shuttle coordinates
function drawShuttle() {
  shuttleSprite.style.left = (shuttleX - 32) + 'px';
  shuttleSprite.style.top = (shuttleY - 32) + 'px';
}

// Update scoreboard text
function drawScore() {
  scoreboard.textContent = `Player: ${playerScore}  |  Opponent: ${aiScore}`;
}

// Simple AI movement to follow shuttle Y position
function updateAI() {
  const aiCenter = aiY + racketHeight / 2;
  if (aiCenter < shuttleY - 10) {
    aiY += racketSpeed * 0.2;
  } else if (aiCenter > shuttleY + 10) {
    aiY -= racketSpeed * 0.2;
  }
  // Keep AI racket inside court bounds
  aiY = Math.max(0, Math.min(courtHeight - racketHeight, aiY));
}

function clearCanvas() {
  ctx.clearRect(0, 0, courtWidth, courtHeight);
}

// Main game loop; redraws and updates positions
function gameLoop() {
  if (!isGameRunning) return;

  clearCanvas();
  drawCourt();
  drawRacket(0, playerY);
  drawRacket(courtWidth - racketWidth, aiY);
  drawShuttle();
  drawScore();
  updateShuttle();
  updateAI();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Move player racket with mouse, clamped to canvas bounds
canvas.addEventListener('mousemove', e => {
  if (!isGameRunning) return;
  const rect = canvas.getBoundingClientRect();
  let mouseY = e.clientY - rect.top;
  playerY = mouseY - racketHeight / 2;
  playerY = Math.max(0, Math.min(courtHeight - racketHeight, playerY));
});

const startButton = document.getElementById('startBtn');
const restartButton = document.getElementById('restartBtn');

// Start game button
startButton.addEventListener('click', () => {
  if (!isGameRunning) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    playerScore = 0;
    aiScore = 0;
    resetShuttle();
    isGameRunning = true;
    startButton.style.display = 'none';
    restartButton.style.display = 'inline-block';
    shuttleSprite.classList.remove('hidden');
    shuttleSprite.classList.add('rotate');
    gameLoop();
  }
});

// Restart game button resets scores and restarts game loop
restartButton.addEventListener('click', () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  playerScore = 0;
  aiScore = 0;
  resetShuttle();
  isGameRunning = true;
  startButton.style.display = 'none';
  restartButton.style.display = 'inline-block';
  shuttleSprite.classList.remove('hidden');
  shuttleSprite.classList.add('rotate');
  gameLoop();
});

// --- Quiz Logic ---
const btnSubmit = document.querySelector("#btnSubmit");
const scorebox = document.querySelector("#scorebox");

// Correct answers array
const corrAnsArray = ["21", "Shuttlecock", "2"];

let score = 0;

// Check quiz answers on submit
btnSubmit.addEventListener("click", CheckAns);

function CheckAns() {
  score = 0; // Reset score
  for (let i = 0; i < corrAnsArray.length; i++) {
    CheckOneQn(i + 1, corrAnsArray[i]);
  }
  scorebox.innerHTML = "Score: " + score + "/" + corrAnsArray.length;
}

// Check single question's selected answer against correct answer
function CheckOneQn(qnNo, CorrAns) {
  const selected = document.querySelector("input[name='q" + qnNo + "']:checked");
  if (!selected) return; // no option selected
  const userAns = selected.value;
  if (userAns === CorrAns) score++;
}