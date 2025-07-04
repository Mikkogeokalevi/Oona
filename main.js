// Oona's Dash v1.25 - Päälogiikka

function resizeCanvas() { /* ...ei muutoksia... */ }
function initializeMenuStars() { /* ...ei muutoksia... */ }
function jump() { /* ...ei muutoksia... */ }
function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }

function updateGame() {
    if (currentLevel <= levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        if (currentMusic) currentMusic.pause();
        gameState = 'levelComplete';
        return;
    }
    
    // ... (alkuosa ennallaan) ...

    // MUUTETTU: Esteiden luominen sisältää nyt piikkejä tasojen yhteydessä
    const lastObstacle = obstacles[obstacles.length - 1];
    const spawnMargin = 350;
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    const spawnCondition = direction === 1 ? (!lastObstacle || lastObstacle.x < canvas.width - spawnMargin) : (!lastObstacle || lastObstacle.x > spawnMargin);
    if (spawnCondition) {
        let obstacleType = 'spike';
        const rand = Math.random();
        
        // Tasojen logiikka...
        if (currentLevel >= 2) { if (rand > 0.6) obstacleType = 'wall'; }
        if (currentLevel >= 3) { if (rand > 0.5) obstacleType = 'platform'; }
        if (currentLevel >= 4) { if (rand > 0.75) obstacleType = 'roof_spike'; }

        const x = direction === 1 ? canvas.width : -60;
        let newObstacle;

        if (obstacleType === 'platform') {
            newObstacle = { type: 'platform', x: x, y: canvas.height - (Math.random() * 150 + 80), width: Math.random() * 100 + 80, height: 20, color: '#ff66c4' };
            obstacles.push(newObstacle);

            // Lisää satunnaisesti piikki tason päälle tai alle
            if (Math.random() < 0.3) {
                obstacles.push({ type: 'spike', x: newObstacle.x + newObstacle.width/2 - 15, width: 30, height: 30, color: '#af47d2' });
            } else if (Math.random() < 0.2) {
                 obstacles.push({ type: 'roof_spike', x: newObstacle.x + newObstacle.width/2 - 15, width: 30, height: newObstacle.y + newObstacle.height + 30, color: '#c70039' });
            }
        } else {
            if (obstacleType === 'spike') { newObstacle = { type: 'spike', x: x, width: 60, height: 60, color: '#af47d2' }; }
            else if (obstacleType === 'wall') { const wallHeight = Math.random() * 60 + 50; newObstacle = { type: 'wall', x: x, y: canvas.height - wallHeight, width: 30, height: wallHeight, color: '#ff66c4' }; }
            else if (obstacleType === 'roof_spike') { newObstacle = { type: 'roof_spike', x: x, width: 50, height: 50, color: '#c70039' }; }
            obstacles.push(newObstacle);
        }
    }
    
    // Törmäystarkistus lattia-piikeille
    for (const obs of obstacles) {
        obs.x -= gameSpeed * direction;
        if (obs.type === 'spike') {
            const playerBottom = player.y + player.height;
            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && playerBottom >= canvas.height - obs.height) {
                 if (currentMusic) { currentMusic.pause(); } crashSound.play(); gameState = 'gameOver';
            }
        }
        // ...muut törmäystarkistukset ennallaan...
    }
    // ... (loppuosa funktiosta ennallaan) ...
}

// MUUTETTU: Vaihtaa musiikin ja valmistelee seuraavan tason
function setupNextLevel() {
    currentLevel++;
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    if (direction === -1) { player.x = canvas.width - player.width - 150; }
    else { player.x = 150; }
    obstacles = [];
    collectibles = [];
    player.velocityY = 0;
    
    // Vaihdetaan musiikki
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

// MUUTETTU: Aloittaa ensimmäisen tason musiikin
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
        if (x > startButton.x && x < startButton.x + startButton.width && y > startButton.y && y < startButton.y + startButton.height) {
            resetGame();
            if (currentMusic) { currentMusic.pause(); }
            currentMusic = musicTracks[0]; // Aloitetaan aina ensimmäisestä kappaleesta
            currentMusic.currentTime = 0;
            currentMusic.play();
            gameState = 'playing';
        }
        // ... (muu logiikka ennallaan) ...
    } else if (gameState === 'levelComplete') {
        if (x > nextLevelButton.x && x < nextLevelButton.x + nextLevelButton.width && y > nextLevelButton.y && y < nextLevelButton.y + nextLevelButton.height) {
            setupNextLevel();
        }
    }
    // ... (muu logiikka ennallaan) ...
}


// ... (loput funktiot ja event listenerit pysyvät ennallaan) ...
