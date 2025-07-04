// Oona's Dash v3.0 (Vakaa pohja)

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
const levelThresholds = [100, 600, 1200, 2000]; // Pisterajat, mutta vain vaikeustaso kasvaa
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
    nextLevelButton.x = canvas.width / 2 - nextLevelButton.width / 2; nextLevelButton.y = canvas.height / 2;
    infoButton.x = canvas.width - 40; infoButton.y = 40;
}

function initializeMenuStars() {
    menuStars = [];
    const starColors = ['#f7ff59', '#ff66c4', '#af47d2'];
    for (let i = 0; i < 7; i++) {
        menuStars.push({ type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.02, color: starColors[i % starColors.length] });
    }
}

function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16), g1 = parseInt(color1.substring(3, 5), 16), b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16), g2 = parseInt(color2.substring(3, 5), 16), b2 = parseInt(color2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1)), g = Math.round(g1 + factor * (g2 - g1)), b = Math.round(b1 + factor * (b2 - b1));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// --- PIIRTOFUNKTIOT ---
function drawPlayer() {
    ctx.save();
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 6) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotation);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}
//... (Muut piirtofunktiot, jotka toimivat)

// --- PÄÄPELILOGIIKKA ---
function updateGame() {
    // Yksinkertaistettu päivityslogiikka ilman suunnanvaihtoja
    // ...
}

function resetGame() {
    currentLevel = 1;
    player.x = 150;
    // ...muut nollaukset
}

// ... loput funktiot...
// KOKO KOODI ALLA

// Oona's Dash v3.0 (Vakaa pohja)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const musicTracks = [ new Audio('music0.mp3'), new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
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
let currentColorIndex = 0, colorTransitionProgress = 0;

let gameState = 'menu', showingInstructions = false, animationFrameCounter = 0;
let currentLevel = 1;
const levelThresholds = [100, 600, 1200, 2000];

const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59' };
const gravity = 0.9, initialJumpStrength = -11, jumpHoldStrength = -1;
let gameSpeed = 5, score = 0;
let obstacles = [], particles = [], collectibles = [], highScores = [], menuStars = [];
const startButton = { x: 0, y: 0, width: 200, height: 50 };
const infoButton = { x: 0, y: 0, radius: 15 };

function resizeCanvas() {
    canvas.width = 800;
    canvas.height = 450;
    startButton.x = canvas.width / 2 - startButton.width / 2;
    startButton.y = canvas.height / 2;
    infoButton.x = canvas.width - 40;
    infoButton.y = 40;
}

function initializeMenuStars() {
    menuStars = [];
    const starColors = ['#f7ff59', '#ff66c4', '#af47d2'];
    for (let i = 0; i < 7; i++) {
        menuStars.push({ type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.02, color: starColors[i % starColors.length] });
    }
}

function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16), g1 = parseInt(color1.substring(3, 5), 16), b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16), g2 = parseInt(color2.substring(3, 5), 16), b2 = parseInt(color2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1)), g = Math.round(g1 + factor * (g2 - g1)), b = Math.round(b1 + factor * (b2 - b1));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotation);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

function drawCollectible(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);
    ctx.fillStyle = item.color;
    if (item.type === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * item.size, -Math.sin((18 + i * 72) * Math.PI / 180) * item.size);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * item.size / 2, -Math.sin((54 + i * 72) * Math.PI / 180) * item.size / 2);
        }
        ctx.closePath();
        ctx.fill();
    } else if (item.type === 'heart') {
        const s = item.size * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, s * 2);
        ctx.bezierCurveTo(-s * 4, -s * 2, -s * 2, -s * 5, 0, -s * 3);
        ctx.bezierCurveTo(s * 2, -s * 5, s * 4, -s * 2, 0, s * 2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawObstacle(obs) {
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
}

function drawDynamicBackground() {
    const nextColorIndex = (currentColorIndex + 1) % colorSchemes.length;
    const topColor = interpolateColor(colorSchemes[currentColorIndex].top, colorSchemes[nextColorIndex].top, colorTransitionProgress);
    const bottomColor = interpolateColor(colorSchemes[currentColorIndex].bottom, colorSchemes[nextColorIndex].bottom, colorTransitionProgress);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGame() {
    drawDynamicBackground();
    drawPlayer();
    obstacles.forEach(drawObstacle);
    collectibles.forEach(drawCollectible);
    particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Taso: ${currentLevel}`, canvas.width - 10, 30);
}

function drawMenu() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    const titleText = "Oona's Dash";
    ctx.font = `70px "Impact", sans-serif`;
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
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
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
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

function drawGameOver() {
    drawDynamicBackground();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff'; ctx.font = '40px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Peli ohi!', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '20px Arial';
    ctx.fillText(`Sait ${Math.floor(score)} pistettä`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Jatka päävalikkoon napauttamalla', canvas.width / 2, canvas.height / 2 + 40);
}

function jump() {
    if (player.isGrounded) {
        player.velocityY = initialJumpStrength;
        jumpSounds[0].currentTime = 0; jumpSounds[0].play();
    } else if (!player.doubleJumpUsed) {
        player.doubleJumpUsed = true;
        player.velocityY = initialJumpStrength;
        jumpSounds[1].currentTime = 0; jumpSounds[1].play();
    }
}

function getHighScores() { const s = localStorage.getItem('oonasDashHighScores'); return s ? JSON.parse(s) : []; }
function saveHighScores() { localStorage.setItem('oonasDashHighScores', JSON.stringify(highScores)); }
function addHighScore(newScore, newName) { if (!newName || newScore === 0) return; highScores.push({ name: newName, score: newScore }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); saveHighScores(); }

function updateGame() {
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) {
        player.velocityY += jumpHoldStrength;
    }
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.rotation += 0.05 * (gameSpeed / 5);
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
        player.doubleJumpUsed = false;
    }
    const lastObstacle = obstacles[obstacles.length - 1];
    if (!lastObstacle || lastObstacle.x < canvas.width - 250) {
        const obstacleHeight = Math.random() * 100 + 50;
        obstacles.push({ x: canvas.width, y: canvas.height - obstacleHeight, width: 30, height: obstacleHeight, color: '#33ff57' });
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
            if(currentMusic) currentMusic.pause();
            crashSound.play();
            gameState = 'gameOver';
        }
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }
    score += 0.1;
    gameSpeed += 0.001;
}

function resetGame() {
    player.x = 150;
    player.y = canvas.height / 2;
    player.velocityY = 0;
    player.rotation = 0;
    player.doubleJumpUsed = false;
    obstacles = [];
    particles = [];
    collectibles = [];
    score = 0;
    gameSpeed = 5;
    currentLevel = 1;
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

function unlockAllAudio() {
    if (audioInitialized) return;
    const allAudio = [...musicTracks, ...jumpSounds, ...collectSounds, crashSound];
    allAudio.forEach(sound => { sound.play(); sound.pause(); sound.currentTime = 0; });
    audioInitialized = true;
}

function handleInputPress(x, y) {
    unlockAllAudio();
    if (gameState === 'playing') {
        player.isJumpHeld = true;
        jump();
    } else if (gameState === 'menu') {
        if (x > startButton.x && x < startButton.x + startButton.width && y > startButton.y && y < startButton.y + startButton.height) {
            resetGame();
            if (currentMusic) { currentMusic.pause(); }
            currentMusic = musicTracks[Math.floor(Math.random() * musicTracks.length)];
            currentMusic.currentTime = 0;
            currentMusic.play();
            gameState = 'playing';
        }
        const infoDist = Math.sqrt((x-infoButton.x)**2 + (y-infoButton.y)**2);
        if (infoDist < infoButton.radius) {
            showingInstructions = true;
        }
    } else if (gameState === 'gameOver') {
        const finalScore = Math.floor(score);
        const name = prompt(`Peli ohi! Sait ${finalScore} pistettä. Syötä nimesi:`, "Pelaaja");
        addHighScore(finalScore, name);
        gameState = 'menu';
    }
}

function handleInputRelease() {
    if (gameState === 'playing') {
        player.isJumpHeld = false;
    }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); handleInputPress((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height)); });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleInputPress((t.clientX - r.left) * (canvas.width/r.width), (t.clientY - r.top) * (canvas.height/r.height)); }, { passive: false });
window.addEventListener('touchend', e => { e.preventDefault(); handleInputRelease(); });

function initializeApp() {
    resizeCanvas();
    initializeMenuStars();
    highScores = getHighScores();
    gameLoop();
}

initializeApp();
