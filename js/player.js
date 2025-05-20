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
    // Assumes 'gamePaused', 'gameStates', 'keys', 'mobileButtons', 'tables' are globally available
    if (gamePaused || gameStates.isTransitioningDay()) return;

    if (player.isSprinting && keys.shift && player.stamina > 0) {
        player.currentSpeed = player.baseSpeed * player.sprintMultiplier;
        player.stamina = Math.max(0, player.stamina - player.staminaDepletionRate);
        if (player.stamina <= 0) {
            player.isSprinting = false;
            keys.shift = false; // Ensure desktop key is also reset
            if (isTouchDevice && mobileButtons.sprint.pressed) mobileButtons.sprint.pressed = false;
        }
    } else {
        player.currentSpeed = player.baseSpeed;
        if (player.stamina < player.maxStamina) player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
    }

    let moveDeltaX = 0; let moveDeltaY = 0;
    if (player.dx !== 0 || player.dy !== 0) {
        moveDeltaX = player.dx * player.currentSpeed;
        moveDeltaY = player.dy * player.currentSpeed;
    }
    
    player.targetX = player.x + moveDeltaX;
    player.targetY = player.y + moveDeltaY;

    const smoothDx = player.targetX - player.x;
    const smoothDy = player.targetY - player.y;
    if (Math.abs(smoothDx) > 0.1 || Math.abs(smoothDy) > 0.1) {
        player.x += smoothDx * player.movementSmoothing;
        player.y += smoothDy * player.movementSmoothing;
    } else {
        player.x = player.targetX;
        player.y = player.targetY;
    }

    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));

    for (const table of tables) {
        if (table.isBench) continue;
        if (checkCollision(player, table)) {
            const overlapLeft = (player.x + player.width) - table.x;
            const overlapRight = (table.x + table.width) - player.x;
            const overlapTop = (player.y + player.height) - table.y;
            const overlapBottom = (table.y + table.height) - player.y;
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) player.x = table.x - player.width;
            else if (minOverlap === overlapRight) player.x = table.x + table.width;
            else if (minOverlap === overlapTop) player.y = table.y - player.height;
            else if (minOverlap === overlapBottom) player.y = table.y + table.height;
            
            player.targetX = player.x;
            player.targetY = player.y;
        }
    }
}