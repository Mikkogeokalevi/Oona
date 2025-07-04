// Oona's Dash v1.18

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

const colorSchemes = [
    { top: '#29024f', bottom: '#f469a9' }, { top: '#00416a', bottom: '#799f0c' },
    { top: '#ff4e50', bottom: '#f9d423' }, { top: '#141e30', bottom: '#243b55' }
];
let currentColorIndex = 0;
let colorTransitionProgress = 0;

// --- Pelin tilan ja muuttujien alustus ---
let gameState = 'menu';
let animationFrameCounter = 0;

// UUSI: Tasojärjestelmän muuttujat
let currentLevel = 1;
const levelThresholds = [500, 1500, 3000, 5000]; // Pistemäärät tason nousuun
let levelUp = { active: false, timer: 0 };

const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59' };
const gravity = 0.9;
const initialJumpStrength = -11;
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
function interpolateColor(color1, color2, factor) { /* ...ei muutoksia... */ }
function resizeCanvas() { /* ...ei muutoksia... */ }
function initializeMenuStars() { /* ...ei muutoksia... */ }
function drawPlayer() { /* ...ei muutoksia... */ }
function jump() { /* ...ei muutoksia... */ }
function drawCollectible(item) { /* ...ei muutoksia... */ }

function drawObstacle(obs) {
    ctx.fillStyle = obs.color;
    if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, canvas.height); ctx.lineTo(obs.x + obs.width / 2, canvas.height - obs.height);
        ctx.lineTo(obs.x + obs.width, canvas.height);
        ctx.closePath(); ctx.fill();
    } else if (obs.type === 'platform' || obs.type === 'wall') {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === 'roof_spike') { // UUSI: Katto-piikin piirtäminen
        ctx.beginPath();
        ctx.moveTo(obs.x, 0); // Aloitetaan ylhäältä
        ctx.lineTo(obs.x + obs.width / 2, obs.height); // Kärki alaspäin
        ctx.lineTo(obs.x + obs.width, 0);
        ctx.closePath();
        ctx.fill();
    }
}

function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }

// --- Pelilogiikan päivitysfunktiot ---
function updateGame() {
    // UUSI: Tasonnousun tarkistus ja käsittely
    if (currentLevel - 1 < levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        currentLevel++;
        levelUp.active = true;
        levelUp.timer = 120; // Näytetään viesti 2 sekunnin ajan
        gameSpeed += 0.5; // Pieni nopeusbonus tasonnoususta
    }
    if (levelUp.active) {
        levelUp.timer--;
        if (levelUp.timer <= 0) {
            levelUp.active = false;
        }
    }

    const transitionSpeed = 0.0005;
    colorTransitionProgress += transitionSpeed * gameSpeed;
    if (colorTransitionProgress >= 1) { colorTransitionProgress = 0; currentColorIndex = (currentColorIndex + 1) % colorSchemes.length; }
    
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) { player.velocityY += jumpHoldStrength; }
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.rotation += 0.05 * (gameSpeed / 5);

    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }

    // MUUTETTU: Esteiden luominen perustuu nyt tasoon
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - (300 + (Math.random()*100 - 50))) {
        let obstacleType = 'spike';
        const rand = Math.random();

        if (currentLevel === 1) {
            // Vain piikkejä
        } else if (currentLevel === 2) {
            if (rand > 0.6) obstacleType = 'wall';
        } else if (currentLevel === 3) {
            if (rand > 0.7) obstacleType = 'platform';
            else if (rand > 0.4) obstacleType = 'wall';
        } else { // Taso 4 ja ylöspäin
             if (rand > 0.75) obstacleType = 'roof_spike';
             else if (rand > 0.5) obstacleType = 'platform';
             else if (rand > 0.25) obstacleType = 'wall';
        }

        if (obstacleType === 'spike') { obstacles.push({ type: 'spike', x: canvas.width, width: 60, height: 60, color: '#af47d2' }); }
        else if (obstacleType === 'platform') { obstacles.push({ type: 'platform', x: canvas.width, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' }); }
        else if (obstacleType === 'wall') { const wallHeight = Math.random() * 60 + 50; obstacles.push({ type: 'wall', x: canvas.width, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }); }
        else if (obstacleType === 'roof_spike') { obstacles.push({ type: 'roof_spike', x: canvas.width, width: 50, height: 50, color: '#c70039' }); }

        const lastObstacle = obstacles[obstacles.length-1];
        if (Math.random() < 0.4) {
            const collectibleType = Math.random() < 0.7 ? 'star' : 'heart';
            collectibles.push({ type: collectibleType, x: lastObstacle.x + lastObstacle.width / 2, y: lastObstacle.y - 40, size: collectibleType === 'star' ? 15 : 20, points: collectibleType === 'star' ? 50 : 150, rotation: 0, color: collectibleType === 'star' ? '#fffb00' : '#ff1a75'});
        }
    }

    for (const obs of obstacles) {
        obs.x -= gameSpeed;
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
        // UUSI: Törmäystarkistus katto-piikeille
        else if (obs.type === 'roof_spike') {
             if (player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y < obs.height) {
                if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver';
             }
        }
    }
    
    // ...loppuosa funktiosta pysyy ennallaan...
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    for (let i = collectibles.length - 1; i >= 0; i--) { /* ... */ }
    for (let i = particles.length - 1; i >= 0; i--) { /* ... */ }
    score += 0.1; gameSpeed += 0.0005;
}

function drawDynamicBackground() { /* ...ei muutoksia... */ }

function drawGame() {
    drawDynamicBackground();
    for (const p of particles) { /* ... */ }
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    
    // Piirretään pisteet ja taso
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Taso: ${currentLevel}`, canvas.width - 10, 30);

    // UUSI: "Taso ylös!" -viestin piirtäminen
    if (levelUp.active) {
        ctx.fillStyle = `rgba(255, 255, 255, ${levelUp.timer / 60})`; // Häivytetään viestiä
        ctx.font = '50px "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Taso ${currentLevel}!`, canvas.width / 2, canvas.height / 2);
    }
}

function drawMenu() { /* ...ei muutoksia... */ }
function drawGameOver() { /* ...ei muutoksia... */ }

function resetGame() {
    player.y = canvas.height / 2;
    player.velocityY = 0; player.rotation = 0;
    player.doubleJumpUsed = false;
    obstacles = []; particles = []; collectibles = [];
    score = 0; gameSpeed = 5;
    currentColorIndex = 0; colorTransitionProgress = 0;
    currentLevel = 1; // UUSI: Nollataan taso
    levelUp.active = false;
}

function gameLoop() { /* ...ei muutoksia... */ }
function unlockAllAudio() { /* ...ei muutoksia... */ }
function handleInputPress(x, y) { /* ...ei muutoksia... */ }
function handleInputRelease() { /* ...ei muutoksia... */ }

// ... (Event Listeners ja pelin käynnistys pysyvät ennallaan) ...
