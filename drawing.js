// Oona's Dash v1.22 - Piirtofunktiot

function interpolateColor(color1, color2, factor) { /* ...ei muutoksia... */ }
function drawPlayer() { /* ...ei muutoksia... */ }
function drawCollectible(item) { /* ...ei muutoksia... */ }
function drawObstacle(obs) { /* ...ei muutoksia... */ }
function drawDynamicBackground() { /* ...ei muutoksia... */ }

function drawGame() {
    drawDynamicBackground();
    for (const p of particles) { /* Piirrä partikkelit */ }
    ctx.globalAlpha = 1.0;
    collectibles.forEach(drawCollectible);
    drawPlayer();
    obstacles.forEach(drawObstacle);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Pisteet: ${Math.floor(score)}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Taso: ${currentLevel}`, canvas.width - 10, 30);

    // UUSI: Tason etenemisen näyttäminen
    if (currentLevel <= levelThresholds.length) {
        const prevThreshold = levelThresholds[currentLevel - 2] || 0;
        const currentThreshold = levelThresholds[currentLevel - 1];
        const scoreInLevel = Math.floor(score - prevThreshold);
        const levelTotal = currentThreshold - prevThreshold;
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText(`${scoreInLevel} / ${levelTotal}`, canvas.width / 2, 30);
    }

    if (levelUp.active) { /* ...ei muutoksia... */ }
}

function drawMenu() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    // Piirrä aaltoileva otsikko...
    /* ... */
    
    // UUSI: Piirrä Info-nappi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(infoButton.x, infoButton.y, infoButton.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', infoButton.x, infoButton.y + 1);
    ctx.textBaseline = 'alphabetic'; // Palauta oletusarvo
    
    // Piirrä loput valikosta...
    /* ... */
}

// UUSI: Funktio ohjeikkunan piirtämiseen
function drawInstructions() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star)); // Piirretään tähdet taustalle
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '30px Impact';
    ctx.fillText('OHJEET', canvas.width / 2, 80);

    ctx.font = '18px Arial';
    ctx.fillText("Paina ja pidä pohjassa hypätäksesi korkeammalle.", canvas.width/2, 120);
    ctx.fillText("Voit hypätä kerran ilmassa (tuplahyppy).", canvas.width/2, 145);

    // Esimerkit
    ctx.textAlign = 'left';
    ctx.fillText("Kerää näitä:", 150, 200);
    drawCollectible({type: 'star', x: 300, y: 195, size: 15, rotation: 0, color: '#fffb00'});
    ctx.fillText("+50 pistettä", 330, 200);
    drawCollectible({type: 'heart', x: 300, y: 225, size: 20, rotation: 0, color: '#ff1a75'});
    ctx.fillText("+150 pistettä", 330, 230);
    
    ctx.fillText("Varo näitä:", 150, 280);
    drawObstacle({type: 'wall', x: 300, y: canvas.height - 50, width: 30, height: 50, color: '#ff66c4'});
    ctx.fillText("Seinä (hyppää yli)", 340, 300);
    drawObstacle({type: 'roof_spike', x: 300, y: 0, width: 40, height: 40, color: '#c70039'});
    ctx.fillText("Kattopiikki (pysy matalana)", 350, 30);
    
    // Sulje-nappi
    ctx.fillStyle = '#ff3333';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("[ Sulje ]", canvas.width/2, canvas.height - 50);
}

// UUSI: Funktio tason läpäisyruudun piirtämiseen
function drawLevelComplete() {
    drawGame(); // Piirretään pelitilanne taustalle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#33ff57';
    ctx.textAlign = 'center';
    ctx.font = '40px Impact';
    ctx.fillText(`Onnittelut! Taso ${currentLevel-1} läpäisty!`, canvas.width/2, 150);

    // Jatka-nappi
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(nextLevelButton.x, nextLevelButton.y, nextLevelButton.width, nextLevelButton.height);
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.fillText(`Aloita taso ${currentLevel}`, canvas.width / 2, nextLevelButton.y + 32);
}

function drawGameOver() { /* ...ei muutoksia... */ }
