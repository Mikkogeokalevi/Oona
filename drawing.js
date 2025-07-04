// Oona's Dash v1.24 - Piirtofunktiot

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
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
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
    if (currentLevel <= levelThresholds.length) {
        const prevThreshold = levelThresholds[currentLevel - 2] || 0;
        const currentThreshold = levelThresholds[currentLevel - 1];
        const scoreInLevel = Math.floor(score - prevThreshold);
        const levelTotal = currentThreshold - prevThreshold;
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText(`${scoreInLevel} / ${levelTotal}`, canvas.width / 2, 30);
    }
}

// KORJATTU: Koko päävalikon piirtofunktio on rakennettu uudelleen ja varmistettu toimivaksi.
function drawMenu() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));

    // Aaltoileva otsikko
    const titleText = "Oona's Dash";
    ctx.font = `70px "Impact", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
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

    // Aloitusnappi
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = '#000000';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Aloita peli', startButton.x + startButton.width / 2, startButton.y + startButton.height / 2);

    // Top 10 -lista
    ctx.textBaseline = 'alphabetic'; // Palautetaan normaaliin
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Arial';
    ctx.fillText('Top 10:', canvas.width / 2, 320);
    if (highScores.length === 0) {
        ctx.font = '18px Arial';
        ctx.fillText('Ei vielä tuloksia!', canvas.width / 2, 350);
    } else {
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const col1X = canvas.width / 2 - 200, col2X = canvas.width / 2 + 50;
        const startY = 350, lineHeight = 20;
        highScores.forEach((entry, index) => {
            const text = `${index + 1}. ${entry.name}: ${entry.score}`;
            if (index < 5) { ctx.fillText(text, col1X, startY + index * lineHeight); }
            else { ctx.fillText(text, col2X, startY + (index - 5) * lineHeight); }
        });
    }

    // Info-nappi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(infoButton.x, infoButton.y, infoButton.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', infoButton.x, infoButton.y + 1);
    ctx.textBaseline = 'alphabetic'; // Palautetaan oletusarvo
}


// KORJATTU: Koko ohjeikkunan piirtofunktio on rakennettu uudelleen siistimmällä asettelulla.
function drawInstructions() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ddd';
    ctx.fillRect(100, 50, canvas.width - 200, canvas.height - 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '30px Impact';
    ctx.fillText('OHJEET', canvas.width / 2, 100);

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
    drawObstacle({type: 'wall', x: 250, y: yPos - 25, width: 20, height: 25, color: '#ff66c4'});
    ctx.fillText("Seinä (hyppää yli)", 280, yPos);
    yPos += 30;
    drawObstacle({type: 'roof_spike', x: 250, y: 0, width: 30, height: 20, color: '#c70039'});
    ctx.fillText("Kattopiikki (pysy matalana)", 290, yPos - 15);
    
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("[ Sulje napauttamalla ]", canvas.width/2, canvas.height - 80);
}


function drawLevelComplete() {
    drawGame();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#33ff57';
    ctx.textAlign = 'center';
    ctx.font = '40px Impact';
    ctx.fillText(`Onnittelut! Taso ${currentLevel} läpäisty!`, canvas.width/2, 150);
    ctx.fillStyle = '#33ff57';
    ctx.fillRect(nextLevelButton.x, nextLevelButton.y, nextLevelButton.width, nextLevelButton.height);
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
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
