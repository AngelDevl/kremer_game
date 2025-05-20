const specialAbilities = {
    active: false, cooldown: 0, maxCooldown: 600,
    timeWarpEffectActive: false, // Flag moved here for direct access by the ability
    available: [
        {
            name: "Time Warp", description: "Slow down time for everyone except you.",
            activate: function() {
                const slowFactor = 0.3;
                const originalSpeeds = [];
                students.forEach((s, i) => { // Assumes 'students' is global
                    originalSpeeds[i] = { speed: s.speed, runSpeed: s.runSpeed, returnSpeed: s.returnSpeed };
                    s.speed *= slowFactor; s.runSpeed *= slowFactor; s.returnSpeed *= slowFactor;
                });
                showGameMessage("Time Warp active!"); // Assumes 'showGameMessage' is global
                specialAbilities.timeWarpEffectActive = true;
                setTimeout(() => {
                    students.forEach((s, i) => {
                        if (originalSpeeds[i]) {
                            s.speed = originalSpeeds[i].speed;
                            s.runSpeed = originalSpeeds[i].runSpeed;
                            s.returnSpeed = originalSpeeds[i].returnSpeed;
                        }
                    });
                    showGameMessage("Time Warp ended");
                    specialAbilities.timeWarpEffectActive = false;
                    specialAbilities.active = false;
                    specialAbilities.cooldown = specialAbilities.maxCooldown;
                }, 2500);
            }
        },
        {
            name: "Super Sprint", description: "Infinite stamina and doubled speed for a short time.",
            activate: function() {
                const originalSpeed = player.baseSpeed; // Assumes 'player' is global
                player.baseSpeed *= 2; player.stamina = player.maxStamina;
                showGameMessage("Super Sprint active!");
                setTimeout(() => {
                    player.baseSpeed = originalSpeed;
                    showGameMessage("Super Sprint ended");
                    specialAbilities.active = false;
                    specialAbilities.cooldown = specialAbilities.maxCooldown;
                }, 7000);
            }
        },
        {
            name: "Student Radar", description: "Reveal the positions of Kremer's students.",
            activate: function() {
                player.radarActive = true; // Assumes 'player' is global
                showGameMessage("Student Radar active!");
                setTimeout(() => {
                    player.radarActive = false;
                    showGameMessage("Student Radar ended");
                    specialAbilities.active = false;
                    specialAbilities.cooldown = specialAbilities.maxCooldown;
                }, 12000);
            }
        }
    ],
    selectedAbility: 0,
    update: function() {
        // Assumes 'gamePaused' and 'gameStates' are global
        if (gamePaused || gameStates.isTransitioningDay()) return;
        if (this.cooldown > 0) this.cooldown--;
    },
    activateAbility: function() {
        // Assumes 'gamePaused', 'gameStates', 'showGameMessage' are global
        if (gamePaused || gameStates.isTransitioningDay()) return;
        if (this.cooldown === 0 && !this.active) {
            this.active = true; this.available[this.selectedAbility].activate();
        } else if (this.cooldown > 0) {
            showGameMessage(`Ability on cooldown: ${Math.ceil(this.cooldown / 60)}s`);
        } else if (this.active){
            showGameMessage(`Ability already active!`);
        }
    },
    cycleAbility: function() {
        // Assumes 'gamePaused', 'gameStates', 'showGameMessage' are global
        if (gamePaused || this.active || gameStates.isTransitioningDay()) return;
        this.selectedAbility = (this.selectedAbility + 1) % this.available.length;
        showGameMessage(`Selected: ${this.available[this.selectedAbility].name}`);
    }
};