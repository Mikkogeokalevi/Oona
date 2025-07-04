// Oona's Dash v1.29

// --- PERUSMUUTTUJAT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNET ---
// MUUTETTU: Lisätty uusi kappale listan alkuun.
const musicTracks = [ new Audio('music0.mp3'), new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
let currentMusic;
const jumpSounds = [ new Audio('jump1.mp3'), new Audio('jump2.mp3') ];
const crashSound = new Audio('crash.mp3');
const collectSounds = [ new Audio('collect1.mp3'), new Audio('collect2.mp3') ];
let audioInitialized = false;
musicTracks.forEach(track => { track.loop = true; track.volume = 0.3; });

// --- VÄRITEEMAT ---
const colorSchemes = [
    { top: '#29024f', bottom: '#f469a9' }, { top: '#00416a', bottom: '#799f0c' },
    { top: '#ff4e50', bottom: '#f9d423' }, { top: '#141e30', bottom: '#243b55' }
];
let currentColorIndex = 0;
let colorTransitionProgress = 0;

// --- PELIN TILA ---
let gameState = 'menu';
let showingInstructions = false;
let animationFrameCounter = 0;
let currentLevel = 1;
const levelThresholds = [100, 600, 1200, 2000];
let levelUp = { active: false, timer: 0 };

// --- PELIN ASETUKSET ---
const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59', lives: 3, invincibleTimer: 0 };
const gravity = 0.9;
const initialJumpStrength = -11;
const jumpHoldStrength = -1;
let gameSpeed = 5;
let score = 0;

// --- OBJEKTITAULUKOT ---
let obstacles = [];
let particles = [];
let collectibles = [];
let highScores = [];
let menuStars = [];

// --- NAPIT ---
const startButton = { x: 300, y: 250, width: 200, height: 50 };
const infoButton = { x: 760, y: 40, radius: 15 };
const nextLevelButton = { x: 300, y: 250, width: 200, height: 50 };

// --- ALUSTUSFUNKTIOT ---
function resizeCanvas() {
    const aspectRatio = 16 / 9;
    let newWidth = window.innerWidth; let newHeight = window.innerHeight;
    const windowAspectRatio = newWidth / newHeight;
    if (windowAspectRatio > aspectRatio) { newWidth = newHeight * aspectRatio; } else { newHeight = newWidth / aspectRatio; }
    canvas.width = 800; canvas.height = 450;
    canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`;
    startButton.x = canvas.width / 2 - startButton.width / 2; startButton.y = canvas.height / 2;
    nextLevelButton.x = canvas.width / 2 - nextLevelButton.width / 2; nextLevelButton.y = canvas.height / 2;
    infoButton.x = canvas.width - 40;
}

function initializeMenuStars() {
    menuStars = [];
    const starColors = ['#f7ff59', '#ff66c4', '#af47d2'];
    for (let i = 0; i < 7; i++) {
        menuStars.push({ type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.02, color: starColors[i % starColors.length] });
    }
}

// --- PIIRTOFUNKTIOT ---
function interpolateColor(color1, color2, factor) { /* ...ei muutoksia... */ }
function drawPlayer() { /* ...ei muutoksia... */ }
function drawCollectible(item) { /* ...ei muutoksia... */ }
function drawObstacle(obs) { /* ...ei muutoksia... */ }
function drawDynamicBackground() { /* ...ei muutoksia... */ }
function drawExampleObstacle(item) { /* ...ei muutoksia... */ }
function drawGame() { /* ...ei muutoksia... */ }
function drawMenu() { /* ...ei muutoksia... */ }
function drawInstructions() { /* ...ei muutoksia... */ }
function drawLevelComplete() { /* ...ei muutoksia... */ }
function drawGameOver() { /* ...ei muutoksia... */ }

// --- PELILOGIIKKA ---
function handlePlayerHit() { /* ...ei muutoksia... */ }
function jump() { /* ...ei muutoksia... */ }
function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }
function updateGame() { /* ...ei muutoksia... */ }
function setupNextLevel() { /* ...ei muutoksia... */ }
function resetGame() { /* ...ei muutoksia... */ }
function gameLoop() { /* ...ei muutoksia... */ }
function unlockAllAudio() { /* ...ei muutoksia... */ }
function handleInputPress(x, y) { /* ...ei muutoksia... */ }
function handleInputRelease() { /* ...ei muutoksia... */ }

// --- KÄYNNISTYS ---
function initializeApp() {
    resizeCanvas();
    initializeMenuStars();
    highScores = getHighScores();
    gameLoop();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); handleInputPress((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height)); });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleInputPress((t.clientX - r.left) * (canvas.width/r.width), (t.clientY - r.top) * (canvas.height/r.height)); }, { passive: false });
window.addEventListener('touchend', e => { e.preventDefault(); handleInputRelease(); });
initializeApp();
