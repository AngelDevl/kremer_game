const environment = {
    timeOfDay: 0,
    dayLengthInSeconds: 60, // Example: 1 minute day
    updateEnvironment: function() {
        // Assumes 'gamePaused' and 'gameStates' are globally available
        if (gamePaused || gameStates.isTransitioningDay()) return;
        gameTime += 1/60; // Assumes 'gameTime' is globally available
        this.timeOfDay = Math.min(1, gameTime / this.dayLengthInSeconds);
        if (this.timeOfDay >= 1 && !gameStates.isTransitioningDay()) {
            gameStates.startDayTransition();
        }
    },
    getBackgroundColor: function() {
        let skyColor;
        const progress = this.timeOfDay;
        if (progress < 0.1) { // Sunrise
            const t = progress / 0.1;
            skyColor = `rgb(${Math.floor(80 + t * 50)}, ${Math.floor(100 + t * 80)}, ${Math.floor(150 + t * 85)})`;
        } else if (progress < 0.8) { // Daytime
            skyColor = '#87CEEB'; // Light Sky Blue
        } else { // Sunset
            const t = (progress - 0.8) / 0.2;
            skyColor = `rgb(${Math.floor(135 - t * 30)}, ${Math.floor(206 - t * 20)}, ${Math.floor(235 - t * 10)})`;
        }
        return skyColor;
    },
    getLightLevel: function() {
        const progress = this.timeOfDay;
        if (progress < 0.1) return 0.8 + progress * 2; // Dawn
        else if (progress < 0.8) return 1.0; // Full day
        else return 1.0 - (progress - 0.8) * 1; // Dusk
    }
};