const player = {
    name: "Kremer",
    x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2,
    width: TILE_SIZE, height: TILE_SIZE,
    color: PLAYER_COLOR,
    baseSpeed: 25,
    currentSpeed: 25,
    sprintMultiplier: 1.8,
    targetX: WORLD_WIDTH / 2, targetY: WORLD_HEIGHT / 2,
    dx: 0, dy: 0,
    movementSmoothing: 0.2,
    stamina: 100, maxStamina: 100,
    staminaRegenRate: 0.5, staminaDepletionRate: 0.8,
    isSprinting: false,
    captureCount: 0,
    radarActive: false,
    attractionField: false, attractionRadius: 0, attractionForce: 0
};

function updatePlayer() {
    if (gamePaused || gameStates.isTransitioningDay()) return;

    // Handle sprinting and stamina
    if (player.isSprinting && keys.shift && player.stamina > 0) {
        player.currentSpeed = player.baseSpeed * player.sprintMultiplier;
        player.stamina = Math.max(0, player.stamina - player.staminaDepletionRate);
        if (player.stamina <= 0) {
            player.isSprinting = false;
            keys.shift = false;
            if (isTouchDevice && mobileButtons.sprint.pressed) mobileButtons.sprint.pressed = false;
        }
    } else {
        player.currentSpeed = player.baseSpeed;
        if (player.stamina < player.maxStamina) player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
    }

    // Store previous position
    const prevX = player.x;
    const prevY = player.y;
    
    // Calculate movement delta
    let moveDeltaX = 0;
    let moveDeltaY = 0;
    if (player.dx !== 0 || player.dy !== 0) {
        moveDeltaX = player.dx * player.currentSpeed;
        moveDeltaY = player.dy * player.currentSpeed;
    }
    
    // Try separate X and Y movements to avoid getting stuck on corners
    let newX = player.x + moveDeltaX;
    let newY = player.y + moveDeltaY;
    
    // Keep within world bounds
    newX = Math.max(0, Math.min(newX, WORLD_WIDTH - player.width));
    newY = Math.max(0, Math.min(newY, WORLD_HEIGHT - player.height));
    
    // Check collision for X movement only
    let canMoveX = true;
    let tempPlayer = {...player, x: newX};
    for (const table of tables) {
        if (table.isBench) continue;
        if (checkCollision(tempPlayer, table)) {
            canMoveX = false;
            break;
        }
    }
    
    // Check collision for Y movement only
    let canMoveY = true;
    tempPlayer = {...player, y: newY};
    for (const table of tables) {
        if (table.isBench) continue;
        if (checkCollision(tempPlayer, table)) {
            canMoveY = false;
            break;
        }
    }
    
    // Apply movements separately
    if (canMoveX) player.targetX = newX;
    if (canMoveY) player.targetY = newY;
    
    // Now handle smooth movement
    const smoothDx = player.targetX - player.x;
    const smoothDy = player.targetY - player.y;
    
    if (Math.abs(smoothDx) > 0.1) {
        player.x += smoothDx * player.movementSmoothing;
    } else {
        player.x = player.targetX;
    }
    
    if (Math.abs(smoothDy) > 0.1) {
        player.y += smoothDy * player.movementSmoothing;
    } else {
        player.y = player.targetY;
    }
    
    // Final boundary check
    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
    
    // If we're stuck, force a small movement
    const movedDistance = Math.sqrt(Math.pow(player.x - prevX, 2) + Math.pow(player.y - prevY, 2));
    if (movedDistance < 0.1 && (player.dx !== 0 || player.dy !== 0)) {
        // Try a small forced movement
        const forceX = player.dx * Math.min(2, player.currentSpeed * 0.2);
        const forceY = player.dy * Math.min(2, player.currentSpeed * 0.2);
        
        let forcedX = player.x + forceX;
        let forcedY = player.y + forceY;
        
        // Check if we can force movements separately
        let canForceX = true;
        tempPlayer = {...player, x: forcedX};
        for (const table of tables) {
            if (table.isBench) continue;
            if (checkCollision(tempPlayer, table)) {
                canForceX = false;
                break;
            }
        }
        
        let canForceY = true;
        tempPlayer = {...player, y: forcedY};
        for (const table of tables) {
            if (table.isBench) continue;
            if (checkCollision(tempPlayer, table)) {
                canForceY = false;
                break;
            }
        }
        
        // Apply forced movements if possible
        if (canForceX) {
            player.x = forcedX;
            player.targetX = forcedX;
        }
        if (canForceY) {
            player.y = forcedY;
            player.targetY = forcedY;
        }
        
        // Final boundary check
        player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
    }
}