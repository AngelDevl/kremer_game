// Assumes 'ctx', 'canvas', 'player', 'specialAbilities', 'students', 'environment', 'currentDay', 'gameTime', 'gameStates', 'isTouchDevice', 'drawMobileControls', 'gameUIMessage' are globally available

function showGameMessage(message, duration = 2000) {
    gameUIMessage.textContent = message;
    gameUIMessage.classList.remove('hidden');
    setTimeout(() => {
        // Only hide if the message hasn't been replaced by a newer one
        if (gameUIMessage.textContent === message) {
            gameUIMessage.classList.add('hidden');
        }
    }, duration);
}

function drawUI() {
    const barWidth = Math.min(150, canvas.width * 0.20);
    const barHeight = Math.min(15, canvas.height * 0.025);
    const padding = Math.min(10, Math.min(canvas.width, canvas.height) * 0.015);
    const fontSizeSmall = Math.max(8, Math.min(10, Math.min(canvas.width, canvas.height) / 60));
    const fontSizeMedium = Math.max(10, Math.min(12, Math.min(canvas.width, canvas.height) / 50));

    // Stamina Bar
    drawRect(padding, padding, barWidth, barHeight, 'rgba(0,0,0,0.5)');
    const staminaWidth = (player.stamina / player.maxStamina) * (barWidth - 4);
    ctx.fillStyle = player.isSprinting ? '#ff9900' : '#22cc22';
    ctx.fillRect(padding + 2, padding + 2, staminaWidth > 0 ? staminaWidth : 0, barHeight - 4);

    // Ability Cooldown Bar
    const abilityBarY = padding + barHeight + padding / 2;
    drawRect(padding, abilityBarY, barWidth, barHeight, 'rgba(0,0,0,0.5)');
    const cooldownWidth = (1 - specialAbilities.cooldown / specialAbilities.maxCooldown) * (barWidth - 4);
    ctx.fillStyle = specialAbilities.cooldown === 0 ? '#22aaff' : '#aaaaaa';
    ctx.fillRect(padding + 2, abilityBarY + 2, cooldownWidth > 0 ? cooldownWidth : 0, barHeight - 4);
    
    drawText(specialAbilities.available[specialAbilities.selectedAbility].name, padding + barWidth + padding, abilityBarY + barHeight/2 + fontSizeSmall/2.5, '#fff', fontSizeSmall, 'left');

    // Students Captured Text
    const studentsTextY = abilityBarY + barHeight + padding;
    drawText(`Students: ${player.captureCount}/${students.length}`, padding, studentsTextY, '#fff', fontSizeMedium, 'left');

    // Game Time Display
    const currentTotalGameHours = GAME_DAY_START_HOUR + (environment.timeOfDay * GAME_DAY_DURATION_HOURS);
    const displayHour = Math.floor(currentTotalGameHours);
    const displayMinute = Math.floor((currentTotalGameHours % 1) * 60);
    const gameTimeDisplayY = studentsTextY + fontSizeMedium + padding / 2;
    drawText(`Time: ${displayHour < 10 ? '0' : ''}${displayHour}:${displayMinute < 10 ? '0' : ''}${displayMinute}`, padding, gameTimeDisplayY, '#fff', fontSizeMedium, 'left');

    // Day Display
    drawText(`Day: ${currentDay}`, canvas.width - padding, padding + fontSizeSmall, '#fff', fontSizeSmall, 'right');
    
    // Controls Hint
    if (Date.now() % 2000 < 1000 && gameTime < 10 && gameStates.currentState === gameStates.GAME && !gameStates.isTransitioningDay()) {
        const hintText = isTouchDevice ? 'Joystick:Move, Buttons:Actions' : 'WASD/Arrows:Move, SHIFT:Sprint, SPACE:Ability, Q:Cycle, P:Pause';
        drawText(hintText, canvas.width / 2, canvas.height - padding - 5, '#ccc', fontSizeSmall);
    }

    if (isTouchDevice) {
        drawMobileControls(); // Defined in input.js but called from UI drawing
    }
}

// Fullscreen functions (can also be in utils.js if preferred)
function requestNativeFullScreen() {
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) { 
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) { 
        canvas.msRequestFullscreen();
    }
}

function exitNativeFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { 
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { 
        document.msExitFullscreen();
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        requestNativeFullScreen();
    } else {
        exitNativeFullScreen();
    }
}

function onFullScreenChange() {
    // Assumes 'isFullscreenActive', 'screenEdgePadding', 'isTouchDevice', 'canvas', 'camera', 'gameStates', 'draw' are globally available
    // and 'resizeCanvasScoped' is globally available from main.js
    isFullscreenActive = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    if (typeof resizeCanvasScoped === 'function') { // Ensure resizeCanvasScoped is defined
        resizeCanvasScoped();
    } else {
        console.error("resizeCanvasScoped function not found for onFullScreenChange.");
    }
}