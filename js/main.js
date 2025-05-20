// --- Global Canvas and Context ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameUIMessage = document.getElementById('gameUI');

// --- Global Game Variables (some might be better encapsulated later) ---
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
let isFullscreenActive = false;
let screenEdgePadding = 0;

let gameTime = 0;
let gamePaused = false;
let currentDay = 1;
let fadeOverlayAlpha = 0;

// --- Main Game Update Function ---
function update() {
    environment.updateEnvironment();
    if (!gamePaused && !gameStates.isTransitioningDay()) {
        specialAbilities.update();
        updatePlayer();
        updateKremerStudents();
        updateZivStudents();
        updatePowerUps();
    }
    updateCamera();
    gameStates.update(); // Handles game state logic like transitions, victory checks
}

// --- Main Game Draw Function ---
function draw() {
    if (gameStates.currentState === gameStates.GAME || gameStates.isTransitioningDay()) {
        drawGame(); // drawGame is defined in drawing.js
    } else if (gameStates.currentState === gameStates.PAUSED) {
        drawGame(); 
        gameStates.draw(); // Draws the pause menu over the game screen
    } else {
        gameStates.draw(); // Draws other screens like menu, instructions, victory
    }

    // Fade overlay for day transitions
    if (fadeOverlayAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeOverlayAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// --- Game Loop ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Canvas Resizing ---
let resizeCanvasScoped; // To be defined in initGame and accessible by onFullScreenChange

// --- Game Initialization ---
function initGame() {
    resizeCanvasScoped = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.width = canvas.width; // Update camera dimensions
        camera.height = canvas.height;
        screenEdgePadding = (isTouchDevice && !isFullscreenActive) ? Math.min(20, Math.min(window.innerWidth, window.innerHeight) * 0.03) : 0;
        if (isTouchDevice) setupMobileControls(); // setupMobileControls is in input.js

        // Redraw current screen on resize
        if (gameStates.currentState !== gameStates.GAME || gameStates.isTransitioningDay()) {
            if (typeof gameStates.draw === 'function') gameStates.draw();
        } else if (typeof draw === 'function') {
             draw(); // Redraw the main game screen
        }
    };
    window.addEventListener('resize', resizeCanvasScoped);
    resizeCanvasScoped(); // Initial call

    // Initialize student seats after tables are defined in students.js
    initializeStudentSeats();


    if (tables.length > KREMER_TABLE_INDEX && tables[KREMER_TABLE_INDEX]) {
        player.x = tables[KREMER_TABLE_INDEX].x + tables[KREMER_TABLE_INDEX].width / 2;
        player.y = tables[KREMER_TABLE_INDEX].y + tables[KREMER_TABLE_INDEX].height + TILE_SIZE * 2;
    } else {
        player.x = WORLD_WIDTH / 2;
        player.y = WORLD_HEIGHT / 2;
    }
    player.targetX = player.x; player.targetY = player.y;

    addInputListeners(); // Setup all input event listeners (from input.js)
    updateCamera(); // Initial camera position

    gameStates.currentState = gameStates.MENU; // Start at the menu
    gameLoop(); // Start the game loop
}

window.addEventListener('load', initGame);