const powerUps = [];
const powerUpTypes = [
    {
        name: "Speed Boost", color: "#ffcc00",
        effect: () => {
            const originalBaseSpeed = player.baseSpeed;
            player.baseSpeed *= 1.5;
            showGameMessage("Speed Boost Active!"); // Assumes showGameMessage is global
            setTimeout(() => {
                player.baseSpeed = originalBaseSpeed;
                showGameMessage("Speed boost ended!");
            }, 5000);
        }
    },
    {
        name: "Student Freeze", color: "#00ccff",
        effect: () => {
            students.forEach(s => { if (!s.isCaught) s.frozenTimer = 5 * 60; }); // Assumes 'students' is global
            showGameMessage("Student Freeze active!");
        }
    },
    {
        name: "Attraction Field", color: "#ff00cc",
        effect: () => {
            player.attractionField = true;
            player.attractionRadius = TILE_SIZE * 10;
            player.attractionForce = 0.5;
            showGameMessage("Attraction Field active!");
            setTimeout(() => {
                player.attractionField = false;
                showGameMessage("Attraction field deactivated!");
            }, 7000);
        }
    },
    {
        name: "Stamina Refill", color: "#00ff00",
        effect: () => {
            player.stamina = player.maxStamina;
            showGameMessage("Stamina Refilled!");
        }
    }
];

function spawnPowerUps() {
    // Assumes 'powerUps', 'tables', 'player', 'students', 'getRandomInt', 'distance', 'checkCollision', 'TILE_SIZE', 'WORLD_WIDTH', 'WORLD_HEIGHT', 'KREMER_TABLE_INDEX' are available
    powerUps.length = 0;
    const maxPowerUps = 5;
    const count = Math.min(maxPowerUps, Math.floor((students.length - player.captureCount) / 2.5) +1 );

    for (let i = 0; i < count; i++) {
        let x, y, validPosition; let attempts = 0;
        do {
            validPosition = true; attempts++;
            x = getRandomInt(TILE_SIZE * 2, WORLD_WIDTH - TILE_SIZE * 3); y = getRandomInt(TILE_SIZE * 2, WORLD_HEIGHT - TILE_SIZE * 3);
            const tempPowerUp = {x, y, width: TILE_SIZE, height: TILE_SIZE};
            for (const table of tables) {
                if (table.isBench) continue;
                if (checkCollision(tempPowerUp, {x: table.x - TILE_SIZE, y: table.y - TILE_SIZE, width: table.width + TILE_SIZE*2, height: table.height + TILE_SIZE*2})) {
                    validPosition = false; break;
                }
            }
            if (validPosition) for (const pUp of powerUps) if (distance(tempPowerUp, pUp) < TILE_SIZE * 8) { validPosition = false; break; }
            
            const kremerTable = tables[KREMER_TABLE_INDEX];
            const playerStartX = kremerTable.x + kremerTable.width / 2; const playerStartY = kremerTable.y + kremerTable.height + TILE_SIZE * 2;
            if (distance(tempPowerUp, {x:playerStartX, y:playerStartY, width:1, height:1}) < TILE_SIZE * 10) validPosition = false;
            
            if (attempts > 100) break;
        } while (!validPosition);

        if (validPosition) {
            const type = powerUpTypes[getRandomInt(0, powerUpTypes.length - 1)];
            powerUps.push({ x, y, width: TILE_SIZE, height: TILE_SIZE, type, pulseTimer: Math.random() * Math.PI * 2 });
        }
    }
}

function updatePowerUps() {
    // Assumes 'gamePaused', 'gameStates', 'powerUps', 'player', 'checkCollision', 'spawnPowerUps', 'students' are available
    if (gamePaused || gameStates.isTransitioningDay()) return;
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i]; powerUp.pulseTimer += 0.05;
        if (checkCollision(player, powerUp)) {
            powerUp.type.effect();
            powerUps.splice(i, 1);
        }
    }
    if (powerUps.length < 2 && Math.random() < 0.0025 && (students.length - player.captureCount > 0) ) spawnPowerUps();
}