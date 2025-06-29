// Modified js/main.js - Add multiplayer integration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameUIMessage = document.getElementById('gameUI');

let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
let isFullscreenActive = false;
let screenEdgePadding = 0;

let gameTime = 0;
let gamePaused = false;
let currentDay = 1;
let fadeOverlayAlpha = 0;

// Main Game Update Function with Multiplayer Support
function update() {
    environment.updateEnvironment();

    if (!gamePaused && !gameStates.isTransitioningDay()) {
        specialAbilities.update();

        // Handle multiplayer-specific updates
        if (multiplayerManager.isMultiplayer) {
            if (multiplayerManager.playerRole === 'teacher') {
                // Teacher updates everything normally
                updatePlayer();
                updateKremerStudents();
                updateZivStudents();
                updatePowerUps();

                // Send game state updates periodically
                if (Math.floor(gameTime * 60) % 30 === 0) { // Every 0.5 seconds
                    multiplayerManager.sendGameStateUpdate({
                        gameTime: gameTime,
                        currentDay: currentDay,
                        teacherData: {
                            x: player.x,
                            y: player.y,
                            stamina: player.stamina,
                            captureCount: player.captureCount
                        }
                    });
                }
            } else if (multiplayerManager.playerRole === 'student') {
                // Students only update their controlled student and handle input
                multiplayerManager.handleStudentInput();
                updateZivStudents(); // Keep Ziv students moving
                updatePowerUps(); // Keep power-ups animated

                // Don't update AI students or teacher - those come from server
                students.forEach(student => {
                    if (!student.isPlayerControlled) {
                        // Skip AI updates for non-controlled students
                        return;
                    }
                });
            }

            // Send position updates for controlled entities
            multiplayerManager.updateMultiplayerStudents();
        } else {
            // Single player - update everything normally
            updatePlayer();
            updateKremerStudents();
            updateZivStudents();
            updatePowerUps();
        }
    }

    updateCamera();
    gameStates.update();
}

// Modified updatePlayer function to handle multiplayer
function updatePlayer() {
    if (gamePaused || gameStates.isTransitioningDay()) return;

    // In multiplayer student mode, don't update the teacher player
    if (multiplayerManager.isMultiplayer && multiplayerManager.playerRole === 'student') {
        return;
    }

    // Handle sprinting and stamina
    if (player.isSprinting && keys.shift && player.stamina > 0) {
        player.currentSpeed = player.baseSpeed * player.sprintMultiplier;
        player.stamina = Math.max(0, player.stamina - player.staminaDepletionRate);
        if (player.stamina <= 0) {
            player.isSprinting = false;
            keys.shift = false;
            if (isTouchDevice && mobileButtons.sprint.pressed) mobileButtons.sprint.pressed = false;
        }
    } else {
        player.currentSpeed = player.baseSpeed;
        if (player.stamina < player.maxStamina) player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
    }

    const prevX = player.x;
    const prevY = player.y;

    let moveDeltaX = 0;
    let moveDeltaY = 0;
    if (player.dx !== 0 || player.dy !== 0) {
        moveDeltaX = player.dx * player.currentSpeed;
        moveDeltaY = player.dy * player.currentSpeed;
    }

    let newX = player.x + moveDeltaX;
    let newY = player.y + moveDeltaY;

    newX = Math.max(0, Math.min(newX, WORLD_WIDTH - player.width));
    newY = Math.max(0, Math.min(newY, WORLD_HEIGHT - player.height));

    let canMoveX = true;
    let tempPlayer = {...player, x: newX };
    for (const table of tables) {
        if (table.isBench) continue;
        if (checkCollision(tempPlayer, table)) {
            canMoveX = false;
            break;
        }
    }

    let canMoveY = true;
    tempPlayer = {...player, y: newY };
    for (const table of tables) {
        if (table.isBench) continue;
        if (checkCollision(tempPlayer, table)) {
            canMoveY = false;
            break;
        }
    }

    if (canMoveX) player.targetX = newX;
    if (canMoveY) player.targetY = newY;

    const smoothDx = player.targetX - player.x;
    const smoothDy = player.targetY - player.y;

    if (Math.abs(smoothDx) > 0.1) {
        player.x += smoothDx * player.movementSmoothing;
    } else {
        player.x = player.targetX;
    }

    if (Math.abs(smoothDy) > 0.1) {
        player.y += smoothDy * player.movementSmoothing;
    } else {
        player.y = player.targetY;
    }

    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));

    const movedDistance = Math.sqrt(Math.pow(player.x - prevX, 2) + Math.pow(player.y - prevY, 2));
    if (movedDistance < 0.1 && (player.dx !== 0 || player.dy !== 0)) {
        const forceX = player.dx * Math.min(2, player.currentSpeed * 0.2);
        const forceY = player.dy * Math.min(2, player.currentSpeed * 0.2);

        let forcedX = player.x + forceX;
        let forcedY = player.y + forceY;

        let canForceX = true;
        tempPlayer = {...player, x: forcedX };
        for (const table of tables) {
            if (table.isBench) continue;
            if (checkCollision(tempPlayer, table)) {
                canForceX = false;
                break;
            }
        }

        let canForceY = true;
        tempPlayer = {...player, y: forcedY };
        for (const table of tables) {
            if (table.isBench) continue;
            if (checkCollision(tempPlayer, table)) {
                canForceY = false;
                break;
            }
        }

        if (canForceX) {
            player.x = forcedX;
            player.targetX = forcedX;
        }
        if (canForceY) {
            player.y = forcedY;
            player.targetY = forcedY;
        }

        player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
    }

    // Send position update in multiplayer
    if (multiplayerManager.isMultiplayer && multiplayerManager.playerRole === 'teacher') {
        // Position updates are sent in multiplayerManager.updateMultiplayerStudents()
    }
}

// Modified updateKremerStudents for multiplayer
function updateKremerStudents() {
    if (gamePaused || gameStates.isTransitioningDay()) return;

    students.forEach(student => {
        // Skip updating player-controlled students in multiplayer
        if (multiplayerManager.isMultiplayer && student.isPlayerControlled) {
            // Player-controlled students are updated by their respective players
            return;
        }

        if (student.frozenTimer && student.frozenTimer > 0) {
            student.frozenTimer--;
            return;
        }

        if (student.isCaught && student.isAtSeat) {
            let boredomIncrease = 0.1;
            if (student.personality.intelligence > 0.65) boredomIncrease *= 1.4;
            if (student.personality.intelligence < 0.3) boredomIncrease *= 0.7;
            if (student.personality.stubbornness > 0.7) boredomIncrease *= 0.6;
            if (student.personality.stubbornness < 0.3) boredomIncrease *= 1.3;
            student.boredom = Math.min(100, student.boredom + boredomIncrease);
            student.happiness = Math.max(0, student.happiness - 0.02);

            if (student.boredom >= 100) {
                student.isCaught = false;
                student.isAtSeat = false;
                student.isWandering = true;
                if (multiplayerManager.playerRole === 'teacher' || !multiplayerManager.isMultiplayer) {
                    player.captureCount = Math.max(0, player.captureCount - 1);
                }
                student.boredom = 0;
                student.happiness = Math.max(0, student.happiness - (20 * (1 + student.personality.stubbornness)));
                student.madness = Math.min(100, student.madness + (15 * (1 + (0.5 - student.personality.bravery) * 0.5)));

                const angle = Math.random() * Math.PI * 2;
                student.wanderTargetX = student.seatX + Math.cos(angle) * TILE_SIZE * 10;
                student.wanderTargetY = student.seatY + Math.sin(angle) * TILE_SIZE * 10;
                showGameMessage(`${student.name} got bored and left their seat!`);
            }
        } else if (student.isCaught && !student.isAtSeat) {
            const targetX = student.seatX;
            const targetY = student.seatY;
            const diffX = targetX - student.x;
            const diffY = targetY - student.y;
            const distToSeat = Math.sqrt(diffX * diffX + diffY * diffY);

            if (distToSeat < student.returnSpeed) {
                student.x = targetX;
                student.y = targetY;
                student.isAtSeat = true;
                student.boredom = 0;
            } else {
                let moveX = (diffX / distToSeat) * student.returnSpeed;
                let moveY = (diffY / distToSeat) * student.returnSpeed;
                let nextX = student.x + moveX;
                let nextY = student.y + moveY;

                for (const table of tables) {
                    if (table.isBench) continue;
                    if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                        if (Math.abs(diffX) > Math.abs(diffY)) {
                            if (!isPathBlocked(student.x, student.y, student.x, student.y + Math.sign(diffY) * student.returnSpeed)) {
                                moveX = 0;
                                moveY = Math.sign(diffY) * student.returnSpeed * 0.8;
                            } else {
                                moveX *= 0.5;
                                moveY *= 0.5;
                            }
                        } else {
                            if (!isPathBlocked(student.x, student.y, student.x + Math.sign(diffX) * student.returnSpeed, student.y)) {
                                moveX = Math.sign(diffX) * student.returnSpeed * 0.8;
                                moveY = 0;
                            } else {
                                moveX *= 0.5;
                                moveY *= 0.5;
                            }
                        }
                        nextX = student.x + moveX;
                        nextY = student.y + moveY;
                        break;
                    }
                }
                student.x += moveX;
                student.y += moveY;
            }
        } else {
            // Wandering/escaping logic
            student.isAtSeat = false;
            if (student.isWandering && !student.isAfraidOfTeacher) {
                student.happiness = Math.min(100, student.happiness + 0.05);
                student.madness = Math.max(0, student.madness - 0.03);
            }

            if (player.attractionField) {
                const distToPlayer = distance(student, player);
                if (distToPlayer < player.attractionRadius) {
                    const force = (1 - distToPlayer / player.attractionRadius) * player.attractionForce;
                    const dirX = player.x - student.x;
                    const dirY = player.y - student.y;
                    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
                    student.x += (dirX / len) * force * student.speed * 0.5;
                    student.y += (dirY / len) * force * student.speed * 0.5;
                }
            }

            const distToTeacher = distance(student, player);
            if (distToTeacher < DETECTION_RADIUS && !student.isAfraidOfTeacher) {
                if (Math.random() > student.personality.bravery) {
                    student.isAfraidOfTeacher = true;
                    student.isWandering = false;
                    student.currentMessage = "!";
                    student.messageTimer = 60;
                }
            } else if (distToTeacher >= DETECTION_RADIUS * 1.5 && student.isAfraidOfTeacher) {
                const calmChance = (0.05 * (1 + (1 - student.personality.stubbornness) * 0.8) * (1 + student.personality.bravery * 0.5));
                if (Math.random() < calmChance / (student.personality.stubbornness + 0.1)) {
                    student.isAfraidOfTeacher = false;
                    student.isWandering = true;
                    student.wanderTimer = student.wanderDelay;
                }
            }

            if (student.messageTimer > 0) student.messageTimer--;
            else student.currentMessage = "";

            if (student.isAfraidOfTeacher) {
                if (student.escapeTimer % 15 === 0 || !student.escapeTarget) {
                    student.escapeTarget = findPathAwayFromTeacher(student, player);
                }

                if (student.escapeTarget) {
                    const diffX = student.escapeTarget.x - student.x;
                    const diffY = student.escapeTarget.y - student.y;
                    const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

                    if (distToTarget < student.runSpeed || student.escapeTimer > 180) {
                        student.escapeTimer++;
                        if (student.escapeTimer > 120) {
                            student.isAfraidOfTeacher = false;
                            student.isWandering = true;
                            student.escapeTimer = 0;
                            student.escapeTarget = null;
                            student.escapeFailCounter = 0;
                        }
                    } else {
                        let moveX = (diffX / distToTarget) * student.runSpeed;
                        let moveY = (diffY / distToTarget) * student.runSpeed;

                        moveX = moveX * 0.7 + (student.lastDirection.x || 0) * 0.3;
                        moveY = moveY * 0.7 + (student.lastDirection.y || 0) * 0.3;

                        const moveLen = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                        if (moveLen > student.runSpeed) {
                            moveX = (moveX / moveLen) * student.runSpeed;
                            moveY = (moveY / moveLen) * student.runSpeed;
                        }

                        let nextX = student.x + moveX;
                        let nextY = student.y + moveY;
                        let canMove = true;

                        for (const table of tables) {
                            if (table.isBench) continue;
                            if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                                canMove = false;
                                break;
                            }
                        }

                        if (canMove) {
                            student.x = nextX;
                            student.y = nextY;
                            student.lastDirection = { x: moveX, y: moveY };
                            student.escapeFailCounter = 0;
                        } else {
                            // Try moving only on X axis
                            nextX = student.x + moveX;
                            nextY = student.y;
                            canMove = true;
                            for (const table of tables) {
                                if (table.isBench) continue;
                                if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                                    canMove = false;
                                    break;
                                }
                            }
                            if (canMove) {
                                student.x = nextX;
                                student.lastDirection = { x: moveX, y: 0 };
                            } else {
                                // Try moving only on Y axis
                                nextX = student.x;
                                nextY = student.y + moveY;
                                canMove = true;
                                for (const table of tables) {
                                    if (table.isBench) continue;
                                    if (checkCollision({ ...student, x: nextX, y: nextY }, table)) {
                                        canMove = false;
                                        break;
                                    }
                                }
                                if (canMove) {
                                    student.y = nextY;
                                    student.lastDirection = { x: 0, y: moveY };
                                } else {
                                    student.escapeFailCounter++;
                                    if (student.escapeFailCounter > 5) {
                                        const randomAngle = Math.random() * Math.PI * 2;
                                        student.escapeTarget = {
                                            x: student.x + Math.cos(randomAngle) * TILE_SIZE * 10,
                                            y: student.y + Math.sin(randomAngle) * TILE_SIZE * 10
                                        };
                                        if (student.escapeFailCounter > 15) {
                                            student.isAfraidOfTeacher = false;
                                            student.isWandering = true;
                                            student.escapeTimer = 0;
                                            student.escapeTarget = null;
                                            student.escapeFailCounter = 0;
                                            student.currentMessage = "?";
                                            student.messageTimer = 30;
                                        }
                                    }
                                }
                            }
                        }
                        student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width));
                        student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
                        student.escapeTimer++;
                    }
                }
            } else if (student.isWandering) {
                student.wanderTimer++;
                if (student.wanderTimer >= student.wanderDelay || distance(student, { x: student.wanderTargetX, y: student.wanderTargetY, width: 1, height: 1 }) < student.speed * 2) {
                    student.wanderTimer = 0;
                    student.wanderDelay = getRandomInt(80, 250) * (1 + (0.6 - student.personality.bravery) * 0.7) * Math.max(0.5, (1 - student.personality.intelligence * 0.3));
                    student.wanderDelay = Math.max(60, student.wanderDelay);

                    const angle = Math.random() * Math.PI * 2;
                    const wanderDistBase = TILE_SIZE * getRandomInt(4, 12);
                    const wanderDist = wanderDistBase * (1 + student.personality.bravery * 0.5) * (1 + student.personality.intelligence * 0.2);

                    student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                    student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                    student.wanderTargetX = Math.max(TILE_SIZE, Math.min(student.wanderTargetX, WORLD_WIDTH - TILE_SIZE * 2));
                    student.wanderTargetY = Math.max(TILE_SIZE, Math.min(student.wanderTargetY, WORLD_HEIGHT - TILE_SIZE * 2));
                }

                const diffX = student.wanderTargetX - student.x;
                const diffY = student.wanderTargetY - student.y;
                const distToTarget = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distToTarget > student.speed) {
                    let moveX = (diffX / distToTarget) * student.speed;
                    let moveY = (diffY / distToTarget) * student.speed;
                    moveX = moveX * 0.7 + student.lastDirection.x * 0.3;
                    moveY = moveY * 0.7 + student.lastDirection.y * 0.3;
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
                        if (checkCollision(futureStudent, table)) {
                            collision = true;
                            break;
                        }
                    }
                    if (!collision) {
                        for (const otherStudent of students) {
                            if (student.id !== otherStudent.id && !otherStudent.isCaught && distance(futureStudent, otherStudent) < TILE_SIZE * 1.1) {
                                collision = true;
                                if (otherStudent.isWandering) {
                                    student.wanderTimer = Math.max(0, student.wanderDelay - 30);
                                }
                                break;
                            }
                        }
                    }

                    if (!collision) {
                        student.x = nextX;
                        student.y = nextY;
                        student.lastDirection = { x: moveX, y: moveY };
                    } else {
                        student.wanderTimer = 0;
                        student.wanderDelay = getRandomInt(30, 90);
                        const randomAngleOffset = (Math.random() - 0.5) * Math.PI / 1.5;
                        const currentAngle = Math.atan2(student.lastDirection.y, student.lastDirection.x || Math.sign(diffX));
                        const newAngle = currentAngle + randomAngleOffset;
                        const wanderDist = TILE_SIZE * getRandomInt(2, 5);
                        student.wanderTargetX = student.x + Math.cos(newAngle) * wanderDist;
                        student.wanderTargetY = student.y + Math.sin(newAngle) * wanderDist;
                        student.wanderTargetX = Math.max(TILE_SIZE, Math.min(student.wanderTargetX, WORLD_WIDTH - TILE_SIZE * 2));
                        student.wanderTargetY = Math.max(TILE_SIZE, Math.min(student.wanderTargetY, WORLD_HEIGHT - TILE_SIZE * 2));
                        student.lastDirection = { x: 0, y: 0 };
                    }
                } else student.wanderTimer = student.wanderDelay;

                student.x = Math.max(0, Math.min(student.x, WORLD_WIDTH - student.width));
                student.y = Math.max(0, Math.min(student.y, WORLD_HEIGHT - student.height));
            }

            // Capture detection - only for teacher or single player
            if ((multiplayerManager.playerRole === 'teacher' || !multiplayerManager.isMultiplayer) &&
                distance(player, student) < CAPTURE_RADIUS && !student.isCaught) {
                student.isCaught = true;
                student.isAtSeat = false;
                student.isWandering = false;
                student.isAfraidOfTeacher = false;
                student.currentMessage = "";
                student.messageTimer = 0;
                player.captureCount++;

                student.timesCaughtThisDay++;
                student.madness = Math.min(100, student.madness + 15 * student.timesCaughtThisDay * (1 + (0.5 - student.personality.bravery)));
                student.happiness = Math.max(0, student.happiness - (30 * student.timesCaughtThisDay * (1 + student.personality.stubbornness)));

                showGameMessage(`${student.name} caught! (${player.captureCount}/${students.length})`);

                // Send capture notification in multiplayer
                if (multiplayerManager.isMultiplayer) {
                    multiplayerManager.sendPlayerAction('capture_attempt', {
                        targetStudentId: student.playerId || student.id
                    });
                }
            }
        }
    });
}


// Use the original updateZivStudents function - no changes needed for multiplayer
function updateZivStudents() {
    if (gamePaused || gameStates.isTransitioningDay()) return;

    const zivTable = tables[ZIV_TABLE_INDEX];

    const farRoamBounds = {
        minX: TILE_SIZE * 2,
        maxX: WORLD_WIDTH - TILE_SIZE * 3,
        minY: TILE_SIZE * 2,
        maxY: WORLD_HEIGHT - TILE_SIZE * 3,
    };
    const localWanderBounds = zivTable ? {
        minX: zivTable.x - TILE_SIZE * 12,
        maxX: zivTable.x + zivTable.width + TILE_SIZE * 12,
        minY: zivTable.y - TILE_SIZE * 10,
        maxY: zivTable.y + zivTable.height + TILE_SIZE * 10,
    } : {
        minX: TILE_SIZE * 5,
        maxX: WORLD_WIDTH - TILE_SIZE * 5,
        minY: TILE_SIZE * 5,
        maxY: WORLD_HEIGHT - TILE_SIZE * 5
    };

    function executeWanderMovement(student, currentWanderBounds) {
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
            const futureStudent = { ...student,
                x: nextX,
                y: nextY
            };

            for (const table of tables) {
                if (table.isBench) continue;
                const isOwnZivTable = zivTable && table.id === zivTable.id;
                if (student.canRoamFar && checkCollision(futureStudent, table)) {
                    collision = true;
                    break;
                } else if (!student.canRoamFar && !isOwnZivTable && checkCollision(futureStudent, table)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) {
                for (const otherZivStudent of zivStudents) {
                    if (student.id !== otherZivStudent.id && distance(futureStudent, otherZivStudent) < TILE_SIZE * 1.1) {
                        collision = true;
                        break;
                    }
                }
            }

            if (!collision) {
                student.x = nextX;
                student.y = nextY;
                student.lastDirection = {
                    x: moveX,
                    y: moveY
                };
            } else {
                student.wanderTimer = student.wanderDelay;
                student.lastDirection = {
                    x: 0,
                    y: 0
                };
            }
        } else {
            student.wanderTimer = student.wanderDelay;
        }
    }

    zivStudents.forEach(student => {
        student.isAtSeat = false;
        student.isMicroWandering = false;

        if (student.canRoamFar) {
            student.isWandering = true;
            student.wanderTimer++;
            if (student.wanderTimer >= student.wanderDelay || distance(student, {
                    x: student.wanderTargetX,
                    y: student.wanderTargetY
                }) < student.speed * 2) {
                student.wanderTimer = 0;
                student.wanderDelay = getRandomInt(300, 700);
                const angle = Math.random() * Math.PI * 2;
                const wanderDist = TILE_SIZE * getRandomInt(15, 30);
                student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                student.wanderTargetX = Math.max(farRoamBounds.minX, Math.min(student.wanderTargetX, farRoamBounds.maxX));
                student.wanderTargetY = Math.max(farRoamBounds.minY, Math.min(student.wanderTargetY, farRoamBounds.maxY));
            }
            executeWanderMovement(student, farRoamBounds);

        } else if (student.seatX === null) {
            student.isWandering = true;
            student.wanderTimer++;
            if (student.wanderTimer >= student.wanderDelay || distance(student, {
                    x: student.wanderTargetX,
                    y: student.wanderTargetY
                }) < student.speed * 2) {
                student.wanderTimer = 0;
                student.wanderDelay = getRandomInt(200, 500);
                const angle = Math.random() * Math.PI * 2;
                const wanderDist = TILE_SIZE * getRandomInt(6, 15);
                student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                student.wanderTargetX = Math.max(localWanderBounds.minX, Math.min(student.wanderTargetX, localWanderBounds.maxX));
                student.wanderTargetY = Math.max(localWanderBounds.minY, Math.min(student.wanderTargetY, localWanderBounds.maxY));
            }
            executeWanderMovement(student, localWanderBounds);

        } else {
            if (student.isWandering) {
                student.wanderTimer++;
                if (student.wanderTimer >= student.wanderDelay || distance(student, {
                        x: student.wanderTargetX,
                        y: student.wanderTargetY
                    }) < student.speed * 2) {
                    student.localWanderSegmentsLeft--;
                    if (student.localWanderSegmentsLeft <= 0) {
                        student.isWandering = false;
                    } else {
                        student.wanderTimer = 0;
                        student.wanderDelay = getRandomInt(180, 400);
                        const angle = Math.random() * Math.PI * 2;
                        const wanderDist = TILE_SIZE * getRandomInt(5, 10);
                        student.wanderTargetX = student.x + Math.cos(angle) * wanderDist;
                        student.wanderTargetY = student.y + Math.sin(angle) * wanderDist;
                        student.wanderTargetX = Math.max(localWanderBounds.minX, Math.min(student.wanderTargetX, localWanderBounds.maxX));
                        student.wanderTargetY = Math.max(localWanderBounds.minY, Math.min(student.wanderTargetY, localWanderBounds.maxY));
                    }
                }
                if (student.isWandering) {
                    executeWanderMovement(student, localWanderBounds);
                }
            }

            if (!student.isWandering) {
                student.isAtSeat = true;
                student.isMicroWandering = true;

                const distToSeat = distance(student, {
                    x: student.seatX,
                    y: student.seatY
                });
                if (distToSeat > student.speed * 0.5) {
                    const diffX = student.seatX - student.x;
                    const diffY = student.seatY - student.y;
                    let moveX = (diffX / distToSeat) * student.speed * 0.8;
                    let moveY = (diffY / distToSeat) * student.speed * 0.8;
                    student.x += moveX;
                    student.y += moveY;
                } else {
                    student.x = student.seatX;
                    student.y = student.seatY;
                    student.lastDirection = {
                        x: 0,
                        y: 0
                    };

                    student.timeToNextMicroWander--;
                    if (student.timeToNextMicroWander <= 0) {
                        if (Math.random() < 0.03) {
                            student.isWandering = true;
                            student.isMicroWandering = false;
                            student.localWanderSegmentsLeft = getRandomInt(2, 5);
                            student.wanderTimer = 0;
                            student.wanderDelay = 0;
                        } else {
                            student.timeToNextMicroWander = getRandomInt(150, 450);
                        }
                    }
                }
            }
        }

        student.x = Math.max(TILE_SIZE, Math.min(student.x, WORLD_WIDTH - student.width - TILE_SIZE));
        student.y = Math.max(TILE_SIZE, Math.min(student.y, WORLD_HEIGHT - student.height - TILE_SIZE));
    });
}

// Use the original updatePowerUps function
function updatePowerUps() {
    if (gamePaused || gameStates.isTransitioningDay()) return;
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.pulseTimer += 0.05;
        if (checkCollision(player, powerUp)) {
            powerUp.type.effect();
            powerUps.splice(i, 1);
        }
    }
    if (powerUps.length < 2 && Math.random() < 0.0025 && (students.length - player.captureCount > 0)) spawnPowerUps();
}

// Main Game Draw Function
function draw() {
    if (gameStates.currentState === gameStates.GAME || gameStates.isTransitioningDay()) {
        drawGame();
    } else if (gameStates.currentState === gameStates.PAUSED) {
        drawGame();
        gameStates.draw();
    } else {
        gameStates.draw();
    }

    if (fadeOverlayAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeOverlayAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

let resizeCanvasScoped;

function initGame() {
    resizeCanvasScoped = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.width = canvas.width;
        camera.height = canvas.height;
        screenEdgePadding = (isTouchDevice && !isFullscreenActive) ? Math.min(20, Math.min(window.innerWidth, window.innerHeight) * 0.03) : 0;
        if (isTouchDevice) setupMobileControls();

        if (gameStates.currentState !== gameStates.GAME || gameStates.isTransitioningDay()) {
            if (typeof gameStates.draw === 'function') gameStates.draw();
        } else if (typeof draw === 'function') {
            draw();
        }
    };
    window.addEventListener('resize', resizeCanvasScoped);
    resizeCanvasScoped();

    initializeStudentSeats();

    if (tables.length > KREMER_TABLE_INDEX && tables[KREMER_TABLE_INDEX]) {
        player.x = tables[KREMER_TABLE_INDEX].x + tables[KREMER_TABLE_INDEX].width / 2;
        player.y = tables[KREMER_TABLE_INDEX].y + tables[KREMER_TABLE_INDEX].height + TILE_SIZE * 2;
    } else {
        player.x = WORLD_WIDTH / 2;
        player.y = WORLD_HEIGHT / 2;
    }
    player.targetX = player.x;
    player.targetY = player.y;

    addInputListeners();
    updateCamera();

    gameStates.currentState = gameStates.MENU;
    gameLoop();
}

window.addEventListener('load', initGame);