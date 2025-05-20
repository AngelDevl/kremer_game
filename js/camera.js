const camera = {
    x: 0, y: 0,
    width: 0, // Will be set in main.js init
    height: 0, // Will be set in main.js init
    zoom: 1
};

function updateCamera() {
    // Assumes 'player' and 'camera' objects are globally available
    const targetCamX = player.x - camera.width / (2 * camera.zoom) + player.width / 2;
    const targetCamY = player.y - camera.height / (2 * camera.zoom) + player.height / 2;
    camera.x += (targetCamX - camera.x) * 0.08;
    camera.y += (targetCamY - camera.y) * 0.08;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - camera.width / camera.zoom));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - camera.height / camera.zoom));
}