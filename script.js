// Oona's Dash v1.11

// Haetaan canvas-elementti HTML:stä
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNTEN LATAUS ---
const musicTracks = [ new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
let currentMusic;
const jumpSounds = [ new Audio('jump1.mp3'), new Audio('jump2.mp3') ];
const crashSound = new Audio('crash.mp3');
const collectSounds = [ new Audio('collect1.mp3'), new Audio('collect2.mp3') ];
let audioInitialized = false;

musicTracks.forEach(track => { track.loop = true; track.volume = 0.3; });

// UUSI: Määritellään väriteemat taustan vaihtumista varten
const colorSchemes = [
    { top: '#29024f', bottom: '#f469a9' }, // 1. Violetista pinkkiin
    { top: '#00416a', bottom: '#799f0c' }, // 2. Tummansinisestä vihreään
    { top: '#ff4e50', bottom: '#f9d423' }, // 3. Punaisesta keltaiseen
    { top: '#141e30', bottom: '#243b55' }  // 4. Yönsinisestä tummaan
];
let currentColorIndex = 0;
let colorTransitionProgress = 0;

// --- Pelin tilan ja muuttujien alustus ---
let gameState = 'menu';
let animationFrameCounter = 0;

const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, color: '#f7ff59' };
const gravity = 0.9;
const initialJumpStrength = -10;
const jumpHoldStrength = -1;
let gameSpeed = 5;
let score = 0;
let obstacles = [];
let particles = [];
let collectibles = [];
let highScores = [];
let menuStars = [];
const startButton = { x: 300, y: 250, width: 200, height: 50 };

// --- Apu- ja piirtofunktiot ---

// UUSI: Funktio, joka laskee kahden värin välisen sävyn
function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}


function resizeCanvas() { /* ...ei muutoksia... */ }
function initializeMenuStars() { /* ...ei muutoksia... */ }
function drawPlayer() { /* ...ei muutoksia... */ }
function jump() { /* ...ei muutoksia... */ }
function drawCollectible(item) { /* ...ei muutoksia... */ }
function drawObstacle(obs) { /* ...ei muutoksia... */ }
function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }

// --- Pelilogiikan päivitysfunktiot ---
function updateGame() {
    // MUUTETTU: Päivitetään värin vaihdon edistymistä
    const transitionSpeed = 0.0005; // Miten nopeasti väri vaihtuu
    colorTransitionProgress += transitionSpeed * gameSpeed;
    if (colorTransitionProgress >= 1) {
        colorTransitionProgress = 0;
        currentColorIndex = (currentColorIndex + 1) % colorSchemes.length;
    }
    
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) { player.velocityY += jumpHoldStrength; }
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.rotation += 0.05 * (gameSpeed / 5);
    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.rotation = 0; }
    
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        const rand = Math.random();
        if (rand < 0.60) { obstacles.push({ type: 'spike', x: canvas.width, width: 60, height: 60, color: '#af47d2' }); }
        else if (rand < 0.85) { obstacles.push({ type: 'platform', x: canvas.width, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' }); }
        else { const wallHeight = Math.random() * 60 + 50; obstacles.push({ type: 'wall', x: canvas.width, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }); }
        const lastObstacle = obstacles[obstacles.length-1];
        if (Math.random() < 0.4) {
            const collectibleType = Math.random() < 0.7 ? 'star' : 'heart';
            collectibles.push({ type: collectibleType, x: lastObstacle.x + lastObstacle.width / 2, y: lastObstacle.y - 40, size: collectibleType === 'star' ? 15 : 20, points: collectibleType === 'star' ? 50 : 150, rotation: 0, color: collectibleType === 'star' ? '#fffb00' : '#ff1a75'});
        }
    }
    
    // Loppuosa `updateGame`-funktiosta pysyy ennallaan...
    for (const obs of obstacles) { /* ... */ }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    for (let i = collectibles.length - 1; i >= 0; i--) { /* ... */ }
    particles.push({ x: player.x + 5, y: player.y + player.height / 2, size: Math.random() * 4 + 2, color: 'rgba(247, 255, 89, 0.5)', life: 1 });
    particles = particles.filter(p => { p.x -= gameSpeed * 0.8; p.life -= 0.05; p.size -= 0.1; return p.life > 0 && p.size > 0; });
    score += 0.1;
    gameSpeed += 0.0005;
}

// --- Piirtofunktiot ---
function drawGame() {
    // MUUTETTU: Piirretään dynaaminen tausta. clearRect ei ole enää tarpeen.
    const nextColorIndex = (currentColorIndex + 1) % colorSchemes.length;
    const topColor = interpolateColor(colorSchemes[currentColorIndex].top, colorSchemes[nextColorIndex].top, colorTransitionProgress);
    const bottomColor = interpolateColor(colorSchemes[currentColorIndex].bottom, colorSchemes[nextColorIndex].bottom, colorTransitionProgress);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Piirretään muut pelin elementit
    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
}

function drawMenu() { /* ...ei muutoksia... */ }
function drawGameOver() { /* ...ei muutoksia... */ }

// --- Pelin alustus ja pääsilmukka ---
function resetGame() { 
    player.y = canvas.height / 2; player.velocityY = 0; player.rotation = 0; obstacles = []; particles = []; collectibles = []; score = 0; gameSpeed = 5;
    // Nollataan väri takaisin ensimmäiseen teemaan
    currentColorIndex = 0;
    colorTransitionProgress = 0;
}

function gameLoop() {
    animationFrameCounter++;
    if (gameState === 'playing') {
        updateGame();
        drawGame();
    } else if (gameState === 'menu') {
        menuStars.forEach(star => { star.rotation += star.rotationSpeed; });
        drawMenu();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

// Muut funktiot (unlockAllAudio, handleInputPress, handleInputRelease, event listeners, käynnistys) pysyvät ennallaan.
// ...
