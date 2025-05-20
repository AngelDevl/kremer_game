// --- Game Settings ---
const TILE_SIZE = 20;
const WORLD_WIDTH = TILE_SIZE * 100;
const WORLD_HEIGHT = TILE_SIZE * 80;
const DETECTION_RADIUS = TILE_SIZE * 8;
const ESCAPE_RADIUS = TILE_SIZE * 5;
const CAPTURE_RADIUS = TILE_SIZE * 0.8;

// --- Day Cycle Variables ---
const GAME_DAY_START_HOUR = 6.5;
const GAME_DAY_END_HOUR = 13.0;
const GAME_DAY_DURATION_HOURS = GAME_DAY_END_HOUR - GAME_DAY_START_HOUR;
const FADE_SPEED = 0.02;

// --- Character and Object Colors ---
const KREMER_STUDENT_COLOR = '#28a745';
const ZIV_STUDENT_COLOR = '#FFA500';
const PLAYER_COLOR = '#007bff';
const ZIV_COLOR = '#6f42c1';

// --- Table and Bench Config ---
const TABLE_COLORS = ['#8B4513', '#A0522D', '#803515', '#975429'];
const BENCH_COLOR = '#A0522D';
const BENCH_THICKNESS = TILE_SIZE * 0.75;
const BENCH_OFFSET = TILE_SIZE * 0.2;

// --- Table Indices ---
const KREMER_TABLE_INDEX = 0;
const ZIV_TABLE_INDEX = 1;

// --- Student Names ---
const KREMER_STUDENT_NAMES = [
    "Itamar", "Noam", "Moshe", "Yossi", "Shachar", "Oryan", "Naor", "Adiel", "Elisha", "Benjamin",
    "Avi", "Ron", "Gal", "Liran", "Yaniv" // Total 15 names
];
const ZIV_STUDENT_NAMES = [
    "Gershy", "Shua", "Rafi", "Orel", "Yair", "Ehuvia",
    "Eliel", "Elad", "Dvir", "Arbel", "Hagi", "Nachshon" // Total 12 names
];