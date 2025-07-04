// Oona's Dash v1.28

// --- PERUSMUUTTUJAT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNET ---
const musicTracks = [ new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
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

// UUSI: Funktio, joka piirtää esimerkkikuvakkeet ohjeisiin oikein.
function drawExampleObstacle(item) {
    ctx.fillStyle = item.color;
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(-item.width / 2, item.height / 2);
        ctx.lineTo(0, -item.height / 2);
        ctx.lineTo(item.width / 2, item.height / 2);
        ctx.closePath();
        ctx.fill();
    } else if (item.type === 'wall') {
        ctx.fillRect(-item.width/2, -item.height/2, item.width, item.height);
    } else if (item.type === 'roof_spike') {
        ctx.beginPath();
        ctx.moveTo(-item.width / 2, -item.height / 2);
        ctx.lineTo(0, item.height / 2);
        ctx.lineTo(item.width / 2, -item.height / 2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawGame() {
    drawDynamicBackground();
    for (const p of particles) { /* ... */ }
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    for (let i = 0; i < player.lives; i++) {
        drawCollectible({ type: 'heart', x: 30 + (i * 35), y: 60, size: 15, rotation: 0, color: '#ff1a75' });
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Taso: ${currentLevel}`, canvas.width - 10, 30);
    if (currentLevel <= levelThresholds.length) {
        const prevThreshold = levelThresholds[currentLevel - 2] || 0;
        const currentThreshold = levelThresholds[currentLevel - 1];
        const scoreInLevel = Math.floor(score - prevThreshold);
        const levelTotal = currentThreshold - prevThreshold;
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText(`${scoreInLevel} / ${levelTotal}`, canvas.width / 2, 30);
    }
}

function drawMenu() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    // KORJATTU: Otsikon kirjoitusvirhe
    const titleText = "Oona's Dash";
    ctx.font = `70px "Impact", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const waveSpeed = 0.05, waveAmplitude = 8, letterSpacing = 0.8;
    let totalWidth = 0;
    for (let i = 0; i < titleText.length; i++) { totalWidth += ctx.measureText(titleText[i]).width * letterSpacing; }
    let currentX = (canvas.width / 2) - (totalWidth / 2);
    for (let i = 0; i < titleText.length; i++) {
        const char = titleText[i];
        const yOffset = Math.sin(animationFrameCounter * waveSpeed + i * 0.5) * waveAmplitude;
        const charWidth = ctx.measureText(char).width;
        ctx.fillText(char, currentX + charWidth/2, 150 + yOffset);
        currentX += charWidth * letterSpacing;
    }
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = '#000000'; ctx.font = '30px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Aloita peli', startButton.x + startButton.width / 2, startButton.y + startButton.height / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff'; ctx.font = '22px Arial';
    ctx.fillText('Top 10:', canvas.width / 2, 320);
    if (highScores.length === 0) {
        ctx.font = '18px Arial'; ctx.fillText('Ei vielä tuloksia!', canvas.width / 2, 350);
    } else {
        ctx.font = '16px Arial'; ctx.textAlign = 'left';
        const col1X = canvas.width / 2 - 200, col2X = canvas.width / 2 + 50;
        const startY = 350, lineHeight = 20;
        highScores.forEach((entry, index) => {
            const text = `${index + 1}. ${entry.name}: ${entry.score}`;
            if (index < 5) { ctx.fillText(text, col1X, startY + index * lineHeight); }
            else { ctx.fillText(text, col2X, startY + (index - 5) * lineHeight); }
        });
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath(); ctx.arc(infoButton.x, infoButton.y, infoButton.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000'; ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('i', infoButton.x, infoButton.y + 1);
    ctx.textBaseline = 'alphabetic';
}

function drawInstructions() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2;
    ctx.strokeRect(100, 50, canvas.width - 200, canvas.height - 100);
    ctx.fillRect(100, 50, canvas.width - 200, canvas.height - 100);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.font = '30px Impact'; ctx.fillText('OHJEET', canvas.width / 2, 100);
    ctx.font = '16px Arial';
    ctx.fillText("Paina ja pidä pohjassa hypätäksesi korkeammalle.", canvas.width/2, 140);
    ctx.fillText("Voit hypätä kerran ilmassa (tuplahyppy).", canvas.width/2, 165);
    ctx.textAlign = 'left';
    let yPos = 210;
    ctx.fillText("Kerää:", 150, yPos);
    drawCollectible({type: 'star', x: 250, y: yPos - 5, size: 15, rotation: animationFrameCounter * 0.1, color: '#fffb00'});
    ctx.fillText("+50 pistettä", 280, yPos);
    yPos += 30;
    drawCollectible({type: 'heart', x: 250, y: yPos - 5, size: 20, rotation: animationFrameCounter * 0.1, color: '#ff1a75'});
    ctx.fillText("+150 pistettä", 280, yPos);
    yPos += 50;
    ctx.fillText("Vältä:", 150, yPos);
    // KORJATTU: Käytetään uutta drawExampleObstacle-funktiota
    drawExampleObstacle({type: 'spike', x: 260, y: yPos, width: 25, height: 25, color: '#af47d2'});
    ctx.fillText("Lattiapiikki", 290, yPos + 5);
    yPos += 35;
    drawExampleObstacle({type: 'wall', x: 260, y: yPos, width: 20, height: 30, color: '#ff66c4'});
    ctx.fillText("Seinä (hyppää yli)", 290, yPos + 5);
    yPos += 35;
    drawExampleObstacle({type: 'roof_spike', x: 260, y: yPos, width: 25, height: 25, color: '#c70039'});
    ctx.fillText("Kattopiikki (pysy matalana)", 290, yPos + 5);
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("[ Sulje napauttamalla ]", canvas.width/2, canvas.height - 80);
}

function drawLevelComplete() { /* ...ei muutoksia... */ }
function drawGameOver() { /* ...ei muutoksia... */ }

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
        obstacles = obstacles.filter(obs => obs.x > player.x + 150 || obs.x < player.x - 150);
    }
}
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
