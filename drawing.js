// Oona's Dash v1.25 - Piirtofunktiot

function interpolateColor(color1, color2, factor) { /* ...ei muutoksia... */ }
function drawPlayer() { /* ...ei muutoksia... */ }
function drawCollectible(item) { /* ...ei muutoksia... */ }
function drawObstacle(obs) { /* ...ei muutoksia... */ }
function drawDynamicBackground() { /* ...ei muutoksia... */ }
function drawGame() { /* ...ei muutoksia... */ }
function drawMenu() { /* ...ei muutoksia... */ }

// KORJATTU: Ohjeikkunan ulkoasu ja sisältö päivitetty.
function drawInstructions() {
    drawDynamicBackground();
    menuStars.forEach(star => drawCollectible(star));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Harmaa taustalaatikko
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 50, canvas.width - 200, canvas.height - 100);
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
    // Kerättävät
    ctx.fillText("Kerää:", 150, yPos);
    drawCollectible({type: 'star', x: 250, y: yPos - 5, size: 15, rotation: animationFrameCounter * 0.1, color: '#fffb00'});
    ctx.fillText("+50 pistettä", 280, yPos);
    yPos += 30;
    drawCollectible({type: 'heart', x: 250, y: yPos - 5, size: 20, rotation: animationFrameCounter * 0.1, color: '#ff1a75'});
    ctx.fillText("+150 pistettä", 280, yPos);

    // Vältettävät
    yPos += 50;
    ctx.fillText("Vältä:", 150, yPos);
    drawObstacle({type: 'spike', x: 250, y: 0, width: 30, height: 25, color: '#af47d2'});
    ctx.fillText("Lattiapiikki (älä osu)", 290, yPos);
    yPos += 30;
    drawObstacle({type: 'wall', x: 250, y: canvas.height - 50, width: 20, height: 50, color: '#ff66c4'});
    ctx.fillText("Seinä (hyppää yli)", 280, yPos - 20);
    yPos += 30;
    drawObstacle({type: 'roof_spike', x: 250, y: 0, width: 30, height: 20, color: '#c70039'});
    ctx.fillText("Kattopiikki (pysy matalana)", 290, yPos - 25);
    
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("[ Sulje napauttamalla ]", canvas.width/2, canvas.height - 80);
}


function drawLevelComplete() { /* ...ei muutoksia... */ }
function drawGameOver() { /* ...ei muutoksia... */ }
