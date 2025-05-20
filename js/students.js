const students = [];
const zivStudents = [];
const ziv = { // Ziv NPC definition
    name: "Ziv",
    x: TILE_SIZE * 80, y: TILE_SIZE * 10,
    width: TILE_SIZE, height: TILE_SIZE,
    color: ZIV_COLOR
};

const TABLE_WIDTH = TILE_SIZE * 12;
const TABLE_HEIGHT = TILE_SIZE * 5;

const tables = [
    {
        id: "kremer_table",
        name: "Kremer's Table",
        x: TILE_SIZE * 5, y: WORLD_HEIGHT - TABLE_HEIGHT * 3,
        width: TABLE_WIDTH, height: TABLE_HEIGHT,
        color: '#6c757d',
        isBench: false
    },
    {
        id: "ziv_table",
        name: "Ziv's Table",
        x: ziv.x - TABLE_WIDTH / 2, y: ziv.y + TILE_SIZE * 2,
        width: TABLE_WIDTH, height: TABLE_HEIGHT,
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

    // AI IMPROVEMENT: Better fallback for small tables if no seats were added by regular spacing
    if (seats.length < numSeats && seats.length === 0) {
        // Try to add one seat per side's center if space allows and seats are needed
        if (table.width >= TILE_SIZE && seats.length < numSeats) { // Top center
            seats.push({ x: table.x + table.width / 2 - TILE_SIZE * 0.25, y: table.y - TILE_SIZE * 1.5 });
        }
        if (table.height >= TILE_SIZE && seats.length < numSeats) { // Right center
            seats.push({ x: table.x + table.width + TILE_SIZE, y: table.y + table.height / 2 - TILE_SIZE * 0.25 });
        }
        if (table.width >= TILE_SIZE && seats.length < numSeats) { // Bottom center
            seats.push({ x: table.x + table.width / 2 - TILE_SIZE * 0.25, y: table.y + table.height + TILE_SIZE * 0.5 });
        }
        if (table.height >= TILE_SIZE && seats.length < numSeats) { // Left center
            seats.push({ x: table.x - TILE_SIZE * 1.5, y: table.y + table.height / 2 - TILE_SIZE * 0.25 });
        }
    }

    while (seats.length < numSeats) { // Fallback for tables too small for regular spacing or to fill remaining
        const randomSide = getRandomInt(0,3);
        // Ensure table dimensions are positive before trying to place seats on that side
        if (randomSide === 0 && table.width > 0 && Math.floor(table.width/TILE_SIZE)-1 >=0) seats.push({ x: table.x + getRandomInt(0, Math.floor(table.width/TILE_SIZE)-1) * TILE_SIZE, y: table.y - TILE_SIZE * 1.5 });
        else if (randomSide === 1 && table.height > 0 && Math.floor(table.height/TILE_SIZE)-1 >=0) seats.push({ x: table.x + table.width + TILE_SIZE, y: table.y + getRandomInt(0, Math.floor(table.height/TILE_SIZE)-1) * TILE_SIZE });
        else if (randomSide === 2 && table.width > 0 && Math.floor(table.width/TILE_SIZE)-1 >=0) seats.push({ x: table.x + getRandomInt(0, Math.floor(table.width/TILE_SIZE)-1) * TILE_SIZE, y: table.y + table.height + TILE_SIZE * 0.5 });
        else if (randomSide === 3 && table.height > 0 && Math.floor(table.height/TILE_SIZE)-1 >=0) seats.push({ x: table.x - TILE_SIZE * 1.5, y: table.y + getRandomInt(0, Math.floor(table.height/TILE_SIZE)-1) * TILE_SIZE });
        else { // Absolute fallback if table has no dimensions for some reason or other sides failed
            if (seats.length < numSeats) { // Only add if still needed, prevent infinite loop if table is truly 0x0
                 seats.push({ x: table.x + getRandomInt(-2,2)*TILE_SIZE, y: table.y + getRandomInt(-2,2)*TILE_SIZE });
            } else {
                break; // Avoid infinite loop if numSeats can't be met
            }
        }
    }
    return seats.slice(0, numSeats);
}


function initializeStudentSeats() { // Call this after tables are fully defined
    kremerSeatPositions = generateSeatPositions(KREMER_TABLE_INDEX, KREMER_STUDENT_NAMES.length);
    zivSeatPositions = generateSeatPositions(ZIV_TABLE_INDEX, ZIV_STUDENT_NAMES.length);
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
            if (attempts > 200) { // Safety break
                studentX = getRandomInt(TILE_SIZE, WORLD_WIDTH - TILE_SIZE * 2);
                studentY = getRandomInt(TILE_SIZE, WORLD_HEIGHT - TILE_SIZE * 2);
                // console.warn("Max attempts reached for student placement, using potentially overlapping position.");
                break;
            }
        } while (!validPosition);
        positions.push({x: studentX, y: studentY});
    }
    return positions;
}

function initializeKremerStudents() {
    students.length = 0;
    const numStudentsToSpawn = 15; // Or KREMER_STUDENT_NAMES.length if you want one of each name at least
    const validPositions = findKremerStudentValidPositions(numStudentsToSpawn);

    for (let i = 0; i < numStudentsToSpawn; i++) {
        const personality = { bravery: Math.random() * 0.6 + 0.2, intelligence: Math.random() * 0.7 + 0.1, stubbornness: Math.random() };
        // AI IMPROVEMENT: Initial wanderDelay influenced by personality
        const initialWanderDelay = getRandomInt(100, 250) * (1 + (0.5 - personality.bravery) * 0.4);

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
            wanderTimer: 0, wanderDelay: initialWanderDelay,
            lastDirection: { x: 0, y: 0 },
            personality: personality,
            escapeTimer: 0, escapeFailCounter: 0, messageTimer: 0, currentMessage: "", frozenTimer: 0,
            happiness: 50, madness: 0, boredom: 0, timesCaughtThisDay: 0
        });
    }
}

function initializeZivStudents() {
    zivStudents.length = 0;
    const zivTable = tables[ZIV_TABLE_INDEX];
    if (!zivTable) {
        console.error("Ziv's table is not defined during Ziv student initialization! Behavior might be unpredictable.");
    }

    for (let i = 0; i < ZIV_STUDENT_NAMES.length; i++) {
        let studentX, studentY, isInitiallyWandering;
        const studentSpeed = 1.0 + Math.random() * 0.5;
        let currentSeatX = null;
        let currentSeatY = null;

        if (zivTable && i < zivSeatPositions.length) {
            isInitiallyWandering = false;
            currentSeatX = zivSeatPositions[i].x;
            currentSeatY = zivSeatPositions[i].y;
            studentX = currentSeatX;
            studentY = currentSeatY;
        } else {
            isInitiallyWandering = true; // Must wander if no seat from the start
            if (zivTable) {
                studentX = zivTable.x + zivTable.width / 2 + getRandomInt(-TILE_SIZE * 4, TILE_SIZE * 4);
                studentY = zivTable.y + zivTable.height / 2 + getRandomInt(-TILE_SIZE * 4, TILE_SIZE * 4);
            } else {
                studentX = WORLD_WIDTH / 2 + getRandomInt(-TILE_SIZE * 10, TILE_SIZE * 10);
                studentY = WORLD_HEIGHT / 2 + getRandomInt(-TILE_SIZE * 10, TILE_SIZE * 10);
            }
        }

        studentX = Math.max(TILE_SIZE, Math.min(studentX, WORLD_WIDTH - TILE_SIZE*2));
        studentY = Math.max(TILE_SIZE, Math.min(studentY, WORLD_HEIGHT - TILE_SIZE*2));

        zivStudents.push({
            id: `ziv_${i}`, name: ZIV_STUDENT_NAMES[i], teacher: "Ziv",
            x: studentX, y: studentY,
            width: TILE_SIZE, height: TILE_SIZE,
            color: ZIV_STUDENT_COLOR,
            isWandering: isInitiallyWandering,
            wanderTargetX: studentX, wanderTargetY: studentY,
            speed: studentSpeed,
            wanderTimer: 0, wanderDelay: getRandomInt(150, 400),
            lastDirection: { x: 0, y: 0 },
            seatX: currentSeatX, seatY: currentSeatY,
            isAtSeat: !isInitiallyWandering, // Only true if starts at seat and not wandering
            isMicroWandering: false,
            microWanderTargetX: null, microWanderTargetY: null,
            timeToNextMicroWander: getRandomInt(180, 500),
            canRoamFar: false,
            // For temporary local wanders from seat:
            localWanderSegmentsLeft: 0, // How many more segments to wander locally before returning to seat
        });
    }

    // Designate 5-6 random students as "far roamers"
    const numRoamers = Math.min(zivStudents.length, getRandomInt(5, 6));
    const studentIndices = Array.from(Array(zivStudents.length).keys());
    for (let i = studentIndices.length - 1; i > 0; i--) { // Shuffle
        const j = Math.floor(Math.random() * (i + 1));
        [studentIndices[i], studentIndices[j]] = [studentIndices[j], studentIndices[i]];
    }

    for (let i = 0; i < numRoamers && i < studentIndices.length; i++) {
        const studentToRoam = zivStudents[studentIndices[i]];
        studentToRoam.canRoamFar = true;
        studentToRoam.isWandering = true;   // Roamers are always wandering
        studentToRoam.isAtSeat = false;
        studentToRoam.seatX = null;         // CRITICAL: Roamers have no seat to return to
        studentToRoam.seatY = null;
        studentToRoam.localWanderSegmentsLeft = 0; // Not applicable
        studentToRoam.wanderDelay = getRandomInt(300, 700); // Roamers might have different initial delays
    }
}

function initializeAllStudents() {
    if (kremerSeatPositions.length === 0 || zivSeatPositions.length === 0) {
        initializeStudentSeats();
    }
    initializeKremerStudents();
    initializeZivStudents();
}

function getMoodEmoji(student) {
    if (student.madness > 70) return "😡";
    if (student.madness > 40) return "😠";
    if (student.happiness <= 20 && student.boredom > 50) return "😑";
    if (student.happiness <= 40) return "😐";
    if (student.happiness > 70) return "😇";
    if (student.happiness > 40) return "🙂";
    return "😐";
}

function updateKremerStudents() {
    if (gamePaused || gameStates.isTransitioningDay()) return;
    students.forEach(student => {
        if (student.frozenTimer && student.frozenTimer > 0) { student.frozenTimer--; return; }

        if (student.isCaught && student.isAtSeat) {
            // AI IMPROVEMENT: Boredom influenced by personality
            let boredomIncrease = 0.1;
            if (student.personality.intelligence > 0.65) boredomIncrease *= 1.4; // Smarter get bored faster
            if (student.personality.intelligence < 0.3) boredomIncrease *= 0.7;
            if (student.personality.stubbornness > 0.7) boredomIncrease *= 0.6; // More stubborn get bored slower
            if (student.personality.stubbornness < 0.3) boredomIncrease *= 1.3;
            student.boredom = Math.min(100, student.boredom + boredomIncrease);
            student.happiness = Math.max(0, student.happiness - 0.02);

            if (student.boredom >= 100) {
                student.isCaught = false;
                student.isAtSeat = false;
                student.isWandering = true;
                player.captureCount = Math.max(0, player.captureCount -1);
                student.boredom = 0;
                // AI IMPROVEMENT: Happiness/madness change on leaving seat influenced by personality
                student.happiness = Math.max(0, student.happiness - (30 * (1 + student.personality.stubbornness * 0.5))); // Stubborn students might get unhappier?
                student.madness = Math.min(100, student.madness + (15 * (1 + (0.5 - student.personality.bravery) * 0.5))); // Less brave, more madness from frustration

                const angle = Math.random() * Math.PI * 2;
                student.wanderTargetX = student.seatX + Math.cos(angle) * TILE_SIZE * 10;
                student.wanderTargetY = student.seatY + Math.sin(angle) * TILE_SIZE * 10;
                showGameMessage(`${student.name} got bored and left their seat!`);
            }
        } else if (student.isCaught && !student.isAtSeat) {
            const targetX = student.seatX; const targetY = student.seatY;
            const diffX = targetX - student.x; const diffY = targetY - student.y;
            const distToSeat = Math.sqrt(diffX * diffX + diffY * diffY);

            if (distToSeat < student.returnSpeed) {
                student.x = targetX; student.y = targetY;
                student.isAtSeat = true;
                student.boredom = 0; // Reset boredom upon reaching seat
            } else {
                let moveX = (diffX / distToSeat) * student.returnSpeed;
                let moveY = (diffY / distToSeat) * student.returnSpeed;
                let nextX = student.x + moveX; let nextY = student.y + moveY;

                for (const table of tables) {
                    if (table.isBench) continue;
                    if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                        // Basic avoidance: try moving along one axis if direct path is blocked
                        if (Math.abs(diffX) > Math.abs(diffY)) { // Primarily horizontal movement needed
                            if (!isPathBlocked(student.x, student.y, student.x, student.y + Math.sign(diffY) * student.returnSpeed)) { moveX = 0; moveY = Math.sign(diffY) * student.returnSpeed * 0.8; }
                            else {moveX *= 0.5; moveY *= 0.5;} // Slow down if alternative also seems blocked
                        } else { // Primarily vertical movement needed
                            if (!isPathBlocked(student.x, student.y, student.x + Math.sign(diffX) * student.returnSpeed, student.y)) { moveX = Math.sign(diffX) * student.returnSpeed * 0.8; moveY = 0; }
                            else {moveX *= 0.5; moveY *= 0.5;}
                        }
                        nextX = student.x + moveX; nextY = student.y + moveY; // Recalculate next based on potential change
                        break;
                    }
                }
                student.x += moveX; student.y += moveY;
            }
        } else { // Not caught or not returning to seat (wandering, escaping)
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
                    // Ensure attraction doesn't make them phase through walls - this is a simplified attraction, full pathing not included here
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
                // AI IMPROVEMENT: Stubbornness and bravery influence calming down
                const calmChance = (0.05 * (1 + (1 - student.personality.stubbornness)*0.8) * (1 + student.personality.bravery*0.5));
                if (Math.random() < calmChance / (student.personality.stubbornness + 0.1) ) { // Higher base chance, more influenced by personality
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

                    let nextX = student.x + moveX; let nextY = student.y + moveY; let collided = false;
                    for (const table of tables) {
                        if (table.isBench) continue;
                        if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                            collided = true;
                            // AI IMPROVEMENT: Modified collision response during escape
                            student.x -= moveX * 0.25; // Less recoil
                            student.y -= moveY * 0.25;

                            const perturbAngle = (Math.random() - 0.5) * Math.PI / 2.5; // +/- 36 degrees
                            const currentEscapeAngle = Math.atan2(student.lastDirection.y, student.lastDirection.x);
                            const perturbedAngle = currentEscapeAngle + perturbAngle;
                            student.lastDirection = {
                                x: Math.cos(perturbedAngle) * student.runSpeed * 0.7, // Slightly reduce speed on perturbation
                                y: Math.sin(perturbedAngle) * student.runSpeed * 0.7
                            };
                            student.escapeFailCounter++;
                            if(student.escapeFailCounter > 7) { // Increased threshold slightly
                                student.isAfraidOfTeacher = false; student.isWandering = true; student.wanderTimer = 0; student.escapeFailCounter = 0;
                                student.currentMessage = "?"; student.messageTimer = 30; // Confused
                            }
                            break;
                        }
                    }
                    if (!collided) { student.x = nextX; student.y = nextY; student.escapeFailCounter = 0; student.lastDirection = { x: moveX, y: moveY };}
                } else { // Reached near escape target or target is too close
                    student.escapeTimer++; if(student.escapeTimer > 120) {
                        student.isAfraidOfTeacher = false; student.isWandering = true; student.escapeTimer = 0;
                    }
                }
                student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width));
                student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
            } else if (student.isWandering) {
                student.wanderTimer++;
                if (student.wanderTimer >= student.wanderDelay || distance(student, {x: student.wanderTargetX, y: student.wanderTargetY, width:1, height:1}) < student.speed * 2) {
                    student.wanderTimer = 0;
                    // AI IMPROVEMENT: Wander delay and distance influenced by personality
                    student.wanderDelay = getRandomInt(80, 250) * (1 + (0.6 - student.personality.bravery) * 0.7) * Math.max(0.5, (1 - student.personality.intelligence * 0.3));
                    student.wanderDelay = Math.max(60, student.wanderDelay); // Minimum delay

                    const angle = Math.random() * Math.PI * 2;
                    const wanderDistBase = TILE_SIZE * getRandomInt(4, 12);
                    const wanderDist = wanderDistBase * (1 + student.personality.bravery * 0.5) * (1 + student.personality.intelligence * 0.2);

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

                    let nextX = student.x + moveX; let nextY = student.y + moveY; let collision = false;
                    const futureStudent = { ...student, x: nextX, y: nextY };
                    for (const table of tables) {
                        if (table.isBench) continue;
                        if (checkCollision(futureStudent, table)) { collision = true; break; }
                    }
                    if (!collision) {
                        for (const otherStudent of students) {
                            if (student.id !== otherStudent.id && !otherStudent.isCaught && distance(futureStudent, otherStudent) < TILE_SIZE * 1.1) {
                                collision = true;
                                // AI IMPROVEMENT: If other student is also wandering, this student might pause or adjust slightly
                                if (otherStudent.isWandering) {
                                    student.wanderTimer = Math.max(0, student.wanderDelay - 30); // Pause for ~0.5 sec before new target
                                }
                                break;
                            }
                        }
                    }

                    if (!collision) { student.x = nextX; student.y = nextY; student.lastDirection = { x: moveX, y: moveY };}
                    else { // AI IMPROVEMENT: Better collision response for wandering
                        student.wanderTimer = 0;
                        student.wanderDelay = getRandomInt(30, 90); // Shorter delay to re-evaluate after collision

                        const randomAngleOffset = (Math.random() - 0.5) * Math.PI / 1.5; // +/- 60 degrees deflection
                        const currentAngle = Math.atan2(student.lastDirection.y, student.lastDirection.x || Math.sign(diffX)); // Use diff if lastDir is 0
                        const newAngle = currentAngle + randomAngleOffset;
                        const wanderDist = TILE_SIZE * getRandomInt(2, 5);

                        student.wanderTargetX = student.x + Math.cos(newAngle) * wanderDist;
                        student.wanderTargetY = student.y + Math.sin(newAngle) * wanderDist;
                        student.wanderTargetX = Math.max(TILE_SIZE, Math.min(student.wanderTargetX, WORLD_WIDTH - TILE_SIZE*2));
                        student.wanderTargetY = Math.max(TILE_SIZE, Math.min(student.wanderTargetY, WORLD_HEIGHT - TILE_SIZE*2));
                        student.lastDirection = {x:0, y:0}; // Clear last direction for fresh calculation
                    }
                } else student.wanderTimer = student.wanderDelay; // Reached target

                student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width));
                student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
            }

            if (distance(player, student) < CAPTURE_RADIUS && !student.isCaught) {
                student.isCaught = true;
                student.isAtSeat = false;
                student.isWandering = false;
                student.isAfraidOfTeacher = false;
                student.currentMessage = ""; student.messageTimer = 0;
                player.captureCount++;

                student.timesCaughtThisDay++;
                student.madness = Math.min(100, student.madness + 15 * student.timesCaughtThisDay * (1 + (0.5 - student.personality.bravery))); // Less brave, more madness when caught
                student.happiness = Math.max(0, student.happiness - (20 * (1 + student.personality.stubbornness))); // More stubborn, bigger happiness hit

                showGameMessage(`${student.name} caught! (${player.captureCount}/${students.length})`);
            }
        }
    });
}

function updateZivStudents() {
    if (gamePaused || gameStates.isTransitioningDay()) return;

    const zivTable = tables[ZIV_TABLE_INDEX];

    const farRoamBounds = {
        minX: TILE_SIZE * 2, maxX: WORLD_WIDTH - TILE_SIZE * 3,
        minY: TILE_SIZE * 2, maxY: WORLD_HEIGHT - TILE_SIZE * 3,
    };
    const localWanderBounds = zivTable ? {
        minX: zivTable.x - TILE_SIZE * 12, maxX: zivTable.x + zivTable.width + TILE_SIZE * 12,
        minY: zivTable.y - TILE_SIZE * 10, maxY: zivTable.y + zivTable.height + TILE_SIZE * 10,
    } : {
        minX: TILE_SIZE * 5, maxX: WORLD_WIDTH - TILE_SIZE * 5,
        minY: TILE_SIZE * 5, maxY: WORLD_HEIGHT - TILE_SIZE * 5
    };

    function executeWanderMovement(student, currentWanderBounds) {
        // ... (This helper function remains the same as in the previous good version)
        // It calculates movement towards student.wanderTargetX/Y within currentWanderBounds,
        // handles basic collision with tables and other Ziv students, and updates student.x/y.
        // On collision or reaching target, it resets student.wanderTimer to student.wanderDelay.
        const diffX = student.wanderTargetX - student.x;
        const diffY = student.wanderTargetY - student.y;
        const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

        if (distToTarget > student.speed) {
            let moveX = (diffX / distToTarget) * student.speed;
            let moveY = (diffY / distToTarget) * student.speed;
            moveX = moveX * 0.75 + (student.lastDirection.x || 0) * 0.25;
            moveY = moveY * 0.75 + (student.lastDirection.y || 0) * 0.25;
            const moveLen = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
            if (moveLen > student.speed) {
                moveX = (moveX / moveLen) * student.speed;
                moveY = (moveY / moveLen) * student.speed;
            }

            let nextX = student.x + moveX;
            let nextY = student.y + moveY;
            let collision = false;
            const futureStudent = { ...student, x: nextX, y: nextY };

            for (const table of tables) {
                if (table.isBench) continue;
                const isOwnZivTable = zivTable && table.id === zivTable.id;
                if (student.canRoamFar && checkCollision(futureStudent, table)) { // Roamers avoid all tables
                    collision = true; break;
                } else if (!student.canRoamFar && !isOwnZivTable && checkCollision(futureStudent, table)) { // Local wanderers avoid tables not Ziv's
                    collision = true; break;
                }
            }
            if (!collision) {
                for (const otherZivStudent of zivStudents) {
                    if (student.id !== otherZivStudent.id && distance(futureStudent, otherZivStudent) < TILE_SIZE * 1.1) {
                        collision = true; break;
                    }
                }
            }

            if (!collision) {
                student.x = nextX;
                student.y = nextY;
                student.lastDirection = { x: moveX, y: moveY };
            } else {
                student.wanderTimer = student.wanderDelay; 
                student.lastDirection = { x: 0, y: 0 };    
            }
        } else { 
            student.wanderTimer = student.wanderDelay; 
        }
    }

    zivStudents.forEach(student => {
        // Reset states that are determined per frame
        student.isAtSeat = false;
        student.isMicroWandering = false;

        if (student.canRoamFar) {
            // --- STATE 1: FAR ROAMER ---
            // These students have seatX = null and are always wandering.
            student.isWandering = true;
            student.wanderTimer++;
            if (student.wanderTimer >= student.wanderDelay || distance(student, { x: student.wanderTargetX, y: student.wanderTargetY }) < student.speed * 2) {
                student.wanderTimer = 0;
                student.wanderDelay = getRandomInt(300, 700); // Longer decision time for roamers
                const angle = Math.random() * Math.PI * 2;
                const wanderDist = TILE_SIZE * getRandomInt(15, 30); // Roam further
                student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                student.wanderTargetX = Math.max(farRoamBounds.minX, Math.min(student.wanderTargetX, farRoamBounds.maxX));
                student.wanderTargetY = Math.max(farRoamBounds.minY, Math.min(student.wanderTargetY, farRoamBounds.maxY));
            }
            executeWanderMovement(student, farRoamBounds);

        } else if (student.seatX === null) {
            // --- STATE 2: UNSEATED LOCAL WANDERER ---
            // These students have no seat and are not far roamers. They always wander locally.
            student.isWandering = true;
            student.wanderTimer++;
            if (student.wanderTimer >= student.wanderDelay || distance(student, { x: student.wanderTargetX, y: student.wanderTargetY }) < student.speed * 2) {
                student.wanderTimer = 0;
                student.wanderDelay = getRandomInt(200, 500);
                const angle = Math.random() * Math.PI * 2;
                const wanderDist = TILE_SIZE * getRandomInt(6, 15); // More local wander distance
                student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                student.wanderTargetX = Math.max(localWanderBounds.minX, Math.min(student.wanderTargetX, localWanderBounds.maxX));
                student.wanderTargetY = Math.max(localWanderBounds.minY, Math.min(student.wanderTargetY, localWanderBounds.maxY));
            }
            executeWanderMovement(student, localWanderBounds);

        } else {
            // --- STATE 3: SEATED STUDENT (has a seat, not a far roamer) ---
            // Manages transitions between being at seat (micro-wandering) and temporary local wandering.
            if (student.isWandering) { // Currently on a temporary local wander
                student.wanderTimer++;
                if (student.wanderTimer >= student.wanderDelay || distance(student, { x: student.wanderTargetX, y: student.wanderTargetY }) < student.speed * 2) {
                    student.localWanderSegmentsLeft--;
                    if (student.localWanderSegmentsLeft <= 0) {
                        student.isWandering = false; // End temporary wander, will go to seat logic next frame
                        // No need to move to seat here, the other block will handle it.
                    } else { // Continue temporary local wander
                        student.wanderTimer = 0;
                        student.wanderDelay = getRandomInt(180, 400); // Shorter segments for local temp wander
                        const angle = Math.random() * Math.PI * 2;
                        const wanderDist = TILE_SIZE * getRandomInt(5, 10);
                        student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                        student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                        student.wanderTargetX = Math.max(localWanderBounds.minX, Math.min(student.wanderTargetX, localWanderBounds.maxX));
                        student.wanderTargetY = Math.max(localWanderBounds.minY, Math.min(student.wanderTargetY, localWanderBounds.maxY));
                    }
                }
                if (student.isWandering) { // If still in temporary wander after logic above
                    executeWanderMovement(student, localWanderBounds);
                }
            }

            if (!student.isWandering) { // At seat or returning to seat
                student.isAtSeat = true;
                student.isMicroWandering = true; // Assume micro-wandering is the "at seat" animated state

                // Logic for actual micro-movement or deciding to start a temp local wander
                const distToSeat = distance(student, { x: student.seatX, y: student.seatY });
                if (distToSeat > student.speed * 0.5) { // If not at seat, move towards it
                     const diffX = student.seatX - student.x;
                     const diffY = student.seatY - student.y;
                     let moveX = (diffX / distToSeat) * student.speed * 0.8; // Slower return to seat
                     let moveY = (diffY / distToSeat) * student.speed * 0.8;
                     student.x += moveX;
                     student.y += moveY;
                } else { // At seat, perform micro-wander logic or decide to start temporary local wander
                    student.x = student.seatX; // Snap to seat precisely
                    student.y = student.seatY;
                    student.lastDirection = { x: 0, y: 0 };

                    student.timeToNextMicroWander--;
                    if (student.timeToNextMicroWander <= 0) {
                        // Chance to start a temporary local wander
                        if (Math.random() < 0.03) { // Small chance (e.g., 3%) to get up and wander locally
                            student.isWandering = true;
                            student.isMicroWandering = false; // Not micro if doing a full wander
                            student.localWanderSegmentsLeft = getRandomInt(2, 5); // Wander for 2-5 segments
                            student.wanderTimer = 0; // Start new wander immediately
                            student.wanderDelay = 0; // Force target selection in current frame if possible for responsiveness
                            // Target will be picked in the next iteration's "isWandering" block
                        } else { // Otherwise, do a micro-fidget (or just reset timer)
                            // This is where you'd put the actual small "fidget" movement if desired,
                            // or just reset the timer for the next chance to start a local wander.
                            // For simplicity, we'll just reset the timer. A dedicated fidget can be added.
                            student.timeToNextMicroWander = getRandomInt(150, 450);
                        }
                    }
                }
            }
        }

        // Final clamping for all students
        student.x = Math.max(TILE_SIZE, Math.min(student.x, WORLD_WIDTH - student.width - TILE_SIZE));
        student.y = Math.max(TILE_SIZE, Math.min(student.y, WORLD_HEIGHT - student.height - TILE_SIZE));
    });
}


function findPathAwayFromTeacher(student, teacher) {
    const dx = student.x - teacher.x; const dy = student.y - teacher.y;
    let targetX, targetY;

    if (student.personality.intelligence > 0.6) {
        let bestHidingSpot = null; let maxScore = -Infinity;
        tables.forEach(table => {
            if (table.id === "kremer_table" || table.id === "ziv_table" || table.isBench) return; // Avoid main teacher tables as hiding spots
            const tableCenterX = table.x + table.width / 2; const tableCenterY = table.y + table.height / 2;
            const teacherToTableX = tableCenterX - teacher.x; const teacherToTableY = tableCenterY - teacher.y;
            const distTeacherToTable = Math.sqrt(teacherToTableX*teacherToTableX + teacherToTableY*teacherToTableY) || 1;

            // Position behind the table relative to the teacher
            const hideX = tableCenterX + (teacherToTableX / distTeacherToTable) * (Math.max(table.width, table.height)/2 + TILE_SIZE * 1.5); // Hide a bit further
            const hideY = tableCenterY + (teacherToTableY / distTeacherToTable) * (Math.max(table.width, table.height)/2 + TILE_SIZE * 1.5);

            const distStudentToHide = distance(student, {x: hideX, y: hideY, width:1, height:1});
            let score = (1000 / (distStudentToHide + 1)) + distTeacherToTable * 1.5; // Prioritize further tables more
            if (isPathBlocked(student.x, student.y, hideX, hideY)) score -= 700; // Heavier penalty for blocked path
            if (score > maxScore) { maxScore = score; bestHidingSpot = { x: hideX, y: hideY }; }
        });
        if (bestHidingSpot) { targetX = bestHidingSpot.x; targetY = bestHidingSpot.y; }
        else { // Fallback if no good hiding spot found
            const escapeDist = TILE_SIZE * (10 + 7 * student.personality.bravery + 3 * student.personality.intelligence); // Braver/smarter run further strategically
            const currentDist = Math.sqrt(dx * dx + dy * dy) || 1;
            targetX = student.x + (dx / currentDist) * escapeDist; targetY = student.y + (dy / currentDist) * escapeDist;
        }
    } else { // Less intelligent students run more directly
        const escapeDist = TILE_SIZE * (8 + 5 * student.personality.bravery); // Bravery still counts
        const currentDist = Math.sqrt(dx * dx + dy * dy) || 1;
        targetX = student.x + (dx / currentDist) * escapeDist; targetY = student.y + (dy / currentDist) * escapeDist;
    }
    targetX = Math.max(TILE_SIZE, Math.min(targetX, WORLD_WIDTH - TILE_SIZE * 2));
    targetY = Math.max(TILE_SIZE, Math.min(targetY, WORLD_HEIGHT - TILE_SIZE * 2));
    return { x: targetX, y: targetY };
}

function findPathAroundObstacles(student, targetX, targetY) {
    // Center of the student for path checking
    const studentCX = student.x + student.width / 2;
    const studentCY = student.y + student.height / 2;

    if (!isPathBlocked(studentCX, studentCY, targetX, targetY)) return { x: targetX, y: targetY };

    const possibleWaypoints = []; const checkAngles = 16; // Check 16 directions
    const intelligenceFactor = 1 + student.personality.intelligence * 1.5; // More intelligent students check further/smarter waypoints

    for (let i = 0; i < checkAngles; i++) {
        const angle = (i / checkAngles) * Math.PI * 2;
        const dist = TILE_SIZE * (3 + 4 * intelligenceFactor); // Base check distance, scaled by intelligence
        const wpX = studentCX + Math.cos(angle) * dist;
        const wpY = studentCY + Math.sin(angle) * dist;

        if (wpX > 0 && wpX < WORLD_WIDTH && wpY > 0 && wpY < WORLD_HEIGHT &&
            !isPathBlocked(studentCX, studentCY, wpX, wpY)) {
            const distToFinalTarget = Math.sqrt(Math.pow(wpX - targetX, 2) + Math.pow(wpY - targetY, 2));
            // Score: prioritize waypoints that lead closer to the final target
            // and slightly penalize waypoints that deviate too much from the direct line to the target
            const directDistToTarget = Math.sqrt(Math.pow(studentCX - targetX, 2) + Math.pow(studentCY - targetY, 2));
            const deviationPenalty = Math.abs(dist + distToFinalTarget - directDistToTarget) * 0.3; // Penalize indirect paths less heavily

            const score = distToFinalTarget + deviationPenalty;
            possibleWaypoints.push({ x: wpX, y: wpY, score: score });
        }
    }

    if (possibleWaypoints.length > 0) {
        possibleWaypoints.sort((a, b) => a.score - b.score);
        return possibleWaypoints[0]; // Return the center of the best waypoint
    }

    // If no clear waypoint, try moving perpendicularly to the initial direction towards target for a short distance
    // This is a more desperate fallback if all waypoints are blocked or none found
    const initialDx = targetX - studentCX;
    const initialDy = targetY - studentCY;
    const perpAngle1 = Math.atan2(initialDy, initialDx) + Math.PI / 2;
    const perpAngle2 = Math.atan2(initialDy, initialDx) - Math.PI / 2;
    const shortDist = TILE_SIZE * 2;

    const fallbackTarget1 = { x: studentCX + Math.cos(perpAngle1) * shortDist, y: studentCY + Math.sin(perpAngle1) * shortDist };
    const fallbackTarget2 = { x: studentCX + Math.cos(perpAngle2) * shortDist, y: studentCY + Math.sin(perpAngle2) * shortDist };

    if (!isPathBlocked(studentCX, studentCY, fallbackTarget1.x, fallbackTarget1.y)) return fallbackTarget1;
    if (!isPathBlocked(studentCX, studentCY, fallbackTarget2.x, fallbackTarget2.y)) return fallbackTarget2;
    
    return { x: targetX, y: targetY }; // Absolute fallback: aim for original target (might be stuck)
}