// Oona's Dash v5.1

// --- PERUSMUUTTUJAT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNET ---
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
let currentColorIndex = 0, colorTransitionProgress = 0;

// --- PELIN TILA ---
let gameState = 'menu', showingInstructions = false, animationFrameCounter = 0;
let currentLevel = 1;
const levelThresholds = [100, 600, 1200, 2000];
let levelUp = { active: false, timer: 0 };

// --- PELIN ASETUKSET ---
const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59', lives: 3, invincibleTimer: 0 };
const gravity = 0.9, initialJumpStrength = -11, jumpHoldStrength = -1;
let gameSpeed = 5, score = 0;

// --- OBJEKTITAULUKOT ---
let obstacles = [], particles = [], collectibles = [], highScores = [], menuStars = [];

// --- NAPIT ---
const startButton = { x: 0, y: 0, width: 200, height: 50 };
const infoButton = { x: 0, y: 0, radius: 15 };
const nextLevelButton = { x: 0, y: 0, width: 200, height: 50 };

// --- ALUSTUS- JA APUFUNKTIOT ---
function resizeCanvas() {
    canvas.width = 800; canvas.height = 450;
    startButton.x = canvas.width / 2 - startButton.width / 2; startButton.y = canvas.height / 2;
    nextLevelButton.x = canvas.width / 2 - nextLevelButton.width / 2; nextLevelButton.y = canvas.height / 2 + 20;
    infoButton.x = canvas.width - 40; infoButton.y = 40;
}

function initializeMenuStars() {
    menuStars = [];
    const starColors = ['#f7ff59', '#ff66c4', '#af47d2'];
    for (let i = 0; i < 7; i++) {
        menuStars.push({ type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.02, color: starColors[i % 3] });
    }
}

// --- PIIRTOFUNKTIOT ---
function interpolateColor(c1, c2, f) { /* ... */ }
function drawPlayer() { /* ... */ }
function drawCollectible(item) { /* ... */ }
function drawObstacle(obs) { /* ... */ }
function drawExampleObstacle(item) { /* ... */ }
function drawDynamicBackground() { /* ... */ }
function drawGame() { /* ... */ }
function drawMenu() { /* ... */ }
function drawInstructions() { /* ... */ }
function drawLevelComplete() { /* ... */ }
function drawGameOver() { /* ... */ }


// --- PELILOGIIKKA ---
function handlePlayerHit() {
    if (player.invincibleTimer > 0) return;
    player.lives--;
    crashSound.play();
    if (player.lives <= 0) {
        if (currentMusic) currentMusic.pause();
        gameState = 'gameOver';
    } else {
        player.invincibleTimer = 120;
        obstacles = obstacles.filter(obs => obs.x > player.x + 200 || obs.x < player.x - 200);
    }
}

function jump() {
    if (player.isGrounded) {
        player.velocityY = initialJumpStrength;
        jumpSounds[0].play();
    } else if (!player.doubleJumpUsed) {
        player.doubleJumpUsed = true;
        player.velocityY = initialJumpStrength * 1.1;
        jumpSounds[1].play();
        for(let i = 0; i < 10; i++) {
             particles.push({ x: player.x + player.width / 2, y: player.y + player.height, size: Math.random() * 5 + 2, color: 'rgba(255, 255, 255, 0.8)', life: 1, velX: (Math.random() - 0.5) * 4, velY: Math.random() * 3 + 1 });
        }
    }
}

function getHighScores() { return JSON.parse(localStorage.getItem('oonasDashHighScores') || '[]'); }
function saveHighScores() { localStorage.setItem('oonasDashHighScores', JSON.stringify(highScores)); }
function addHighScore(newScore, newName) { if (!newName || newScore === 0) return; highScores.push({ name: newName, score: newScore }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); saveHighScores(); }

function updateGame() {
    if (currentLevel <= levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        if (currentMusic) currentMusic.pause();
        gameState = 'levelComplete';
        return;
    }
    if (player.invincibleTimer > 0) player.invincibleTimer--;
    
    const transitionSpeed = 0.0005;
    colorTransitionProgress += transitionSpeed * gameSpeed;
    if (colorTransitionProgress >= 1) { colorTransitionProgress = 0; currentColorIndex = (currentColorIndex + 1) % colorSchemes.length; }
    
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) player.velocityY += jumpHoldStrength;
    player.velocityY += gravity;
    player.y += player.velocityY;
    
    // KORJATTU: Pelaaja ei voi mennä ruudun yläreunan läpi.
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }
    
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    player.rotation += (0.05 * (gameSpeed / 5)) * direction;
    
    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
    
    const lastObstacle = obstacles[obstacles.length - 1];
    const spawnMargin = 350;
    const spawnCondition = !lastObstacle || (direction === 1 ? lastObstacle.x < canvas.width - spawnMargin : lastObstacle.x > spawnMargin + (lastObstacle.width || 0) );
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();

        // KORJATTU: Kattopiikkejä voi tulla jo tasolta 1 alkaen
        if (rand < 0.15 && score > 50) { // Pieni mahdollisuus kattopiikille (ei heti alussa)
            obstacleType = 'roof_spike';
        } else if (currentLevel === 1) {
            obstacleType = 'spike';
        } else if (currentLevel === 2) {
            if (rand > 0.6) obstacleType = 'wall';
        } else if (currentLevel >= 3) {
            if (rand > 0.65) obstacleType = 'platform';
            else if (rand > 0.3) obstacleType = 'wall';
        }
        
        const x = direction === 1 ? canvas.width : -60;
        let newObstacle;
        switch (obstacleType) {
            case 'spike': newObstacle = { type: 'spike', x: x, width: 40, height: 40, color: '#af47d2' }; obstacles.push(newObstacle); break;
            case 'wall': const wallHeight = Math.random() * 60 + 50; newObstacle = { type: 'wall', x: x, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }; obstacles.push(newObstacle); break;
            case 'roof_spike': newObstacle = { type: 'roof_spike', x: x, width: 50, height: 50, color: '#c70039' }; obstacles.push(newObstacle); break;
            case 'platform':
                newObstacle = { type: 'platform', x: x, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' };
                obstacles.push(newObstacle);
                if (Math.random() < 0.4) {
                    obstacles.push({ type: 'spike', x: newObstacle.x + newObstacle.width / 2 - 15, width: 30, height: 30, color: '#af47d2' });
                }
                break;
        }
        if (newObstacle && newObstacle.type !== 'roof_spike' && Math.random() < 0.4) {
             const collectibleType = Math.random() < 0.7 ? 'star' : 'heart';
             collectibles.push({ type: collectibleType, x: newObstacle.x + newObstacle.width/2, y: newObstacle.y - 40, size: collectibleType === 'star' ? 15 : 20, points: collectibleType === 'star' ? 50 : 150, rotation: 0, color: collectibleType === 'star' ? '#fffb00' : '#ff1a75'});
        }
    }
    // ... (loppuosa funktiosta ennallaan) ...
}

function setupNextLevel() { /* ...ei muutoksia... */ }
function resetGame() { /* ...ei muutoksia... */ }
function gameLoop() { /* ...ei muutoksia... */ }
function unlockAllAudio() { /* ...ei muutoksia... */ }
function handleInputPress(x, y) { /* ...ei muutoksia... */ }
function handleInputRelease() { /* ...ei muutoksia... */ }

// --- KÄYNNISTYS ---
// KORJATTU: Varmistetaan, että fontit ovat latautuneet ennen pelin aloitusta.
async function initializeApp() {
    try {
        await document.fonts.load('70px Impact');
        await document.fonts.load('16px Arial');
    } catch(e) {
        console.error("Fontin lataus epäonnistui:", e);
    }
    resizeCanvas();
    initializeMenuStars();
    highScores = getHighScores();
    gameLoop();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousedown', e => { /* ... */ });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { /* ... */ }, { passive: false });
window.addEventListener('touchend', e => { /* ... */ });

initializeApp();
