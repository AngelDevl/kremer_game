function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distance(obj1, obj2) {
    const centerX1 = obj1.x + obj1.width / 2;
    const centerY1 = obj1.y + obj1.height / 2;
    const centerX2 = obj2.x + obj2.width / 2;
    const centerY2 = obj2.y + obj2.height / 2;
    return Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
}

function checkCollision(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    if (rect2.isBench) return false; // Benches are not collidable
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function isPathBlocked(startX, startY, endX, endY) {
    const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    // Increase the number of steps for more precise checking
    const steps = Math.max(4, Math.ceil(dist / (TILE_SIZE / 4))); 
    
    // Check multiple points along the path
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = startX + (endX - startX) * t;
        const checkY = startY + (endY - startY) * t;
        
        // Create a small collision box at the check point, not just a single point
        const checkBox = {
            x: checkX - TILE_SIZE/4,
            y: checkY - TILE_SIZE/4,
            width: TILE_SIZE/2,
            height: TILE_SIZE/2
        };
        
        for (const table of tables) {
            if (table.isBench) continue; // Benches don't block paths
            if (checkCollision(checkBox, table)) return true;
        }
    }
    return false;
}

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive for array indexing or similar
};