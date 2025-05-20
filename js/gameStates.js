// Assumes 'canvas', 'ctx', 'drawGame', 'player', 'students', 'tables', 'currentDay', 'gameTime', 'gamePaused', 
// 'initializeAllStudents', 'spawnPowerUps', 'updateCamera', 'showGameMessage', 'isTouchDevice', 'setupMobileControls',
// 'specialAbilities', 'keys', 'joystick', 'KREMER_TABLE_INDEX', 'FADE_SPEED', 'fadeOverlayAlpha', 'drawRect', 'drawText'
// are globally available or passed as needed.

const gameStates = {
    MENU: 'menu', GAME: 'game', PAUSED: 'paused',
    GAME_OVER: 'gameOver', VICTORY: 'victory', INSTRUCTIONS: 'instructions',
    DAY_TRANSITION_OUT: 'dayTransitionOut', DAY_TRANSITION_IN: 'dayTransitionIn',
    currentState: 'menu', // Initial state
    startScreen: {
        title: "Catch The Students!",
        subtitle: "Can you bring them all back to class?",
        options: [
            { text: "Start Game", action: () => gameStates.startGame() },
            { text: "How to Play", action: () => gameStates.showInstructionsScreen() }
        ],
        selectedOption: 0,
        fullscreenButtonRect: null,
        draw: function() {
            // ... (Keep existing startScreen.draw logic, ensure 'drawRect', 'drawText' are accessible)
            ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(32, canvas.width / 18, canvas.height / 15)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText(this.title, canvas.width / 2, canvas.height / 3);
            ctx.font = `${Math.min(16, canvas.width / 30, canvas.height / 25)}px "Press Start 2P"`;
            ctx.fillText(this.subtitle, canvas.width / 2, canvas.height / 3 + Math.min(40, canvas.height / 10));
            ctx.font = `${Math.min(20, canvas.width / 25, canvas.height / 20)}px "Press Start 2P"`;
            this.options.forEach((option, i) => {
                ctx.fillStyle = (i === this.selectedOption) ? '#ffcc00' : '#fff';
                ctx.fillText((i === this.selectedOption ? '> ' : '') + option.text + (i === this.selectedOption ? ' <' : ''), canvas.width / 2, canvas.height / 2 + i * Math.min(50, canvas.height / 10) + Math.min(30, canvas.height / 15));
            });
            ctx.font = `${Math.min(12, canvas.width / 40, canvas.height / 35)}px "Press Start 2P"`; ctx.fillStyle = '#aaa';
            ctx.fillText('Navigate: Keys/Touch, Select: Enter/Tap', canvas.width / 2, canvas.height - Math.min(50, canvas.height / 8));

            if (isTouchDevice) {
                const fsBtnSize = Math.min(canvas.width, canvas.height) * 0.06;
                const fsBtnPadding = Math.min(15, canvas.width * 0.03);
                const fsBtnX = canvas.width - fsBtnSize - fsBtnPadding;
                const fsBtnY = fsBtnPadding;
                this.fullscreenButtonRect = {x: fsBtnX, y: fsBtnY, width: fsBtnSize, height: fsBtnSize};
                drawRect(fsBtnX, fsBtnY, fsBtnSize, fsBtnSize, isFullscreenActive ? 'rgba(80,80,80,0.7)' : 'rgba(120,120,120,0.7)');
                drawText(isFullscreenActive ? '[ ]' : 'FS', fsBtnX + fsBtnSize/2, fsBtnY + fsBtnSize/2 + fsBtnSize*0.1, '#fff', fsBtnSize*0.4);
            }
        },
        handleInput: function(key) {
            switch(key.toLowerCase()) {
                case 'arrowup': case 'w': this.selectedOption = Math.max(0, this.selectedOption - 1); break;
                case 'arrowdown': case 's': this.selectedOption = Math.min(this.options.length - 1, this.selectedOption + 1); break;
                case 'enter': case ' ': this.options[this.selectedOption].action(); break;
            }
        }
    },
    instructionsScreen: {
        // ... (Keep existing instructionsScreen logic)
        draw: function() {
            ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(24, canvas.width / 20, canvas.height / 18)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("How to Play", canvas.width / 2, Math.min(80, canvas.height/8));
            ctx.font = `${Math.min(11, canvas.width / 45, canvas.height / 30)}px "Press Start 2P"`; 
            ctx.textAlign = 'left';
            const instructionsText = [
                "Desktop Controls:",
                "- WASD or Arrow Keys: Move", 
                "- SHIFT: Sprint (uses stamina)",
                "- SPACE: Use Special Ability", 
                "- Q: Cycle Special Ability",
                "- P: Pause Game",
                "",
                "Mobile Controls (Landscape):",
                "- Left Joystick: Move",
                "- Bottom-Right Buttons:",
                "  'RUN': Hold to Sprint",
                "  'USE': Activate Ability",
                "  'SWAP': Cycle Ability",
                "",
                "Goal: Catch all Kremer's students before 13:00!",
                "Students get bored at their desks and might leave.",
                "Catching them repeatedly makes them mad!",
                "A new day starts if time runs out."
            ];
            const lineHeight = Math.min(22, canvas.height / 22);
            const startY = Math.min(120, canvas.height / 6);
            const startX = canvas.width / 10;
            instructionsText.forEach((text, i) => ctx.fillText(text, startX, startY + i * lineHeight));
            ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center'; 
            ctx.font = `${Math.min(16, canvas.width / 30, canvas.height / 25)}px "Press Start 2P"`;
            ctx.fillText("Tap or Press ESC/Enter to Return", canvas.width / 2, canvas.height - Math.min(50, canvas.height / 10));
        },
        handleInput: function(key) {
            if (['escape', 'enter', ' '].includes(key.toLowerCase())) {
                gameStates.currentState = gameStates.MENU;
            }
        }
    },
    pauseMenu: {
        // ... (Keep existing pauseMenu logic)
        options: [
            { text: "Resume", action: () => { gameStates.currentState = gameStates.GAME; gamePaused = false; } },
            { text: "Restart Day", action: () => gameStates.restartCurrentDay() }, 
            { text: "Main Menu", action: () => { gameStates.currentState = gameStates.MENU; gamePaused = false; gameTime = 0; currentDay = 1;} }
        ],
        selectedOption: 0,
        draw: function() {
            drawGame(); 
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(32, canvas.width / 18, canvas.height / 15)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 3);
            ctx.font = `${Math.min(20, canvas.width / 25, canvas.height / 20)}px "Press Start 2P"`;
            this.options.forEach((option, i) => {
                ctx.fillStyle = (i === this.selectedOption) ? '#ffcc00' : '#fff';
                ctx.fillText((i === this.selectedOption ? '> ' : '') + option.text + (i === this.selectedOption ? ' <' : ''), canvas.width / 2, canvas.height / 2 + i * Math.min(50, canvas.height / 10));
            });
        },
        handleInput: function(key) {
            switch(key.toLowerCase()) {
                case 'arrowup': case 'w': this.selectedOption = Math.max(0, this.selectedOption - 1); break;
                case 'arrowdown': case 's': this.selectedOption = Math.min(this.options.length - 1, this.selectedOption + 1); break;
                case 'enter': case ' ': this.options[this.selectedOption].action(); break;
                case 'escape': case 'p': gameStates.currentState = gameStates.GAME; gamePaused = false; break;
            }
        }
    },
    victoryScreen: {
        // ... (Keep existing victoryScreen logic)
        draw: function() {
            ctx.fillStyle = 'rgba(0, 0, 100, 0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) { 
                const x = (Math.sin(i * 0.1 + Date.now() * 0.0002) * 0.4 + 0.5) * canvas.width; 
                const y = (Math.cos(i * 0.1 + Date.now() * 0.0002) * 0.4 + 0.5) * canvas.height;
                const size = Math.sin(i + Date.now() * 0.002) * 1.5 + 2; 
                if (size > 0) ctx.fillRect(x, y, size, size);
            }
            ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15; ctx.fillStyle = '#ffff00';
            ctx.font = `${Math.min(36, canvas.width / 15, canvas.height / 12)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("VICTORY!", canvas.width / 2, canvas.height / 3);
            ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(20, canvas.width / 25, canvas.height / 20)}px "Press Start 2P"`;
            ctx.fillText(`All of Kremer's students captured!`, canvas.width / 2, canvas.height / 2 - Math.min(20, canvas.height/20) );
            ctx.fillText(`It took you ${currentDay} day(s).`, canvas.width / 2, canvas.height / 2 + Math.min(20, canvas.height/20));
            ctx.fillStyle = '#ffcc00'; 
            ctx.font = `${Math.min(16, canvas.width / 30, canvas.height / 25)}px "Press Start 2P"`;
            ctx.fillText("Tap or Press ENTER for Main Menu", canvas.width / 2, canvas.height / 2 + Math.min(100, canvas.height/6));
        },
        handleInput: function(key) {
            switch(key.toLowerCase()) {
                case 'enter': case ' ': gameStates.currentState = gameStates.MENU; gameTime = 0; currentDay = 1; break;
                case 'escape': gameStates.currentState = gameStates.MENU; gameTime = 0; currentDay = 1; break;
            }
        }
    },
    isTransitioningDay: function() {
        return this.currentState === this.DAY_TRANSITION_OUT || this.currentState === this.DAY_TRANSITION_IN;
    },
    startDayTransition: function() {
        if (this.isTransitioningDay()) return;
        this.currentState = this.DAY_TRANSITION_OUT;
        gamePaused = true;
        showGameMessage("End of the day...", 3000);
    },
    resetDay: function() {
        gameTime = 0;
        environment.timeOfDay = 0; // Reset environment time
        player.x = tables[KREMER_TABLE_INDEX].x + tables[KREMER_TABLE_INDEX].width / 2;
        player.y = tables[KREMER_TABLE_INDEX].y + tables[KREMER_TABLE_INDEX].height + TILE_SIZE * 2;
        player.targetX = player.x; player.targetY = player.y;
        player.stamina = player.maxStamina;

        const previouslyCaughtKremerStudentNames = students.filter(s => s.isCaught).map(s => s.name);
        
        initializeAllStudents(); // This will re-initialize students based on their names
        
        students.forEach(s => {
            s.timesCaughtThisDay = 0;
            if (previouslyCaughtKremerStudentNames.includes(s.name)) {
                s.isCaught = true;
                s.isAtSeat = true;
                s.x = s.seatX;
                s.y = s.seatY;
                s.boredom = 0;
            } else {
                s.isCaught = false;
                s.isAtSeat = false;
            }
        });
        player.captureCount = students.filter(s => s.isCaught && s.isAtSeat).length;

        spawnPowerUps();
        updateCamera(); // Ensure camera is updated after player reset
    },
    startGame: function() {
        currentDay = 1;
        player.captureCount = 0;
        initializeAllStudents(); // Initialize students for a new game
        this.resetDay(); // Reset day-specifics
        this.currentState = this.GAME;
        gamePaused = false;
        fadeOverlayAlpha = 0;
        specialAbilities.cooldown = 0; specialAbilities.active = false; specialAbilities.selectedAbility = 0;
        showGameMessage(`Day ${currentDay}: Catch the students!`);
        if (isTouchDevice) setupMobileControls();
    },
    restartCurrentDay: function() {
        // Keep track of students who were already caught for the whole game (not just this day attempt)
        const permanentlyCaughtNames = students.filter(s => s.isCaught && s.isAtSeat).map(s => s.name);

        this.resetDay(); // Resets day time, player position, re-initializes students to start-of-day state

        // Restore the "permanently" caught status for students
        let newCaptureCount = 0;
        students.forEach(s => {
            if (permanentlyCaughtNames.includes(s.name)) {
                s.isCaught = true;
                s.isAtSeat = true;
                s.x = s.seatX;
                s.y = s.seatY;
                s.boredom = 0;
                s.happiness = 50; 
                s.madness = 0;
                s.timesCaughtThisDay = 0; 
                newCaptureCount++;
            } else {
                // Students not permanently caught remain as per resetDay's initializeAllStudents
            }
        });
        player.captureCount = newCaptureCount;

        this.currentState = this.GAME;
        gamePaused = false;
        fadeOverlayAlpha = 0;
        showGameMessage(`Restarting Day ${currentDay}`);
    },
    showInstructionsScreen: function() { this.currentState = this.INSTRUCTIONS; },
    handleKeyPress: function(key) {
        switch(this.currentState) {
            case this.MENU: this.startScreen.handleInput(key); break;
            case this.INSTRUCTIONS: this.instructionsScreen.handleInput(key); break;
            case this.PAUSED: this.pauseMenu.handleInput(key); break;
            case this.VICTORY: this.victoryScreen.handleInput(key); break;
        }
    },
    update: function() {
        if (this.currentState === this.GAME && !gamePaused) {
            const allKremerStudentsCaughtAndAtSeat = students.length > 0 && students.every(s => s.isCaught && s.isAtSeat);
            if (allKremerStudentsCaughtAndAtSeat) {
                this.currentState = this.VICTORY;
                player.dx = 0; player.dy = 0; // Stop player movement
                keys.up = keys.down = keys.left = keys.right = keys.shift = false;
                if (isTouchDevice && joystick.active) { // Reset joystick
                    joystick.active = false; joystick.touchId = null;
                    joystick.stickX = joystick.x; joystick.stickY = joystick.y;
                }
            }
        } else if (this.currentState === this.DAY_TRANSITION_OUT) {
            fadeOverlayAlpha += FADE_SPEED;
            if (fadeOverlayAlpha >= 1) {
                fadeOverlayAlpha = 1;
                currentDay++;
                this.resetDay();
                showGameMessage(`Day ${currentDay}`, 3000);
                this.currentState = this.DAY_TRANSITION_IN;
            }
        } else if (this.currentState === this.DAY_TRANSITION_IN) {
            fadeOverlayAlpha -= FADE_SPEED;
            if (fadeOverlayAlpha <= 0) {
                fadeOverlayAlpha = 0;
                this.currentState = this.GAME;
                gamePaused = false;
            }
        }
    },
    draw: function() { // For drawing specific game state screens like menu, pause, etc.
        switch(this.currentState) {
            case this.MENU: this.startScreen.draw(); break;
            case this.INSTRUCTIONS: this.instructionsScreen.draw(); break;
            case this.PAUSED: this.pauseMenu.draw(); break;
            case this.VICTORY: this.victoryScreen.draw(); break;
            // GAME state drawing is handled by the main drawGame() function
        }
    }
};