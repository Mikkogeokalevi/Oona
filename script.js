// Haetaan canvas-elementti HTML:stä
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNTEN LATAUS ---
// MUUTETTU: Ladataan kaikki taustamusiikit ja hyppyäänet taulukoihin
const musicTracks = [
    new Audio('music1.mp3'),
    new Audio('music2.mp3'),
    new Audio('music3.mp3'),
    new Audio('music4.mp3')
];
let currentMusic; // Pitää kirjaa soivasta kappaleesta

const jumpSounds = [
    new Audio('jump1.mp3'),
    new Audio('jump2.mp3')
];
const crashSound = new Audio('crash.mp3');

// Asetetaan kaikille musiikkikappaleille yhteiset ominaisuudet
musicTracks.forEach(track => {
    track.loop = true;
    track.volume = 0.3;
});


// --- Pelin tilan ja muuttujien alustus ---
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'

const player = {
    x: 150,
    y: 300,
    width: 40,
    height: 40,
    velocityY: 0,
    rotation: 0,
    isGrounded: false,
    color: '#f7ff59'
};

const gravity = 0.8;
const jumpStrength = -19;
let gameSpeed = 5;
let score = 0;
let obstacles = [];
let particles = [];
let highScores = [];

const startButton = { x: 300, y: 250, width: 200, height: 50 };

// --- Apu- ja piirtofunktiot ---

function resizeCanvas() {
    const aspectRatio = 16 / 9;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;
    const windowAspectRatio = newWidth / newHeight;

    if (windowAspectRatio > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }
    
    canvas.width = 800;
    canvas.height = 450;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    startButton.x = canvas.width / 2 - startButton.width / 2;
    startButton.y = canvas.height / 2;
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
        player.velocityY = jumpStrength;
        // MUUTETTU: Valitaan satunnainen hyppyääni ja soitetaan se
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
    }
}

function drawObstacle(obs) {
    ctx.fillStyle = obs.color;
    if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, canvas.height);
        ctx.lineTo(obs.x + obs.width / 2, canvas.height - obs.height);
        ctx.lineTo(obs.x + obs.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    } else if (obs.type === 'platform') {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
}

// --- Huipputulosten käsittely (localStorage) ---

function getHighScores() {
    const scores = localStorage.getItem('oonasDashHighScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScores() {
    localStorage.setItem('oonasDashHighScores', JSON.stringify(highScores));
}

function addHighScore(newScore, newName) {
    if (!newName || newScore === 0) return;
    highScores.push({ name: newName, score: newScore });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    saveHighScores();
}

// --- Pelilogiikan päivitysfunktiot ---

function updateGame() {
    player.isGrounded = false;
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.rotation += 0.05 * (gameSpeed / 5);

    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
        player.rotation = 0;
    }

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 350) {
        if (Math.random() > 0.65) {
            const platformHeight = 20;
            const platformWidth = Math.random() * 100 + 80;
            const platformY = canvas.height - (Math.random() * 150 + 80);
            obstacles.push({ type: 'platform', x: canvas.width, y: platformY, width: platformWidth, height: platformHeight, color: '#ff66c4' });
        } else {
            const spikeHeight = Math.random() * 80 + 40;
            const spikeWidth = spikeHeight * 0.7;
            obstacles.push({ type: 'spike', x: canvas.width, width: spikeWidth, height: spikeHeight, color: '#af47d2' });
        }
    }
    
    for (const obs of obstacles) {
        obs.x -= gameSpeed;
        if (obs.type === 'platform') {
            if (player.velocityY >= 0 && player.x + player.width > obs.x && player.x < obs.x + obs.width &&
                player.y + player.height > obs.y && player.y + player.height < obs.y + obs.height + 15) {
                player.y = obs.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.rotation = 0;
            }
        } else if (obs.type === 'spike') {
            const playerHitbox = { x: player.x + 10, y: player.y + 10, width: player.width - 20, height: player.height - 20 };
            if (playerHitbox.x < obs.x + obs.width && playerHitbox.x + playerHitbox.width > obs.x) {
                if (playerHitbox.y + playerHitbox.height > canvas.height - obs.height) {
                    const spikeTipX = obs.x + obs.width / 2;
                    const dx = (playerHitbox.x + playerHitbox.width / 2) - spikeTipX;
                    const dy = (playerHitbox.y + playerHitbox.height / 2) - (canvas.height - obs.height);
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                         // MUUTETTU: Pysäytetään nykyinen musiikkikappale
                         if (currentMusic) {
                            currentMusic.pause();
                         }
                         crashSound.play();
                         gameState = 'gameOver';
                    }
                }
            }
        }
    }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

    particles.push({ x: player.x + 5, y: player.y + player.height / 2, size: Math.random() * 4 + 2, color: 'rgba(247, 255, 89, 0.5)', life: 1 });
    particles = particles.filter(p => {
        p.x -= gameSpeed * 0.8; p.life -= 0.05; p.size -= 0.1;
        return p.life > 0 && p.size > 0;
    });

    score += 0.1;
    gameSpeed += 0.0005;
}

// --- Piirtofunktiot eri pelitiloille ---

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
}

function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ['#f7ff59', '#ff66c4', '#af47d2'].forEach((color, i) => {
        ctx.font = `${60 + i*20}px Arial`;
        ctx.fillStyle = color;
        ctx.fillText('★', 100 + i*150, 150 + i*50);
    });
    ctx.fillStyle = '#ffffff';
    ctx.font = '70px "Impact", sans-serif';
    ctx.fillText("Oona's Dash", canvas.width / 2, 150);
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = '#000000'; ctx.font = '30px Arial';
    ctx.fillText('Aloita peli', canvas.width / 2, startButton.y + 35);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial';
    ctx.fillText('Top 10:', canvas.width / 2, 350);
    if (highScores.length === 0) {
        ctx.font = '18px Arial';
        ctx.fillText('Ei vielä tuloksia!', canvas.width / 2, 390);
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

function resetGame() {
    player.y = canvas.height / 2;
    player.velocityY = 0; player.rotation = 0;
    obstacles = []; particles = [];
    score = 0; gameSpeed = 5;
}

function gameLoop() {
    if (gameState === 'playing') {
        updateGame();
        drawGame();
    } else if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

// --- Tapahtumankäsittelijät ---

function handleInput(x, y) {
    if (gameState === 'playing') {
        jump();
    } else if (gameState === 'menu') {
        if (x > startButton.x && x < startButton.x + startButton.width &&
            y > startButton.y && y < startButton.y + startButton.height) {
            resetGame();
            
            // MUUTETTU: Valitaan ja soitetaan satunnainen taustamusiikki
            if (currentMusic) {
                currentMusic.pause(); // Pysäytä mahdollinen edellinen musiikki
            }
            const musicIndex = Math.floor(Math.random() * musicTracks.length);
            currentMusic = musicTracks[musicIndex];
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

window.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
    handleInput(x, y);
});
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX; const y = (touch.clientY - rect.top) * scaleY;
    handleInput(x, y);
}, { passive: false });

// --- Pelin käynnistys ---
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
highScores = getHighScores();
gameLoop();