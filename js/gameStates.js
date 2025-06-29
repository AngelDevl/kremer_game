// Modified js/gameStates.js - Add multiplayer menu options
const gameStates = {
    MENU: 'menu', GAME: 'game', PAUSED: 'paused',
    GAME_OVER: 'gameOver', VICTORY: 'victory', INSTRUCTIONS: 'instructions',
    DAY_TRANSITION_OUT: 'dayTransitionOut', DAY_TRANSITION_IN: 'dayTransitionIn',
    MULTIPLAYER_MENU: 'multiplayerMenu', JOIN_ROOM: 'joinRoom',
    currentState: 'menu',
    
    startScreen: {
        title: "Catch The Students!",
        subtitle: "Can you bring them all back to class?",
        options: [
            { text: "Single Player", action: () => gameStates.startGame() },
            { text: "Multiplayer", action: () => gameStates.showMultiplayerMenu() },
            { text: "How to Play", action: () => gameStates.showInstructionsScreen() },
            { text: "About", action: () => window.location.href = "/about" },
            { text: "Privacy Policy", action: () => window.location.href = "/privacy-policy" },
            { text: "Terms Of Service", action: () => window.location.href = "/terms-of-service" },
            { text: "Buy Me A Coffee", action: () => window.location.href = "https://buymeacoffee.com/sweetasmarley" }
        ],
        selectedOption: 0,
        fullscreenButtonRect: null,
        draw: function() {
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
    
    multiplayerMenu: {
        options: [
            { text: "Create Room (Teacher)", action: () => gameStates.createMultiplayerRoom() },
            { text: "Join Room (Student)", action: () => gameStates.showJoinRoom() },
            { text: "Back", action: () => gameStates.currentState = gameStates.MENU }
        ],
        selectedOption: 0,
        draw: function() {
            ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(28, canvas.width / 20, canvas.height / 18)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("Multiplayer", canvas.width / 2, canvas.height / 3);
            
            ctx.font = `${Math.min(12, canvas.width / 35, canvas.height / 30)}px "Press Start 2P"`;
            ctx.fillStyle = '#aaa';
            ctx.fillText("Teachers create rooms, students join them", canvas.width / 2, canvas.height / 3 + 40);
            
            ctx.font = `${Math.min(18, canvas.width / 25, canvas.height / 20)}px "Press Start 2P"`;
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
                case 'escape': gameStates.currentState = gameStates.MENU; break;
            }
        }
    },
    
    joinRoomScreen: {
        roomCode: '',
        playerName: '',
        inputField: 'roomCode', // 'roomCode' or 'playerName'
        draw: function() {
            ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(24, canvas.width / 20, canvas.height / 18)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("Join Room", canvas.width / 2, canvas.height / 4);
            
            ctx.font = `${Math.min(14, canvas.width / 30, canvas.height / 25)}px "Press Start 2P"`;
            
            // Room code input
            ctx.fillStyle = this.inputField === 'roomCode' ? '#ffcc00' : '#fff';
            ctx.fillText("Room Code:", canvas.width / 2, canvas.height / 2 - 60);
            const roomCodeDisplay = this.roomCode || '_____';
            ctx.fillText(roomCodeDisplay, canvas.width / 2, canvas.height / 2 - 30);
            
            // Player name input
            ctx.fillStyle = this.inputField === 'playerName' ? '#ffcc00' : '#fff';
            ctx.fillText("Your Name:", canvas.width / 2, canvas.height / 2);
            const nameDisplay = this.playerName || 'Student';
            ctx.fillText(nameDisplay, canvas.width / 2, canvas.height / 2 + 30);
            
            // Instructions
            ctx.font = `${Math.min(10, canvas.width / 40, canvas.height / 35)}px "Press Start 2P"`;
            ctx.fillStyle = '#aaa';
            ctx.fillText("TAB: Switch fields, ENTER: Join, ESC: Back", canvas.width / 2, canvas.height - 60);
        },
        handleInput: function(key) {
            switch(key.toLowerCase()) {
                case 'tab':
                    this.inputField = this.inputField === 'roomCode' ? 'playerName' : 'roomCode';
                    break;
                case 'enter':
                    if (this.roomCode.length >= 5) {
                        gameStates.joinMultiplayerRoom(this.roomCode, this.playerName || 'Student');
                    } else {
                        showGameMessage('Enter a valid room code');
                    }
                    break;
                case 'escape':
                    gameStates.currentState = gameStates.MULTIPLAYER_MENU;
                    break;
                case 'backspace':
                    if (this.inputField === 'roomCode') {
                        this.roomCode = this.roomCode.slice(0, -1);
                    } else {
                        this.playerName = this.playerName.slice(0, -1);
                    }
                    break;
                default:
                    // Add character to appropriate field
                    if (key.length === 1) {
                        if (this.inputField === 'roomCode' && this.roomCode.length < 6) {
                            this.roomCode += key.toUpperCase();
                        } else if (this.inputField === 'playerName' && this.playerName.length < 15) {
                            this.playerName += key;
                        }
                    }
            }
        }
    },
    
    instructionsScreen: {
        draw: function() {
            ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(24, canvas.width / 20, canvas.height / 18)}px "Press Start 2P"`; 
            ctx.textAlign = 'center';
            ctx.fillText("How to Play", canvas.width / 2, Math.min(80, canvas.height/8));
            ctx.font = `${Math.min(11, canvas.width / 45, canvas.height / 30)}px "Press Start 2P"`; 
            ctx.textAlign = 'left';
            const instructionsText = [
                "Single Player:",
                "- Play as Teacher Kremer",
                "- Catch all wandering students",
                "- Bring them back to class",
                "",
                "Multiplayer:",
                "- Teachers create rooms and catch students",
                "- Students join rooms and try to avoid being caught",
                "- Share room codes with friends",
                "",
                "Desktop Controls:",
                "- WASD or Arrow Keys: Move", 
                "- SHIFT: Sprint (uses stamina)",
                "- SPACE: Use Special Ability (Teacher only)", 
                "- Q: Cycle Special Ability (Teacher only)",
                "- P: Pause Game",
                "",
                "Mobile Controls (Landscape):",
                "- Left Joystick: Move",
                "- Bottom-Right Buttons:",
                "  'RUN': Hold to Sprint",
                "  'USE': Activate Ability (Teacher)",
                "  'SWAP': Cycle Ability (Teacher)",
                "",
                "Goal: Work together or compete!",
                "Students: Don't get caught, stay free!",
                "Teachers: Catch all students before time runs out!"
            ];
            const lineHeight = Math.min(18, canvas.height / 25);
            const startY = Math.min(120, canvas.height / 6);
            const startX = canvas.width / 12;
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
        options: [
            { text: "Resume", action: () => { gameStates.currentState = gameStates.GAME; gamePaused = false; } },
            { text: "Restart Day", action: () => gameStates.restartCurrentDay() }, 
            { text: "Main Menu", action: () => { 
                multiplayerManager.cleanup(); // Disconnect from multiplayer
                gameStates.currentState = gameStates.MENU; 
                gamePaused = false; 
                gameTime = 0; 
                currentDay = 1;
            } }
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
            
            let victoryText = "VICTORY!";
            if (multiplayerManager.isMultiplayer) {
                if (multiplayerManager.playerRole === 'teacher') {
                    victoryText = "TEACHER WINS!";
                } else {
                    victoryText = "STUDENTS CAUGHT!";
                }
            }
            
            ctx.fillText(victoryText, canvas.width / 2, canvas.height / 3);
            ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; 
            ctx.font = `${Math.min(20, canvas.width / 25, canvas.height / 20)}px "Press Start 2P"`;
            
            if (multiplayerManager.isMultiplayer) {
                if (multiplayerManager.playerRole === 'teacher') {
                    ctx.fillText(`All students captured!`, canvas.width / 2, canvas.height / 2 - Math.min(20, canvas.height/20));
                } else {
                    ctx.fillText(`Better luck next time!`, canvas.width / 2, canvas.height / 2 - Math.min(20, canvas.height/20));
                }
            } else {
                ctx.fillText(`All of Kremer's students captured!`, canvas.width / 2, canvas.height / 2 - Math.min(20, canvas.height/20));
                ctx.fillText(`It took you ${currentDay} day(s).`, canvas.width / 2, canvas.height / 2 + Math.min(20, canvas.height/20));
            }
            
            ctx.fillStyle = '#ffcc00'; 
            ctx.font = `${Math.min(16, canvas.width / 30, canvas.height / 25)}px "Press Start 2P"`;
            ctx.fillText("Tap or Press ENTER for Main Menu", canvas.width / 2, canvas.height / 2 + Math.min(100, canvas.height/6));
        },
        handleInput: function(key) {
            switch(key.toLowerCase()) {
                case 'enter': case ' ': 
                    multiplayerManager.cleanup();
                    gameStates.currentState = gameStates.MENU; 
                    gameTime = 0; 
                    currentDay = 1; 
                    break;
                case 'escape': 
                    multiplayerManager.cleanup();
                    gameStates.currentState = gameStates.MENU; 
                    gameTime = 0; 
                    currentDay = 1; 
                    break;
            }
        }
    },
    
    // Multiplayer-specific methods
    showMultiplayerMenu: function() {
        this.currentState = this.MULTIPLAYER_MENU;
    },
    
    showJoinRoom: function() {
        this.currentState = this.JOIN_ROOM;
        this.joinRoomScreen.roomCode = '';
        this.joinRoomScreen.playerName = '';
        this.joinRoomScreen.inputField = 'roomCode';
    },
    
    createMultiplayerRoom: function() {
        if (!multiplayerManager.isConnected) {
            showGameMessage('Connecting to server...');
            multiplayerManager.connect();
            
            // Wait for connection then create room
            const waitForConnection = () => {
                if (multiplayerManager.isConnected) {
                    multiplayerManager.createRoom('Teacher');
                } else {
                    setTimeout(waitForConnection, 100);
                }
            };
            waitForConnection();
        } else {
            multiplayerManager.createRoom('Teacher');
        }
    },
    
    joinMultiplayerRoom: function(roomCode, playerName) {
        if (!multiplayerManager.isConnected) {
            showGameMessage('Connecting to server...');
            multiplayerManager.connect();
            
            // Wait for connection then join room
            const waitForConnection = () => {
                if (multiplayerManager.isConnected) {
                    multiplayerManager.joinRoom(roomCode, playerName);
                } else {
                    setTimeout(waitForConnection, 100);
                }
            };
            waitForConnection();
        } else {
            multiplayerManager.joinRoom(roomCode, playerName);
        }
    },
    
    // Rest of existing methods...
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
        environment.timeOfDay = 0;
        player.x = tables[KREMER_TABLE_INDEX].x + tables[KREMER_TABLE_INDEX].width / 2;
        player.y = tables[KREMER_TABLE_INDEX].y - TILE_SIZE * 1.5;
        player.targetX = player.x; 
        player.targetY = player.y;
        player.dx = 0;
        player.dy = 0;
        player.stamina = player.maxStamina;

        const previouslyCaughtKremerStudentNames = students.filter(s => s.isCaught).map(s => s.name);
        
        initializeAllStudents();
        
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
        updateCamera();
    },
    
    startGame: function() {
        currentDay = 1;
        player.captureCount = 0;
        initializeAllStudents();
        this.resetDay();
        this.currentState = this.GAME;
        gamePaused = false;
        fadeOverlayAlpha = 0;
        specialAbilities.cooldown = 0; 
        specialAbilities.active = false; 
        specialAbilities.selectedAbility = 0;
        showGameMessage(`Day ${currentDay}: Catch the students!`);
        if (isTouchDevice) setupMobileControls();
    },
    
    restartCurrentDay: function() {
        const permanentlyCaughtNames = students.filter(s => s.isCaught && s.isAtSeat).map(s => s.name);
        this.resetDay();
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
            }
        });
        player.captureCount = newCaptureCount;
        this.currentState = this.GAME;
        gamePaused = false;
        fadeOverlayAlpha = 0;
        showGameMessage(`Restarting Day ${currentDay}`);
    },
    
    showInstructionsScreen: function() { 
        this.currentState = this.INSTRUCTIONS; 
    },
    
    handleKeyPress: function(key) {
        switch(this.currentState) {
            case this.MENU: this.startScreen.handleInput(key); break;
            case this.MULTIPLAYER_MENU: this.multiplayerMenu.handleInput(key); break;
            case this.JOIN_ROOM: this.joinRoomScreen.handleInput(key); break;
            case this.INSTRUCTIONS: this.instructionsScreen.handleInput(key); break;
            case this.PAUSED: this.pauseMenu.handleInput(key); break;
            case this.VICTORY: this.victoryScreen.handleInput(key); break;
        }
    },
    
    update: function() {
        if (this.currentState === this.GAME && !gamePaused) {
            // Check victory conditions
            if (multiplayerManager.isMultiplayer) {
                // Multiplayer victory conditions
                if (multiplayerManager.playerRole === 'teacher') {
                    const allKremerStudentsCaughtAndAtSeat = students.length > 0 && 
                        students.filter(s => !s.isPlayerControlled).every(s => s.isCaught && s.isAtSeat) &&
                        students.filter(s => s.isPlayerControlled).every(s => s.isCaught);
                    
                    if (allKremerStudentsCaughtAndAtSeat) {
                        this.currentState = this.VICTORY;
                        player.dx = 0; player.dy = 0;
                        keys.up = keys.down = keys.left = keys.right = keys.shift = false;
                        if (isTouchDevice && joystick && joystick.active) {
                            joystick.active = false; joystick.touchId = null;
                            if (typeof joystick.x !== 'undefined' && typeof joystick.y !== 'undefined') {
                                joystick.stickX = joystick.x; joystick.stickY = joystick.y;
                            }
                        }
                    }
                }
                // For students, victory is handled by server messages
            } else {
                // Single player victory conditions (original)
                const allKremerStudentsCaughtAndAtSeat = students.length > 0 && students.every(s => s.isCaught && s.isAtSeat);
                if (allKremerStudentsCaughtAndAtSeat) {
                    this.currentState = this.VICTORY;
                    player.dx = 0; player.dy = 0;
                    keys.up = keys.down = keys.left = keys.right = keys.shift = false;
                    if (isTouchDevice && joystick && joystick.active) {
                        joystick.active = false; joystick.touchId = null;
                        if (typeof joystick.x !== 'undefined' && typeof joystick.y !== 'undefined') {
                            joystick.stickX = joystick.x; joystick.stickY = joystick.y;
                        }
                    }
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
    
    draw: function() {
        switch(this.currentState) {
            case this.MENU: this.startScreen.draw(); break;
            case this.MULTIPLAYER_MENU: this.multiplayerMenu.draw(); break;
            case this.JOIN_ROOM: this.joinRoomScreen.draw(); break;
            case this.INSTRUCTIONS: this.instructionsScreen.draw(); break;
            case this.PAUSED: this.pauseMenu.draw(); break;
            case this.VICTORY: this.victoryScreen.draw(); break;
        }
    }
};