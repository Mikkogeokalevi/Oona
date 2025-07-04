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

// --- Pelin tilan ja muuttujien alustus ---
let gameState = 'menu';
let animationFrameCounter = 0; // UUSI: Laskuri jatkuville animaatioille

const player = {
    x: 150, y: 300, width: 40, height: 40,
    velocityY: 0, rotation: 0, isGrounded: false,
    isJumpHeld: false,
    color: '#f7ff59'
};

const gravity = 0.9;
const initialJumpStrength = -10;
const jumpHoldStrength = -1;
let gameSpeed = 5;
let score = 0;
let obstacles = [];
let particles = [];
let collectibles = [];
let highScores = [];
let menuStars = []; // UUSI: Taulukko valikon tähdille

const startButton = { x: 300, y: 250, width: 200, height: 50 };

// --- Apu- ja piirtofunktiot ---

function resizeCanvas() {
    const aspectRatio = 16 / 9;
    let newWidth = window.innerWidth; let newHeight = window.innerHeight;
    const windowAspectRatio = newWidth / newHeight;
    if (windowAspectRatio > aspectRatio) { newWidth = newHeight * aspectRatio; } else { newHeight = newWidth / aspectRatio; }
    canvas.width = 800; canvas.height = 450;
    canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`;
    startButton.x = canvas.width / 2 - startButton.width / 2; startButton.y = canvas.height / 2;
}

// UUSI: Alustetaan valikon tähdet kerran
function initializeMenuStars() {
    menuStars = []; // Tyhjennetään varmuuden vuoksi
    const starColors = ['#f7ff59', '#ff66c4', '#af47d2'];
    for (let i = 0; i < 5; i++) {
        menuStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 20 + 10,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            color: starColors[i % starColors.length]
        });
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotation);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

function jump() {
    if (player.isGrounded) {
        player.velocityY = initialJumpStrength;
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
    }
}

function drawStar(star) {
    ctx.fillStyle = star.color;
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(star.rotation);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * star.size, -Math.sin((18 + i * 72) * Math.PI / 180) * star.size);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * star.size / 2, -Math.sin((54 + i * 72) * Math.PI / 180) * star.size / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawObstacle(obs) {
    ctx.fillStyle = obs.color;
    if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, canvas.height); ctx.lineTo(obs.x + obs.width / 2, canvas.height - obs.height);
        ctx.lineTo(obs.x + obs.width, canvas.height);
        ctx.closePath(); ctx.fill();
    } else if (obs.type === 'platform' || obs.type === 'wall') {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
}

// --- Huipputulosten käsittely (localStorage) ---
function getHighScores() { const s = localStorage.getItem('oonasDashHighScores'); return s ? JSON.parse(s) : []; }
function saveHighScores() { localStorage.setItem('oonasDashHighScores', JSON.stringify(highScores)); }
function addHighScore(newScore, newName) { if (!newName || newScore === 0) return; highScores.push({ name: newName, score: newScore }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); saveHighScores(); }

// --- Pelilogiikan päivitysfunktiot ---
function updateGame() {
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
        if (Math.random() < 0.4) { collectibles.push({x: lastObstacle.x + lastObstacle.width / 2, y: lastObstacle.y - 40, size: 15, rotation: 0, color: '#fffb00'}); }
    }
    for (const obs of obstacles) {
        obs.x -= gameSpeed;
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
    }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const star = collectibles[i];
        star.x -= gameSpeed; star.rotation += 0.1;
        const dx = (player.x + player.width/2) - star.x; const dy = (player.y + player.height/2) - star.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.width/2 + star.size) {
            score += 50;
            const randomCollectSound = collectSounds[Math.floor(Math.random() * collectSounds.length)];
            randomCollectSound.play();
            collectibles.splice(i, 1);
        }
        if (star.x < -20) collectibles.splice(i, 1);
    }
    particles.push({ x: player.x + 5, y: player.y + player.height / 2, size: Math.random() * 4 + 2, color: 'rgba(247, 255, 89, 0.5)', life: 1 });
    particles = particles.filter(p => { p.x -= gameSpeed * 0.8; p.life -= 0.05; p.size -= 0.1; return p.life > 0 && p.size > 0; });
    score += 0.1; gameSpeed += 0.0005;
}

// --- Piirtofunktiot ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawStar);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
}

function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // MUUTETTU: Piirretään pyörivät taustatähdet
    menuStars.forEach(drawStar);

    // MUUTETTU: Piirretään aaltoileva otsikko
    const titleText = "Oona's Dash";
    const titleFontSize = 70;
    ctx.font = `${titleFontSize}px "Impact", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    const waveSpeed = 0.05;
    const waveAmplitude = 8;
    const letterSpacing = 0.8;
    
    // Lasketaan koko tekstin leveys, jotta voimme keskittää sen manuaalisesti
    let totalWidth = 0;
    for (let i = 0; i < titleText.length; i++) {
        totalWidth += ctx.measureText(titleText[i]).width * letterSpacing;
    }
    let currentX = (canvas.width / 2) - (totalWidth / 2);

    for (let i = 0; i < titleText.length; i++) {
        const char = titleText[i];
        const yOffset = Math.sin(animationFrameCounter * waveSpeed + i * 0.5) * waveAmplitude;
        const charWidth = ctx.measureText(char).width;
        
        ctx.fillText(char, currentX + charWidth/2, 150 + yOffset);
        currentX += charWidth * letterSpacing;
    }

    // Piirretään loput valikon elementit
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = '#000000'; ctx.font = '30px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Aloita peli', canvas.width / 2, startButton.y + 35);

    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial';
    ctx.fillText('Top 10:', canvas.width / 2, 350);
    if (highScores.length === 0) {
        ctx.font = '18px Arial'; ctx.fillText('Ei vielä tuloksia!', canvas.width / 2, 390);
    } else {
        highScores.forEach((entry, index) => {
            ctx.font = '20px Arial';
            ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, canvas.width / 2, 390 + index * 25);
        });
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff'; ctx.font = '40px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Peli ohi!', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '20px Arial';
    ctx.fillText(`Sait ${Math.floor(score)} pistettä`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Jatka päävalikkoon napauttamalla', canvas.width / 2, canvas.height / 2 + 40);
}

// --- Pelin alustus ja pääsilmukka ---
function resetGame() { player.y = canvas.height / 2; player.velocityY = 0; player.rotation = 0; obstacles = []; particles = []; collectibles = []; score = 0; gameSpeed = 5; }

function gameLoop() {
    animationFrameCounter++; // Päivitetään animaatiolaskuria joka kierroksella

    if (gameState === 'playing') {
        updateGame();
        drawGame();
    } else if (gameState === 'menu') {
        // MUUTETTU: Päivitetään valikon tähtien animaatiota
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

// --- Tapahtumankäsittelijät ---
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
    } else if (gameState === 'gameOver') {
        const finalScore = Math.floor(score);
        const name = prompt(`Peli ohi! Sait ${finalScore} pistettä. Syötä nimesi:`, "Pelaaja");
        addHighScore(finalScore, name);
        gameState = 'menu';
    }
}

function handleInputRelease() { if (gameState === 'playing') { player.isJumpHeld = false; } }

window.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); handleInputPress((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height)); });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleInputPress((t.clientX - r.left) * (canvas.width/r.width), (t.clientY - r.top) * (canvas.height/r.height)); }, { passive: false });
window.addEventListener('touchend', e => { e.preventDefault(); handleInputRelease(); });

// --- Pelin käynnistys ---
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initializeMenuStars(); // Alustetaan tähdet kerran
highScores = getHighScores();
gameLoop();
