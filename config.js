// Oona's Dash v1.26 (stable)

// --- PERUSMUUTTUJAT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÄÄNET ---
const musicTracks = [ new Audio('music1.mp3'), new Audio('music2.mp3'), new Audio('music3.mp3'), new Audio('music4.mp3') ];
let currentMusic;
const jumpSounds = [ new Audio('jump1.mp3'), new Audio('jump2.mp3') ];
const crashSound = new Audio('crash.mp3');
const collectSounds = [ new Audio('collect1.mp3'), new Audio('collect2.mp3') ];
let audioInitialized = false;
musicTracks.forEach(track => { track.loop = true; track.volume = 0.3; });

// --- VÄRITEEMAT ---
const colorSchemes = [
    { top: '#29024f', bottom: '#f469a9' }, { top: '#00416a', bottom: '#799f0c' },
    { top: '#ff4e50', bottom: '#f9d423' }, { top: '#141e30', bottom: '#243b55' }
];
let currentColorIndex = 0;
let colorTransitionProgress = 0;

// --- PELIN TILA ---
let gameState = 'menu';
let showingInstructions = false;
let animationFrameCounter = 0;
let currentLevel = 1;
const levelThresholds = [100, 600, 1200, 2000];
let levelUp = { active: false, timer: 0 };

// --- PELIN ASETUKSET ---
const player = { x: 150, y: 300, width: 40, height: 40, velocityY: 0, rotation: 0, isGrounded: false, isJumpHeld: false, doubleJumpUsed: false, color: '#f7ff59' };
const gravity = 0.9;
const initialJumpStrength = -11;
const jumpHoldStrength = -1;
let gameSpeed = 5;
let score = 0;

// --- OBJEKTITAULUKOT ---
let obstacles = [];
let particles = [];
let collectibles = [];
let highScores = [];
let menuStars = [];

// --- NAPIT ---
const startButton = { x: 300, y: 250, width: 200, height: 50 };
const infoButton = { x: 760, y: 40, radius: 15 };
const nextLevelButton = { x: 300, y: 250, width: 200, height: 50 };
