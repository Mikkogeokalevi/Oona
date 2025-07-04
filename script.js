// Oona's Dash v2.0 (Toimiva koonti)

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
const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59' };
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

// --- KRIITTISET ALUSTUSFUNKTIOT ---
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
        menuStars.push({
            type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02, color: starColors[i % starColors.length]
        });
    }
}

// --- PIIRTOFUNKTIOT ---
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
    if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, canvas.height); ctx.lineTo(obs.x + obs.width / 2, canvas.height - obs.height);
        ctx.lineTo(obs.x + obs.width, canvas.height);
        ctx.closePath(); ctx.fill();
    } else if (obs.type === 'platform' || obs.type === 'wall') {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === 'roof_spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, 0);
        ctx.lineTo(obs.x + obs.width / 2, obs.height);
        ctx.lineTo(obs.x + obs.width, 0);
        ctx.closePath();
        ctx.fill();
    }
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
    for (const p of particles) {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial';
    ctx.textAlign = 'left'; ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
    ctx.textAlign = 'right'; ctx.fillText(`Taso: ${currentLevel}`, canvas.width - 10, 30);
    if (currentLevel <= levelThresholds.length) {
        const prevThreshold = levelThresholds[currentLevel - 2] || 0;
        const currentThreshold = levelThresholds[currentLevel - 1];
        const scoreInLevel = Math.floor(score - prevThreshold);
        const levelTotal = currentThreshold - prevThreshold;
        ctx.textAlign = 'center'; ctx.font = '20px Arial';
        ctx.fillText(`${scoreInLevel} / ${levelTotal}`, canvas.width / 2, 30);
    }
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
    drawObstacle({type: 'spike', x: 250, y: 0, width: 30, height: 25, color: '#af47d2'});
    ctx.fillText("Lattiapiikki", 290, yPos);
    yPos += 30;
    drawObstacle({type: 'wall', x: 250, y: canvas.height - 50, width: 20, height: 50, color: '#ff66c4'});
    ctx.fillText("Seinä (hyppää yli)", 280, yPos - 20);
    yPos += 30;
    drawObstacle({type: 'roof_spike', x: 250, y: 0, width: 30, height: 20, color: '#c70039'});
    ctx.fillText("Kattopiikki (pysy matalana)", 290, yPos - 25);
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("[ Sulje napauttamalla ]", canvas.width/2, canvas.height - 80);
}

function drawLevelComplete() {
    drawGame();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#33ff57'; ctx.textAlign = 'center';
    ctx.font = '40px Impact';
    ctx.fillText(`Onnittelut! Taso ${currentLevel} läpäisty!`, canvas.width/2, 150);
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(nextLevelButton.x, nextLevelButton.y, nextLevelButton.width, nextLevelButton.height);
    ctx.fillStyle = '#000000'; ctx.font = '24px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Aloita taso ${currentLevel + 1}`, canvas.width / 2, nextLevelButton.y + nextLevelButton.height/2);
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


// --- PELILOGIIKKA ---
function jump() {
    if (player.isGrounded) {
        player.velocityY = initialJumpStrength;
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
    }
    else if (!player.doubleJumpUsed) {
        player.doubleJumpUsed = true;
        player.velocityY = initialJumpStrength * 1.1;
        const randomSound = jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
        randomSound.currentTime = 0;
        randomSound.play();
        for(let i = 0; i < 10; i++) {
             particles.push({
                x: player.x + player.width / 2, y: player.y + player.height,
                size: Math.random() * 5 + 2, color: 'rgba(255, 255, 255, 0.8)',
                life: 1, velX: (Math.random() - 0.5) * 4, velY: Math.random() * 3 + 1
             });
        }
    }
}

function getHighScores() { const s = localStorage.getItem('oonasDashHighScores'); return s ? JSON.parse(s) : []; }
function saveHighScores() { localStorage.setItem('oonasDashHighScores', JSON.stringify(highScores)); }
function addHighScore(newScore, newName) { if (!newName || newScore === 0) return; highScores.push({ name: newName, score: newScore }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 10); saveHighScores(); }

function updateGame() {
    if (currentLevel <= levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        if (currentMusic) currentMusic.pause();
        gameState = 'levelComplete';
        return;
    }
    const transitionSpeed = 0.0005;
    colorTransitionProgress += transitionSpeed * gameSpeed;
    if (colorTransitionProgress >= 1) { colorTransitionProgress = 0; currentColorIndex = (currentColorIndex + 1) % colorSchemes.length; }
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) { player.velocityY += jumpHoldStrength; }
    player.velocityY += gravity;
    player.y += player.velocityY;
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    player.rotation += (0.05 * (gameSpeed / 5)) * direction;
    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
    
    const lastObstacle = obstacles[obstacles.length - 1];
    const spawnMargin = 350;
    const spawnCondition = !lastObstacle || (direction === 1 ? lastObstacle.x < canvas.width - spawnMargin : lastObstacle.x > spawnMargin + lastObstacle.width);
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();
        if (currentLevel === 1) { /* Only spikes */ }
        else if (currentLevel === 2) { if (rand > 0.6) obstacleType = 'wall'; }
        else if (currentLevel === 3) { if (rand > 0.65) obstacleType = 'platform'; else if (rand > 0.3) obstacleType = 'wall';}
        else if (currentLevel >= 4) { if (rand > 0.7) obstacleType = 'roof_spike'; else if (rand > 0.4) obstacleType = 'platform'; else if (rand > 0.2) obstacleType = 'wall';}
        const x = direction === 1 ? canvas.width : -60;
        let newObstacle;
        switch (obstacleType) {
            case 'spike':
                newObstacle = { type: 'spike', x: x, width: 40, height: 40, color: '#af47d2' };
                obstacles.push(newObstacle);
                break;
            case 'wall':
                const wallHeight = Math.random() * 60 + 50;
                newObstacle = { type: 'wall', x: x, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' };
                obstacles.push(newObstacle);
                break;
            case 'roof_spike':
                newObstacle = { type: 'roof_spike', x: x, width: 50, height: 50, color: '#c70039' };
                obstacles.push(newObstacle);
                break;
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

    for (const obs of obstacles) {
        obs.x -= gameSpeed * direction;
        if (obs.type === 'spike') {
             const playerBottom = player.y + player.height;
            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && playerBottom >= canvas.height - obs.height) {
                 if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver';
            }
        }
        else if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        } else if (obs.type === 'roof_spike') {
             if (player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y < obs.height) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
    }
    
    obstacles = obstacles.filter(obs => direction === 1 ? obs.x + obs.width > 0 : obs.x < canvas.width + 60);
    
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        item.x -= gameSpeed * direction; item.rotation += 0.1;
        const dx = (player.x + player.width/2) - item.x; const dy = (player.y + player.height/2) - item.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.width/2 + item.size) {
            score += item.points;
            const randomCollectSound = collectSounds[Math.floor(Math.random() * collectSounds.length)];
            randomCollectSound.play();
            collectibles.splice(i, 1);
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.velX) p.x += p.velX; else p.x -= gameSpeed * 0.8;
        if (p.velY) p.y += p.velY;
        p.life -= 0.05; p.size -= 0.1;
        if (p.life <= 0 || p.size <= 0) { particles.splice(i, 1); }
    }
    
    score += 0.1; gameSpeed += 0.0005;
}

function setupNextLevel() {
    currentLevel++;
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    if (direction === -1) { player.x = canvas.width - player.width - 150; }
    else { player.x = 150; }
    obstacles = [];
    collectibles = [];
    player.velocityY = 0;
    
    if (currentMusic) { currentMusic.pause(); }
    const musicIndex = (currentLevel - 1) % musicTracks.length;
    currentMusic = musicTracks[musicIndex];
    currentMusic.currentTime = 0;
    currentMusic.play();

    gameState = 'playing';
}

function resetGame() {
    currentLevel = 1;
    player.x = 150;
    player.y = canvas.height / 2;
    player.velocityY = 0;
    player.rotation = 0;
    player.doubleJumpUsed = false;
    obstacles = []; particles = []; collectibles = [];
    score = 0; gameSpeed = 5;
    currentColorIndex = 0; colorTransitionProgress = 0;
    levelUp.active = false;
}

function gameLoop() {
    animationFrameCounter++;
    if (gameState === 'playing') {
        updateGame();
        drawGame();
    } else if (gameState === 'menu') {
        if (showingInstructions) {
            drawInstructions();
        } else {
            menuStars.forEach(star => { star.rotation += star.rotationSpeed; });
            drawMenu();
        }
    } else if (gameState === 'gameOver') {
        drawGameOver();
    } else if (gameState === 'levelComplete') {
        drawLevelComplete();
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
    if (showingInstructions) {
        showingInstructions = false;
        return;
    }
    if (gameState === 'playing') {
        player.isJumpHeld = true;
        jump();
    } else if (gameState === 'menu') {
        const startButtonRect = {x: startButton.x, y: startButton.y, width: startButton.width, height: startButton.height};
        if (x > startButtonRect.x && x < startButtonRect.x + startButtonRect.width && y > startButtonRect.y && y < startButtonRect.y + startButtonRect.height) {
             resetGame();
             if (currentMusic) { currentMusic.pause(); }
             currentMusic = musicTracks[0];
             currentMusic.currentTime = 0;
             currentMusic.play();
             gameState = 'playing';
        }
        const infoDist = Math.sqrt((x-infoButton.x)**2 + (y-infoButton.y)**2);
        if (infoDist < infoButton.radius) {
            showingInstructions = true;
        }
    } else if (gameState === 'levelComplete') {
        const nextLvlButtonRect = {x: nextLevelButton.x, y: nextLevelButton.y, width: nextLevelButton.width, height: nextLevelButton.height};
        if (x > nextLvlButtonRect.x && x < nextLvlButtonRect.x + nextLvlButtonRect.width && y > nextLvlButtonRect.y && y < nextLvlButtonRect.y + nextLvlButtonRect.height) {
            setupNextLevel();
        }
    }
    else if (gameState === 'gameOver') {
        const finalScore = Math.floor(score);
        const name = prompt(`Peli ohi! Sait ${finalScore} pistettä. Syötä nimesi:`, "Pelaaja");
        addHighScore(finalScore, name);
        gameState = 'menu';
    }
}

function handleInputRelease() { if (gameState === 'playing') { player.isJumpHeld = false; } }

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
