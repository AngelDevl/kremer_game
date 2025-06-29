// server.js - WebSocket Multiplayer Server for Teacher Chase Game
const WebSocket = require('ws');
const http = require('http');

class GameServer {
    constructor() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Game state
        this.rooms = new Map(); // roomId -> GameRoom
        this.playerConnections = new Map(); // playerId -> WebSocket
        
        this.setupWebSocketHandlers();
    }
    
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Invalid message format:', error);
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                }
            });
            
            ws.on('close', () => {
                this.handleDisconnection(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    
    handleMessage(ws, data) {
        switch (data.type) {
            case 'create_room':
                this.createRoom(ws, data);
                break;
            case 'join_room':
                this.joinRoom(ws, data);
                break;
            case 'player_move':
                this.handlePlayerMove(ws, data);
                break;
            case 'player_action':
                this.handlePlayerAction(ws, data);
                break;
            case 'game_state_update':
                this.handleGameStateUpdate(ws, data);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    createRoom(ws, data) {
        const roomId = this.generateRoomId();
        const room = new GameRoom(roomId, ws, data.playerName || 'Teacher');
        this.rooms.set(roomId, room);
        
        ws.playerId = room.teacher.id;
        ws.roomId = roomId;
        this.playerConnections.set(ws.playerId, ws);
        
        ws.send(JSON.stringify({
            type: 'room_created',
            roomId: roomId,
            playerId: ws.playerId,
            role: 'teacher'
        }));
        
        console.log(`Room ${roomId} created by ${data.playerName}`);
    }
    
    joinRoom(ws, data) {
        const room = this.rooms.get(data.roomId);
        if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
        }
        
        if (room.students.size >= 15) { // Max students limit
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
        }
        
        const student = room.addStudent(ws, data.playerName || `Student${room.students.size + 1}`);
        ws.playerId = student.id;
        ws.roomId = data.roomId;
        this.playerConnections.set(ws.playerId, ws);
        
        // Send join confirmation to new player
        ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: data.roomId,
            playerId: ws.playerId,
            role: 'student',
            studentData: student
        }));
        
        // Notify all players in room about new student
        this.broadcastToRoom(data.roomId, {
            type: 'student_joined',
            student: student
        });
        
        // Send current game state to new player
        ws.send(JSON.stringify({
            type: 'game_state',
            teacher: room.teacher,
            students: Array.from(room.students.values()),
            gameTime: room.gameTime,
            currentDay: room.currentDay
        }));
        
        console.log(`Player ${data.playerName} joined room ${data.roomId} as student`);
    }
    
    handlePlayerMove(ws, data) {
        const room = this.rooms.get(ws.roomId);
        if (!room) return;
        
        if (ws.playerId === room.teacher.id) {
            // Teacher movement
            room.updateTeacherPosition(data.x, data.y, data.dx, data.dy);
        } else {
            // Student movement
            room.updateStudentPosition(ws.playerId, data.x, data.y, data.dx, data.dy);
        }
        
        // Broadcast movement to all other players
        this.broadcastToRoom(ws.roomId, {
            type: 'player_moved',
            playerId: ws.playerId,
            x: data.x,
            y: data.y,
            dx: data.dx,
            dy: data.dy
        }, ws);
    }
    
    handlePlayerAction(ws, data) {
        const room = this.rooms.get(ws.roomId);
        if (!room) return;
        
        // Handle various player actions
        switch (data.action) {
            case 'sprint':
                room.setPlayerSprinting(ws.playerId, data.isSprinting);
                break;
            case 'ability':
                if (ws.playerId === room.teacher.id) {
                    room.activateTeacherAbility(data.abilityType);
                }
                break;
            case 'capture_attempt':
                if (ws.playerId === room.teacher.id) {
                    room.attemptCapture(data.targetStudentId);
                }
                break;
        }
        
        this.broadcastToRoom(ws.roomId, {
            type: 'player_action',
            playerId: ws.playerId,
            action: data.action,
            data: data
        }, ws);
    }
    
    handleGameStateUpdate(ws, data) {
        const room = this.rooms.get(ws.roomId);
        if (!room || ws.playerId !== room.teacher.id) return; // Only teacher can update game state
        
        room.updateGameState(data);
        
        this.broadcastToRoom(ws.roomId, {
            type: 'game_state_updated',
            gameState: data
        }, ws);
    }
    
    handleDisconnection(ws) {
        if (!ws.playerId || !ws.roomId) return;
        
        const room = this.rooms.get(ws.roomId);
        if (!room) return;
        
        console.log(`Player ${ws.playerId} disconnected from room ${ws.roomId}`);
        
        // Remove player from room
        if (ws.playerId === room.teacher.id) {
            // Teacher disconnected - close room or transfer ownership
            this.closeRoom(ws.roomId);
        } else {
            // Student disconnected
            room.removeStudent(ws.playerId);
            this.broadcastToRoom(ws.roomId, {
                type: 'student_left',
                playerId: ws.playerId
            });
        }
        
        this.playerConnections.delete(ws.playerId);
    }
    
    broadcastToRoom(roomId, message, excludeWs = null) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        const messageStr = JSON.stringify(message);
        
        // Send to teacher
        if (room.teacher.connection && room.teacher.connection !== excludeWs) {
            room.teacher.connection.send(messageStr);
        }
        
        // Send to all students
        room.students.forEach((student) => {
            if (student.connection && student.connection !== excludeWs) {
                student.connection.send(messageStr);
            }
        });
    }
    
    closeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // Notify all players
        this.broadcastToRoom(roomId, {
            type: 'room_closed',
            reason: 'Teacher disconnected'
        });
        
        // Clean up connections
        if (room.teacher.connection) {
            this.playerConnections.delete(room.teacher.id);
        }
        
        room.students.forEach((student) => {
            if (student.connection) {
                this.playerConnections.delete(student.id);
            }
        });
        
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} closed`);
    }
    
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    start(port = 8080) {
        this.server.listen(port, () => {
            console.log(`Game server listening on port ${port}`);
        });
    }
}

class GameRoom {
    constructor(id, teacherWs, teacherName) {
        this.id = id;
        this.teacher = {
            id: this.generatePlayerId(),
            name: teacherName,
            connection: teacherWs,
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            isSprinting: false,
            stamina: 100,
            captureCount: 0
        };
        
        this.students = new Map(); // studentId -> student object
        this.gameTime = 0;
        this.currentDay = 1;
        this.gameState = 'waiting'; // waiting, playing, paused
        
        // Available student names from Kremer's class
        this.availableStudentNames = [
            "Itamar", "Noam", "Moshe", "Yossi", "Shachar", "Oryan", "Naor", 
            "Adiel", "Elisha", "Benjamin", "Avi", "Ron", "Gal", "Liran", "Yaniv"
        ];
        this.usedStudentNames = new Set();
    }
    
    addStudent(ws, playerName) {
        // Find an available student name
        const availableName = this.getAvailableStudentName();
        
        const student = {
            id: this.generatePlayerId(),
            name: availableName,
            playerName: playerName,
            connection: ws,
            x: Math.random() * 1000 + 100, // Random starting position
            y: Math.random() * 600 + 100,
            dx: 0,
            dy: 0,
            isSprinting: false,
            isCaught: false,
            isAtSeat: false,
            happiness: 50,
            madness: 0,
            boredom: 0,
            speed: 1.5 + Math.random() * 0.5,
            personality: {
                bravery: Math.random() * 0.6 + 0.2,
                intelligence: Math.random() * 0.7 + 0.1,
                stubbornness: Math.random()
            }
        };
        
        this.students.set(student.id, student);
        this.usedStudentNames.add(availableName);
        
        return student;
    }
    
    removeStudent(studentId) {
        const student = this.students.get(studentId);
        if (student) {
            this.usedStudentNames.delete(student.name);
            this.students.delete(studentId);
        }
    }
    
    getAvailableStudentName() {
        for (const name of this.availableStudentNames) {
            if (!this.usedStudentNames.has(name)) {
                return name;
            }
        }
        // If all names are used, generate a numbered variant
        return `Student${this.students.size + 1}`;
    }
    
    updateTeacherPosition(x, y, dx, dy) {
        this.teacher.x = x;
        this.teacher.y = y;
        this.teacher.dx = dx;
        this.teacher.dy = dy;
    }
    
    updateStudentPosition(studentId, x, y, dx, dy) {
        const student = this.students.get(studentId);
        if (student && !student.isCaught) { // Only allow movement if not caught
            student.x = x;
            student.y = y;
            student.dx = dx;
            student.dy = dy;
        }
    }
    
    setPlayerSprinting(playerId, isSprinting) {
        if (playerId === this.teacher.id) {
            this.teacher.isSprinting = isSprinting;
        } else {
            const student = this.students.get(playerId);
            if (student) {
                student.isSprinting = isSprinting;
            }
        }
    }
    
    activateTeacherAbility(abilityType) {
        // Handle teacher abilities
        console.log(`Teacher activated ability: ${abilityType}`);
    }
    
    attemptCapture(targetStudentId) {
        const student = this.students.get(targetStudentId);
        if (student && !student.isCaught) {
            // Calculate distance between teacher and student
            const distance = Math.sqrt(
                Math.pow(this.teacher.x - student.x, 2) + 
                Math.pow(this.teacher.y - student.y, 2)
            );
            
            const CAPTURE_RADIUS = 30; // Same as in original game
            
            if (distance < CAPTURE_RADIUS) {
                student.isCaught = true;
                student.isAtSeat = false;
                this.teacher.captureCount++;
                
                console.log(`Student ${student.name} captured!`);
                return true;
            }
        }
        return false;
    }
    
    updateGameState(gameState) {
        this.gameTime = gameState.gameTime || this.gameTime;
        this.currentDay = gameState.currentDay || this.currentDay;
        this.gameState = gameState.state || this.gameState;
    }
    
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 15);
    }
}

// Start the server
const gameServer = new GameServer();
gameServer.start(process.env.PORT || 8080);

module.exports = GameServer;