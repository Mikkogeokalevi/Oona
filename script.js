// Oona's Dash v5.0 (Kaikki ominaisuudet toiminnassa)

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
    for (let i = 0; i < 7; i++) {
        menuStars.push({ type: 'star', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 20 + 10, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.02, color: ['#f7ff59', '#ff66c4', '#af47d2'][i % 3] });
    }
}

function interpolateColor(c1, c2, f) {
    const p = (c, i) => parseInt(c.substring(i, i + 2), 16);
    const r1 = p(c1, 1), g1 = p(c1, 3), b1 = p(c1, 5);
    const r2 = p(c2, 1), g2 = p(c2, 3), b2 = p(c2, 5);
    const r = Math.round(r1 + f * (r2 - r1)), g = Math.round(g1 + f * (g2 - g1)), b = Math.round(b1 + f * (b2 - b1));
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

function drawExampleObstacle(item) {
    ctx.fillStyle = item.color;
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(-item.width / 2, item.height / 2); ctx.lineTo(0, -item.height / 2);
        ctx.lineTo(item.width / 2, item.height / 2); ctx.closePath(); ctx.fill();
    } else if (item.type === 'wall') {
        ctx.fillRect(-item.width/2, -item.height/2, item.width, item.height);
    } else if (item.type === 'roof_spike') {
        ctx.beginPath();
        ctx.moveTo(-item.width / 2, -item.height / 2); ctx.lineTo(0, item.height / 2);
        ctx.lineTo(item.width / 2, -item.height / 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
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
    particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    for (let i = 0; i < player.lives; i++) {
        drawCollectible({ type: 'heart', x: 30 + (i * 35), y: 60, size: 15, rotation: 0, color: '#ff1a75' });
    }
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
    ctx.font = `70px "Impact"`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
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
    ctx.fillStyle = '#000000'; ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
    ctx.fillStyle = '#000000'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
    ctx.fillText("[ Sulje napauttamalla ]", canvas.width/2, canvas.height - 60);
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
    ctx.fillStyle = '#000000'; ctx.font = '24px Arial'; ctx.textBaseline = 'middle';
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

function getHighScores() { const s = localStorage.getItem('oonasDashHighScores'); return s ? JSON.parse(s) : []; }
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
    
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    player.rotation += (0.05 * (gameSpeed / 5)) * direction;
    
    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
    
    const lastObstacle = obstacles[obstacles.length - 1];
    const spawnMargin = 350;
    const spawnCondition = !lastObstacle || (direction === 1 ? lastObstacle.x < canvas.width - spawnMargin : lastObstacle.x > spawnMargin + (lastObstacle.width || 0));
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();
        if (currentLevel === 1) {}
        else if (currentLevel === 2) { if (rand > 0.6) obstacleType = 'wall'; }
        else if (currentLevel === 3) { if (rand > 0.65) obstacleType = 'platform'; else if (rand > 0.3) obstacleType = 'wall'; }
        else if (currentLevel >= 4) { if (rand > 0.7) obstacleType = 'roof_spike'; else if (rand > 0.4) obstacleType = 'platform'; else if (rand > 0.2) obstacleType = 'wall'; }
        
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

    for (const obs of obstacles) {
        obs.x -= gameSpeed * direction;
        let hit = false;
        if (obs.type === 'spike') {
             if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y + player.height >= canvas.height - obs.height) { hit = true; }
        }
        else if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { hit = true; }
        } else if (obs.type === 'roof_spike') {
             if (player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y < obs.height) { hit = true; }
        }
        if (hit) { handlePlayerHit(); }
    }
    
    obstacles = obstacles.filter(obs => direction === 1 ? obs.x + obs.width > 0 : obs.x < canvas.width + 60);
    for (let i = collectibles.length - 1; i >= 0; i--) { /* ... */ }
    for (let i = particles.length - 1; i >= 0; i--) { /* ... */ }
    
    score += 0.1; gameSpeed += 0.0005;
}

function setupNextLevel() {
    currentLevel++;
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    if (direction === -1) { player.x = canvas.width - player.width - 150; }
    else { player.x = 150; }
    obstacles = []; collectibles = []; player.velocityY = 0;
    if (currentMusic) { currentMusic.pause(); }
    const musicIndex = (currentLevel - 1) % musicTracks.length;
    currentMusic = musicTracks[musicIndex];
    currentMusic.currentTime = 0;
    currentMusic.play();
    gameState = 'playing';
}

function resetGame() {
    currentLevel = 1; player.x = 150; player.y = canvas.height / 2;
    player.velocityY = 0; player.rotation = 0; player.doubleJumpUsed = false;
    player.lives = 3; player.invincibleTimer = 0;
    obstacles = []; particles = []; collectibles = [];
    score = 0; gameSpeed = 5;
    currentColorIndex = 0; colorTransitionProgress = 0;
    levelUp.active = false;
}

function gameLoop() {
    animationFrameCounter++;
    if (gameState === 'playing') { updateGame(); drawGame(); }
    else if (gameState === 'menu') {
        if (showingInstructions) { drawInstructions(); }
        else { menuStars.forEach(star => { star.rotation += star.rotationSpeed; }); drawMenu(); }
    }
    else if (gameState === 'gameOver') { drawGameOver(); }
    else if (gameState === 'levelComplete') { drawLevelComplete(); }
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
    if (showingInstructions) { showingInstructions = false; return; }
    if (gameState === 'playing') { player.isJumpHeld = true; jump(); }
    else if (gameState === 'menu') {
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
        if (infoDist < infoButton.radius) { showingInstructions = true; }
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
