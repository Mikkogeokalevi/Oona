// Haetaan canvas-elementti HTML:stä
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNTEN LATAUS ---
const musicTracks = [ new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
let currentMusic;
const jumpSounds = [ new Audio('jump1.mp3'), new Audio('jump2.mp3') ];
const crashSound = new Audio('crash.mp3');
// UUSI: Keräilyäänet
const collectSounds = [ new Audio('collect1.mp3'), new Audio('collect2.mp3') ];
let audioInitialized = false; // UUSI: Seurataan, onko äänet "avattu"

musicTracks.forEach(track => { track.loop = true; track.volume = 0.3; });

// --- Pelin tilan ja muuttujien alustus ---
let gameState = 'menu';

const player = {
    x: 150, y: 300, width: 40, height: 40,
    velocityY: 0, rotation: 0, isGrounded: false,
    isJumpHeld: false, // UUSI: Seuraa, onko hyppynappia pidetty pohjassa
    color: '#f7ff59'
};

const gravity = 0.9; // Hiukan vahvempi painovoima säädettävää hyppyä varten
const initialJumpStrength = -10; // UUSI: Hypyn alkuvoima
const jumpHoldStrength = -1;  // UUSI: Voima, jolla hyppyä jatketaan
let gameSpeed = 5;
let score = 0;
let obstacles = [];
let particles = [];
let collectibles = []; // UUSI: Taulukko kerättäville tähdille
let highScores = [];

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

// UUSI: Piirtofunktio tähdelle
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

    // MUUTETTU: Säädettävä hyppy
    if (player.isJumpHeld && player.velocityY < 0) {
        player.velocityY += jumpHoldStrength;
    }
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.rotation += 0.05 * (gameSpeed / 5);

    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.rotation = 0; }

    // Esteiden, seinien ja kerättävien luominen
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        const rand = Math.random();
        if (rand < 0.60) { // 60% piikki
            obstacles.push({ type: 'spike', x: canvas.width, width: 60, height: 60, color: '#af47d2' });
        } else if (rand < 0.85) { // 25% taso
            obstacles.push({ type: 'platform', x: canvas.width, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' });
        } else { // 15% seinä
            const wallHeight = Math.random() * 60 + 50;
            obstacles.push({ type: 'wall', x: canvas.width, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' });
        }
        // UUSI: Lisää tähti satunnaisesti esteen yhteyteen
        const lastObstacle = obstacles[obstacles.length-1];
        if (Math.random() < 0.4) {
             collectibles.push({x: lastObstacle.x + lastObstacle.width / 2, y: lastObstacle.y - 40, size: 15, rotation: 0, color: '#fffb00'});
        }
    }

    // Esteiden ja tasojen käsittely & törmäykset
    for (const obs of obstacles) {
        obs.x -= gameSpeed;
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) &&
                          (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) {
                player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.rotation = 0;
            }
            // UUSI: Seinään törmäys
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) {
                if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver';
            }
        }
        // Piikkiin törmäys on tarkoituksella sallittu (ei törmäystä)
    }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

    // UUSI: Kerättävien tähtien käsittely
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const star = collectibles[i];
        star.x -= gameSpeed;
        star.rotation += 0.1;
        // Törmäys pelaajaan
        const dx = (player.x + player.width/2) - star.x;
        const dy = (player.y + player.height/2) - star.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.width/2 + star.size) {
            score += 50; // Lisää pisteitä
            const randomCollectSound = collectSounds[Math.floor(Math.random() * collectSounds.length)];
            randomCollectSound.play(); // Soita keräysääni
            collectibles.splice(i, 1); // Poista tähti
        }
        if (star.x < -20) collectibles.splice(i, 1); // Poista ruudun ulkopuolelta
    }

    // Partikkelien käsittely
    particles.push({ x: player.x + 5, y: player.y + player.height / 2, size: Math.random() * 4 + 2, color: 'rgba(247, 255, 89, 0.5)', life: 1 });
    particles = particles.filter(p => { p.x -= gameSpeed * 0.8; p.life -= 0.05; p.size -= 0.1; return p.life > 0 && p.size > 0; });
    score += 0.1; gameSpeed += 0.0005;
}

// --- Piirtofunktiot ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawStar); // Piirrä tähdet
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
}

function drawMenu() { /*... (ei muutoksia)...*/ }
function drawGameOver() { /*... (ei muutoksia)...*/ }

// --- Pelin alustus ja pääsilmukka ---
function resetGame() { player.y = canvas.height / 2; player.velocityY = 0; player.rotation = 0; obstacles = []; particles = []; collectibles = []; score = 0; gameSpeed = 5; }
function gameLoop() { if (gameState === 'playing') { updateGame(); drawGame(); } else if (gameState === 'menu') { drawMenu(); } else if (gameState === 'gameOver') { drawGameOver(); } requestAnimationFrame(gameLoop); }

// UUSI: Funktio äänien "avaamiseksi" mobiililaitteilla
function unlockAllAudio() {
    if (audioInitialized) return;
    const allAudio = [...musicTracks, ...jumpSounds, ...collectSounds, crashSound];
    allAudio.forEach(sound => {
        sound.play();
        sound.pause();
        sound.currentTime = 0;
    });
    audioInitialized = true;
}

// --- Tapahtumankäsittelijät ---
function handleInputPress(x, y) {
    unlockAllAudio(); // Avataan äänet ensimmäisellä painalluksella
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
// UUSI: Käsittelijä painikkeen vapauttamiselle
function handleInputRelease() {
    if (gameState === 'playing') {
        player.isJumpHeld = false;
    }
}

// Lisätään kuuntelijat
window.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); handleInputPress((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height)); });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleInputPress((t.clientX - r.left) * (canvas.width/r.width), (t.clientY - r.top) * (canvas.height/r.height)); }, { passive: false });
window.addEventListener('touchend', e => { e.preventDefault(); handleInputRelease(); });

// --- Pelin käynnistys ---
window.addEventListener('resize', resizeCanvas); resizeCanvas(); highScores = getHighScores(); gameLoop();

// HUOM: Olen lyhentänyt joitain rivejä, jotka eivät muuttuneet, jotta koodi mahtuu paremmin.
// `drawMenu` ja `drawGameOver` ovat ennallaan. Voit kopioida tämän tiedoston kokonaan.
