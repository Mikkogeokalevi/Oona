// Oona's Dash v1.16

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
const player = {
    x: 150, y: 300, width: 40, height: 40,
    velocityY: 0, rotation: 0, isGrounded: false,
    isJumpHeld: false,
    doubleJumpUsed: false, // UUSI: Seuraa onko tuplahyppy käytetty
    color: '#f7ff59'
};
const gravity = 0.9;
const initialJumpStrength = -11; // Hieman säädetty tuplahypyn takia
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

// MUUTETTU: jump-funktio tukee nyt tuplahyppyä
function jump() {
    // Tavallinen hyppy maasta
    if (player.isGrounded) {
        player.velocityY = initialJumpStrength;
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
    } 
    // Tuplahyppy ilmasta, jos sitä ei ole vielä käytetty
    else if (!player.doubleJumpUsed) {
        player.doubleJumpUsed = true; // Merkitään tuplahyppy käytetyksi
        player.velocityY = initialJumpStrength * 1.1; // Annetaan pieni lisäpotku
        
        // Soitetaan hyppyääni
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
        
        // Luodaan visuaalinen tehoste tuplahypylle
        for(let i = 0; i < 10; i++) {
             particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                size: Math.random() * 5 + 2,
                color: 'rgba(255, 255, 255, 0.8)',
                life: 1,
                velX: (Math.random() - 0.5) * 4,
                velY: Math.random() * 3 + 1
             });
        }
    }
}

function drawCollectible(item) { /* ...ei muutoksia... */ }
function drawObstacle(obs) { /* ...ei muutoksia... */ }
function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }

// --- Pelilogiikan päivitysfunktiot ---
function updateGame() {
    const transitionSpeed = 0.0005;
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

    // MUUTETTU: Kun pelaaja osuu maahan, tuplahyppy "ladataan" uudelleen
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
        player.doubleJumpUsed = false; // Ladataan tuplahyppy
        player.rotation = 0;
    }
    
    // ... (Esteiden ja keräilyesineiden luominen pysyy ennallaan) ...
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) { /* ... */ }

    for (const obs of obstacles) {
        obs.x -= gameSpeed;
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) {
                player.y = obs.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.doubleJumpUsed = false; // MUUTETTU: Ladataan tuplahyppy myös tason päällä
                player.rotation = 0;
            }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
    }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

    // ... (Keräilyesineiden ja partikkelien käsittely pysyy ennallaan) ...
    for (let i = collectibles.length - 1; i >= 0; i--) { /* ... */ }
    
    // Päivitetään partikkelit (myös tuplahypyn tehoste)
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.velX || 0; // Käytetään velX/velY jos on, muuten vanha logiikka
        p.y += p.velY || 0;
        if(!p.velX) p.x -= gameSpeed * 0.8;
        
        p.life -= 0.05;
        p.size -= 0.1;
        if (p.life <= 0 || p.size <= 0) {
            particles.splice(i, 1);
        }
    }
    score += 0.1;
    gameSpeed += 0.0005;
}

// --- Piirtofunktiot ---
function drawDynamicBackground() { /* ...ei muutoksia... */ }
function drawGame() {
    drawDynamicBackground();
    // Piirretään partikkelit
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
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
    player.y = canvas.height / 2;
    player.velocityY = 0;
    player.rotation = 0;
    player.doubleJumpUsed = false; // Nollataan myös resetissä
    obstacles = [];
    particles = [];
    collectibles = [];
    score = 0;
    gameSpeed = 5;
    currentColorIndex = 0;
    colorTransitionProgress = 0;
}
function gameLoop() { /* ...ei muutoksia... */ }
function unlockAllAudio() { /* ...ei muutoksia... */ }
function handleInputPress(x, y) { /* ...ei muutoksia... */ }
function handleInputRelease() { /* ...ei muutoksia... */ }

// ... (Event Listeners ja pelin käynnistys pysyvät ennallaan) ...
