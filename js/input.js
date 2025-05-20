// Assumes 'gameStates', 'player', 'specialAbilities', 'canvas', 'keys', 'isTouchDevice', 'joystick', 'mobileButtons', 'screenEdgePadding'
// 'gamePaused', 'showGameMessage', 'toggleFullScreen' are globally available

const keys = { up: false, down: false, left: false, right: false, shift: false, space: false, q: false, p: false, enter: false, escape: false };

const joystick = {
    x: 0, y: 0, radius: 0, stickX: 0, stickY: 0, stickRadius: 0,
    active: false, touchId: null, maxDisplacement: 0, visible: false
};
const mobileButtons = {
    sprint: { x: 0, y: 0, width: 0, height: 0, text: "RUN", pressed: false, visible: false, touchId: null },
    activate: { x: 0, y: 0, width: 0, height: 0, text: "USE", pressed: false, visible: false },
    cycle: { x: 0, y: 0, width: 0, height: 0, text: "SWAP", pressed: false, visible: false }
};

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (gameStates.isTransitioningDay()) return;

    if (gameStates.currentState !== gameStates.GAME) {
        gameStates.handleKeyPress(e.key);
        return;
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "shift", " ", "q", "p", "escape"].includes(key)) e.preventDefault();
    
    switch (key) {
        case 'arrowup': case 'w': keys.up = true; break;
        case 'arrowdown': case 's': keys.down = true; break;
        case 'arrowleft': case 'a': keys.left = true; break;
        case 'arrowright': case 'd': keys.right = true; break;
        case 'shift': keys.shift = true; player.isSprinting = true; break;
        case ' ': keys.space = true; specialAbilities.activateAbility(); break;
        case 'q': keys.q = true; specialAbilities.cycleAbility(); break;
        case 'p':
            if (gameStates.currentState === gameStates.GAME && !gamePaused) {
                gamePaused = true;
                gameStates.currentState = gameStates.PAUSED;
            } else if (gameStates.currentState === gameStates.PAUSED && gamePaused) {
                gameStates.pauseMenu.options[0].action(); // Resume
            }
            break;
        case 'escape':
            if (gameStates.currentState === gameStates.GAME && !gamePaused) {
                gamePaused = true; gameStates.currentState = gameStates.PAUSED;
            } else if (gameStates.currentState === gameStates.PAUSED) {
                gameStates.pauseMenu.options[0].action(); // Resume
            }
            break;
    }
    if (gameStates.currentState === gameStates.GAME && !isTouchDevice) updatePlayerVelocity();
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (gameStates.isTransitioningDay()) return;
    if (gameStates.currentState !== gameStates.GAME) return;
    switch (key) {
        case 'arrowup': case 'w': keys.up = false; break;
        case 'arrowdown': case 's': keys.down = false; break;
        case 'arrowleft': case 'a': keys.left = false; break;
        case 'arrowright': case 'd': keys.right = false; break;
        case 'shift': keys.shift = false; player.isSprinting = false; break;
        case ' ': keys.space = false; break;
        case 'q': keys.q = false; break;
    }
    if (gameStates.currentState === gameStates.GAME && !isTouchDevice) updatePlayerVelocity();
}

function updatePlayerVelocity() {
    if (isTouchDevice && joystick.active) return; // Mobile input handles dx/dy directly

    player.dx = 0; player.dy = 0;
    if (keys.up) player.dy = -1; if (keys.down) player.dy = 1;
    if (keys.left) player.dx = -1; if (keys.right) player.dx = 1;
    if (player.dx !== 0 && player.dy !== 0) {
        const length = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
        player.dx /= length; player.dy /= length;
    }
}

function setupMobileControls() {
    if (!isTouchDevice) return;
    joystick.visible = true;
    mobileButtons.sprint.visible = true;
    mobileButtons.activate.visible = true;
    mobileButtons.cycle.visible = true;

    joystick.radius = Math.min(canvas.width, canvas.height) * 0.11;
    joystick.x = joystick.radius * 1.3 + screenEdgePadding;
    joystick.y = canvas.height - joystick.radius * 1.3 - screenEdgePadding;
    joystick.stickRadius = joystick.radius * 0.45;
    joystick.stickX = joystick.x;
    joystick.stickY = joystick.y;
    joystick.maxDisplacement = joystick.radius - joystick.stickRadius;

    const buttonHeight = Math.min(canvas.width, canvas.height) * 0.07;
    const buttonWidth = buttonHeight * 1.7;
    const buttonMargin = buttonHeight * 0.25;

    mobileButtons.sprint.width = buttonWidth;
    mobileButtons.sprint.height = buttonHeight;
    mobileButtons.sprint.x = canvas.width - buttonWidth - buttonMargin - screenEdgePadding;
    mobileButtons.sprint.y = canvas.height - buttonHeight - buttonMargin - screenEdgePadding;
    
    mobileButtons.activate.width = buttonWidth;
    mobileButtons.activate.height = buttonHeight;
    mobileButtons.activate.x = canvas.width - buttonWidth - buttonMargin - screenEdgePadding;
    mobileButtons.activate.y = mobileButtons.sprint.y - buttonHeight - buttonMargin;

    mobileButtons.cycle.width = buttonWidth;
    mobileButtons.cycle.height = buttonHeight;
    mobileButtons.cycle.x = canvas.width - buttonWidth - buttonMargin - screenEdgePadding;
    mobileButtons.cycle.y = mobileButtons.activate.y - buttonHeight - buttonMargin;
}

function drawMobileControls() {
    // Assumes 'isTouchDevice', 'joystick', 'mobileButtons', 'gameStates', 'drawCircle', 'drawRect', 'drawText' are globally available
    if (!isTouchDevice || !joystick.visible || gameStates.isTransitioningDay()) return;

    drawCircle(joystick.x, joystick.y, joystick.radius, 'rgba(80, 80, 80, 0.4)');
    drawCircle(joystick.stickX, joystick.stickY, joystick.stickRadius, joystick.active ? 'rgba(180, 180, 180, 0.8)' : 'rgba(120, 120, 120, 0.6)');

    Object.values(mobileButtons).forEach(button => {
        if (button.visible) {
            drawRect(button.x, button.y, button.width, button.height, button.pressed ? 'rgba(100, 100, 100, 0.8)' : 'rgba(60, 60, 60, 0.6)');
            drawText(button.text, button.x + button.width / 2, button.y + button.height / 2 + button.height*0.1, '#fff', Math.min(12, button.height * 0.3), 'center');
        }
    });
}

function isTouchInCircle(touchX, touchY, circleX, circleY, circleRadius) {
    const dx = touchX - circleX;
    const dy = touchY - circleY;
    return (dx * dx + dy * dy) < (circleRadius * circleRadius);
}

function isTouchInRect(touchX, touchY, rect) {
    return touchX >= rect.x && touchX <= rect.x + rect.width &&
           touchY >= rect.y && touchY <= rect.y + rect.height;
}


function addInputListeners() { // Call this in main.js init
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    canvas.addEventListener('touchstart', function(e) {
        if (!isTouchDevice) return;
        e.preventDefault(); 
        const rect = canvas.getBoundingClientRect();

        if (gameStates.isTransitioningDay()) return;

        if (gameStates.currentState !== gameStates.GAME) {
            const touch = e.changedTouches[0]; 
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            if (gameStates.currentState === gameStates.MENU && gameStates.startScreen.fullscreenButtonRect && 
                isTouchInRect(touchX, touchY, gameStates.startScreen.fullscreenButtonRect)) {
                toggleFullScreen(); // Assumes toggleFullScreen is global
                return;
            }

            if (gameStates.currentState === gameStates.MENU || gameStates.currentState === gameStates.PAUSED) {
                let menuSystem = (gameStates.currentState === gameStates.MENU) ? gameStates.startScreen : gameStates.pauseMenu;
                const optionHeight = Math.min(50, canvas.height / 10); 
                const firstOptionYBase = (gameStates.currentState === gameStates.MENU) ? canvas.height / 2 + Math.min(30, canvas.height / 15) : canvas.height / 2;
                for(let i=0; i < menuSystem.options.length; i++) {
                    const optionCenterY = firstOptionYBase + i * optionHeight;
                    const optionTopY = optionCenterY - optionHeight / 2;
                    const optionBottomY = optionCenterY + optionHeight / 2;
                    if (touchY > optionTopY && touchY < optionBottomY) {
                        menuSystem.selectedOption = i;
                        menuSystem.handleInput('enter'); 
                        return;
                    }
                }
            } else if (gameStates.currentState === gameStates.INSTRUCTIONS || gameStates.currentState === gameStates.GAME_OVER || gameStates.currentState === gameStates.VICTORY) {
                gameStates.handleKeyPress('enter');
            }
            return;
        }
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            if (!joystick.active && joystick.visible && isTouchInCircle(touchX, touchY, joystick.x, joystick.y, joystick.radius * 1.3)) { 
                joystick.active = true;
                joystick.touchId = touch.identifier;
                const dxJoy = touchX - joystick.x;
                const dyJoy = touchY - joystick.y;
                const dist = Math.sqrt(dxJoy * dxJoy + dyJoy * dyJoy);
                if (dist > joystick.maxDisplacement) {
                    joystick.stickX = joystick.x + (dxJoy / dist) * joystick.maxDisplacement;
                    joystick.stickY = joystick.y + (dyJoy / dist) * joystick.maxDisplacement;
                } else {
                    joystick.stickX = touchX;
                    joystick.stickY = touchY;
                }
                player.dx = (joystick.stickX - joystick.x) / joystick.maxDisplacement;
                player.dy = (joystick.stickY - joystick.y) / joystick.maxDisplacement;
                continue; 
            }
            if (mobileButtons.sprint.visible && isTouchInRect(touchX, touchY, mobileButtons.sprint)) {
                keys.shift = true; player.isSprinting = true;
                mobileButtons.sprint.pressed = true;
                mobileButtons.sprint.touchId = touch.identifier;
                continue;
            }
            if (mobileButtons.activate.visible && isTouchInRect(touchX, touchY, mobileButtons.activate)) {
                specialAbilities.activateAbility();
                mobileButtons.activate.pressed = true;
                setTimeout(() => { mobileButtons.activate.pressed = false; }, 150);
                continue;
            }
            if (mobileButtons.cycle.visible && isTouchInRect(touchX, touchY, mobileButtons.cycle)) {
                specialAbilities.cycleAbility();
                mobileButtons.cycle.pressed = true;
                setTimeout(() => { mobileButtons.cycle.pressed = false; }, 150);
                continue;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
        if (!isTouchDevice || gameStates.currentState !== gameStates.GAME || gamePaused || gameStates.isTransitioningDay()) return; 
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (joystick.active && touch.identifier === joystick.touchId) {
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                let dxJoy = touchX - joystick.x;
                let dyJoy = touchY - joystick.y;
                const dist = Math.sqrt(dxJoy * dxJoy + dyJoy * dyJoy);

                if (dist === 0) { 
                    player.dx = 0;
                    player.dy = 0;
                    joystick.stickX = joystick.x;
                    joystick.stickY = joystick.y;
                    return;
                }

                if (dist > joystick.maxDisplacement) {
                    dxJoy = (dxJoy / dist) * joystick.maxDisplacement;
                    dyJoy = (dyJoy / dist) * joystick.maxDisplacement;
                }
                joystick.stickX = joystick.x + dxJoy;
                joystick.stickY = joystick.y + dyJoy;
                player.dx = dxJoy / joystick.maxDisplacement;
                player.dy = dyJoy / joystick.maxDisplacement;
                
                if (player.dx !== 0 || player.dy !== 0) { 
                    const length = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
                    if (length > 1) { 
                        player.dx /= length; player.dy /= length;
                    }
                }
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function(e) {
        if (!isTouchDevice || gameStates.currentState !== gameStates.GAME || gameStates.isTransitioningDay()) return;
         for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (joystick.active && touch.identifier === joystick.touchId) {
                joystick.active = false;
                joystick.touchId = null;
                joystick.stickX = joystick.x;
                joystick.stickY = joystick.y;
                player.dx = 0;
                player.dy = 0;
            }
            if (mobileButtons.sprint.touchId === touch.identifier) {
                keys.shift = false; player.isSprinting = false;
                mobileButtons.sprint.pressed = false;
                mobileButtons.sprint.touchId = null;
            }
        }
    });

    document.addEventListener('fullscreenchange', onFullScreenChange);
    document.addEventListener('webkitfullscreenchange', onFullScreenChange);
    document.addEventListener('msfullscreenchange', onFullScreenChange);
}