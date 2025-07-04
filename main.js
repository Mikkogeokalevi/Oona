// Oona's Dash v1.23 - Päälogiikka

// KORJATTU: Nämä kriittiset alustusfunktiot puuttuivat aiemmin ja aiheuttivat virheen.
function resizeCanvas() {
    const aspectRatio = 16 / 9;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;
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
    const spawnCondition = direction === 1 ? (!lastObstacle || lastObstacle.x < canvas.width - spawnMargin) : (!lastObstacle || lastObstacle.x > spawnMargin);
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();
        if (currentLevel === 1) { /* only spikes */ }
        else if (currentLevel === 2) { if (rand > 0.6) obstacleType = 'wall'; }
        else if (currentLevel >= 3) { if (rand > 0.75) obstacleType = 'roof_spike'; else if (rand > 0.5) obstacleType = 'platform'; else if (rand > 0.25) obstacleType = 'wall';}
        
        const x = direction === 1 ? canvas.width : -60;
        let newObstacle;
        if (obstacleType === 'spike') { newObstacle = { type: 'spike', x: x, width: 60, height: 60, color: '#af47d2' }; }
        else if (obstacleType === 'platform') { newObstacle = { type: 'platform', x: x, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' }; }
        else if (obstacleType === 'wall') { const wallHeight = Math.random() * 60 + 50; newObstacle = { type: 'wall', x: x, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }; }
        else if (obstacleType === 'roof_spike') { newObstacle = { type: 'roof_spike', x: x, width: 50, height: 50, color: '#c70039' }; }
        obstacles.push(newObstacle);

        if (Math.random() < 0.4 && newObstacle.type !== 'roof_spike') {
             const collectibleType = Math.random() < 0.7 ? 'star' : 'heart';
             collectibles.push({ type: collectibleType, x: newObstacle.x + newObstacle.width/2, y: newObstacle.y - 40, size: collectibleType === 'star' ? 15 : 20, points: collectibleType === 'star' ? 50 : 150, rotation: 0, color: collectibleType === 'star' ? '#fffb00' : '#ff1a75'});
        }
    }

    for (const obs of obstacles) {
        obs.x -= gameSpeed * direction;
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        } else if (obs.type === 'roof_spike') {
             if (player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y < obs.height) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
    }
    
    obstacles = obstacles.filter(obs => direction === 1 ? obs.x + obs.width > 0 : obs.x < canvas.width);
    
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
        if (direction === 1 && item.x < -20) collectibles.splice(i, 1);
        if (direction === -1 && item.x > canvas.width + 20) collectibles.splice(i, 1);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.velX) p.x += p.velX; else p.x -= gameSpeed * 0.8;
        if (p.velY) p.y += p.velY;
        p.life -= 0.05;
        p.size -= 0.1;
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
    if(currentMusic) currentMusic.play();
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
        const startDist = Math.sqrt((x-startButton.x-startButton.width/2)**2 + (y-startButton.y-startButton.height/2)**2);
        if (startDist < startButton.width/2) {
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
    } else if (gameState === 'levelComplete') {
        const nextLvlDist = Math.sqrt((x-nextLevelButton.x-nextLevelButton.width/2)**2 + (y-nextLevelButton.y-nextLevelButton.height/2)**2);
        if (nextLvlDist < nextLevelButton.width/2) {
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
