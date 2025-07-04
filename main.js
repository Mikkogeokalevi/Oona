// Oona's Dash v1.22 - Päälogiikka

function resizeCanvas() { /* ...ei muutoksia... */ }
function initializeMenuStars() { /* ...ei muutoksia... */ }
function jump() { /* ...ei muutoksia... */ }
function getHighScores() { /* ...ei muutoksia... */ }
function saveHighScores() { /* ...ei muutoksia... */ }
function addHighScore(newScore, newName) { /* ...ei muutoksia... */ }

function updateGame() {
    // MUUTETTU: Tasonnousu pysäyttää pelin
    if (currentLevel <= levelThresholds.length && score >= levelThresholds[currentLevel - 1]) {
        if (currentMusic) currentMusic.pause();
        gameState = 'levelComplete';
        return; // Pysäytetään päivitys tähän
    }
    
    // ... muu updateGame-logiikka pysyy ennallaan ...
}

// UUSI: Funktio, joka valmistelee seuraavan tason alkavaksi
function setupNextLevel() {
    currentLevel++;
    // Asetetaan pelaajan sijainti uuden tason suunnan mukaan
    const direction = currentLevel % 2 === 1 ? 1 : -1;
    if (direction === -1) { player.x = canvas.width - player.width - 150; }
    else { player.x = 150; }
    
    // Tyhjennetään vanhat esteet ja kerättävät
    obstacles = [];
    collectibles = [];
    player.velocityY = 0; // Varmistetaan, ettei pelaaja putoa
    
    if(currentMusic) currentMusic.play(); // Jatketaan musiikkia
    gameState = 'playing';
}

function resetGame() { /* ...muokattu nollaamaan uudet muuttujat... */ }

function gameLoop() {
    animationFrameCounter++;
    if (gameState === 'playing') {
        updateGame();
        drawGame();
    } else if (gameState === 'menu') {
        // MUUTETTU: Näyttää joko menun tai ohjeet
        if (showingInstructions) {
            drawInstructions();
        } else {
            menuStars.forEach(star => { star.rotation += star.rotationSpeed; });
            drawMenu();
        }
    } else if (gameState === 'gameOver') {
        drawGameOver();
    } else if (gameState === 'levelComplete') { // UUSI: Pelitila
        drawLevelComplete();
    }
    requestAnimationFrame(gameLoop);
}

function unlockAllAudio() { /* ...ei muutoksia... */ }

function handleInputPress(x, y) {
    unlockAllAudio();

    if (showingInstructions) {
        showingInstructions = false; // Mikä tahansa napautus sulkee ohjeet
        return;
    }
    
    if (gameState === 'playing') {
        player.isJumpHeld = true;
        jump();
    } else if (gameState === 'menu') {
        // Tarkistetaan start-nappi
        if (x > startButton.x && x < startButton.x + startButton.width && y > startButton.y && y < startButton.y + startButton.height) {
            resetGame();
            if (currentMusic) { currentMusic.pause(); }
            currentMusic = musicTracks[Math.floor(Math.random() * musicTracks.length)];
            currentMusic.currentTime = 0;
            currentMusic.play();
            gameState = 'playing';
        }
        // Tarkistetaan info-nappi
        const dist = Math.sqrt((x-infoButton.x)**2 + (y-infoButton.y)**2);
        if (dist < infoButton.radius) {
            showingInstructions = true;
        }
    } else if (gameState === 'levelComplete') {
        // Tarkistetaan "Jatka" -nappi
        if (x > nextLevelButton.x && x < nextLevelButton.x + nextLevelButton.width && y > nextLevelButton.y && y < nextLevelButton.y + nextLevelButton.height) {
            setupNextLevel();
        }
    } else if (gameState === 'gameOver') {
        const finalScore = Math.floor(score);
        const name = prompt(`Peli ohi! Sait ${finalScore} pistettä. Syötä nimesi:`, "Pelaaja");
        addHighScore(finalScore, name);
        gameState = 'menu';
    }
}

function handleInputRelease() { /* ...ei muutoksia... */ }

// --- Käynnistys ja tapahtumankäsittelijät ---
/* ...ei muutoksia... */
