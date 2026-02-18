/* ================================================================
   SUPER MARIO HTML5 — Complete Game Engine
   Canvas-based platformer with pixel art sprites, physics,
   enemies, power-ups, 3 levels, audio, and touch controls.
   ================================================================ */

// ===================================================
//  1. CONFIGURATION
// ===================================================

const INTERNAL_W = 768;
const INTERNAL_H = 480;
const T = 32; // tile size
const COLS = INTERNAL_W / T; // 24
const ROWS = INTERNAL_H / T; // 15

const GRAVITY = 0.55;
const MAX_FALL = 12;
const PLAYER_ACCEL = 0.45;
const PLAYER_AIR_ACCEL = 0.3;
const PLAYER_FRICTION = 0.82;
const PLAYER_AIR_FRICTION = 0.94;
const PLAYER_SKID_FRICTION = 0.89;
const PLAYER_MAX_SPEED = 4.2;
const PLAYER_RUN_MAX = 6;
const JUMP_FORCE = -10;
const JUMP_FORCE_BIG = -10.5;
const BOUNCE_FORCE = -7;
const COYOTE_FRAMES = 5;
const JUMP_BUFFER_FRAMES = 7;
const ENEMY_SPEED = 1;
const KOOPA_SHELL_SPEED = 7;

// Tile codes
const TILE = {
  EMPTY: ' ',
  GROUND: '=',
  BRICK: 'B',
  QBLOCK: '?',
  QMUSH: 'M',
  Q1UP: 'L',
  HARD: '@',
  PIPE_TL: '{',
  PIPE_TR: '}',
  PIPE_BL: '[',
  PIPE_BR: ']',
  COIN: 'c',
  GOOMBA: 'g',
  KOOPA: 'k',
  SPAWN: 's',
  FLAG_TOP: 'F',
  FLAG_POLE: 'f',
  FLAG_BASE: '*',
  USED: 'U',
};

const SOLID_TILES = new Set(['=', 'B', '?', 'M', 'L', '@', '{', '}', '[', ']', 'U', '*']);

// Colors
const C = {
  SKY: '#6B8CFF',
  GROUND_TOP: '#5CB85C',
  GROUND: '#C8722A',
  GROUND_DARK: '#8B4513',
  BRICK: '#C84C09',
  BRICK_LINE: '#8B3000',
  QBLOCK: '#FFB020',
  QBLOCK_DARK: '#C87820',
  QBLOCK_SHINE: '#FFE0A0',
  USED_BLOCK: '#886644',
  HARD: '#445588',
  PIPE_GREEN: '#30A030',
  PIPE_DARK: '#207020',
  PIPE_LIGHT: '#50D050',
  MARIO_RED: '#E52521',
  MARIO_SKIN: '#FDB883',
  MARIO_HAIR: '#6B3304',
  MARIO_BLUE: '#2058D8',
  MARIO_SHOE: '#6B3304',
  GOOMBA_BODY: '#C87820',
  GOOMBA_DARK: '#8B4513',
  GOOMBA_FOOT: '#402000',
  KOOPA_GREEN: '#30A030',
  KOOPA_DARK: '#207020',
  KOOPA_SKIN: '#F0D060',
  KOOPA_SHELL: '#20C020',
  MUSHROOM_RED: '#E52521',
  MUSHROOM_SKIN: '#F8E8C8',
  COIN_GOLD: '#FFD700',
  COIN_DARK: '#B8960B',
  FLAG_GREEN: '#30A030',
  POLE_GRAY: '#888',
  WHITE: '#FFF',
  BLACK: '#000',
};

// ===================================================
//  2. AUDIO ENGINE (Web Audio API)
// ===================================================

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  try {
    ensureAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.12, now);

    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.12);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'coin':
        osc.type = 'square';
        osc.frequency.setValueAtTime(988, now);
        osc.frequency.setValueAtTime(1319, now + 0.07);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'stomp':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
        break;
      case 'powerup':
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, now);
        [523, 659, 784, 1047].forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.08);
        });
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
        break;
      case 'die':
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.7);
        osc.start(now); osc.stop(now + 0.7);
        break;
      case 'break':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'bump':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.08);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
        break;
      case '1up':
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, now);
        [262, 330, 392, 524, 660, 784].forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.06);
        });
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        break;
      case 'flag':
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, now);
        [392, 440, 494, 523, 587, 659, 784, 880].forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.1);
        });
        gain.gain.linearRampToValueAtTime(0, now + 0.9);
        osc.start(now); osc.stop(now + 0.9);
        break;
      case 'kick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.08);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
        break;
      case 'skid':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.04, now);
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
    }
  } catch (e) { /* Audio not supported */ }
}

// ===================================================
//  3. SPRITE RENDERER (Pixel Art via Canvas)
// ===================================================

function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function pixelArt(w, h, scale, data, colorMap) {
  const c = createCanvas(w * scale, h * scale);
  const ctx = c.getContext('2d');
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const ch = data[y][x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = colorMap[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c;
}

function flipH(sprite) {
  const c = createCanvas(sprite.width, sprite.height);
  const ctx = c.getContext('2d');
  ctx.translate(sprite.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(sprite, 0, 0);
  return c;
}

// --- Mario Sprites ---
const M_COLORS = {
  'R': C.MARIO_RED, 'S': C.MARIO_SKIN, 'H': C.MARIO_HAIR,
  'B': C.MARIO_BLUE, 'O': C.MARIO_SHOE, 'W': C.WHITE, 'K': C.BLACK,
  'Y': '#FFD700', // belt/button highlight
};

const MARIO_SM_STAND = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RBRR..',
  '.RBRBRR.',
  '.RBRBRR.',
  '.RBBBBR.',
  '.SSRBRS.',
  '.SSSRSSS',
  'SSSSSSSS',
  '.OO..OO.',
  'OOO..OOO',
];

const MARIO_SM_WALK1 = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RRBR..',
  '.RRRBRB.',
  '.RRRBRB.',
  '..BBBBB.',
  '..SRRS..',
  '..SSOO..',
  '..OOOS..',
  '..OO.OO.',
  '....OOO.',
];

const MARIO_SM_WALK2 = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RBRR..',
  '.RBRBRR.',
  '.RBRBRR.',
  '.RBBBBR.',
  '..SRRS..',
  '.OO.SS..',
  '.S.OOO..',
  '.OO..OO.',
  '.OOO....',
];

const MARIO_SM_JUMP = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RBRRB.',
  'RRRBBBR.',
  'SSRBBRBB',
  'SS.BBB..',
  '..BRRB..',
  '.RROO...',
  '.ROO....',
  'OOO.....',
  'OO......',
];

// Skid pose: feet forward, body leans back
const MARIO_SM_SKID = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RBRR..',
  '.RBRBRR.',
  '.RBRBRR.',
  '.RBBBBR.',
  '..SRRS..',
  '.SS..SS.',
  'OOO.OOO.',
  '.OO..OO.',
  '........',
];

// Big Mario sprites (8x19)
const MARIO_BG_STAND = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '.RRBRRR.',
  'RRRBRRRR',
  'RRRBRRRR',
  'RRRBBBB.',
  '.SBRRBRS',
  '.SBRRRRR',
  '.SSRRRS.',
  '..RRRR..',
  '..RRRR..',
  '..R..R..',
  '.RR..RR.',
  '.OO..OO.',
  'OOO..OOO',
];

const MARIO_BG_WALK1 = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '.RRRBR..',
  'RRRRBRB.',
  'RRRRBRB.',
  '.RRBBBBB',
  '.SBRRS..',
  '.SBRRS..',
  '.SSRRS..',
  '..RRRR..',
  '..ROOR..',
  '..OOOR..',
  '.OOO.RR.',
  '.OO..OOO',
  '......OO',
];

const MARIO_BG_WALK2 = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '.RRBRRR.',
  'RRRBRRRR',
  'RRRBRRRR',
  'RRRBBBB.',
  '.SBRRS..',
  '.SBRRS..',
  '.SSRRS..',
  '..RRRR..',
  '..ROOR..',
  '.RR.OOO.',
  '.OO..SS.',
  'OOO..OO.',
  'OO......',
];

const MARIO_BG_JUMP = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '..RBRRRB',
  'RRRBBBRR',
  'SSRBBRBB',
  'SS.BBB..',
  '..BRRB..',
  '..BRRB..',
  '..RRRR..',
  '.RROORR.',
  '.ROO..R.',
  'OOO..RR.',
  'OO...OOO',
  '.....OO.',
  '........',
];

// Big Mario skid (8x19)
const MARIO_BG_SKID = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '.RRBRRR.',
  'RRRBRRRR',
  'RRRBRRRR',
  'RRRBBBB.',
  '.SBRRBRS',
  '.SBRRRRR',
  '.SSRRRS.',
  '..RRRR..',
  '..SRRS..',
  '.SS..SS.',
  'OOO.OOO.',
  '.OO..OO.',
  '........',
];

// Big Mario crouch (8x13)
const MARIO_BG_CROUCH = [
  '...RRR..',
  '..RRRRRR',
  '..HSSSHK',
  '.HSHSHSS',
  '.HSHSSSK',
  '..SSSSH.',
  '.RRRBR..',
  'RRRRBRB.',
  'RRRRBRB.',
  '.RRBBBBB',
  '.SSRRSS.',
  '.OO..OO.',
  'OOO..OOO',
];

// --- Goomba ---
const G_COLORS = { 'B': C.GOOMBA_BODY, 'D': C.GOOMBA_DARK, 'F': C.GOOMBA_FOOT, 'W': C.WHITE, 'K': C.BLACK };
const GOOMBA_1 = [
  '..DDDDDD..',
  '.DDDDDDDD.',
  'DDDDDDDDDD',
  'DDWKDDWKDD',
  'DDWKDDWKDD',
  'DDDDDDDDD.',
  '.DDDDDDDD.',
  '..FFFFFF..',
  '.FFFFFFFF.',
  'FFF....FFF',
];
const GOOMBA_2 = [
  '..DDDDDD..',
  '.DDDDDDDD.',
  'DDDDDDDDDD',
  'DDWKDDWKDD',
  'DDWKDDWKDD',
  'DDDDDDDDD.',
  '.DDDDDDDD.',
  '..FFFFFF..',
  '.FFFFFFFF.',
  '..FFF.FFF.',
];
const GOOMBA_FLAT = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  'DDDDDDDDDD',
  'DKWDDDKWDD',
  'DDDDDDDDDD',
];

// --- Koopa ---
const K_COLORS = { 'G': C.KOOPA_GREEN, 'D': C.KOOPA_DARK, 'Y': C.KOOPA_SKIN, 'S': C.KOOPA_SHELL, 'W': C.WHITE, 'K': C.BLACK };
const KOOPA_1 = [
  '..YYYY.',
  '.YYYYYY',
  '.YWWYWY',
  '.YWWYWY',
  '.YYYYYY',
  '..YYYY.',
  '..DGDD.',
  '.DDGDDD',
  'DDSGSDD',
  'DDSGSD.',
  '.DSSS..',
  '..YY...',
  '.YYY...',
  '.YY.YY.',
];

const KOOPA_2 = [
  '..YYYY.',
  '.YYYYYY',
  '.YWWYWY',
  '.YWWYWY',
  '.YYYYYY',
  '..YYYY.',
  '..DGDD.',
  '.DDGDDD',
  'DDSGSDD',
  '.DDSGSD',
  '...DSSS',
  '...YY..',
  '...YYY.',
  '.YY.YY.',
];

const KOOPA_SHELL = [
  '.GGGG.',
  'GGGGGG',
  'GSGSGG',
  'GSGSGG',
  'GGGGGG',
  '.GGGG.',
];

// --- Mushroom ---
const MU_COLORS = { 'R': C.MUSHROOM_RED, 'W': C.MUSHROOM_SKIN, 'K': C.BLACK };
const MUSHROOM = [
  '..RRRR..',
  '.RRRWRR.',
  'RRWRWRRR',
  'RRWRWRRR',
  'RRRWRRRR',
  '.RRRRRR.',
  '..WWWW..',
  '.WWKWKW.',
  '.WWKWKW.',
  '..WWWW..',
];

// Pre-render sprites
const S = {};

function buildSprites() {
  const sc = 3;

  // Mario small
  S.marioSR = pixelArt(8, 15, sc, MARIO_SM_STAND, M_COLORS);
  S.marioSL = flipH(S.marioSR);
  S.marioW1R = pixelArt(8, 15, sc, MARIO_SM_WALK1, M_COLORS);
  S.marioW1L = flipH(S.marioW1R);
  S.marioW2R = pixelArt(8, 15, sc, MARIO_SM_WALK2, M_COLORS);
  S.marioW2L = flipH(S.marioW2R);
  S.marioJR = pixelArt(8, 15, sc, MARIO_SM_JUMP, M_COLORS);
  S.marioJL = flipH(S.marioJR);
  S.marioKR = pixelArt(8, 15, sc, MARIO_SM_SKID, M_COLORS);
  S.marioKL = flipH(S.marioKR);

  // Mario big
  S.marioBSR = pixelArt(8, 19, sc, MARIO_BG_STAND, M_COLORS);
  S.marioBSL = flipH(S.marioBSR);
  S.marioBW1R = pixelArt(8, 19, sc, MARIO_BG_WALK1, M_COLORS);
  S.marioBW1L = flipH(S.marioBW1R);
  S.marioBW2R = pixelArt(8, 19, sc, MARIO_BG_WALK2, M_COLORS);
  S.marioBW2L = flipH(S.marioBW2R);
  S.marioBJR = pixelArt(8, 19, sc, MARIO_BG_JUMP, M_COLORS);
  S.marioBJL = flipH(S.marioBJR);
  S.marioBKR = pixelArt(8, 19, sc, MARIO_BG_SKID, M_COLORS);
  S.marioBKL = flipH(S.marioBKR);
  S.marioBCR = pixelArt(8, 13, sc, MARIO_BG_CROUCH, M_COLORS);
  S.marioBCL = flipH(S.marioBCR);

  // Goomba
  S.goomba1 = pixelArt(10, 10, sc, GOOMBA_1, G_COLORS);
  S.goomba2 = pixelArt(10, 10, sc, GOOMBA_2, G_COLORS);
  S.goombaFlat = pixelArt(10, 10, sc, GOOMBA_FLAT, G_COLORS);

  // Koopa
  S.koopa1 = pixelArt(7, 14, sc, KOOPA_1, K_COLORS);
  S.koopa1L = flipH(S.koopa1);
  S.koopa2 = pixelArt(7, 14, sc, KOOPA_2, K_COLORS);
  S.koopa2L = flipH(S.koopa2);
  S.koopaShell = pixelArt(6, 6, sc * 1.2, KOOPA_SHELL, K_COLORS);

  // Mushroom
  S.mushroom = pixelArt(8, 10, sc, MUSHROOM, MU_COLORS);
}

// ===================================================
//  4. TILE DRAWING
// ===================================================

function drawTile(ctx, type, x, y) {
  switch (type) {
    case TILE.GROUND:
      ctx.fillStyle = C.GROUND;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.GROUND_TOP;
      ctx.fillRect(x, y, T, 4);
      ctx.fillStyle = C.GROUND_DARK;
      ctx.fillRect(x + 2, y + 8, 12, 2);
      ctx.fillRect(x + 18, y + 20, 10, 2);
      break;

    case TILE.BRICK:
      ctx.fillStyle = C.BRICK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.BRICK_LINE;
      ctx.fillRect(x, y + 7, T, 2);
      ctx.fillRect(x, y + 16, T, 2);
      ctx.fillRect(x, y + 25, T, 2);
      ctx.fillRect(x + 15, y, 2, 7);
      ctx.fillRect(x + 7, y + 9, 2, 7);
      ctx.fillRect(x + 23, y + 9, 2, 7);
      ctx.fillRect(x + 15, y + 18, 2, 7);
      break;

    case TILE.QBLOCK:
    case TILE.QMUSH:
    case TILE.Q1UP: {
      const t = (Date.now() / 200) | 0;
      const shimmer = (t % 4 === 0) ? C.QBLOCK_SHINE : C.QBLOCK;
      ctx.fillStyle = shimmer;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.QBLOCK_DARK;
      ctx.fillRect(x, y, T, 2);
      ctx.fillRect(x, y, 2, T);
      ctx.fillRect(x + T - 2, y, 2, T);
      ctx.fillRect(x, y + T - 2, T, 2);
      ctx.fillStyle = C.BLACK;
      ctx.font = 'bold 18px Courier';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + T / 2, y + T - 8);
      break;
    }

    case TILE.USED:
      ctx.fillStyle = C.USED_BLOCK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#664422';
      ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      break;

    case TILE.HARD:
      ctx.fillStyle = C.HARD;
      ctx.fillRect(x, y, T, T);
      ctx.strokeStyle = '#556699';
      ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
      break;

    case TILE.PIPE_TL:
      ctx.fillStyle = C.PIPE_DARK;
      ctx.fillRect(x - 4, y, T + 4, T);
      ctx.fillStyle = C.PIPE_GREEN;
      ctx.fillRect(x - 2, y + 2, T, T - 2);
      ctx.fillStyle = C.PIPE_LIGHT;
      ctx.fillRect(x, y + 4, 6, T - 6);
      break;

    case TILE.PIPE_TR:
      ctx.fillStyle = C.PIPE_DARK;
      ctx.fillRect(x, y, T + 4, T);
      ctx.fillStyle = C.PIPE_GREEN;
      ctx.fillRect(x + 2, y + 2, T, T - 2);
      ctx.fillStyle = C.PIPE_LIGHT;
      ctx.fillRect(x + 4, y + 4, 6, T - 6);
      break;

    case TILE.PIPE_BL:
      ctx.fillStyle = C.PIPE_DARK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.PIPE_GREEN;
      ctx.fillRect(x + 2, y, T - 4, T);
      ctx.fillStyle = C.PIPE_LIGHT;
      ctx.fillRect(x + 4, y, 6, T);
      break;

    case TILE.PIPE_BR:
      ctx.fillStyle = C.PIPE_DARK;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.PIPE_GREEN;
      ctx.fillRect(x + 2, y, T - 4, T);
      ctx.fillStyle = C.PIPE_LIGHT;
      ctx.fillRect(x + 4, y, 6, T);
      break;

    case TILE.FLAG_POLE:
      ctx.fillStyle = C.POLE_GRAY;
      ctx.fillRect(x + 14, y, 4, T);
      break;

    case TILE.FLAG_TOP:
      ctx.fillStyle = C.POLE_GRAY;
      ctx.fillRect(x + 14, y + 8, 4, T - 8);
      ctx.fillStyle = C.COIN_GOLD;
      ctx.beginPath();
      ctx.arc(x + 16, y + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.FLAG_BASE:
      ctx.fillStyle = C.GROUND;
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = C.GROUND_TOP;
      ctx.fillRect(x, y, T, 4);
      ctx.fillStyle = C.POLE_GRAY;
      ctx.fillRect(x + 14, y, 4, T);
      break;
  }
}

// ===================================================
//  5. LEVEL DATA
// ===================================================

const LEVELS = [
  {
    name: 'World 1-1',
    time: 300,
    bg: C.SKY,
    rows: [
      '                                                                                                                   ',
      '                                                                                                                   ',
      '                                                                                                                   ',
      '                                                                                                                   ',
      '                                                                                                                   ',
      '                              @@@                                                                                  ',
      '                                                                                                                   ',
      '                                                                  ?                                                ',
      '                                                                                                                   ',
      '             ?  M?? ?                       B?B                BBBB           ?  ?              @                   ',
      '                                                                                                @                  ',
      '                                                                                       g  g    g @        F        ',
      '    s                g  g       g   {}  g       g  {}        g    g   g    {}            g      @ @       f         ',
      '======    ====  ========== ====== ==[]======  ====  []====  ============================@@@=====@@@===*===== =======',
      '======    ====  ========== ====== ==[]======  ====  []====  ============================@@@=====@@@===*===== =======',
    ]
  },
  {
    name: 'World 1-2',
    time: 300,
    bg: '#202040',
    rows: [
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                         B?B                                                                                        ',
      '                                          @@@                              ???                                      ',
      '                                                                                                                    ',
      '              ?                                           B?B?B                                ?                    ',
      '                                                                                                                    ',
      '         BBBB      BBM?BB      ?    BB          BBB           g    BBB                   BB          @              ',
      '                                                                       g                       g g   @    F        ',
      '   s          g                  g      g            g  g        g   g      g  g     g    g g   ggg   @   f         ',
      '  ====  === ======  ===  ====  ==  ==  === ====  ===  ======  ==  ======  ==  ====  ======  ==  === ==@==*===========',
      '  ====  === ======  ===  ====  ==  ==  === ====  ===  ======  ==  ======  ==  ====  ======  ==  === ==@==*===========',
      '  ====  === ======  ===  ====  ==  ==  === ====  ===  ======  ==  ======  ==  ====  ======  ==  === ==@==*===========',
    ]
  },
  {
    name: 'World 1-3',
    time: 250,
    bg: '#4A1A6B',
    rows: [
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                                                                                                         @@@       ',
      '                   @     ?              @  @                     ?                                                   ',
      '                  @@@                  @    @    BBB                        @@@              ?                       ',
      '                                      @    @                                                                        ',
      '          B?MB            ?   @@@    @@      @@   ?  ?           @@@                 @@@     @@              @       ',
      '                                                                                                            @       ',
      '     ?       g     @@   g            g           g  g     @@   g    @@    g     @@  g   g   g   @@    g g    @  F    ',
      '            g g          g  g   gg                          g          g    g     g   g          g   ggg     @  f    ',
      '  s        g   g    g     g g  ggg    k         k     g      g  k     g  g    g    g   g   g     g   g  k   @ f     ',
      ' ====  ==  ===  ==  ==  =  == ====  ==  ==  ====  ==  =  ====  ==  ==  =  ==  == ====  == ==  ==  =====@==*=========',
      ' ====  ==  ===  ==  ==  =  == ====  ==  ==  ====  ==  =  ====  ==  ==  =  ==  == ====  == ==  ==  =====@==*=========',
      ' ====  ==  ===  ==  ==  =  == ====  ==  ==  ====  ==  =  ====  ==  ==  =  ==  == ====  == ==  ==  =====@==*=========',
    ]
  }
];

// ===================================================
//  6. GAME STATE
// ===================================================

let canvas, ctx;
let gameState = 'menu';
let currentLevel = 0;
let tileMap = [];
let levelW = 0, levelH = 0;
let player = null;
let entities = [];
let camera = { x: 0, targetX: 0 };
let score = 0;
let coins = 0;
let lives = 3;
let timer = 300;
let timerAcc = 0;
let flagSliding = false;
let levelCompleteTimer = 0;
let deathTimer = 0;
let frameCount = 0;

// Input
const keys = {};
const touchState = { left: false, right: false, jump: false, run: false, down: false };

// ===================================================
//  7. HELPER: Tile collision for axis-separated physics
// ===================================================

function getTilesInRect(x, y, w, h) {
  const tiles = [];
  const left = Math.floor(x / T);
  const right = Math.floor((x + w - 1) / T);
  const top = Math.floor(y / T);
  const bottom = Math.floor((y + h - 1) / T);

  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      if (r >= 0 && r < levelH && c >= 0 && c < levelW) {
        const type = tileMap[r][c];
        if (SOLID_TILES.has(type)) {
          tiles.push({ x: c, y: r, type });
        }
      }
    }
  }
  return tiles;
}

function isSolidAt(px, py) {
  const c = Math.floor(px / T);
  const r = Math.floor(py / T);
  if (r < 0 || r >= levelH || c < 0 || c >= levelW) return false;
  return SOLID_TILES.has(tileMap[r][c]);
}

// ===================================================
//  8. ENTITY CLASSES
// ===================================================

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = 24; this.h = 30;
    this.big = false;
    this.dir = 1;
    this.grounded = false;
    this.wasGrounded = false;
    this.jumping = false;
    this.invincible = 0;
    this.dead = false;
    this.visible = true;
    this.animFrame = 0;
    this.animTimer = 0;
    this.shrinkTimer = 0;
    // Advanced physics
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasJumpPressed = false;
    this.skidding = false;
    this.skidSoundCooldown = 0;
    this.crouching = false;
    this.landTimer = 0;
    this.growTimer = 0;
    this.runDustTimer = 0;
  }

  update() {
    if (this.dead) return;

    // Grow animation freeze
    if (this.growTimer > 0) {
      this.growTimer--;
      return;
    }

    const left = keys['ArrowLeft'] || keys['KeyA'] || touchState.left;
    const right = keys['ArrowRight'] || keys['KeyD'] || touchState.right;
    const jump = keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || touchState.jump;
    const run = keys['ShiftLeft'] || keys['ShiftRight'] || touchState.run;
    const down = keys['ArrowDown'] || keys['KeyS'] || touchState.down;

    // Crouch (big Mario only, grounded, not moving input)
    this.crouching = this.big && this.grounded && down && !left && !right;

    const maxSpd = run ? PLAYER_RUN_MAX : PLAYER_MAX_SPEED;
    const accel = this.grounded ? PLAYER_ACCEL : PLAYER_AIR_ACCEL;
    const friction = this.grounded ? PLAYER_FRICTION : PLAYER_AIR_FRICTION;

    // Skid detection: pressing opposite to movement direction while moving fast
    this.skidding = false;
    if (this.grounded && !this.crouching) {
      if ((left && this.vx > 2) || (right && this.vx < -2)) {
        this.skidding = true;
      }
    }

    // Horizontal movement
    if (!this.crouching) {
      if (left) {
        this.vx -= accel;
        if (!this.skidding) this.dir = -1;
      } else if (right) {
        this.vx += accel;
        if (!this.skidding) this.dir = 1;
      } else {
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }
    } else {
      // Slow down when crouching
      this.vx *= 0.9;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Skid braking particles and sound
    if (this.skidding) {
      this.vx *= PLAYER_SKID_FRICTION;
      if (frameCount % 3 === 0) {
        spawnDust(this.x + this.w / 2, this.y + this.h, this.vx > 0 ? 1 : -1);
      }
      if (this.skidSoundCooldown <= 0) {
        playSound('skid');
        this.skidSoundCooldown = 15;
      }
      // Flip direction when skid ends (speed drops enough)
      if (Math.abs(this.vx) < 1) {
        this.dir = left ? -1 : 1;
      }
    }
    if (this.skidSoundCooldown > 0) this.skidSoundCooldown--;

    this.vx = Math.max(-maxSpd, Math.min(maxSpd, this.vx));

    // Coyote time: grace period after walking off edge
    if (this.grounded) {
      this.coyoteTimer = COYOTE_FRAMES;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    // Jump buffer: remember jump press for a few frames
    if (jump && !this.wasJumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_FRAMES;
    }
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;
    this.wasJumpPressed = jump;

    // Jump execution
    const canJump = this.grounded || this.coyoteTimer > 0;
    const wantsJump = this.jumpBufferTimer > 0;

    if (canJump && wantsJump && !this.jumping && !this.crouching) {
      // Speed-dependent jump: faster = higher (like real Mario)
      const speedFactor = Math.abs(this.vx) / PLAYER_RUN_MAX;
      const baseForce = this.big ? JUMP_FORCE_BIG : JUMP_FORCE;
      this.vy = baseForce - speedFactor * 0.8;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumping = true;
      playSound('jump');
      // Jump dust
      spawnDust(this.x + 4, this.y + this.h, -1);
      spawnDust(this.x + this.w - 4, this.y + this.h, 1);
    }
    if (!jump) this.jumping = false;

    // Variable jump height
    if (!jump && this.vy < -3) {
      this.vy = -3;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // Save grounded state before movement
    this.wasGrounded = this.grounded;

    // Collision & movement (axis-separated)
    this.moveX();
    this.moveY();

    // Update dimensions based on state
    if (this.big) {
      if (this.crouching) {
        const oldH = this.h;
        this.h = 36;
        if (oldH > 36) this.y += (oldH - 36);
      } else {
        const oldH = this.h;
        this.h = 54;
        if (oldH < 54 && oldH === 36) this.y -= (54 - 36);
      }
    } else {
      this.h = 30;
    }

    // Landing detection
    if (this.grounded && !this.wasGrounded) {
      this.landTimer = 6;
      spawnDust(this.x + 4, this.y + this.h, -1);
      spawnDust(this.x + this.w - 4, this.y + this.h, 1);
    }
    if (this.landTimer > 0) this.landTimer--;

    // Running dust
    if (this.grounded && Math.abs(this.vx) > 4.5) {
      this.runDustTimer++;
      if (this.runDustTimer > 4) {
        this.runDustTimer = 0;
        spawnDust(this.x + (this.vx > 0 ? 0 : this.w), this.y + this.h, this.vx > 0 ? -1 : 1);
      }
    } else {
      this.runDustTimer = 0;
    }

    // Smooth camera
    camera.targetX = this.x - INTERNAL_W / 3;
    camera.targetX = Math.max(0, Math.min(camera.targetX, levelW * T - INTERNAL_W));
    camera.x += (camera.targetX - camera.x) * 0.12;

    // Fell off
    if (this.y > levelH * T + 50) {
      this.die();
    }

    // Animation - only cycle when actually moving
    const speed = Math.abs(this.vx);
    if (this.grounded && speed > 0.5) {
      const animSpeed = speed > 4 ? 4 : speed > 2 ? 6 : 8;
      this.animTimer++;
      if (this.animTimer > animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 3;
      }
    } else if (this.grounded && speed <= 0.5) {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    // Invincibility
    if (this.invincible > 0) {
      this.invincible--;
      this.visible = (this.invincible % 4 < 2);
    } else {
      this.visible = true;
    }

    if (this.shrinkTimer > 0) this.shrinkTimer--;
  }

  moveX() {
    this.x += this.vx;
    if (this.x < 0) { this.x = 0; this.vx = 0; }

    const col = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of col) {
      const tx = t.x * T, ty = t.y * T;
      const overlapX = Math.min(this.x + this.w, tx + T) - Math.max(this.x, tx);
      const overlapY = Math.min(this.y + this.h, ty + T) - Math.max(this.y, ty);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vx > 0) {
        this.x = tx - this.w;
        this.vx = 0;
      } else if (this.vx < 0) {
        this.x = tx + T;
        this.vx = 0;
      }
    }
  }

  moveY() {
    this.y += this.vy;
    this.grounded = false;

    const col = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of col) {
      const tx = t.x * T, ty = t.y * T;
      const overlapX = Math.min(this.x + this.w, tx + T) - Math.max(this.x, tx);
      const overlapY = Math.min(this.y + this.h, ty + T) - Math.max(this.y, ty);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vy > 0) {
        this.y = ty - this.h;
        this.vy = 0;
        this.grounded = true;
      } else if (this.vy < 0) {
        this.y = ty + T;
        this.vy = 1;
        hitBlock(t.x, t.y, this.big);
      }
    }
  }

  hit() {
    if (this.invincible > 0) return;
    if (this.big) {
      this.big = false;
      this.h = 30;
      this.crouching = false;
      this.invincible = 90;
      this.shrinkTimer = 30;
      playSound('bump');
    } else {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.vy = JUMP_FORCE;
    lives--;
    playSound('die');
    gameState = 'dying';
    deathTimer = 120;
  }

  grow() {
    if (!this.big) {
      this.big = true;
      this.y -= 24;
      this.h = 54;
      this.growTimer = 40;
      playSound('powerup');
    }
  }

  render() {
    if (!this.visible) return;
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    let sprite;

    // Grow animation: flash between small and big
    if (this.growTimer > 0) {
      const flash = (this.growTimer % 8 < 4);
      if (flash) {
        sprite = this.dir === 1 ? S.marioSR : S.marioSL;
      } else {
        sprite = this.dir === 1 ? S.marioBSR : S.marioBSL;
      }
      const offsetY = sprite.height - this.h;
      ctx.drawImage(sprite, sx - 4, sy - offsetY, sprite.width, sprite.height);
      return;
    }

    if (this.big) {
      if (this.crouching) {
        sprite = this.dir === 1 ? S.marioBCR : S.marioBCL;
      } else if (!this.grounded) {
        sprite = this.dir === 1 ? S.marioBJR : S.marioBJL;
      } else if (this.skidding) {
        // Skid: sprite faces the direction Mario is going to (opposite of velocity)
        sprite = this.vx > 0 ? S.marioBKL : S.marioBKR;
      } else if (Math.abs(this.vx) > 0.5) {
        const f = this.animFrame;
        if (f === 0) sprite = this.dir === 1 ? S.marioBSR : S.marioBSL;
        else if (f === 1) sprite = this.dir === 1 ? S.marioBW1R : S.marioBW1L;
        else sprite = this.dir === 1 ? S.marioBW2R : S.marioBW2L;
      } else {
        sprite = this.dir === 1 ? S.marioBSR : S.marioBSL;
      }
    } else {
      if (!this.grounded) {
        sprite = this.dir === 1 ? S.marioJR : S.marioJL;
      } else if (this.skidding) {
        sprite = this.vx > 0 ? S.marioKL : S.marioKR;
      } else if (Math.abs(this.vx) > 0.5) {
        const f = this.animFrame;
        if (f === 0) sprite = this.dir === 1 ? S.marioSR : S.marioSL;
        else if (f === 1) sprite = this.dir === 1 ? S.marioW1R : S.marioW1L;
        else sprite = this.dir === 1 ? S.marioW2R : S.marioW2L;
      } else {
        sprite = this.dir === 1 ? S.marioSR : S.marioSL;
      }
    }

    // Landing squash & stretch effect
    let scaleX = 1, scaleY = 1;
    if (this.landTimer > 0) {
      const t = this.landTimer / 6;
      scaleX = 1 + t * 0.12;
      scaleY = 1 - t * 0.08;
    }

    const offsetY = sprite.height - this.h;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.save();
      const cx = sx + sprite.width / 2 - 4;
      const cy = sy - offsetY + sprite.height;
      ctx.translate(cx, cy);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height, sprite.width, sprite.height);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, sx - 4, sy - offsetY, sprite.width, sprite.height);
    }
  }
}

class Goomba {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = -ENEMY_SPEED; this.vy = 0;
    this.w = 28; this.h = 30;
    this.alive = true;
    this.flat = false;
    this.flatTimer = 0;
    this.type = 'goomba';
    this.animFrame = 0;
    this.animTimer = 0;
    this.activated = false;
  }

  update() {
    if (this.flat) {
      this.flatTimer--;
      if (this.flatTimer <= 0) this.alive = false;
      return;
    }

    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.x += this.vx;
    this.resolveCollisionX();

    this.y += this.vy;
    this.resolveCollisionY();

    if (this.y > levelH * T + 100) this.alive = false;

    this.animTimer++;
    if (this.animTimer > 12) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
    }
  }

  resolveCollisionX() {
    const tiles = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tiles) {
      const tx = t.x * T;
      const overlapX = Math.min(this.x + this.w, tx + T) - Math.max(this.x, tx);
      const overlapY = Math.min(this.y + this.h, t.y * T + T) - Math.max(this.y, t.y * T);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vx > 0) {
        this.x = tx - this.w;
        this.vx = -ENEMY_SPEED;
      } else if (this.vx < 0) {
        this.x = tx + T;
        this.vx = ENEMY_SPEED;
      }
    }
  }

  resolveCollisionY() {
    const tiles = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tiles) {
      const ty = t.y * T;
      const overlapX = Math.min(this.x + this.w, t.x * T + T) - Math.max(this.x, t.x * T);
      const overlapY = Math.min(this.y + this.h, ty + T) - Math.max(this.y, ty);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vy > 0) {
        this.y = ty - this.h;
        this.vy = 0;
      } else if (this.vy < 0) {
        this.y = (t.y + 1) * T;
        this.vy = 0;
      }
    }
  }

  stomp() {
    this.flat = true;
    this.flatTimer = 30;
    score += 100;
    playSound('stomp');
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    if (sx < -40 || sx > INTERNAL_W + 40) return;

    if (this.flat) {
      ctx.drawImage(S.goombaFlat, sx, sy + this.h - S.goombaFlat.height, S.goombaFlat.width, S.goombaFlat.height);
    } else {
      const spr = this.animFrame ? S.goomba1 : S.goomba2;
      const offsetY = spr.height - this.h;
      ctx.drawImage(spr, sx - 1, sy - offsetY, spr.width, spr.height);
    }
  }
}

class Koopa {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = -ENEMY_SPEED; this.vy = 0;
    this.w = 21; this.h = 42;
    this.alive = true;
    this.shell = false;
    this.shellMoving = false;
    this.type = 'koopa';
    this.animFrame = 0;
    this.animTimer = 0;
    this.kickCooldown = 0;
    this.activated = false;
  }

  update() {
    if (this.kickCooldown > 0) this.kickCooldown--;

    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.x += this.vx;
    this.resolveCollisionX();

    this.y += this.vy;
    this.resolveCollisionY();

    if (this.y > levelH * T + 100) this.alive = false;

    if (this.shellMoving) {
      for (const e of entities) {
        if (e === this || !e.alive) continue;
        if (e.type === 'goomba' || e.type === 'koopa') {
          if (this.overlaps(e)) {
            e.alive = false;
            score += 100;
            spawnParticle(e.x, e.y, '100');
          }
        }
      }
    }

    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
    }
  }

  resolveCollisionX() {
    const tiles = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tiles) {
      const tx = t.x * T;
      const overlapX = Math.min(this.x + this.w, tx + T) - Math.max(this.x, tx);
      const overlapY = Math.min(this.y + this.h, t.y * T + T) - Math.max(this.y, t.y * T);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vx > 0) {
        this.x = tx - this.w;
        this.vx = this.shellMoving ? -KOOPA_SHELL_SPEED : -ENEMY_SPEED;
      } else if (this.vx < 0) {
        this.x = tx + T;
        this.vx = this.shellMoving ? KOOPA_SHELL_SPEED : ENEMY_SPEED;
      }
    }
  }

  resolveCollisionY() {
    const tiles = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tiles) {
      const ty = t.y * T;
      const overlapX = Math.min(this.x + this.w, t.x * T + T) - Math.max(this.x, t.x * T);
      const overlapY = Math.min(this.y + this.h, ty + T) - Math.max(this.y, ty);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (this.vy > 0) {
        this.y = ty - this.h;
        this.vy = 0;
      } else if (this.vy < 0) {
        this.y = (t.y + 1) * T;
        this.vy = 0;
      }
    }
  }

  stomp() {
    if (!this.shell) {
      this.shell = true;
      this.shellMoving = false;
      this.vx = 0;
      this.h = 22;
      this.y += 20;
      score += 100;
      this.kickCooldown = 10;
      playSound('stomp');
    } else if (!this.shellMoving && this.kickCooldown <= 0) {
      this.shellMoving = true;
      this.vx = player.x < this.x ? KOOPA_SHELL_SPEED : -KOOPA_SHELL_SPEED;
      this.kickCooldown = 10;
      playSound('kick');
    } else if (this.shellMoving && this.kickCooldown <= 0) {
      this.shellMoving = false;
      this.vx = 0;
      this.kickCooldown = 10;
    }
  }

  overlaps(other) {
    return this.x < other.x + other.w && this.x + this.w > other.x &&
           this.y < other.y + other.h && this.y + this.h > other.y;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    if (sx < -40 || sx > INTERNAL_W + 40) return;

    if (this.shell) {
      ctx.drawImage(S.koopaShell, sx, sy, S.koopaShell.width, S.koopaShell.height);
    } else {
      let spr;
      if (this.vx < 0) {
        spr = this.animFrame ? S.koopa1 : S.koopa2;
      } else {
        spr = this.animFrame ? S.koopa1L : S.koopa2L;
      }
      const offsetY = spr.height - this.h;
      ctx.drawImage(spr, sx, sy - offsetY, spr.width, spr.height);
    }
  }
}

class MushroomItem {
  constructor(x, y) {
    this.x = x; this.y = y - T;
    this.vx = 2; this.vy = -2;
    this.w = 24; this.h = 30;
    this.alive = true;
    this.type = 'mushroom';
    this.emergeY = y;
    this.emerging = true;
  }

  update() {
    if (this.emerging) {
      this.y -= 1;
      if (this.y <= this.emergeY - T) {
        this.emerging = false;
      }
      return;
    }

    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.x += this.vx;
    const tilesX = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tilesX) {
      const tx = t.x * T;
      const overlapX = Math.min(this.x + this.w, tx + T) - Math.max(this.x, tx);
      const overlapY = Math.min(this.y + this.h, t.y * T + T) - Math.max(this.y, t.y * T);
      if (overlapX > 0 && overlapY > 0) {
        if (this.vx > 0) this.x = tx - this.w;
        else this.x = tx + T;
        this.vx = -this.vx;
      }
    }

    this.y += this.vy;
    const tilesY = getTilesInRect(this.x, this.y, this.w, this.h);
    for (const t of tilesY) {
      const ty = t.y * T;
      const overlapX = Math.min(this.x + this.w, t.x * T + T) - Math.max(this.x, t.x * T);
      const overlapY = Math.min(this.y + this.h, ty + T) - Math.max(this.y, ty);
      if (overlapX > 0 && overlapY > 0) {
        if (this.vy > 0) { this.y = ty - this.h; this.vy = 0; }
        else { this.y = ty + T; this.vy = 0; }
      }
    }

    if (this.y > levelH * T + 50) this.alive = false;
  }

  render() {
    if (this.x - camera.x < -40 || this.x - camera.x > INTERNAL_W + 40) return;
    ctx.drawImage(S.mushroom, Math.round(this.x - camera.x), Math.round(this.y), S.mushroom.width, S.mushroom.height);
  }
}

class CoinItem {
  constructor(x, y) {
    this.x = x + T / 2 - 6; this.y = y;
    this.alive = true;
    this.type = 'floatingcoin';
    this.w = 12; this.h = 16;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  update() {}

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y + Math.sin(Date.now() / 200 + this.bobOffset) * 3);
    if (sx < -20 || sx > INTERNAL_W + 20) return;

    const f = ((Date.now() / 150 | 0) % 4);
    const widths = [12, 8, 4, 8];
    const w = widths[f];
    ctx.fillStyle = C.COIN_GOLD;
    ctx.fillRect(sx + (12 - w) / 2, sy, w, 16);
    ctx.fillStyle = C.COIN_DARK;
    ctx.fillRect(sx + (12 - w) / 2 + 1, sy + 2, Math.max(w - 2, 1), 2);
  }
}

class Particle {
  constructor(x, y, text) {
    this.x = x; this.y = y;
    this.vy = -3;
    this.life = 40;
    this.text = text;
    this.alive = true;
    this.type = 'particle';
  }

  update() {
    this.y += this.vy;
    this.vy += 0.02;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const alpha = Math.min(1, this.life / 15);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = C.WHITE;
    ctx.font = 'bold 14px Courier';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, sx, Math.round(this.y));
    ctx.globalAlpha = 1;
  }
}

class BrickParticle {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = 60;
    this.alive = true;
    this.type = 'particle';
    this.rot = 0;
    this.rotSpeed = (Math.random() - 0.5) * 0.3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY * 0.5;
    this.rot += this.rotSpeed;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    ctx.save();
    ctx.translate(sx + 4, sy + 4);
    ctx.rotate(this.rot);
    ctx.fillStyle = C.BRICK;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = C.BRICK_LINE;
    ctx.fillRect(-4, -1, 8, 2);
    ctx.restore();
  }
}

class CoinBounce {
  constructor(x, y) {
    this.x = x + 8; this.y = y;
    this.vy = -8;
    this.life = 30;
    this.alive = true;
    this.type = 'particle';
  }

  update() {
    this.y += this.vy;
    this.vy += 0.5;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    const f = ((Date.now() / 80 | 0) % 4);
    const widths = [12, 8, 3, 8];
    const w = widths[f];
    ctx.fillStyle = C.COIN_GOLD;
    ctx.fillRect(sx - w / 2, sy, w, 14);
  }
}

class StompEffect {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.life = 8;
    this.alive = true;
    this.type = 'particle';
    this.radius = 4;
  }

  update() {
    this.radius += 2;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    ctx.globalAlpha = this.life / 8;
    ctx.strokeStyle = C.WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// Dust particle for landing, jumping, skidding, running
class DustParticle {
  constructor(x, y, dirX) {
    this.x = x;
    this.y = y;
    this.vx = dirX * (1 + Math.random() * 1.5);
    this.vy = -(0.5 + Math.random() * 1.5);
    this.life = 12 + Math.random() * 8 | 0;
    this.maxLife = this.life;
    this.alive = true;
    this.type = 'particle';
    this.size = 2 + Math.random() * 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  render() {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y);
    const alpha = this.life / this.maxLife * 0.6;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#D4C4A0';
    ctx.beginPath();
    ctx.arc(sx, sy, this.size * (this.life / this.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function spawnParticle(x, y, text) {
  entities.push(new Particle(x + 8, y - 8, text));
}

function spawnStompEffect(x, y) {
  entities.push(new StompEffect(x, y));
}

function spawnDust(x, y, dirX) {
  entities.push(new DustParticle(x, y, dirX));
  entities.push(new DustParticle(x, y, dirX * 0.5));
}

// ===================================================
//  9. LEVEL LOADING
// ===================================================

function loadLevel(index) {
  const lvl = LEVELS[index];
  tileMap = [];
  entities = [];

  const rows = lvl.rows;
  levelH = rows.length;
  levelW = rows[0].length;

  let spawnX = 64, spawnY = 0;

  for (let r = 0; r < levelH; r++) {
    tileMap[r] = [];
    for (let c = 0; c < levelW; c++) {
      const ch = c < rows[r].length ? rows[r][c] : ' ';

      switch (ch) {
        case 's':
          tileMap[r][c] = TILE.EMPTY;
          spawnX = c * T;
          spawnY = r * T - 30;
          break;
        case 'g':
          tileMap[r][c] = TILE.EMPTY;
          entities.push(new Goomba(c * T + 2, r * T));
          break;
        case 'k':
          tileMap[r][c] = TILE.EMPTY;
          entities.push(new Koopa(c * T, r * T - 12));
          break;
        case 'c':
          tileMap[r][c] = TILE.EMPTY;
          entities.push(new CoinItem(c * T, r * T));
          break;
        default:
          tileMap[r][c] = ch;
          break;
      }
    }
  }

  player = new Player(spawnX, spawnY);
  camera.x = 0;
  camera.targetX = 0;
  timer = lvl.time;
  timerAcc = 0;
  flagSliding = false;
  levelCompleteTimer = 0;
  gameState = 'playing';
}

// ===================================================
//  10. BLOCK INTERACTION
// ===================================================

function hitBlock(col, row, isBig) {
  if (row < 0 || row >= levelH || col < 0 || col >= levelW) return;
  const tile = tileMap[row][col];

  if (tile === TILE.BRICK) {
    if (isBig) {
      tileMap[row][col] = TILE.EMPTY;
      playSound('break');
      score += 50;
      const bx = col * T, by = row * T;
      entities.push(new BrickParticle(bx, by, -2, -5));
      entities.push(new BrickParticle(bx + 16, by, 2, -5));
      entities.push(new BrickParticle(bx, by + 8, -1.5, -3));
      entities.push(new BrickParticle(bx + 16, by + 8, 1.5, -3));
    } else {
      playSound('bump');
    }
    killEnemyOnBlock(col, row);
  }

  if (tile === TILE.QBLOCK || tile === TILE.QMUSH || tile === TILE.Q1UP) {
    tileMap[row][col] = TILE.USED;

    if (tile === TILE.QBLOCK) {
      coins++;
      score += 200;
      playSound('coin');
      entities.push(new CoinBounce(col * T, row * T));
      spawnParticle(col * T, row * T, '200');
    } else if (tile === TILE.QMUSH) {
      entities.push(new MushroomItem(col * T, row * T));
      playSound('bump');
    } else if (tile === TILE.Q1UP) {
      lives++;
      playSound('1up');
      spawnParticle(col * T, row * T, '1UP');
    }

    killEnemyOnBlock(col, row);
  }
}

function killEnemyOnBlock(col, row) {
  const bx = col * T, by = (row - 1) * T;
  for (const e of entities) {
    if (!e.alive || e.type === 'particle' || e.type === 'mushroom' || e.type === 'floatingcoin') continue;
    if (e.x + e.w > bx && e.x < bx + T && Math.abs(e.y + e.h - by - T) < 8) {
      e.alive = false;
      score += 100;
      spawnParticle(e.x, e.y, '100');
    }
  }
}

// ===================================================
//  11. COLLISION DETECTION
// ===================================================

function checkPlayerEnemyCollisions() {
  if (player.dead || player.invincible > 0) return;

  for (const e of entities) {
    if (!e.alive) continue;
    if (e.type === 'mushroom') {
      if (playerOverlaps(e)) {
        e.alive = false;
        player.grow();
        score += 1000;
        spawnParticle(e.x, e.y, '1000');
      }
      continue;
    }

    if (e.type === 'floatingcoin') {
      if (playerOverlaps(e)) {
        e.alive = false;
        coins++;
        score += 200;
        playSound('coin');
        spawnParticle(e.x, e.y, '200');
      }
      continue;
    }

    if (e.type !== 'goomba' && e.type !== 'koopa') continue;
    if (e.flat) continue;
    if (e.type === 'koopa' && e.shell && !e.shellMoving && e.kickCooldown > 0) continue;

    if (!playerOverlaps(e)) continue;

    if (player.vy > 0 && player.y + player.h - e.y < e.h * 0.5) {
      e.stomp();
      player.vy = BOUNCE_FORCE;
      player.grounded = false;
      spawnParticle(e.x, e.y, '100');
      spawnStompEffect(e.x + e.w / 2, e.y);
    } else {
      player.hit();
    }
  }
}

function checkFlagCollision() {
  if (flagSliding) return;

  const pc = Math.floor((player.x + player.w / 2) / T);
  const pr = Math.floor((player.y + player.h / 2) / T);

  for (let r = 0; r < levelH; r++) {
    if (tileMap[r][pc] === TILE.FLAG_POLE || tileMap[r][pc] === TILE.FLAG_TOP) {
      flagSliding = true;
      player.vx = 0;
      player.vy = 3;
      playSound('flag');
      const height = levelH - pr;
      score += height * 100;
      spawnParticle(player.x, player.y, String(height * 100));
      return;
    }
  }
}

function playerOverlaps(e) {
  return player.x < e.x + e.w && player.x + player.w > e.x &&
         player.y < e.y + e.h && player.y + player.h > e.y;
}

// ===================================================
//  12. GAME LOOP
// ===================================================

function update() {
  frameCount++;

  switch (gameState) {
    case 'playing':
      updatePlaying();
      break;
    case 'dying':
      updateDying();
      break;
    case 'levelcomplete':
      updateLevelComplete();
      break;
  }
}

function updatePlaying() {
  if (flagSliding) {
    player.y += 3;
    player.x = Math.round(player.x);

    const bottomRow = Math.floor((player.y + player.h) / T);
    if (bottomRow >= levelH - 2) {
      player.y = (levelH - 2) * T - player.h;
      player.grounded = true;
      flagSliding = false;
      gameState = 'levelcomplete';
      levelCompleteTimer = 120;
    }
    // Camera follows during flag
    camera.targetX = player.x - INTERNAL_W / 3;
    camera.targetX = Math.max(0, Math.min(camera.targetX, levelW * T - INTERNAL_W));
    camera.x += (camera.targetX - camera.x) * 0.12;
    return;
  }

  player.update();

  for (const e of entities) {
    if (!e.alive) continue;

    if (e.type === 'goomba' || e.type === 'koopa') {
      const activationRange = INTERNAL_W + 100;
      if (!e.activated && e.x < camera.x + activationRange && e.x > camera.x - 64) {
        e.activated = true;
      }
      if (e.activated && e.x > camera.x - 200 && e.x < camera.x + INTERNAL_W + 200) {
        e.update();
      }
    } else {
      e.update();
    }
  }

  entities = entities.filter(e => e.alive);

  checkPlayerEnemyCollisions();
  checkFlagCollision();

  timerAcc++;
  if (timerAcc >= 60) {
    timerAcc = 0;
    timer--;
    if (timer <= 0) {
      player.die();
    }
  }
}

function updateDying() {
  player.vy += GRAVITY * 0.5;
  player.y += player.vy;
  deathTimer--;

  if (deathTimer <= 0) {
    if (lives <= 0) {
      gameState = 'gameover';
    } else {
      loadLevel(currentLevel);
    }
  }
}

function updateLevelComplete() {
  levelCompleteTimer--;
  player.x += 2;
  player.dir = 1;
  player.animTimer++;
  if (player.animTimer > 6) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 3;
  }

  // Camera follows
  camera.targetX = player.x - INTERNAL_W / 3;
  camera.targetX = Math.max(0, Math.min(camera.targetX, levelW * T - INTERNAL_W));
  camera.x += (camera.targetX - camera.x) * 0.12;

  if (levelCompleteTimer <= 0) {
    currentLevel++;
    if (currentLevel >= LEVELS.length) {
      gameState = 'win';
    } else {
      loadLevel(currentLevel);
    }
  }
}

// ===================================================
//  13. RENDERING
// ===================================================

function render() {
  const lvl = LEVELS[currentLevel] || LEVELS[0];
  ctx.fillStyle = lvl.bg;
  ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

  switch (gameState) {
    case 'menu':
      renderMenu();
      break;
    case 'playing':
    case 'dying':
    case 'levelcomplete':
      renderGame();
      renderHUD();
      break;
    case 'gameover':
      renderGameOver();
      break;
    case 'win':
      renderWin();
      break;
  }
}

function renderGame() {
  renderBackground();

  const startCol = Math.max(0, Math.floor(camera.x / T) - 1);
  const endCol = Math.min(levelW, startCol + COLS + 3);

  for (let r = 0; r < levelH; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = tileMap[r][c];
      if (tile === TILE.EMPTY) continue;
      const sx = c * T - camera.x;
      const sy = r * T;
      drawTile(ctx, tile, sx, sy);
    }
  }

  renderFlagCloth();

  for (const e of entities) {
    if (e.alive) e.render();
  }

  player.visible = true;
  player.render();
}

function renderBackground() {
  const lvl = LEVELS[currentLevel] || LEVELS[0];
  const parallax = camera.x * 0.3;

  for (let i = 0; i < 8; i++) {
    const cx = (i * 250 + 50 - parallax % 2000 + 2000) % 2000 - 200;
    const cy = 30 + (i % 3) * 40;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx + 20, cy + 15, 15, 0, Math.PI * 2);
    ctx.arc(cx + 40, cy + 10, 20, 0, Math.PI * 2);
    ctx.arc(cx + 60, cy + 15, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  if (lvl.bg === C.SKY) {
    for (let i = 0; i < 5; i++) {
      const hx = (i * 400 + 100 - parallax % 2000 + 2000) % 2000 - 200;
      const hy = levelH * T - 64;
      ctx.fillStyle = '#4A8C3F';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 64);
      ctx.quadraticCurveTo(hx + 60, hy - 20, hx + 120, hy + 64);
      ctx.fill();
    }
  }

  if (lvl.bg === C.SKY) {
    for (let i = 0; i < 6; i++) {
      const bx = (i * 350 + 200 - parallax * 0.5 % 2100 + 2100) % 2100 - 200;
      const by = levelH * T - 64 - 6;
      ctx.fillStyle = '#3DA035';
      ctx.beginPath();
      ctx.arc(bx, by + 10, 12, 0, Math.PI * 2);
      ctx.arc(bx + 16, by + 6, 14, 0, Math.PI * 2);
      ctx.arc(bx + 32, by + 10, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderFlagCloth() {
  for (let r = 0; r < levelH; r++) {
    for (let c = Math.max(0, Math.floor(camera.x / T) - 1); c < Math.min(levelW, Math.floor(camera.x / T) + COLS + 3); c++) {
      if (tileMap[r][c] === TILE.FLAG_TOP) {
        const sx = c * T - camera.x + 18;
        const sy = r * T + 10;

        if (!flagSliding) {
          const wave = Math.sin(Date.now() / 300) * 2;
          ctx.fillStyle = C.FLAG_GREEN;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 20 + wave, sy + 8);
          ctx.lineTo(sx, sy + 16);
          ctx.fill();
        }
        return;
      }
    }
  }
}

function renderHUD() {
  ctx.fillStyle = C.WHITE;
  ctx.font = 'bold 16px Courier';
  ctx.textAlign = 'left';

  ctx.fillText('SCORE', 20, 22);
  ctx.fillText(String(score).padStart(6, '0'), 20, 40);

  ctx.fillStyle = C.COIN_GOLD;
  ctx.fillRect(200, 28, 10, 12);
  ctx.fillStyle = C.WHITE;
  ctx.fillText('x' + String(coins).padStart(2, '0'), 214, 40);

  ctx.textAlign = 'center';
  ctx.fillText('WORLD', INTERNAL_W / 2, 22);
  ctx.fillText(LEVELS[currentLevel]?.name || '1-1', INTERNAL_W / 2, 40);

  ctx.textAlign = 'right';
  ctx.fillText('TIME', INTERNAL_W - 20, 22);
  ctx.fillText(String(Math.max(0, timer)), INTERNAL_W - 20, 40);

  ctx.textAlign = 'left';
  ctx.fillText('x' + lives, 310, 40);
  ctx.fillStyle = C.MARIO_RED;
  ctx.fillRect(295, 28, 12, 8);
  ctx.fillStyle = C.MARIO_SKIN;
  ctx.fillRect(300, 32, 8, 8);
}

function renderMenu() {
  ctx.fillStyle = C.SKY;
  ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

  for (let i = 0; i < COLS + 1; i++) {
    drawTile(ctx, TILE.GROUND, i * T, INTERNAL_H - T * 2);
    drawTile(ctx, TILE.GROUND, i * T, INTERNAL_H - T);
  }

  ctx.fillStyle = C.BLACK;
  ctx.font = 'bold 48px Courier';
  ctx.textAlign = 'center';
  ctx.fillText('SUPER MARIO', INTERNAL_W / 2 + 3, 123);

  ctx.strokeStyle = C.BLACK;
  ctx.lineWidth = 4;
  ctx.strokeText('SUPER MARIO', INTERNAL_W / 2, 120);
  ctx.fillStyle = C.MARIO_RED;
  ctx.fillText('SUPER MARIO', INTERNAL_W / 2, 120);

  ctx.fillStyle = C.COIN_GOLD;
  ctx.font = 'bold 28px Courier';
  ctx.fillText('HTML5', INTERNAL_W / 2, 160);

  if (S.marioSR) {
    ctx.drawImage(S.marioSR, INTERNAL_W / 2 - S.marioSR.width / 2, 200, S.marioSR.width, S.marioSR.height);
  }

  if (S.goomba1) {
    const goombaSprite = ((Date.now() / 400 | 0) % 2) ? S.goomba1 : S.goomba2;
    ctx.drawImage(goombaSprite, INTERNAL_W / 2 + 80, 220, goombaSprite.width, goombaSprite.height);
  }

  ctx.fillStyle = C.WHITE;
  ctx.font = '16px Courier';

  const blink = (Date.now() / 500 | 0) % 2;
  if (blink) {
    ctx.fillText('Pressione ENTER ou toque para jogar', INTERNAL_W / 2, 300);
  }

  ctx.fillStyle = C.MUSHROOM_SKIN;
  ctx.font = '13px Courier';
  ctx.fillText('← → ou A/D: Mover    ↑ ou ESPAÇO: Pular    SHIFT: Correr', INTERNAL_W / 2, 350);
  ctx.fillText('↓ ou S: Agachar    Pise nos inimigos! Chegue na bandeira!', INTERNAL_W / 2, 375);

  ctx.fillStyle = '#8090B0';
  ctx.font = '11px Courier';
  ctx.fillText('Fan game — Apenas para fins educacionais', INTERNAL_W / 2, 430);
}

function renderGameOver() {
  ctx.fillStyle = C.BLACK;
  ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

  ctx.fillStyle = C.MARIO_RED;
  ctx.font = 'bold 40px Courier';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', INTERNAL_W / 2, INTERNAL_H / 2 - 30);

  ctx.fillStyle = C.WHITE;
  ctx.font = '18px Courier';
  ctx.fillText('Score: ' + score, INTERNAL_W / 2, INTERNAL_H / 2 + 20);

  const blink = (Date.now() / 500 | 0) % 2;
  if (blink) {
    ctx.fillStyle = C.COIN_GOLD;
    ctx.font = '16px Courier';
    ctx.fillText('Pressione ENTER para tentar novamente', INTERNAL_W / 2, INTERNAL_H / 2 + 70);
  }
}

function renderWin() {
  ctx.fillStyle = '#102040';
  ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

  ctx.fillStyle = C.COIN_GOLD;
  ctx.font = 'bold 36px Courier';
  ctx.textAlign = 'center';
  ctx.fillText('PARABÉNS!', INTERNAL_W / 2, INTERNAL_H / 2 - 60);

  ctx.fillStyle = C.WHITE;
  ctx.font = 'bold 22px Courier';
  ctx.fillText('Você completou todas as fases!', INTERNAL_W / 2, INTERNAL_H / 2 - 10);

  ctx.font = '20px Courier';
  ctx.fillText('Score Final: ' + score, INTERNAL_W / 2, INTERNAL_H / 2 + 30);
  ctx.fillText('Moedas: ' + coins, INTERNAL_W / 2, INTERNAL_H / 2 + 60);

  const blink = (Date.now() / 500 | 0) % 2;
  if (blink) {
    ctx.fillStyle = C.COIN_GOLD;
    ctx.font = '16px Courier';
    ctx.fillText('Pressione ENTER para jogar novamente', INTERNAL_W / 2, INTERNAL_H / 2 + 110);
  }
}

// ===================================================
//  14. MAIN LOOP
// ===================================================

let lastTime = 0;
const STEP = 1000 / 60;
let accumulator = 0;

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += Math.min(dt, 100);

  while (accumulator >= STEP) {
    update();
    accumulator -= STEP;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ===================================================
//  15. INPUT
// ===================================================

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  ensureAudio();

  if (e.code === 'Enter' || e.code === 'Space') {
    if (gameState === 'menu') {
      startNewGame();
      e.preventDefault();
    } else if (gameState === 'gameover' || gameState === 'win') {
      resetToMenu();
      e.preventDefault();
    }
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function setupTouchControls() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const touchEl = document.getElementById('touch-controls');

  if (isTouchDevice && touchEl) {
    touchEl.classList.remove('hidden');
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    ensureAudio();
    if (gameState === 'menu') startNewGame();
    else if (gameState === 'gameover' || gameState === 'win') resetToMenu();
  });

  canvas.addEventListener('click', () => {
    ensureAudio();
    if (gameState === 'menu') startNewGame();
    else if (gameState === 'gameover' || gameState === 'win') resetToMenu();
  });

  document.querySelectorAll('.touch-btn').forEach(btn => {
    const action = btn.dataset.action;

    const start = () => {
      touchState[action] = true;
      btn.classList.add('pressed');
      ensureAudio();
    };
    const end = () => {
      touchState[action] = false;
      btn.classList.remove('pressed');
    };

    btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); start(); });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); end(); });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); end(); });
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); start(); });
    btn.addEventListener('mouseup', (e) => { e.preventDefault(); e.stopPropagation(); end(); });
    btn.addEventListener('mouseleave', end);
  });
}

// ===================================================
//  16. GAME STATE MANAGEMENT
// ===================================================

function startNewGame() {
  currentLevel = 0;
  score = 0;
  coins = 0;
  lives = 3;
  loadLevel(0);
}

function resetToMenu() {
  gameState = 'menu';
  score = 0;
  coins = 0;
  lives = 3;
  currentLevel = 0;
}

// ===================================================
//  17. INITIALIZATION
// ===================================================

function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  canvas.width = INTERNAL_W;
  canvas.height = INTERNAL_H;

  ctx.imageSmoothingEnabled = false;

  buildSprites();
  setupTouchControls();
  resizeCanvas();

  window.addEventListener('resize', resizeCanvas);

  gameState = 'menu';
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const ratio = INTERNAL_W / INTERNAL_H;
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  let cw, ch;
  if (ww / wh > ratio) {
    ch = wh;
    cw = ch * ratio;
  } else {
    cw = ww;
    ch = cw / ratio;
  }

  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
}

window.addEventListener('DOMContentLoaded', init);
