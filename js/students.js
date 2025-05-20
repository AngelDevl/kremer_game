const students = [];
const zivStudents = [];
const ziv = { // Ziv NPC definition
    name: "Ziv",
    x: TILE_SIZE * 80, y: TILE_SIZE * 10,
    width: TILE_SIZE, height: TILE_SIZE,
    color: ZIV_COLOR
};

// Tables array definition and dynamic generation
const tables = [
    {
        id: "kremer_table", 
        name: "Class Table",
        x: TILE_SIZE * 5, y: WORLD_HEIGHT - TILE_SIZE * 15,
        width: TILE_SIZE * 10, height: TILE_SIZE * 4,
        color: '#6c757d',
        isBench: false
    },
    {
        id: "ziv_table", 
        name: "Ziv's Table",
        x: ziv.x - TILE_SIZE * 4, y: ziv.y + TILE_SIZE * 2, // Position relative to Ziv NPC
        width: TILE_SIZE * 8, height: TILE_SIZE * 3,
        color: '#5c656d',
        isBench: false
    }
];

function generateDiningTables() {
    for (let i = 0; i < 15; i++) {
        const tableWidth = getRandomInt(3, 8) * TILE_SIZE;
        const tableHeight = getRandomInt(2, 5) * TILE_SIZE;
        let tableX, tableY, validPosition;
        do {
            validPosition = true;
            tableX = getRandomInt(TILE_SIZE * 5, WORLD_WIDTH - tableWidth - TILE_SIZE * 5);
            tableY = getRandomInt(TILE_SIZE * 5, WORLD_HEIGHT - tableHeight - TILE_SIZE * 5);
            for (const existingTable of tables) {
                const combinedHalfWidths = (tableWidth + existingTable.width) / 2 + TILE_SIZE * 2; 
                const combinedHalfHeights = (tableHeight + existingTable.height) / 2 + TILE_SIZE * 2;
                if (Math.abs((tableX + tableWidth/2) - (existingTable.x + existingTable.width/2)) < combinedHalfWidths &&
                    Math.abs((tableY + tableHeight/2) - (existingTable.y + existingTable.height/2)) < combinedHalfHeights) {
                    validPosition = false;
                    break;
                }
            }
        } while (!validPosition);
        
        const mainTable = {
            id: `dining_table_${i}`, name: "Dining Table", 
            x: tableX, y: tableY, width: tableWidth, height: tableHeight,
            color: TABLE_COLORS[getRandomInt(0, TABLE_COLORS.length -1)],
            isBench: false
        };
        tables.push(mainTable);

        if (tableWidth > tableHeight) { 
            tables.push({
                id: `dining_table_${i}_bench_top`, name: "Bench",
                x: tableX, y: tableY - BENCH_THICKNESS - BENCH_OFFSET,
                width: tableWidth, height: BENCH_THICKNESS,
                color: BENCH_COLOR, isBench: true
            });
            tables.push({
                id: `dining_table_${i}_bench_bottom`, name: "Bench",
                x: tableX, y: tableY + tableHeight + BENCH_OFFSET,
                width: tableWidth, height: BENCH_THICKNESS,
                color: BENCH_COLOR, isBench: true
            });
        } else { 
            tables.push({
                id: `dining_table_${i}_bench_left`, name: "Bench",
                x: tableX - BENCH_THICKNESS - BENCH_OFFSET, y: tableY,
                width: BENCH_THICKNESS, height: tableHeight,
                color: BENCH_COLOR, isBench: true
            });
            tables.push({
                id: `dining_table_${i}_bench_right`, name: "Bench",
                x: tableX + tableWidth + BENCH_OFFSET, y: tableY,
                width: BENCH_THICKNESS, height: tableHeight,
                color: BENCH_COLOR, isBench: true
            });
        }
    }
}
generateDiningTables(); // Call it once tables array is initially defined

// Seat positions (generated after tables are defined)
let kremerSeatPositions = [];
let zivSeatPositions = [];

function generateSeatPositions(tableIndex, numSeats) {
    const table = tables[tableIndex];
    if (!table) {
        console.error("Table not found for seat generation:", tableIndex);
        return [];
    }
    const seats = [];
    const spacing = TILE_SIZE * 1.5;

    // Top
    for (let i = 0; i < Math.floor(table.width / spacing) && seats.length < numSeats; i++) {
        seats.push({ x: table.x + i * spacing + TILE_SIZE * 0.25, y: table.y - TILE_SIZE * 1.5 });
    }
    // Right
    for (let i = 0; i < Math.floor(table.height / spacing) && seats.length < numSeats; i++) {
        seats.push({ x: table.x + table.width + TILE_SIZE, y: table.y + i * spacing + TILE_SIZE * 0.25 });
    }
    // Bottom
    for (let i = 0; i < Math.floor(table.width / spacing) && seats.length < numSeats; i++) {
        seats.push({ x: table.x + i * spacing + TILE_SIZE * 0.25, y: table.y + table.height + TILE_SIZE * 0.5 });
    }
    // Left
    for (let i = 0; i < Math.floor(table.height / spacing) && seats.length < numSeats; i++) {
        seats.push({ x: table.x - TILE_SIZE * 1.5, y: table.y + i * spacing + TILE_SIZE * 0.25 });
    }
     while (seats.length < numSeats) { // Fallback for tables too small for regular spacing or to fill remaining
         const randomSide = getRandomInt(0,3);
         if (randomSide === 0 && table.width > 0) seats.push({ x: table.x + getRandomInt(0, Math.floor(table.width/TILE_SIZE)-1) * TILE_SIZE, y: table.y - TILE_SIZE * 1.5 });
         else if (randomSide === 1 && table.height > 0) seats.push({ x: table.x + table.width + TILE_SIZE, y: table.y + getRandomInt(0, Math.floor(table.height/TILE_SIZE)-1) * TILE_SIZE });
         else if (randomSide === 2 && table.width > 0) seats.push({ x: table.x + getRandomInt(0, Math.floor(table.width/TILE_SIZE)-1) * TILE_SIZE, y: table.y + table.height + TILE_SIZE * 0.5 });
         else if (table.height > 0) seats.push({ x: table.x - TILE_SIZE * 1.5, y: table.y + getRandomInt(0, Math.floor(table.height/TILE_SIZE)-1) * TILE_SIZE });
         else { // Absolute fallback if table has no dimensions for some reason
            seats.push({ x: table.x + getRandomInt(-2,2)*TILE_SIZE, y: table.y + getRandomInt(-2,2)*TILE_SIZE });
         }
    }
    return seats.slice(0, numSeats);
}


function initializeStudentSeats() { // Call this after tables are fully defined
    kremerSeatPositions = generateSeatPositions(KREMER_TABLE_INDEX, 15);
    zivSeatPositions = generateSeatPositions(ZIV_TABLE_INDEX, Math.min(6, ZIV_STUDENT_NAMES.length));
}


function findKremerStudentValidPositions(count) {
    const positions = []; const minDistanceBetweenStudents = TILE_SIZE * 3;
    const kremerTable = tables[KREMER_TABLE_INDEX];
    const playerStartX = kremerTable.x + kremerTable.width / 2;
    const playerStartY = kremerTable.y + kremerTable.height + TILE_SIZE * 2;

    for (let i = 0; i < count; i++) {
        let studentX, studentY, validPosition; let attempts = 0;
        do {
            attempts++; validPosition = true;
            studentX = getRandomInt(TILE_SIZE * 2, WORLD_WIDTH - TILE_SIZE * 3);
            studentY = getRandomInt(TILE_SIZE * 2, WORLD_HEIGHT - TILE_SIZE * 3);
            for (const table of tables) if (checkCollision({x: studentX - TILE_SIZE, y: studentY - TILE_SIZE, width: TILE_SIZE * 3, height: TILE_SIZE * 3}, table)) { validPosition = false; break; }
            if (validPosition) for (const pos of positions) if (Math.sqrt(Math.pow(studentX - pos.x, 2) + Math.pow(studentY - pos.y, 2)) < minDistanceBetweenStudents) { validPosition = false; break; }
            if (Math.sqrt(Math.pow(studentX - playerStartX, 2) + Math.pow(studentY - playerStartY, 2)) < TILE_SIZE * 15) validPosition = false;
            if (tables[ZIV_TABLE_INDEX] && checkCollision({x: studentX, y: studentY, width: TILE_SIZE, height: TILE_SIZE}, tables[ZIV_TABLE_INDEX])) validPosition = false;
            if (attempts > 200) {
                studentX = getRandomInt(TILE_SIZE, WORLD_WIDTH - TILE_SIZE * 2);
                studentY = getRandomInt(TILE_SIZE, WORLD_HEIGHT - TILE_SIZE * 2);
                break;
            }
        } while (!validPosition);
        positions.push({x: studentX, y: studentY});
    }
    return positions;
}

function initializeKremerStudents() {
    students.length = 0;
    const numStudentsToSpawn = 15;
    const validPositions = findKremerStudentValidPositions(numStudentsToSpawn);

    for (let i = 0; i < numStudentsToSpawn; i++) {
        students.push({
            id: `kremer_${i}`, name: KREMER_STUDENT_NAMES[i % KREMER_STUDENT_NAMES.length], teacher: "Kremer",
            x: validPositions[i].x, y: validPositions[i].y,
            width: TILE_SIZE, height: TILE_SIZE,
            color: KREMER_STUDENT_COLOR,
            isCaught: false, isAtSeat: false,
            isWandering: true, isAfraidOfTeacher: false,
            wanderTargetX: validPositions[i].x, wanderTargetY: validPositions[i].y,
            seatX: kremerSeatPositions[i % kremerSeatPositions.length].x,
            seatY: kremerSeatPositions[i % kremerSeatPositions.length].y,
            speed: 1.5 + Math.random() * 0.5, runSpeed: 2.5 + Math.random() * 0.7, returnSpeed: 3,
            wanderTimer: 0, wanderDelay: getRandomInt(60, 200),
            lastDirection: { x: 0, y: 0 },
            personality: { bravery: Math.random() * 0.6 + 0.2, intelligence: Math.random() * 0.7 + 0.1, stubbornness: Math.random() },
            escapeTimer: 0, escapeFailCounter: 0, messageTimer: 0, currentMessage: "", frozenTimer: 0,
            happiness: 50, madness: 0, boredom: 0, timesCaughtThisDay: 0
        });
    }
}

function initializeZivStudents() {
    zivStudents.length = 0;
    const zivTable = tables[ZIV_TABLE_INDEX];

    for (let i = 0; i < ZIV_STUDENT_NAMES.length; i++) {
        let studentX, studentY, isWanderingZ;
        const studentSpeed = 0.7;
        let currentSeatX = null;
        let currentSeatY = null;

        if (i < zivSeatPositions.length) {
            isWanderingZ = false;
            currentSeatX = zivSeatPositions[i].x;
            currentSeatY = zivSeatPositions[i].y;
            studentX = currentSeatX;
            studentY = currentSeatY;
        } else {
            isWanderingZ = true;
            studentX = zivTable.x + zivTable.width / 2 + getRandomInt(-TILE_SIZE * 4, TILE_SIZE * 4);
            studentY = zivTable.y + zivTable.height / 2 + getRandomInt(-TILE_SIZE * 4, TILE_SIZE * 4);
        }

        studentX = Math.max(TILE_SIZE, Math.min(studentX, WORLD_WIDTH - TILE_SIZE*2));
        studentY = Math.max(TILE_SIZE, Math.min(studentY, WORLD_HEIGHT - TILE_SIZE*2));

        zivStudents.push({
            id: `ziv_${i}`, name: ZIV_STUDENT_NAMES[i], teacher: "Ziv",
            x: studentX, y: studentY,
            width: TILE_SIZE, height: TILE_SIZE,
            color: ZIV_STUDENT_COLOR,
            isWandering: isWanderingZ,
            wanderTargetX: studentX, wanderTargetY: studentY,
            speed: studentSpeed,
            wanderTimer: 0, wanderDelay: getRandomInt(120, 300),
            lastDirection: { x: 0, y: 0 },
            seatX: currentSeatX,
            seatY: currentSeatY,
        });
    }
}

function initializeAllStudents() {
    // Ensure seats are generated before students who need them
    if (kremerSeatPositions.length === 0 || zivSeatPositions.length === 0) {
        initializeStudentSeats(); // Make sure this is called if not already
    }
    initializeKremerStudents();
    initializeZivStudents();
}

function getMoodEmoji(student) {
    if (student.madness > 70) return "😠";
    if (student.madness > 40) return "😒";
    if (student.happiness <= 20 && student.boredom > 50) return "😑";
    if (student.happiness <= 40) return "😐";
    if (student.happiness > 70) return "😄";
    if (student.happiness > 40) return "🙂";
    return "😐";
}

function updateKremerStudents() {
    // ... (Keep existing updateKremerStudents logic, ensure it uses global 'player', 'students', 'tables', 'showGameMessage')
    // This function is quite long, so for brevity, I'm indicating to keep its content.
    // Make sure any references to other game objects (player, tables, etc.) are valid in the global scope.
    if (gamePaused || gameStates.isTransitioningDay()) return;
    students.forEach(student => { 
        if (student.frozenTimer && student.frozenTimer > 0) { student.frozenTimer--; return; } 

        if (student.isCaught && student.isAtSeat) {
            student.boredom = Math.min(100, student.boredom + 0.1); 
            student.happiness = Math.max(0, student.happiness - 0.02);
            if (student.boredom >= 100) {
                student.isCaught = false;
                student.isAtSeat = false;
                student.isWandering = true;
                player.captureCount = Math.max(0, player.captureCount -1); 
                student.boredom = 0;
                student.happiness = Math.max(0, student.happiness - 30);
                student.madness = Math.min(100, student.madness + 15);
                const angle = Math.random() * Math.PI * 2;
                student.wanderTargetX = student.seatX + Math.cos(angle) * TILE_SIZE * 10;
                student.wanderTargetY = student.seatY + Math.sin(angle) * TILE_SIZE * 10;
                showGameMessage(`${student.name} got bored and left!`);
            }
        } else if (student.isCaught && !student.isAtSeat) { 
            const targetX = student.seatX; const targetY = student.seatY;
            const diffX = targetX - student.x; const diffY = targetY - student.y;
            const distToSeat = Math.sqrt(diffX * diffX + diffY * diffY);

            if (distToSeat < student.returnSpeed) { 
                student.x = targetX; student.y = targetY; 
                student.isAtSeat = true; 
                student.boredom = 0; 
            } else {
                let moveX = (diffX / distToSeat) * student.returnSpeed; 
                let moveY = (diffY / distToSeat) * student.returnSpeed;
                let nextX = student.x + moveX; let nextY = student.y + moveY;
                
                for (const table of tables) { 
                    if (table.isBench) continue;
                    if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                        if (Math.abs(diffX) > Math.abs(diffY)) { 
                            if (!isPathBlocked(student.x, student.y, student.x, student.y + Math.sign(diffY) * student.returnSpeed)) { moveX = 0; moveY = Math.sign(diffY) * student.returnSpeed * 0.8; }
                        } else { 
                            if (!isPathBlocked(student.x, student.y, student.x + Math.sign(diffX) * student.returnSpeed, student.y)) { moveX = Math.sign(diffX) * student.returnSpeed * 0.8; moveY = 0; }
                        }
                        break;
                    }
                }
                student.x += moveX; student.y += moveY;
            }
        } else { 
            student.isAtSeat = false; 
            if (student.isWandering && !student.isAfraidOfTeacher) {
                student.happiness = Math.min(100, student.happiness + 0.05);
                student.madness = Math.max(0, student.madness - 0.03);
            }

            if (player.attractionField) {
                const distToPlayer = distance(student, player);
                if (distToPlayer < player.attractionRadius) {
                    const force = (1 - distToPlayer / player.attractionRadius) * player.attractionForce;
                    const dirX = player.x - student.x; const dirY = player.y - student.y;
                    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
                    student.x += (dirX / len) * force * student.speed * 0.5; 
                    student.y += (dirY / len) * force * student.speed * 0.5;
                }
            }

            const distToTeacher = distance(student, player);
            if (distToTeacher < DETECTION_RADIUS && !student.isAfraidOfTeacher) {
                if (Math.random() > student.personality.bravery) { 
                    student.isAfraidOfTeacher = true; student.isWandering = false;
                    student.currentMessage = "!"; student.messageTimer = 60; 
                }
            } else if (distToTeacher >= DETECTION_RADIUS * 1.5 && student.isAfraidOfTeacher) { 
                if (Math.random() < 0.05 / (student.personality.stubbornness + 0.1)) { 
                    student.isAfraidOfTeacher = false; student.isWandering = true; student.wanderTimer = student.wanderDelay; 
                }
            }
            if (student.messageTimer > 0) student.messageTimer--; else student.currentMessage = "";

            if (student.isAfraidOfTeacher) {
                const escapeTarget = findPathAwayFromTeacher(student, player);
                const finalPathTarget = findPathAroundObstacles(student, escapeTarget.x, escapeTarget.y);
                const diffX = finalPathTarget.x - student.x; const diffY = finalPathTarget.y - student.y;
                const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distToTarget > student.runSpeed) {
                    let moveX = (diffX / distToTarget) * student.runSpeed; let moveY = (diffY / distToTarget) * student.runSpeed;
                    moveX = moveX * 0.8 + student.lastDirection.x * 0.2; 
                    moveY = moveY * 0.8 + student.lastDirection.y * 0.2;
                    const moveLen = Math.sqrt(moveX*moveX + moveY*moveY) || 1;
                    if (moveLen > student.runSpeed) { moveX = (moveX/moveLen) * student.runSpeed; moveY = (moveY/moveLen) * student.runSpeed; }
                    student.lastDirection = { x: moveX, y: moveY };

                    let nextX = student.x + moveX; let nextY = student.y + moveY; let collided = false;
                    for (const table of tables) {
                        if (table.isBench) continue;
                        if (checkCollision({ ...student, x: nextX, y: nextY }, table)) { 
                            collided = true; 
                            student.x -= moveX * 0.5; student.y -= moveY * 0.5; 
                            student.lastDirection = {x: -student.lastDirection.x *0.5 , y: -student.lastDirection.y*0.5}; 
                            student.escapeFailCounter++; 
                            if(student.escapeFailCounter > 5) { 
                                student.isAfraidOfTeacher = false; student.isWandering = true; student.wanderTimer = 0; student.escapeFailCounter = 0; 
                            }
                            break; 
                        }
                    }
                    if (!collided) { student.x = nextX; student.y = nextY; student.escapeFailCounter = 0; }
                } else { 
                    student.escapeTimer++; if(student.escapeTimer > 120) { 
                        student.isAfraidOfTeacher = false; student.isWandering = true; student.escapeTimer = 0;
                    }
                }
                student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width)); 
                student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
            } else if (student.isWandering) {
                student.wanderTimer++;
                if (student.wanderTimer >= student.wanderDelay || distance(student, {x: student.wanderTargetX, y: student.wanderTargetY, width:1, height:1}) < student.speed * 2) { 
                    student.wanderTimer = 0; student.wanderDelay = getRandomInt(100, 300); 
                    const angle = Math.random() * Math.PI * 2; const wanderDist = TILE_SIZE * getRandomInt(5, 15);
                    student.wanderTargetX = student.x + Math.cos(angle) * wanderDist; 
                    student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                    student.wanderTargetX = Math.max(TILE_SIZE, Math.min(student.wanderTargetX, WORLD_WIDTH - TILE_SIZE*2));
                    student.wanderTargetY = Math.max(TILE_SIZE, Math.min(student.wanderTargetY, WORLD_HEIGHT - TILE_SIZE*2));
                }
                const diffX = student.wanderTargetX - student.x; const diffY = student.wanderTargetY - student.y;
                const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distToTarget > student.speed) {
                    let moveX = (diffX / distToTarget) * student.speed; let moveY = (diffY / distToTarget) * student.speed;
                    moveX = moveX * 0.7 + student.lastDirection.x * 0.3; 
                    moveY = moveY * 0.7 + student.lastDirection.y * 0.3;
                    const moveLen = Math.sqrt(moveX*moveX + moveY*moveY) || 1;
                    if (moveLen > student.speed) { moveX = (moveX/moveLen) * student.speed; moveY = (moveY/moveLen) * student.speed; }
                    student.lastDirection = { x: moveX, y: moveY };

                    let nextX = student.x + moveX; let nextY = student.y + moveY; let collision = false;
                    const futureStudent = { ...student, x: nextX, y: nextY };
                    for (const table of tables) {
                        if (table.isBench) continue;
                        if (checkCollision(futureStudent, table)) { collision = true; break; }
                    }
                    // Check collision with other Kremer students
                    for (const otherStudent of students) { // Changed from `students` to avoid self-collision if not careful with id
                        if (student.id !== otherStudent.id && !otherStudent.isCaught && distance(futureStudent, otherStudent) < TILE_SIZE * 1.2) { // Reduced distance a bit
                            collision = true; break; 
                        }
                    }
                    
                    if (!collision) { student.x = nextX; student.y = nextY; } 
                    else { student.wanderTimer = student.wanderDelay; student.lastDirection = {x:0, y:0}; } 
                } else student.wanderTimer = student.wanderDelay; 

                student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width)); 
                student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
            }

            if (distance(player, student) < CAPTURE_RADIUS && !student.isCaught) {
                student.isCaught = true; 
                student.isAtSeat = false; 
                student.isWandering = false; 
                student.isAfraidOfTeacher = false; 
                student.currentMessage = "";   
                student.messageTimer = 0;
                player.captureCount++; 
                
                student.timesCaughtThisDay++;
                student.madness = Math.min(100, student.madness + 15 * student.timesCaughtThisDay);
                student.happiness = Math.max(0, student.happiness - 20);

                showGameMessage(`${student.name} caught! (${player.captureCount}/${students.length})`);
            }
        }
    });
}

function updateZivStudents() {
    // ... (Keep existing updateZivStudents logic)
    // This function is also quite long.
    // Ensure any references to other game objects (tables, etc.) are valid in the global scope.
    if (gamePaused || gameStates.isTransitioningDay()) return;
    const zivTable = tables[ZIV_TABLE_INDEX]; // Assumes ZIV_TABLE_INDEX is correct
    const wanderBounds = { 
        minX: zivTable.x - TILE_SIZE * 6,
        maxX: zivTable.x + zivTable.width + TILE_SIZE * 6,
        minY: zivTable.y - TILE_SIZE * 6,
        maxY: zivTable.y + zivTable.height + TILE_SIZE * 6,
    };

    zivStudents.forEach(student => {
        if (student.isWandering) { 
            student.wanderTimer++;
            if (student.wanderTimer >= student.wanderDelay || distance(student, {x: student.wanderTargetX, y: student.wanderTargetY, width:1, height:1}) < student.speed * 2) {
                student.wanderTimer = 0; student.wanderDelay = getRandomInt(150, 400); 
                const angle = Math.random() * Math.PI * 2;
                const wanderDist = TILE_SIZE * getRandomInt(3, 8); 
                student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;

                student.wanderTargetX = Math.max(wanderBounds.minX, Math.min(student.wanderTargetX, wanderBounds.maxX));
                student.wanderTargetY = Math.max(wanderBounds.minY, Math.min(student.wanderTargetY, wanderBounds.maxY));
                
                student.wanderTargetX = Math.max(TILE_SIZE, Math.min(student.wanderTargetX, WORLD_WIDTH - TILE_SIZE*2));
                student.wanderTargetY = Math.max(TILE_SIZE, Math.min(student.wanderTargetY, WORLD_HEIGHT - TILE_SIZE*2));
            }

            const diffX = student.wanderTargetX - student.x;
            const diffY = student.wanderTargetY - student.y;
            const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

            if (distToTarget > student.speed) {
                let moveX = (diffX / distToTarget) * student.speed;
                let moveY = (diffY / distToTarget) * student.speed;
                moveX = moveX * 0.7 + student.lastDirection.x * 0.3;
                moveY = moveY * 0.7 + student.lastDirection.y * 0.3;
                const moveLen = Math.sqrt(moveX*moveX + moveY*moveY) || 1;
                if (moveLen > student.speed) { moveX = (moveX/moveLen) * student.speed; moveY = (moveY/moveLen) * student.speed; }
                student.lastDirection = { x: moveX, y: moveY };

                let nextX = student.x + moveX; let nextY = student.y + moveY; let collision = false;
                const futureStudent = { ...student, x: nextX, y: nextY };
                for (const table of tables) {
                    if (table.isBench) continue; 
                    if (table.id !== "ziv_table" && checkCollision(futureStudent, table)) { 
                        collision = true; break; 
                    }
                }
                 // Check collision with other Ziv students
                for (const otherZivStudent of zivStudents) {
                    if (student.id !== otherZivStudent.id && distance(futureStudent, otherZivStudent) < TILE_SIZE * 1.2) { // Reduced distance
                        collision = true; break; 
                    }
                }
                
                if (!collision) { student.x = nextX; student.y = nextY; } 
                else { student.wanderTimer = student.wanderDelay; student.lastDirection = {x:0, y:0}; }
            } else {
                student.wanderTimer = student.wanderDelay; 
            }
            student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width));
            student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
        } else { 
            if (student.seatX !== null && student.seatY !== null) {
               student.x = student.seatX;
               student.y = student.seatY;
            }
        }
    });
}


function findPathAwayFromTeacher(student, teacher) {
    // ... (Keep existing findPathAwayFromTeacher logic)
    const dx = student.x - teacher.x; const dy = student.y - teacher.y;
    let targetX, targetY;

    if (student.personality.intelligence > 0.6) { 
        let bestHidingSpot = null; let maxScore = -Infinity;
        tables.forEach(table => {
            if (table.id === "kremer_table" || table.isBench) return; 
            const tableCenterX = table.x + table.width / 2; const tableCenterY = table.y + table.height / 2;
            const teacherToTableX = tableCenterX - teacher.x; const teacherToTableY = tableCenterY - teacher.y;
            const distTeacherToTable = Math.sqrt(teacherToTableX*teacherToTableX + teacherToTableY*teacherToTableY) || 1;
            const hideX = tableCenterX + (teacherToTableX / distTeacherToTable) * (table.width/2 + TILE_SIZE);
            const hideY = tableCenterY + (teacherToTableY / distTeacherToTable) * (table.height/2 + TILE_SIZE);
            const distStudentToHide = distance(student, {x: hideX, y: hideY, width:1, height:1});
            let score = (1000 / (distStudentToHide + 1)) + distTeacherToTable; 
            if (isPathBlocked(student.x, student.y, hideX, hideY)) score -= 500; 
            if (score > maxScore) { maxScore = score; bestHidingSpot = { x: hideX, y: hideY }; }
        });
        if (bestHidingSpot) { targetX = bestHidingSpot.x; targetY = bestHidingSpot.y; }
        else { 
            const escapeDist = TILE_SIZE * (10 + 5 * student.personality.bravery);
            const currentDist = Math.sqrt(dx * dx + dy * dy) || 1;
            targetX = student.x + (dx / currentDist) * escapeDist; targetY = student.y + (dy / currentDist) * escapeDist;
        }
    } else { 
        const escapeDist = TILE_SIZE * (10 + 5 * student.personality.bravery); 
        const currentDist = Math.sqrt(dx * dx + dy * dy) || 1; 
        targetX = student.x + (dx / currentDist) * escapeDist; targetY = student.y + (dy / currentDist) * escapeDist;
    }
    targetX = Math.max(TILE_SIZE, Math.min(targetX, WORLD_WIDTH - TILE_SIZE * 2));
    targetY = Math.max(TILE_SIZE, Math.min(targetY, WORLD_HEIGHT - TILE_SIZE * 2));
    return { x: targetX, y: targetY };
}

function findPathAroundObstacles(student, targetX, targetY) {
    // ... (Keep existing findPathAroundObstacles logic)
    if (!isPathBlocked(student.x + student.width/2, student.y + student.height/2, targetX, targetY)) return { x: targetX, y: targetY };
            
    const possibleWaypoints = []; const checkAngles = 16; 
    for (let i = 0; i < checkAngles; i++) {
        const angle = (i / checkAngles) * Math.PI * 2;
        const dist = TILE_SIZE * (5 + student.personality.intelligence * 5); 
        const wpX = student.x + student.width/2 + Math.cos(angle) * dist; const wpY = student.y + student.height/2 + Math.sin(angle) * dist;
        
        if (wpX > 0 && wpX < WORLD_WIDTH && wpY > 0 && wpY < WORLD_HEIGHT && 
            !isPathBlocked(student.x + student.width/2, student.y + student.height/2, wpX, wpY)) {
            const distToTarget = Math.sqrt(Math.pow(wpX - targetX, 2) + Math.pow(wpY - targetY, 2));
            const directDistToTarget = Math.sqrt(Math.pow(student.x - targetX, 2) + Math.pow(student.y - targetY, 2));
            const score = distToTarget + Math.abs(directDistToTarget - distToTarget) * 0.5; 
            possibleWaypoints.push({ x: wpX, y: wpY, score: score });
        }
    }
    if (possibleWaypoints.length > 0) { 
        possibleWaypoints.sort((a, b) => a.score - b.score); 
        return possibleWaypoints[0]; 
    }
    return { x: targetX, y: targetY }; 
}