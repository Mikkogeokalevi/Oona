// Oona's Dash v1.19 - Päälogiikka

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
    // --- Tasonnousu ja värin vaihto ---
    if (currentLevel - 1 < levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        currentLevel++;
        levelUp.active = true; levelUp.timer = 120;
        gameSpeed += 0.5;
    }
    if (levelUp.active) { levelUp.timer--; if (levelUp.timer <= 0) { levelUp.active = false; } }
    const transitionSpeed = 0.0005;
    colorTransitionProgress += transitionSpeed * gameSpeed;
    if (colorTransitionProgress >= 1) { colorTransitionProgress = 0; currentColorIndex = (currentColorIndex + 1) % colorSchemes.length; }
    
    // --- Pelaajan fysiikka ---
    player.isGrounded = false;
    if (player.isJumpHeld && player.velocityY < 0) { player.velocityY += jumpHoldStrength; }
    player.velocityY += gravity;
    player.y += player.velocityY;
    
    // MUUTETTU: Pelin suunta vaikuttaa pyörimiseen ja x-sijaintiin
    const direction = currentLevel % 2 === 1 ? 1 : -1; // 1 = vasemmalta oikealle, -1 = oikealta vasemmalle
    player.rotation += (0.05 * (gameSpeed / 5)) * direction;
    player.x += player.velocityX; // Horisontaalinen liike, jos tarpeen tulevaisuudessa
    
    // --- Maahan ja tasoihin laskeutuminen ---
    if (player.y > canvas.height - player.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }

    // --- Esteiden luominen ---
    const lastObstacle = obstacles[obstacles.length - 1];
    const spawnCondition = direction === 1 ? (!lastObstacle || lastObstacle.x < canvas.width - 300) : (!lastObstacle || lastObstacle.x > 300);
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();
        if (currentLevel === 2) { if (rand > 0.6) obstacleType = 'wall'; }
        else if (currentLevel >= 3) { if (rand > 0.75) obstacleType = 'roof_spike'; else if (rand > 0.5) obstacleType = 'platform'; else if (rand > 0.25) obstacleType = 'wall';}
        
        const x = direction === 1 ? canvas.width : 0; // Aloituspiste suunnan mukaan
        if (obstacleType === 'spike') { obstacles.push({ type: 'spike', x: x, width: 60, height: 60, color: '#af47d2' }); }
        else if (obstacleType === 'platform') { obstacles.push({ type: 'platform', x: x, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' }); }
        else if (obstacleType === 'wall') { const wallHeight = Math.random() * 60 + 50; obstacles.push({ type: 'wall', x: x, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }); }
        else if (obstacleType === 'roof_spike') { obstacles.push({ type: 'roof_spike', x: x, width: 50, height: 50, color: '#c70039' }); }

        if (Math.random() < 0.4) {
             const collectibleType = Math.random() < 0.7 ? 'star' : 'heart';
             collectibles.push({ type: collectibleType, x: x, y: canvas.height / 2, size: collectibleType === 'star' ? 15 : 20, points: collectibleType === 'star' ? 50 : 150, rotation: 0, color: collectibleType === 'star' ? '#fffb00' : '#ff1a75'});
        }
    }

    // --- Törmäystarkistelut ja objektien päivitys ---
    for (const obs of obstacles) {
        obs.x -= gameSpeed * direction;
        // Törmäystarkistelut... (logiikka sama, mutta ottaa huomioon suunnan)
        if (obs.type === 'platform' || obs.type === 'wall') {
            const onTop = player.velocityY >= 0 && (player.x + player.width) > obs.x && player.x < (obs.x + obs.width) && (player.y + player.height) > obs.y && (player.y + player.height) < obs.y + 25;
            if (onTop) { player.y = obs.y - player.height; player.velocityY = 0; player.isGrounded = true; player.doubleJumpUsed = false; player.rotation = 0; }
            if (obs.type === 'wall' && !onTop && player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y + player.height > obs.y) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        } else if (obs.type === 'roof_spike') {
             if (player.x + player.width > obs.x && player.x < obs.x + obs.width && player.y < obs.height) { if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver'; }
        }
    }

    collectibles.forEach(item => item.x -= gameSpeed * direction);
    // ... muu logiikka pysyy samana ...
}

function resetGame() {
    player.y = canvas.height / 2;
    player.velocityY = 0;
    player.rotation = 0;
    player.doubleJumpUsed = false;
    // Pelaajan aloituspaikka riippuu tason suunnasta
    currentLevel = 1;
    player.x = 150;

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
    } else if (gameState === 'gameOver') {
        const finalScore = Math.floor(score);
        const name = prompt(`Peli ohi! Sait ${finalScore} pistettä. Syötä nimesi:`, "Pelaaja");
        addHighScore(finalScore, name);
        gameState = 'menu';
    }
}

function handleInputRelease() { if (gameState === 'playing') { player.isJumpHeld = false; } }

// --- Käynnistys ja tapahtumankäsittelijät ---
window.addEventListener('resize', () => {
    resizeCanvas();
    initializeMenuStars();
});
window.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); handleInputPress((e.clientX - r.left) * (canvas.width/r.width), (e.clientY - r.top) * (canvas.height/r.height)); });
window.addEventListener('mouseup', handleInputRelease);
window.addEventListener('touchstart', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleInputPress((t.clientX - r.left) * (canvas.width/r.width), (t.clientY - r.top) * (canvas.height/r.height)); }, { passive: false });
window.addEventListener('touchend', e => { e.preventDefault(); handleInputRelease(); });

resizeCanvas();
initializeMenuStars();
highScores = getHighScores();
gameLoop();