// Assumes 'ctx' is globally available from main.js

function drawRect(x, y, width, height, color, alpha = 1) {
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color; ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = oldAlpha;
}

function drawText(text, x, y, color = '#fff', size = 10, align = 'center', alpha = 1) {
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color; ctx.font = `${size}px 'Press Start 2P'`; ctx.textAlign = align; ctx.fillText(text, x, y);
    ctx.globalAlpha = oldAlpha;
}

function drawCircle(x, y, radius, color, alpha = 1) {
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = oldAlpha;
}

function drawGrid() {
    // Assumes 'camera', 'TILE_SIZE', 'ctx', 'specialAbilities' are globally available
    let gridStrokeStyle = 'rgba(58, 58, 58, 0.5)';
    let gridLineWidth = 0.5;

    // Time warp effect could modify grid, but currently handled by overlay in drawGame
    // if (specialAbilities.timeWarpEffectActive) {
    //     gridStrokeStyle = 'rgba(100, 100, 250, 0.4)'; // Example: bluish grid
    // }
            
    ctx.strokeStyle = gridStrokeStyle; 
    ctx.lineWidth = gridLineWidth; 
    const gridSize = TILE_SIZE * 5;
    const startX = Math.floor(camera.x / gridSize) * gridSize; 
    const endX = Math.ceil((camera.x + camera.width / camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize; 
    const endY = Math.ceil((camera.y + camera.height / camera.zoom) / gridSize) * gridSize;

    for (let gx = startX; gx < endX; gx += gridSize) { ctx.beginPath(); ctx.moveTo(gx, startY); ctx.lineTo(gx, endY); ctx.stroke(); }
    for (let gy = startY; gy < endY; gy += gridSize) { ctx.beginPath(); ctx.moveTo(startX, gy); ctx.lineTo(endX, gy); ctx.stroke(); }
}


function drawGame() {
    // Assumes all game objects (camera, environment, tables, ziv, students, powerUps, player, etc.)
    // and helper functions (drawRect, drawText, getMoodEmoji, etc.) are globally available
    // Assumes 'ctx', 'canvas' are globally available

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const bgColor = environment.getBackgroundColor();
    ctx.fillStyle = bgColor;
    ctx.fillRect(camera.x, camera.y, camera.width / camera.zoom, camera.height / camera.zoom);

    const lightLevel = environment.getLightLevel();
    drawGrid();

    tables.forEach(table => {
        drawRect(table.x, table.y, table.width, table.height, table.color, lightLevel);
        if (table.name === "Dining Table" && !table.isBench) {
            const tabletopPadding = TILE_SIZE * 0.2;
            drawRect(table.x + tabletopPadding, table.y + tabletopPadding,
                     table.width - 2 * tabletopPadding, table.height - 2 * tabletopPadding, 'rgba(0,0,0,0.15)', lightLevel);
        } else if (table.id === "kremer_table" || table.id === "ziv_table") {
            drawText(table.name, table.x + table.width / 2, table.y + table.height / 2 - 5, '#eee', 8, 'center', lightLevel);
        }
    });

    drawRect(ziv.x, ziv.y, ziv.width, ziv.height, ziv.color, lightLevel);
    drawText(ziv.name, ziv.x + ziv.width / 2, ziv.y - 6, '#fff', 8, 'center', lightLevel);

    // Kremer Seats & Seated Students
    kremerSeatPositions.forEach((seat) => {
        const studentAtSeat = students.find(s => s.isCaught && s.isAtSeat && s.seatX === seat.x && s.seatY === seat.y);
        if (studentAtSeat) {
            drawRect(seat.x, seat.y, TILE_SIZE, TILE_SIZE, studentAtSeat.color, lightLevel);
            const moodEmoji = getMoodEmoji(studentAtSeat);
            drawText(`${moodEmoji} ${studentAtSeat.name} (K)`, seat.x + TILE_SIZE / 2, seat.y - 9, '#fff', 9, 'center', lightLevel);
        } else {
            drawRect(seat.x, seat.y, TILE_SIZE, TILE_SIZE, '#555', lightLevel);
        }
    });

    // Ziv Seats (visual squares)
    zivSeatPositions.forEach(seat => {
        drawRect(seat.x, seat.y, TILE_SIZE, TILE_SIZE, '#4a4a4a', lightLevel);
    });

    powerUps.forEach(powerUp => {
        const pulseScale = 0.8 + Math.sin(powerUp.pulseTimer) * 0.2; const size = TILE_SIZE * pulseScale;
        const pX = powerUp.x + TILE_SIZE/2; const pY = powerUp.y + TILE_SIZE/2;
        drawCircle(pX, pY, size/2 * 1.5, powerUp.type.color, lightLevel * (0.3 + Math.sin(powerUp.pulseTimer * 1.5) * 0.2));
        drawCircle(pX, pY, size/2, powerUp.type.color, lightLevel);
        drawText(powerUp.type.name.charAt(0), pX, pY + 4, '#fff', 12, 'center', lightLevel);
    });

    // Wandering or returning Kremer Students
    students.forEach(s => {
        if (!s.isAtSeat) {
            drawRect(s.x, s.y, s.width, s.height, s.color, lightLevel);
            const moodEmoji = getMoodEmoji(s);
            drawText(`${moodEmoji} ${s.name} (K)`, s.x + s.width / 2, s.y - 9, '#fff', 9, 'center', lightLevel);
            const messageYOffset = s.y - 9 - 10; // Place message above name
            if (s.currentMessage && s.messageTimer > 0) drawText(s.currentMessage, s.x + s.width / 2, messageYOffset, '#ffcc00', 10, 'center', lightLevel);
            else if (s.isAfraidOfTeacher) drawText("!", s.x + s.width / 2, messageYOffset, '#ff3333', 10, 'center', lightLevel);

            if (player.radarActive && !s.isCaught) {
                const dist = distance(player, s); const maxRadarDist = TILE_SIZE * 40;
                if (dist < maxRadarDist) {
                    const radarIntensity = Math.max(0.2, 1 - dist / maxRadarDist);
                    const pulseSize = (4 + Math.sin(Date.now() * 0.008 + s.id.hashCode()) * 2) * radarIntensity;
                    drawCircle(s.x + s.width / 2, s.y + s.height / 2, pulseSize, `rgba(255, 100, 100, ${radarIntensity * 0.7})`, lightLevel);
                }
            }
            if (s.frozenTimer && s.frozenTimer > 0) {
                drawRect(s.x - 2, s.y - 2, s.width + 4, s.height + 4, `rgba(173, 216, 230, ${0.3 + (s.frozenTimer % 60) / 120})`, lightLevel);
                for(let k=0; k<3; k++) drawRect(s.x + Math.random()*s.width - 2, s.y + Math.random()*s.height - 2, 4, 4, 'rgba(220, 250, 255, 0.6)', lightLevel);
            }
        }
    });

    // All Ziv Students (drawn over their seats if applicable, or at wandering pos)
    zivStudents.forEach(s => {
        drawRect(s.x, s.y, s.width, s.height, s.color, lightLevel);
        drawText(`${s.name} (Z)`, s.x + s.width / 2, s.y - 9, '#fff', 9, 'center', lightLevel);
    });

    drawRect(player.x, player.y, player.width, player.height, player.color, lightLevel);
    drawText(player.name, player.x + player.width / 2, player.y - 6, '#fff', 8, 'center', lightLevel);
    if (player.attractionField) {
        const oldGlobalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = lightLevel * oldGlobalAlpha;
        const pulse = Math.sin(Date.now() * 0.006) * 0.1;
        ctx.strokeStyle = `rgba(255, 0, 204, ${0.3 + pulse * 0.2})`; ctx.lineWidth = 2 + pulse;
        ctx.beginPath(); ctx.arc(player.x + player.width/2, player.y + player.height/2, player.attractionRadius * (0.9 + pulse * 0.05) , 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = oldGlobalAlpha;
    }

    // Time Warp visual effect overlay
    if (specialAbilities.timeWarpEffectActive) {
        const overlayAlpha = 0.05 + Math.sin(Date.now() * 0.005) * 0.03; // Subtle pulse
        ctx.fillStyle = `rgba(70, 70, 150, ${overlayAlpha * lightLevel})`; // Bluish tint
        ctx.fillRect(camera.x, camera.y, camera.width / camera.zoom, camera.height / camera.zoom);
    }

    ctx.restore();
    drawUI(); // UI drawn outside camera transform
}