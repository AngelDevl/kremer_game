// js/multiplayer.js - Add this as a new file to your game
class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isMultiplayer = false;
        this.playerId = null;
        this.roomId = null;
        this.playerRole = null; // 'teacher' or 'student'
        this.otherPlayers = new Map(); // playerId -> player data
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pingInterval = null;

        // Server URL - change this to your server address
        this.serverUrl = 'wss://rth80xbx-8200.euw.devtunnels.ms/ws';
    }

    // Initialize multiplayer connection
    connect() {
        try {
            this.ws = new WebSocket(this.serverUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
            showGameMessage('Failed to connect to multiplayer server');
        }
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('Connected to multiplayer server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startPing();
            showGameMessage('Connected to multiplayer server');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            } catch (error) {
                console.error('Error parsing server message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from multiplayer server');
            this.isConnected = false;
            this.stopPing();

            if (this.isMultiplayer && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                showGameMessage(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => this.connect(), 2000);
            } else {
                showGameMessage('Disconnected from multiplayer server');
                this.cleanup();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showGameMessage('Connection error');
        };
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'room_created':
                this.handleRoomCreated(data);
                break;
            case 'room_joined':
                this.handleRoomJoined(data);
                break;
            case 'student_joined':
                this.handleStudentJoined(data);
                break;
            case 'student_left':
                this.handleStudentLeft(data);
                break;
            case 'player_moved':
                this.handlePlayerMoved(data);
                break;
            case 'player_action':
                this.handlePlayerAction(data);
                break;
            case 'game_state':
                this.handleGameState(data);
                break;
            case 'game_state_updated':
                this.handleGameStateUpdated(data);
                break;
            case 'room_closed':
                this.handleRoomClosed(data);
                break;
            case 'error':
                showGameMessage(`Error: ${data.message}`);
                break;
            case 'pong':
                // Ping response
                break;
            default:
                console.log('Unknown server message:', data.type);
        }
    }

    // Create a new multiplayer room (teacher)
    createRoom(playerName = 'Teacher') {
        if (!this.isConnected) {
            showGameMessage('Not connected to server');
            return;
        }

        this.send({
            type: 'create_room',
            playerName: playerName
        });
    }

    // Join an existing room (student)
    joinRoom(roomId, playerName = 'Student') {
        if (!this.isConnected) {
            showGameMessage('Not connected to server');
            return;
        }

        this.send({
            type: 'join_room',
            roomId: roomId,
            playerName: playerName
        });
    }

    // Send player movement
    sendPlayerMove(x, y, dx, dy) {
        if (!this.isMultiplayer || !this.isConnected) return;

        this.send({
            type: 'player_move',
            x: x,
            y: y,
            dx: dx,
            dy: dy
        });
    }

    // Send player action
    sendPlayerAction(action, data = {}) {
        if (!this.isMultiplayer || !this.isConnected) return;

        this.send({
            type: 'player_action',
            action: action,
            ...data
        });
    }

    // Send game state update (teacher only)
    sendGameStateUpdate(gameState) {
        if (!this.isMultiplayer || !this.isConnected || this.playerRole !== 'teacher') return;

        this.send({
            type: 'game_state_update',
            ...gameState
        });
    }

    // Handle room creation response
    handleRoomCreated(data) {
        this.isMultiplayer = true;
        this.playerId = data.playerId;
        this.roomId = data.roomId;
        this.playerRole = data.role;

        showGameMessage(`Room created: ${this.roomId}`, 5000);

        // Switch to multiplayer teacher mode
        this.initializeAsTeacher();

        // Show room code to share with students
        this.showRoomCode();
    }

    // Handle room join response
    handleRoomJoined(data) {
        this.isMultiplayer = true;
        this.playerId = data.playerId;
        this.roomId = data.roomId;
        this.playerRole = data.role;

        showGameMessage(`Joined room: ${this.roomId}`, 3000);

        // Switch to multiplayer student mode
        this.initializeAsStudent(data.studentData);
    }

    // Handle new student joining
    handleStudentJoined(data) {
        const newStudent = data.student;

        // Add the new student to the game
        this.addMultiplayerStudent(newStudent);

        showGameMessage(`${newStudent.playerName} joined as ${newStudent.name}`);
    }

    // Handle student leaving
    handleStudentLeft(data) {
        const studentId = data.playerId;

        // Remove student from game
        this.removeMultiplayerStudent(studentId);

        showGameMessage('A student left the game');
    }

    // Handle player movement
    handlePlayerMoved(data) {
        if (data.playerId === this.playerId) return; // Don't update own position

        if (this.playerRole === 'student' && this.isTeacherPlayer(data.playerId)) {
            // Update teacher position
            this.updateTeacherPosition(data);
        } else if (this.playerRole === 'teacher') {
            // Update other student position
            this.updateOtherStudentPosition(data);
        }
    }

    // Handle player actions
    handlePlayerAction(data) {
        if (data.playerId === this.playerId) return; // Don't handle own actions

        switch (data.action) {
            case 'sprint':
                this.updatePlayerSprinting(data.playerId, data.data.isSprinting);
                break;
            case 'ability':
                this.handleOtherPlayerAbility(data);
                break;
            case 'capture_attempt':
                this.handleCaptureAttempt(data);
                break;
        }
    }

    // Handle complete game state
    handleGameState(data) {
        // Sync with server game state
        if (this.playerRole === 'student') {
            // Update teacher data
            if (data.teacher) {
                this.syncTeacherData(data.teacher);
            }

            // Update other students
            if (data.students) {
                this.syncOtherStudents(data.students);
            }

            // Update game time and day
            if (typeof gameTime !== 'undefined') {
                gameTime = data.gameTime || gameTime;
                currentDay = data.currentDay || currentDay;
            }
        }
    }

    // Handle game state updates
    handleGameStateUpdated(data) {
        // Apply game state changes from teacher
        if (this.playerRole === 'student') {
            // Update local game state based on teacher's update
            this.applyGameStateUpdate(data.gameState);
        }
    }

    // Handle room closure
    handleRoomClosed(data) {
        showGameMessage(`Room closed: ${data.reason}`, 5000);
        this.cleanup();

        // Return to main menu
        gameStates.currentState = gameStates.MENU;
        gamePaused = false;
    }

    // Initialize as teacher
    initializeAsTeacher() {
        // Teacher controls the main game logic
        // Start the game normally but enable multiplayer features
        gameStates.startGame();

        // Modify player object to be the teacher
        player.name = "Kremer (You)";
        player.isMultiplayerTeacher = true;
    }

    // Initialize as student
    initializeAsStudent(studentData) {
        // Student joins an existing game
        // Switch to student control mode

        // Find the student character this player will control
        const controlledStudent = this.findStudentByName(studentData.name);
        if (controlledStudent) {
            // Mark this student as player-controlled
            controlledStudent.isPlayerControlled = true;
            controlledStudent.playerId = this.playerId;
            controlledStudent.playerName = studentData.playerName;

            // Override student AI
            this.overrideStudentAI(controlledStudent);
        }

        // Start the game in student mode
        gameStates.currentState = gameStates.GAME;
        gamePaused = false;

        showGameMessage(`You are controlling ${studentData.name}`, 3000);
    }

    // Add a new multiplayer student
    addMultiplayerStudent(studentData) {
        // Find an available AI student and convert to multiplayer
        const availableStudent = students.find(s => !s.isPlayerControlled && s.name === studentData.name);
        if (availableStudent) {
            availableStudent.isPlayerControlled = true;
            availableStudent.playerId = studentData.id;
            availableStudent.playerName = studentData.playerName;
            availableStudent.x = studentData.x;
            availableStudent.y = studentData.y;

            this.overrideStudentAI(availableStudent);
        }
    }

    // Remove a multiplayer student
    removeMultiplayerStudent(studentId) {
        const student = students.find(s => s.playerId === studentId);
        if (student) {
            // Convert back to AI control
            student.isPlayerControlled = false;
            student.playerId = null;
            student.playerName = null;

            this.restoreStudentAI(student);
        }
    }

    // Override student AI for player control
    overrideStudentAI(student) {
        student.originalUpdateFunction = student.update;
        student.isAIControlled = false;

        // Player-controlled students don't use AI movement
        student.isWandering = false;
        student.isAfraidOfTeacher = false;
    }

    // Restore student AI
    restoreStudentAI(student) {
        student.isAIControlled = true;
        student.isWandering = true;

        if (student.originalUpdateFunction) {
            student.update = student.originalUpdateFunction;
        }
    }

    // Find student by name
    findStudentByName(name) {
        return students.find(s => s.name === name);
    }

    // Check if player ID belongs to teacher
    isTeacherPlayer(playerId) {
        // In this implementation, we'll track this differently
        // For now, assume first player is teacher
        return this.playerRole === 'student'; // If we're student, others might be teacher
    }

    // Update teacher position (for students)
    updateTeacherPosition(data) {
        if (typeof player !== 'undefined') {
            player.x = data.x;
            player.y = data.y;
            player.dx = data.dx;
            player.dy = data.dy;
        }
    }

    // Update other student position (for teacher)
    updateOtherStudentPosition(data) {
        const student = students.find(s => s.playerId === data.playerId);
        if (student) {
            student.x = data.x;
            student.y = data.y;
            student.dx = data.dx;
            student.dy = data.dy;
        }
    }

    // Update player sprinting status
    updatePlayerSprinting(playerId, isSprinting) {
        if (this.playerRole === 'student' && this.isTeacherPlayer(playerId)) {
            if (typeof player !== 'undefined') {
                player.isSprinting = isSprinting;
            }
        } else {
            const student = students.find(s => s.playerId === playerId);
            if (student) {
                student.isSprinting = isSprinting;
            }
        }
    }

    // Handle other player abilities
    handleOtherPlayerAbility(data) {
        // Handle teacher abilities from student perspective
        if (this.playerRole === 'student') {
            showGameMessage(`Teacher used ${data.data.abilityType}!`);
        }
    }

    // Handle capture attempts
    handleCaptureAttempt(data) {
        // Handle capture logic
        if (this.playerRole === 'student') {
            const targetStudent = students.find(s => s.playerId === data.data.targetStudentId);
            if (targetStudent && targetStudent.playerId === this.playerId) {
                // This player was captured
                showGameMessage('You were caught!');
                targetStudent.isCaught = true;
            }
        }
    }

    // Sync teacher data (for students)
    syncTeacherData(teacherData) {
        if (typeof player !== 'undefined') {
            player.x = teacherData.x;
            player.y = teacherData.y;
            player.stamina = teacherData.stamina;
            player.captureCount = teacherData.captureCount;
        }
    }

    // Sync other students (for students)
    syncOtherStudents(serverStudents) {
        serverStudents.forEach(serverStudent => {
            if (serverStudent.id !== this.playerId) {
                const localStudent = students.find(s => s.playerId === serverStudent.id);
                if (localStudent) {
                    localStudent.x = serverStudent.x;
                    localStudent.y = serverStudent.y;
                    localStudent.isCaught = serverStudent.isCaught;
                    localStudent.isAtSeat = serverStudent.isAtSeat;
                }
            }
        });
    }

    // Apply game state update
    applyGameStateUpdate(gameState) {
        if (gameState.gameTime !== undefined && typeof gameTime !== 'undefined') {
            gameTime = gameState.gameTime;
        }
        if (gameState.currentDay !== undefined && typeof currentDay !== 'undefined') {
            currentDay = gameState.currentDay;
        }
    }

    // Show room code for sharing
    showRoomCode() {
        const roomCodeElement = document.createElement('div');
        roomCodeElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: #ffcc00;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            z-index: 1000;
            border: 2px solid #ffcc00;
        `;
        roomCodeElement.innerHTML = `
            <div>Room Code:</div>
            <div style="font-size: 16px; margin: 5px 0;">${this.roomId}</div>
            <div style="font-size: 8px;">Share with students</div>
        `;

        document.body.appendChild(roomCodeElement);

        // Remove after 10 seconds
        setTimeout(() => {
            if (roomCodeElement.parentNode) {
                roomCodeElement.parentNode.removeChild(roomCodeElement);
            }
        }, 10000);
    }

    // Send data to server
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    // Start ping to keep connection alive
    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' });
            }
        }, 30000); // Ping every 30 seconds
    }

    // Stop ping
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // Cleanup multiplayer state
    cleanup() {
        this.isMultiplayer = false;
        this.playerId = null;
        this.roomId = null;
        this.playerRole = null;
        this.otherPlayers.clear();
        this.reconnectAttempts = 0;

        // Reset all students to AI control
        students.forEach(student => {
            if (student.isPlayerControlled) {
                this.restoreStudentAI(student);
            }
        });

        this.stopPing();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }

    // Get controlled student (for student players)
    getControlledStudent() {
        if (this.playerRole === 'student') {
            return students.find(s => s.playerId === this.playerId);
        }
        return null;
    }

    // Check if this player is controlling a specific student
    isControllingStudent(student) {
        return this.playerRole === 'student' && student.playerId === this.playerId;
    }

    // Update multiplayer students (called from game loop)
    updateMultiplayerStudents() {
        if (!this.isMultiplayer) return;

        // Send position updates for controlled entities
        if (this.playerRole === 'teacher') {
            // Send teacher position
            this.sendPlayerMove(player.x, player.y, player.dx, player.dy);
        } else if (this.playerRole === 'student') {
            const controlledStudent = this.getControlledStudent();
            if (controlledStudent) {
                this.sendPlayerMove(controlledStudent.x, controlledStudent.y, controlledStudent.dx, controlledStudent.dy);
            }
        }
    }

    // Handle input for student players
    handleStudentInput() {
        if (this.playerRole !== 'student') return;

        const controlledStudent = this.getControlledStudent();
        if (!controlledStudent || controlledStudent.isCaught) return;

        // Apply movement input to controlled student
        let dx = 0, dy = 0;

        if (keys.up || keys.w) dy = -1;
        if (keys.down || keys.s) dy = 1;
        if (keys.left || keys.a) dx = -1;
        if (keys.right || keys.d) dx = 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        controlledStudent.dx = dx;
        controlledStudent.dy = dy;

        // Apply movement
        const speed = controlledStudent.isSprinting ? controlledStudent.runSpeed : controlledStudent.speed;
        controlledStudent.x += dx * speed;
        controlledStudent.y += dy * speed;

        // Keep within bounds
        controlledStudent.x = Math.max(0, Math.min(controlledStudent.x, WORLD_WIDTH - controlledStudent.width));
        controlledStudent.y = Math.max(0, Math.min(controlledStudent.y, WORLD_HEIGHT - controlledStudent.height));

        // Handle sprinting
        if (keys.shift && !controlledStudent.isSprinting) {
            controlledStudent.isSprinting = true;
            this.sendPlayerAction('sprint', { isSprinting: true });
        } else if (!keys.shift && controlledStudent.isSprinting) {
            controlledStudent.isSprinting = false;
            this.sendPlayerAction('sprint', { isSprinting: false });
        }
    }
}

// Create global multiplayer manager instance
const multiplayerManager = new MultiplayerManager();