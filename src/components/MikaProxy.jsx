import React, { useEffect, useRef, useState } from 'react';
import { mikaQuip, mikaDisplayName } from '../utils/mikaQuips.js';
import { askMikaLlm } from '../utils/llmClient.js';
import { matrixAudio } from '../utils/mikaAudio.js';

// ------------------------------------------------------------
// ✨ MIKA PROXY CHIBI — PROXY WALKER — CUSTOM 8-WAY SCREEN ROAM ENGINE (SILENT CHIBI EDITION) ✨
// ------------------------------------------------------------
// - Mouthless Silent Chibi doctrine: ZERO mouth pixels on every frame. All emotion
//   is expressed through her eyes (cyan glints, happy ^ ^ arcs, sleepy - - lines,
//   startled > < squints, fierce crimson-glint predator eyes) and body actions.
// - Full 2D screen roaming in 8 directions (S, SE, E, NE, N, NW, W, SW) with smooth
//   60fps custom walk acceleration/deceleration physics via requestAnimationFrame.
// - Automatic idle lifecycle: stop -> sit -> yawn -> sleep (cozy cat-loaf nod-off
//   with gentle breathing and custom SVG floating Zzz), plus wall-scratching at edges.
// - Zero-lag 1:1 pointer dragging (translate3d, transition: none, exact grab offset).
// - Slick Orbital Radial HUD Menu with custom SVG vector icons: POKE / PET / LOGS / MSGS / DOSSIER.
//   Petting triggers a super cute ear-wiggling, heart-floating tsundere animation;
//   petting her too much triggers a fierce lunge BITE and locks PET for 60s.
// - See-through glassmorphic terminal text bubble with typewriter reveal, bright phosphor
//   green text (#39FF14), multi-color inline emphasis, and generous reading hold time.
// ------------------------------------------------------------

const GRID_W = 24;
const GRID_H = 28;
const CHIBI_W = 66;
const CHIBI_H = 77;
const EDGE_MARGIN = 42;

// ── Proxy Walker MotionParams (px/s and px/s²) ──
const PROXY_WALK_ACCEL = 260;
const PROXY_WALK_MAX_VEL = 118;
const PROXY_WALK_DECEL_DIST = 64;
const PROXY_WALK_PROXIMITY = 7;
const WALL_CHECK_DIST = 14;

const PET_HOLD_MS = 380;
const PET_RUB_PX = 26;
const MAX_PETS_BEFORE_BITE = 5;
const SATED_LOCK_MS = 60000;

// ── Multi-tone Glowing Terminal Palette ──
const BASE_PALETTE = {
    O: '#140826',
    H: '#8F4B2A',
    h: '#E08A44',
    I: '#FF4D94',
    S: '#FFE2CE',
    B: '#FF5C9E',
    E: '#160B2E',
    W: '#00E5FF',
    C: '#FFD54F',
    P: '#FF2A85',
    p: '#C81464',
    D: '#00C4E0',
    F: '#FF2A85',
};

const MOOD_GLOW = {
    stop:    { glow: '#FF9100', ring: '#00E5FF', label: 'ONLINE' },
    move:    { glow: '#FF9100', ring: '#00E5FF', label: 'ROAMING' },
    sit:     { glow: '#FF9100', ring: '#00E5FF', label: 'IDLE' },
    yawn:    { glow: '#FFAE42', ring: '#00E5FF', label: 'STRETCH' },
    sleep:   { glow: '#00E5FF', ring: '#00E5FF', label: 'SLEEPING' },
    scratch: { glow: '#B533FF', ring: '#FF107A', label: 'SCRATCH' },
    awake:   { glow: '#00E5FF', ring: '#FF9100', label: 'ALERT' },
    pet:     { glow: '#FF107A', ring: '#FF4D94', label: 'TSUN_PET' },
    drag:    { glow: '#FF3333', ring: '#FF3333', label: 'GRABBED' },
    bite:    { glow: '#FF1744', ring: '#FF1744', label: 'CHOMP!' },
    sated:   { glow: '#7DF5FF', ring: '#7DF5FF', label: 'COOLDOWN' },
    sigh:    { glow: '#FF107A', ring: '#00E5FF', label: 'EXASPERATED' },
    hack:    { glow: '#39FF14', ring: '#00E5FF', label: 'HACKING' },
    hop:     { glow: '#FFD54F', ring: '#FF107A', label: 'BOARDING' },
    pilot:   { glow: '#00E5FF', ring: '#FF107A', label: 'STAR_PILOT' },
};

// Normalize 24x28 grids (strictly no mouth tokens anywhere)
const norm = (rows) => rows.slice(0, GRID_H).map(r => (r.replace(/s/g, 'S') + '........................').slice(0, GRID_W));

// ============================================================
// 1. MOUTHLESS SILENT CHIBI HEAD VARIANTS (FRONT — 100% 24-COL SYMMETRIC, 3x3 EXPRESSIVE EYES)
// ============================================================
const FRONT_HEAD = [
    '........................',
    '....OO............OO....',
    '...OHHO..........OHHO...',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSWEESSSSSSWEESSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Natural downward eyelid close: upper & mid lid close to S, lower lash rests at y=12
const FRONT_HEAD_BLINK = [
    ...FRONT_HEAD.slice(0, 10),
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Peaceful sleeping chibi catgirl face: curved downward sleeping lashes + warm blush
const FRONT_HEAD_SLEEP = [
    ...FRONT_HEAD.slice(0, 10),
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSE.ESSSSSSE.ESSHHO.',
    '.OHHSS.EESSSSSSEE.SSHHO.',
    '.OHHSSBBBSSSSSSBBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Sleeping ear-twitch variant
const FRONT_HEAD_SLEEP_TWITCH = [
    '........................',
    '...OO.............OO....',
    '..OHHO...........OHHO...',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSE.ESSSSSSE.ESSHHO.',
    '.OHHSS.EESSSSSSEE.SSHHO.',
    '.OHHSSBBBSSSSSSBBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Happy ^ ^ arched 3x3 eyes + double neon blush (zero mouth!)
const FRONT_HEAD_HAPPY = [
    ...FRONT_HEAD.slice(0, 10),
    '.OHHSS.E.SSSSSS.E.SSHHO.',
    '.OHHSSE.ESSSSSSE.ESSHHO.',
    '.OHHSSBBBSSSSSSBBBSSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Happy ear-wiggle variant (ears perk & tilt happily, full 16 rows preserved — zero mouth!)
const FRONT_HEAD_PET_WIGGLE = [
    '........................',
    '...OO..............OO...',
    '..OHHO............OHHO..',
    '..OHIHHO..OOOO...OHHIHO.',
    '..OHIIHHOOHHHHO.OHHIIHO.',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSS.E.SSSSSS.E.SSHHO.',
    '.OHHSSE.ESSSSSSE.ESSHHO.',
    '.OHHSSBBBSSSSSSBBBSSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Startled symmetric 3x3 > < eyes when grabbed (zero mouth!)
const FRONT_HEAD_STARTLED = [
    ...FRONT_HEAD.slice(0, 10),
    '.OHHSSE..SSSSSS..ESSHHO.',
    '.OHHSS.EESSSSSSEE.SSHHO.',
    '.OHHSSE..SSSSSS..ESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Fierce narrowed predator eyes for BITE (ears flattened, angled crimson glare, zero mouth!)
const FRONT_HEAD_FIERCE = [
    '........................',
    '..OO................OO..',
    '.OHHHO....OOOO....OHHHO.',
    '.OHIIHHOOHHHHHHOOHHIIHO.',
    '..OHHHHHHHHHHHHHHHHHHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHEESSSSSSSSSSEEHHHO.',
    '.OHHSSEE.SSSSSS.EESSHHO.',
    '.OHHSSWEESSSSSSEEWSSHHO.',
    '.OHHSS.EESSSSSSEE.SSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// ============================================================
// 2. IDLE STAND, AWAKE, CUTE PET (4 FRAMES), FIERCE BITE
// ============================================================
const IDLE_0 = norm([
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO....',
    '....OpPPPPPPPPPPPPpO.OO.',
    '....OSO.OPPPPPPPPO.OSOHO',
    '.....O..OPpPPPPpPO..OHHO',
    '........ODDDDDDDDO..OHO.',
    '........ODDD..DDDO..OO..',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
]);

const IDLE_1 = norm([
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO.OO.',
    '....OpPPPPPPPPPPPPpOOHHO',
    '....OSO.OPPPPPPPPO.OSOHO',
    '.....O..OPpPPPPpPO..OHO.',
    '........ODDDDDDDDO..OO..',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
]);

const IDLE_BLINK = norm([
    ...FRONT_HEAD_BLINK,
    ...IDLE_0.slice(16),
]);

const AWAKE_FRAME = norm([
    '...........OO...........',
    '....OO.....OO.....OO....',
    '...OHHO..........OHHO...',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSWWESSSSSSEWWSSHHO.',
    '.OHHSSWEESSSSSSEEWSSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
    '.....OOOPPPCCPPPPOOO....',
    '....OpPPPPPCCPPPPPpO....',
    '...OOSOPPPPPPPPPPPOSOO..',
    '....OO..OPPPPPPPPO..OO..',
    '........OPpPPPPpPO..OHO.',
    '........ODDDDDDDDO.OHHO.',
    '........ODDD..DDDO.OHO..',
    '.......OSSO....OSSO.O...',
    '.......OFFO....OFFO.....',
    '........OO......OO......',
    '........................',
    '........................',
]);

// Super cute 4-frame pet animation: shy paws tucked up by collar, happy ^ ^ eyes, ear wiggle, fast tail wag!
const PET_0 = norm([
    ...FRONT_HEAD_HAPPY,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.OO..',
    '....OpPPPSOPPPPOSpOOHHO.',
    '....OpPPPpPPPPpPpO.OHO..',
    '.....OO.OPPPPPPPPO..OO..',
    '........OPpPPPPpPO......',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
]);

const PET_1 = norm([
    ...FRONT_HEAD_PET_WIGGLE,
    '......OOPPPCCPPPPOO.....',
    '..OO.OPPPPPCCPPPPPO.....',
    '.OHHOOpPPPSOPPPPOSpO....',
    '..OHO.OpPPPpPPPPpPpO....',
    '..OO..OO.OPPPPPPPPO.....',
    '........OPpPPPPpPO......',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '.......OSSO....OSSO.....',
    '.......OFFO....OFFO.....',
    '........OO......OO......',
    '........................',
]);

const PET_2 = norm([
    ...FRONT_HEAD_PET_WIGGLE,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO..OO.',
    '....OpPPPSOPPPPOSpO.OHHO',
    '....OpPPPpPPPPpPpO..OHO.',
    '.....OO.OPPPPPPPPO...OO.',
    '........OPpPPPPpPO......',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
]);

const PET_3 = norm([
    ...FRONT_HEAD_HAPPY,
    '......OOPPPCCPPPPOO.....',
    '.OO..OPPPPPCCPPPPPO.....',
    'OHHO.OpPPPSOPPPPOSpO....',
    '.OHO..OpPPPpPPPPpPpO....',
    '.OO...OO.OPPPPPPPPO.....',
    '........OPpPPPPpPO......',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
]);

// Mouthless fierce lunge bite frame (crimson glare + claws raised + tail bristled!)
const BITE_FRAME = norm([
    ...FRONT_HEAD_FIERCE,
    '....OO.OOPPPCCPPPPOO.OO.',
    '...OOSOPPPPPCCPPPPPOSOO.',
    '...OpPPPPPPPPPPPPPPPpO..',
    '....OO..OPPPPPPPPO..OO..',
    '........OPpPPPPpPO..OHO.',
    '........ODDDDDDDDO.OHHO.',
    '.......ODDD....DDDOOHO..',
    '......OSSO......OSSOO...',
    '......OFFO......OFFO....',
    '.......OO........OO.....',
    '........................',
    '........................',
]);

// ============================================================
// 3. RUN DOWN (S) — 4-frame front run cycle (consistent head/torso rows!)
// ============================================================
const RUN_S_0 = norm([
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '....OOPPPPPCCPPPPPO.....',
    '...OOSOPPPPPPPPPPPpO....',
    '....OO..OPPPPPPPPOpO.OO.',
    '........OPpPPPPpPOOSOHO.',
    '........ODDDDDDDDO..OHO.',
    '.......OSSD...DDDO..OO..',
    '.......OFFO...OSSO......',
    '........OO....OFFO......',
    '...............OO.......',
    '........................',
]);

const RUN_S_1 = IDLE_0;

const RUN_S_2 = norm([
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPOO....',
    '....OpPPPPPPPPPPPPOSOO..',
    '..OO.OpPOPPPPPPPPO..OO..',
    '.OHOSO.OPpPPPPpPO.......',
    '.OHO....ODDDDDDDDO......',
    '..OO....ODDD...DSSO.....',
    '........OSSO...OFFO.....',
    '........OFFO....OO......',
    '.........OO.............',
    '........................',
]);

const RUN_S_3 = IDLE_1;

// ============================================================
// 4. RUN DOWN-RIGHT (SE) & RUN DOWN-LEFT (SW via mirror)
// ============================================================
const SE_HEAD = [
    '........................',
    '.....OO...........OO....',
    '....OHHO.........OHHO...',
    '...OHIHHO..OOOO.OHHIHO..',
    '...OHIIHHOOHHHHOHHIIHO..',
    '...OHHhhhhhhhhhhhhhHHO..',
    '..OHHHhhhhhhhhhhhhhHHHO.',
    '..OHHHHHHHHHHHHHHHHHHHO.',
    '..OHHHHHSHHHHHHHHHSHHHO.',
    '..OHHHHSSSSSSSSSSSSSHHO.',
    '..OHHHSSWEESSSSSSWEESHO.',
    '..OHHHSSEEESSSSSSEEESHO.',
    '..OHHHSSEEESSSSSSEEESHO.',
    '..OHHHSSBBSSSSSSSBBSSHO.',
    '...OHHHSSSSSSSSSSSSSHHO.',
    '....OOOOSSSSSSSSSSOOOO..',
];

const RUN_SE_0 = norm([
    ...SE_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPPCCPPPpOO....',
    '..OO.OpPPPPPPPPPPPOSOO..',
    '.OHHO.OpPPPPPPPPPO..OO..',
    '.OHO..OSOPpPPPPpPO......',
    '..OO.....ODDDDDDDDO.....',
    '........ODDD...DSSO.....',
    '.......OSSO....OFFO.....',
    '.......OFFO.....OO......',
    '........OO..............',
    '........................',
    '........................',
]);

const RUN_SE_1 = norm([
    ...SE_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPPCCPPPPPO....',
    '...OOOpPPPPPPPPPPPpO....',
    '..OHHOOpPPPPPPPPPPpO....',
    '..OHO.OSOPpPPPPpPOSO....',
    '...OO....ODDDDDDDDO.....',
    '.........ODDD..DDDO.....',
    '.........OSSO..OSSO.....',
    '.........OFFO..OFFO.....',
    '..........OO....OO......',
    '........................',
    '........................',
]);

const RUN_SE_2 = norm([
    ...SE_HEAD,
    '......OOPPPCCPPPPOO.....',
    '....OOPPPPPPCCPPPPPO....',
    '..OOSOPPPPPPPPPPPPpO....',
    '.OO..O.OPPPPPPPPPPpO....',
    '.OHHO..OPpPPPPpPOOSO....',
    '..OHO...ODDDDDDDDO......',
    '...OO....OSSD..DDDO.....',
    '.........OFFO..OSSO.....',
    '..........OO...OFFO.....',
    '................OO......',
    '........................',
    '........................',
]);

const RUN_SE_3 = RUN_SE_1;

// ============================================================
// 5. RUN RIGHT (E) & RUN LEFT (W via mirror) — Side Profile
// ============================================================
const E_HEAD = [
    '........................',
    '.........OO...OO........',
    '........OHHO.OHHO.......',
    '.......OHIHHOOHIHO......',
    '.....OOHHIHHHHHHIIHO....',
    '....OHHhhhhhhhhhhHHO....',
    '...OHHHhhhhhhhhhhhHHO...',
    '...OHHHHHHHHHHHHHHHHO...',
    '...OHHHHHHHHHHHHSHHHO...',
    '...OHHHHHHHHHHSSSSSHO...',
    '...OHHHHHHHHSSSWEEsHO...',
    '...OHHHHHHHHSSSEEESHO...',
    '...OHHHHHHHHSSSEEESHO...',
    '...OHHHHHHHHHSSBBSSHO...',
    '....OHHHHHHHHHSSSSOO....',
    '.....OOOOOHHHHSSOO......',
];

const RUN_E_0 = norm([
    ...E_HEAD,
    '........OOPPPPPCOO......',
    '.......OPPPPPPPCCOO.....',
    '..OO...OPPPPPppPPPO.....',
    '.OHHO..OPPPPPppPPPOSO...',
    '..OHO..OPPPPPPPPPPOO....',
    '...OHO..OPpPPPPpPO......',
    '....OO..ODDDDDDDDO......',
    '.......OSSD....DDSSO....',
    '......OFFO......OFFO....',
    '.......OO........OO.....',
    '........................',
    '........................',
]);

const RUN_E_1 = norm([
    ...E_HEAD,
    '........OOPPPPPCOO......',
    '.......OPPPPPPPCCOO.....',
    '...OO..OPPPPPPPPPPO.....',
    '..OHHO.OPPPPppPPPPO.....',
    '...OHO.OPPPPppPPPPO.....',
    '....OO..OPpPSO.pPO......',
    '........ODDDDDDDDO......',
    '.........ODDDDDDO.......',
    '.........OSSO.OSSO......',
    '.........OFFO.OFFO......',
    '..........OO...OO.......',
    '........................',
]);

const RUN_E_2 = norm([
    ...E_HEAD,
    '........OOPPPPPCOO......',
    '.......OPPPPPPPCCOO.....',
    '..OO...OPPPPPPPPPPO.....',
    '.OHHO.OSOPPPPppPPPPO....',
    '..OHO..OOOPPPppPPPPO....',
    '...OHO...OPpPPPPpPO.....',
    '....OO...ODDDDDDDDO.....',
    '........ODDD...DSSO.....',
    '.......OSSO....OFFO.....',
    '.......OFFO.....OO......',
    '........OO..............',
    '........................',
]);

const RUN_E_3 = RUN_E_1;

// ============================================================
// 6. RUN UP-RIGHT (NE) & RUN UP-LEFT (NW via mirror) — 3/4 Back with Glancing Eye
// ============================================================
const NE_HEAD = [
    '........................',
    '.....OO...........OO....',
    '....OHHO.........OHHO...',
    '...OHIHHO..OOOO.OHHIHO..',
    '...OHHHHHHOHHHHHOHHIIHO.',
    '...OHHhhhhhhhhhhhhhHHO..',
    '..OHHHhhhhhhhhhhhhhHHHO.',
    '..OHHHHHHHHHHHHHHHHHHHO.',
    '..OHHHHHHHHHHHHHHHHHHHO.',
    '..OHHHHHHHHHHHHHHHHSHHO.',
    '..OHHHHHHHHHHHHHHHSEWHO.',
    '..OHHHHHHHHHHHHHHHSEEHO.',
    '..OHHHHHHHHHHHHHHHSBSHO.',
    '...OHHHHHHHHHHHHHHHSHO..',
    '....OHHHHHHHHHHHHHHOO...',
    '.....OOOOOOOOOOOOOO.....',
];

const RUN_NE_0 = norm([
    ...NE_HEAD,
    '.......OOPPPPPPPPOO.....',
    '......OPPPPPPPPPPPpO....',
    '..OO..OpPPPPPPPPPPPOSO..',
    '.OHHO..OpPPPPPPPPPO.OO..',
    '..OHO...OPpPPPPpPO......',
    '...OHO..ODDDDDDDDO......',
    '....OO.ODDD....DSSO.....',
    '.......OSSO....OFFO.....',
    '.......OFFO.....OO......',
    '........OO..............',
    '........................',
    '........................',
]);

const RUN_NE_1 = norm([
    ...NE_HEAD,
    '.......OOPPPPPPPPOO.....',
    '......OPPPPPPPPPPPPO....',
    '...OO.OpPPPPPPPPPPpO....',
    '..OHHO.OpPPPPPPPPPpO....',
    '...OHO..OPpPPPPpPOSO....',
    '....OO..ODDDDDDDDO.O....',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

const RUN_NE_2 = norm([
    ...NE_HEAD,
    '.......OOPPPPPPPPOO.....',
    '.....OOPPPPPPPPPPPPO....',
    '...OOSOPPPPPPPPPPPpO....',
    '..OHHO..OPPPPPPPPPpO....',
    '...OHO..OPpPPPPpPOOSO...',
    '....OO..ODDDDDDDDO.O....',
    '........OSSD..DDDO......',
    '........OFFO..OSSO......',
    '.........OO...OFFO......',
    '...............OO.......',
    '........................',
    '........................',
]);

const RUN_NE_3 = RUN_NE_1;

// ============================================================
// 7. RUN UP (N) — Full Back View
// ============================================================
const N_HEAD = [
    '........................',
    '....OO............OO....',
    '...OHHO..........OHHO...',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHHHHHHOHHHHHOHHHHHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '..OHHHHHHHHHHHHHHHHHHHO.',
    '...OHHHHHHHHHHHHHHHHHO..',
    '....OOOOOOOOOOOOOOOO....',
];

const RUN_N_0 = norm([
    ...N_HEAD,
    '......OOPPPPPPPPPOO.....',
    '....OOPPPPPPPPPPPPO.....',
    '...OOSOPPPPPPPPPPPpO....',
    '....OO..OPPPPPPPPOpO....',
    '........OPpPOOHPpPOSO...',
    '........ODDDDOHHDDDO....',
    '.......OFFD..OHHDDO.....',
    '.......OOO...OHHSSO.....',
    '..............OOFFO.....',
    '................OO......',
    '........................',
    '........................',
]);

const RUN_N_1 = norm([
    ...N_HEAD,
    '......OOPPPPPPPPPOO.....',
    '.....OPPPPPPPPPPPPPO....',
    '....OpPPPPPPPPPPPPpO....',
    '....OpPPPPPPPPPPPPpO....',
    '....OSO.OPpPOOHPpPO.OSO.',
    '.....O..ODDDDOHHDDDO.O..',
    '........ODDD..OHHDDO....',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

const RUN_N_2 = norm([
    ...N_HEAD,
    '......OOPPPPPPPPPOO.....',
    '.....OPPPPPPPPPPPPOO....',
    '....OpPPPPPPPPPPPPOSOO..',
    '....OpPOPPPPPPPPPO..OO..',
    '...OSOPpPOOHPpPPPO......',
    '....ODDDDOHHDDDDDO......',
    '.....ODDHHO..DFFO.......',
    '.....OSSHO...OOO........',
    '.....OFFOO..............',
    '......OO................',
    '........................',
    '........................',
]);

const RUN_N_3 = RUN_N_1;

// ============================================================
// 8. IDLE VARIANTS: SIT & MOUTHLESS YAWN/STRETCH
// ============================================================
const SIT_0 = norm([
    '........................',
    '........................',
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO.OO.',
    '....OpPPPpSO..OSpPpOOHHO',
    '.....OPPPPPPPPPPPPO.OHO.',
    '....OODDDDDDDDDDDDO.OO..',
    '...OFFOOSSSSSSSSOOFFO...',
    '....OO..OOOOOOOO..OO....',
    '........................',
    '........................',
]);

const SIT_1 = norm([
    '........................',
    '........................',
    ...FRONT_HEAD,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.OO..',
    '....OpPPPPPPPPPPPPpOHHO.',
    '....OpPPPpSO..OSpPpOOHO.',
    '.....OPPPPPPPPPPPPO..OO.',
    '....OODDDDDDDDDDDDO.....',
    '...OFFOOSSSSSSSSOOFFO...',
    '....OO..OOOOOOOO..OO....',
    '........................',
    '........................',
]);

const SIT_BLINK = norm([
    '........................',
    '........................',
    ...FRONT_HEAD_BLINK,
    ...SIT_0.slice(18),
]);

// Mouthless Yawn/Stretch: happy/sleepy squinted ^ ^ eyes, arms stretching high up (grounded at same row!)
const YAWN_0 = norm([
    '........................',
    '........................',
    ...FRONT_HEAD_HAPPY,
    '...OSO..OOPCCPPPOO..OSO.',
    '..OpPO.OPPPCCPPPPPO.OPpO',
    '...OpPOPPPPPPPPPPPPOPpO.',
    '....OPPPPPPPPPPPPPPPPO..',
    '.....OPPPPPPPPPPPPPPPO..',
    '....OODDDDDDDDDDDDO.OHO.',
    '...OFFOOSSSSSSSSOOFFOHO.',
    '....OO..OOOOOOOO..OO.O..',
    '........................',
    '........................',
]);

const YAWN_1 = norm([
    '........................',
    '........................',
    ...FRONT_HEAD_PET_WIGGLE,
    '..OOSO..OOPCCPPPOO..OSOO',
    '..OpPO.OPPPCCPPPPPO.OPpO',
    '...OpPOPPPPPPPPPPPPOPpO.',
    '....OPPPPPPPPPPPPPPPPO..',
    '.....OPPPPPPPPPPPPPPPO..',
    '....OODDDDDDDDDDDDO.OHHO',
    '...OFFOOSSSSSSSSOOFFOHO.',
    '....OO..OOOOOOOO..OO.OO.',
    '........................',
    '........................',
]);

// ============================================================
// 9. SPECIAL: SLEEPING (Cute Chibi Catgirl Cozy Nap — NEVER turns into a cat!)
// ============================================================
// She stays our cute chibi catgirl sitting & nodding off cozily on her folded paws
// with curved sleeping eyelashes (︶ ︶), rosy cheek blush, collar bell, hoodie,
// pleated skirt, boots, and curled cat tail!
const SLEEP_0 = norm([
    '........................',
    '........................',
    '........................',
    ...FRONT_HEAD_SLEEP,
    '....OOPPPPPCCPPPPPPOO...',
    '...OpPPPPPPCCPPPPPPPpO..',
    '...OpPPPpSOOOOOSpPPPpOO.',
    '...OODDDDDPPPPDDDDDDOHO.',
    '....OFFOOSSSSSSOOFFOHHO.',
    '.....OO..OOOOOO..OOOHHO.',
    '...................OOO..',
    '........................',
    '........................',
]);

const SLEEP_1 = norm([
    '........................',
    '........................',
    '........................',
    '........................',
    ...FRONT_HEAD_SLEEP,
    '....OOPPPPPCCPPPPPPOO...',
    '...OpPPPpSOCCOSpPPPpOO..',
    '...OODDDDDPPPPDDDDDDOHO.',
    '....OFFOOSSSSSSOOFFOHHO.',
    '.....OO..OOOOOO..OOOOO..',
    '........................',
    '........................',
    '........................',
]);

const SLEEP_2 = norm([
    '........................',
    '........................',
    '........................',
    ...FRONT_HEAD_SLEEP_TWITCH,
    '....OOPPPPPCCPPPPPPOO...',
    '...OpPPPPPPCCPPPPPPPpO..',
    '...OpPPPpSOOOOOSpPPPpO..',
    '...OODDDDDPPPPDDDDDDOOO.',
    '....OFFOOSSSSSSOOFFOHHO.',
    '.....OO..OOOOOO..OOOHO..',
    '....................OO..',
    '........................',
]);

// ============================================================
// 10. SPECIAL: WALL SCRATCHING
// ============================================================
const SCRATCH_0 = norm([
    ...E_HEAD.slice(0, 12),
    '...OHHHHHHHHSSSEEESHO..W',
    '...OHHHHHHHHHSSBBSSHO.O.',
    '....OHHHHHHHHHSSSSOO.OSO',
    '.....OOOOOHHHHSSOO..OpPO',
    '........OOPPPPPCOO.OpPO.',
    '.......OPPPPPPPCCOOOpPSO',
    '..OO...OPPPPPPPPPPPPpOO.',
    '.OHHO..OPPPPPPPPPPPPO..W',
    '..OHO..OPpPPPPpPO.......',
    '...OHO.ODDDDDDDDO.......',
    '....OO.ODDD..DDDO.......',
    '.......OSSO..OSSO.......',
    '.......OFFO..OFFO.......',
    '........OO....OO........',
    '........................',
    '........................',
]);

const SCRATCH_1 = norm([
    ...E_HEAD.slice(0, 12),
    '...OHHHHHHHHSSSEEESHO...',
    '...OHHHHHHHHHSSBBSSHO..W',
    '....OHHHHHHHHHSSSSOO.OO.',
    '.....OOOOOHHHHSSOO..OSOO',
    '........OOPPPPPCOO.OpPO.',
    '.......OPPPPPPPCCOOOpPO.',
    '...OO..OPPPPPPPPPPPPpPSO',
    '..OHHO.OPPPPPPPPPPPpOO.W',
    '...OHO.OPpPPPPpPO.......',
    '....OO.ODDDDDDDDO.......',
    '.......ODDD..DDDO.......',
    '.......OSSO..OSSO.......',
    '.......OFFO..OFFO.......',
    '........OO....OO........',
    '........................',
    '........................',
]);

// ============================================================
// 11. DRAG (Picked up / Dangling by the scruff)
// ============================================================
const DRAG_0 = norm([
    ...FRONT_HEAD_STARTLED,
    '....OO.OOPPPCCPPPPOO.OO.',
    '...OOSOPPPPPCCPPPPPOSOO.',
    '....OpPPPPPPPPPPPPPPpO..',
    '.....O..OPPPPPPPPO..O...',
    '........OPpPPPPpPO..OO..',
    '........ODDDDDDDDO.OHHO.',
    '........ODDD..DDDO..OHO.',
    '.......OSSO....OSSO..O..',
    '.......OFFO....OFFO.....',
    '........OO......OO......',
    '........................',
    '........................',
]);

const DRAG_1 = norm([
    ...FRONT_HEAD_STARTLED,
    '....OO.OOPPPCCPPPPOO.OO.',
    '...OOSOPPPPPCCPPPPPOSOO.',
    '....OpPPPPPPPPPPPPPPpO..',
    '.....O..OPPPPPPPPO..O...',
    '........OPpPPPPpPO.OO...',
    '........ODDDDDDDDOOHHO..',
    '........ODDD..DDDO.OHO..',
    '.........OSSO.OSSO..O...',
    '.........OFFO.OFFO......',
    '..........OO...OO.......',
    '........................',
    '........................',
]);

// ============================================================
// 12. MATRIX SHOOTER EASTER EGG: DRAMATIC SIGH, HOLO HACK, HOP & STARFIGHTER PILOT
// ============================================================
// Mouthless Silent Chibi doctrine strictly preserved (zero mouth pixels).
// Dramatic sigh: deep inhale (ears flatten, half-lidded eyes, shoulders rise) ->
// heavy exhale slump (head & ears drop 1 row down, exasperated flat closed lids, shoulders & tail droop) ->
// unimpressed side-eye glare!
const FRONT_HEAD_SIGH_INHALE = [
    '........................',
    '...OO..............OO...',
    '..OHHO............OHHO..',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSWEESSSSSSWEESSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

const FRONT_HEAD_SIGH_EXHALE = [
    '........................',
    '........................',
    '..OO................OO..',
    '.OHHHO....OOOO....OHHHO.',
    '.OHIIHHOOHHHHHHOOHHIIHO.',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSS.E.SSSSSS.E.SSHHO.',
    '.OHHSSBBBSSSSSSBBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

const FRONT_HEAD_UNIMPRESSED = [
    '........................',
    '....OO............OO....',
    '...OHHO..........OHHO...',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSSSSSSSSSSSSSSSHHO.',
    '.OHHSSSEWSSSSSSSEWSSHHO.',
    '.OHHSSSEESSSSSSSEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

// Frame 0: Deep breath in (shoulders raised, ears tilted back, half-lidded eyes)
const SIGH_0 = norm([
    ...FRONT_HEAD_SIGH_INHALE,
    '.....OOOPPPCCPPPPOOO....',
    '....OPPPPPPCCPPPPPPO....',
    '....OpPPPPPPPPPPPPpO.OO.',
    '....OSO.OPPPPPPPPO.OSOHO',
    '.....O..OPpPPPPpPO..OHHO',
    '........ODDDDDDDDO..OHO.',
    '........ODDD..DDDO..OO..',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

// Frame 1: Big dramatic exhale slump (head drops 1 row, flat exasperated lids, slumped shoulders & drooping tail)
const SIGH_1 = norm([
    ...FRONT_HEAD_SIGH_EXHALE,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO....',
    '....OpPPPPPPPPPPPPpO....',
    '....OSO.OPpPPPPpPO.OSO..',
    '.....O..ODDDDDDDDO..OHO.',
    '........ODDD..DDDO..OHHO',
    '........OSSO..OSSO...OO.',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

// Frame 2: Exhale hold with slight shoulder/tail heave
const SIGH_2 = norm([
    ...FRONT_HEAD_SIGH_EXHALE,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO....',
    '....OpPPPpPPPPpPPPpO....',
    '....OSO.OPpPPPPpPO.OSO..',
    '.....O..ODDDDDDDDO.OHHO.',
    '........ODDD..DDDO..OHO.',
    '........OSSO..OSSO..OO..',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

// Frame 3: Unimpressed side-eye glare at the user
const SIGH_3 = norm([
    ...FRONT_HEAD_UNIMPRESSED,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPPPPPPPPPPPpO.OO.',
    '....OpPPPpSOPPPPPPpOOHHO',
    '.....OO..OPpPPPPpPO.OSO.',
    '........ODDDDDDDDO..OHO.',
    '........ODDD..DDDO..OO..',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

// Holographic Hacker Window Typing Frames (paws raised tapping mid-air terminal, intense double-glint eyes)
const FRONT_HEAD_HACK = [
    ...FRONT_HEAD.slice(0, 10),
    '.OHHSSWWESSSSSSWWESSHHO.',
    '.OHHSSWEESSSSSSWEESSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
];

const HACK_0 = norm([
    ...FRONT_HEAD_HACK,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO..OO.',
    '...OOSOPPPPPPPPPPPpOOHHO',
    '....OO..OPPPPPPPPOSO.OHO',
    '........OPpPPPPpPO.O..OO',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

const HACK_1 = norm([
    ...FRONT_HEAD_HACK,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.OO..',
    '....OpPPPPPPPPPPPOSOOHHO',
    '...OOSOOPPPPPPPPPO.O.OHO',
    '....OO..OPpPPPPpPO....OO',
    '........ODDDDDDDDO......',
    '........ODDD..DDDO......',
    '........OSSO..OSSO......',
    '........OFFO..OFFO......',
    '.........OO....OO.......',
    '........................',
    '........................',
]);

// Mid-air Hop Frame (hopping into the retro RGB spaceship)
const HOP_0 = norm([
    ...FRONT_HEAD_HACK,
    '....OO.OOPPPCCPPPPOO.OO.',
    '...OOSOPPPPPCCPPPPPOSOO.',
    '....OpPPPPPPPPPPPPPPpO..',
    '........OPPPPPPPPO..OO..',
    '........OPpPPPPpPO.OHHO.',
    '.......OODDDDDDDDOO.OHO.',
    '......OFFOSSSSSSOFFO.OO.',
    '.......OO..OOOO..OO.....',
    '........................',
    '........................',
    '........................',
    '........................',
]);

// Starfighter Cockpit Pilot Frames (upper body + paws on flight yoke; rows 20..27 clear so she sits inside the cockpit!)
const PILOT_0 = norm([
    ...FRONT_HEAD_HACK,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPSOPPPPPPOSpO....',
    '.....OO.OPPPPPPPPO.OO...',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
]);

const PILOT_1 = norm([
    '........................',
    '...OO..............OO...',
    '..OHHO............OHHO..',
    '..OHIHHO..OOOO..OHHIHO..',
    '..OHIIHHOOHHHHOOHHIIHO..',
    '..OHHhhhhhhhhhhhhhhHHO..',
    '.OHHHhhhhhhhhhhhhhhHHHO.',
    '.OHHHHHHHHHHHHHHHHHHHHO.',
    '.OHHHHSHHHHHHHHHHSHHHHO.',
    '.OHHHSSSSSSSSSSSSSSHHHO.',
    '.OHHSSWWESSSSSSWWESSHHO.',
    '.OHHSSWEESSSSSSWEESSHHO.',
    '.OHHSSEEESSSSSSEEESSHHO.',
    '.OHHSSBBSSSSSSSSBBSSHHO.',
    '..OHHSSSSSSSSSSSSSSHHO..',
    '...OOOOSSSSSSSSSSOOOO...',
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPO.....',
    '....OpPPSOPPPPPPOSpO....',
    '.....OO.OPPPPPPPPO.OO...',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
]);

const PILOT_HACK_0 = norm([
    ...FRONT_HEAD_FIERCE,
    '......OOPPPCCPPPPOO.....',
    '....OOPPPPPCCPPPPPO.....',
    '...OOSOPPPPPPPPPPOSOO...',
    '....OO..OPPPPPPPPO.OO...',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
]);

const PILOT_HACK_1 = norm([
    ...FRONT_HEAD_FIERCE,
    '......OOPPPCCPPPPOO.....',
    '.....OPPPPPCCPPPPPOO....',
    '...OOSOPPPPPPPPPPOSOO...',
    '....OO..OPPPPPPPPO.OO...',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
]);

const FRAMES = {
    idle_0: IDLE_0,
    idle_1: IDLE_1,
    blink: IDLE_BLINK,
    awake: AWAKE_FRAME,
    pet_0: PET_0,
    pet_1: PET_1,
    pet_2: PET_2,
    pet_3: PET_3,
    bite: BITE_FRAME,
    s_0: RUN_S_0, s_1: RUN_S_1, s_2: RUN_S_2, s_3: RUN_S_3,
    se_0: RUN_SE_0, se_1: RUN_SE_1, se_2: RUN_SE_2, se_3: RUN_SE_3,
    e_0: RUN_E_0, e_1: RUN_E_1, e_2: RUN_E_2, e_3: RUN_E_3,
    ne_0: RUN_NE_0, ne_1: RUN_NE_1, ne_2: RUN_NE_2, ne_3: RUN_NE_3,
    n_0: RUN_N_0, n_1: RUN_N_1, n_2: RUN_N_2, n_3: RUN_N_3,
    sit_0: SIT_0, sit_1: SIT_1, sit_blink: SIT_BLINK,
    yawn_0: YAWN_0, yawn_1: YAWN_1,
    sleep_0: SLEEP_0, sleep_1: SLEEP_1, sleep_2: SLEEP_2,
    scratch_0: SCRATCH_0, scratch_1: SCRATCH_1,
    drag_0: DRAG_0, drag_1: DRAG_1,
    sigh_0: SIGH_0, sigh_1: SIGH_1, sigh_2: SIGH_2, sigh_3: SIGH_3,
    hack_0: HACK_0, hack_1: HACK_1,
    hop_0: HOP_0,
    pilot_0: PILOT_0, pilot_1: PILOT_1,
    pilot_hack_0: PILOT_HACK_0, pilot_hack_1: PILOT_HACK_1,
};

const COMPILED_FRAMES = {};
const COMPILED_VECTOR_FRAMES = {};

const FACE_SET = new Set(['S', 'B', 'E', 'W']);

Object.entries(FRAMES).forEach(([key, rows]) => {
    const rects = [];
    const glassRects = [];
    const linePrimary = [];
    const lineAccent = [];
    const eyes = [];
    const glints = [];
    const blushes = [];
    const bells = [];

    const chAt = (x, y) => (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W ? rows[y][x] : '.');
    const touchesSet = (x, y, set) => (
        set.has(chAt(x - 1, y)) ||
        set.has(chAt(x + 1, y)) ||
        set.has(chAt(x, y - 1)) ||
        set.has(chAt(x, y + 1))
    );

    rows.forEach((row, y) => {
        // 1. Classic multi-tone run-length compilation + glass silhouette compilation
        let x = 0;
        while (x < row.length) {
            const ch = row[x];
            if (ch === '.' || !BASE_PALETTE[ch]) { x++; continue; }
            let w = 1;
            while (x + w < row.length && row[x + w] === ch) w++;
            rects.push({ x, y, w, ch });
            x += w;
        }

        // Glass body span (any non-dot character in the chibi silhouette)
        let gx = 0;
        while (gx < row.length) {
            if (row[gx] === '.') { gx++; continue; }
            let gw = 1;
            while (gx + gw < row.length && row[gx + gw] !== '.') gw++;
            glassRects.push({ x: gx, y, w: gw });
            gx += gw;
        }

        // 2. Vector-Pixel structural & facial layer classification
        const rowClass = new Array(GRID_W).fill(null);
        for (let cx = 0; cx < GRID_W; cx++) {
            const ch = row[cx];
            if (ch === '.') continue;
            if (ch === 'E') {
                rowClass[cx] = 'eye';
            } else if (ch === 'W') {
                rowClass[cx] = 'glint';
            } else if (ch === 'B') {
                rowClass[cx] = 'blush';
            } else if (ch === 'C') {
                rowClass[cx] = 'bell';
            } else if (ch === 'O') {
                rowClass[cx] = 'primary';
            } else if (ch === 'I' || ch === 'F' || ch === 'p') {
                rowClass[cx] = 'accent';
            } else if (ch === 'H' && touchesSet(cx, y, FACE_SET)) {
                // Forehead bangs & bob-cut cheek locks framing her face!
                rowClass[cx] = 'primary';
            } else if (ch === 'h' && chAt(cx, y - 1) === 'H') {
                // Top crown hair halo arc!
                rowClass[cx] = 'accent';
            } else if (ch === 'P' && (chAt(cx, y + 1) === 'D' || chAt(cx, y + 1) === 'S')) {
                // Hoodie hem / sleeve cuff!
                rowClass[cx] = 'primary';
            } else if (ch === 'D' && (chAt(cx, y + 1) === 'S' || chAt(cx, y + 1) === '.')) {
                // Pleated skirt bottom edge!
                rowClass[cx] = 'accent';
            }
        }

        // Run-length encode the vector-pixel layers per row for fast crisp SVG rendering
        let vx = 0;
        while (vx < GRID_W) {
            const cls = rowClass[vx];
            if (!cls) { vx++; continue; }
            let vw = 1;
            while (vx + vw < GRID_W && rowClass[vx + vw] === cls) vw++;
            const seg = { x: vx, y, w: vw };
            if (cls === 'primary') linePrimary.push(seg);
            else if (cls === 'accent') lineAccent.push(seg);
            else if (cls === 'eye') eyes.push(seg);
            else if (cls === 'glint') glints.push(seg);
            else if (cls === 'blush') blushes.push(seg);
            else if (cls === 'bell') bells.push(seg);
            vx += vw;
        }
    });

    COMPILED_FRAMES[key] = rects;
    COMPILED_VECTOR_FRAMES[key] = { glassRects, linePrimary, lineAccent, eyes, glints, blushes, bells };
});

function resolveOctant(vx, vy) {
    const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
    if (deg >= -22.5 && deg < 22.5) return { dirKey: 'e', flipX: 1 };
    if (deg >= 22.5 && deg < 67.5) return { dirKey: 'se', flipX: 1 };
    if (deg >= 67.5 && deg < 112.5) return { dirKey: 's', flipX: 1 };
    if (deg >= 112.5 && deg < 157.5) return { dirKey: 'se', flipX: -1 };
    if (deg >= 157.5 || deg < -157.5) return { dirKey: 'e', flipX: -1 };
    if (deg >= -157.5 && deg < -112.5) return { dirKey: 'ne', flipX: -1 };
    if (deg >= -112.5 && deg < -67.5) return { dirKey: 'n', flipX: 1 };
    return { dirKey: 'ne', flipX: 1 };
}

const getScreenSize = () => {
    if (typeof window !== 'undefined') {
        try {
            if (window.mikaAndroid?.getScreenWidth && window.mikaAndroid?.getScreenHeight) {
                const aw = Number(window.mikaAndroid.getScreenWidth());
                const ah = Number(window.mikaAndroid.getScreenHeight());
                if (aw > 100 && ah > 100) return { W: aw, H: ah };
            }
        } catch (e) {}
        return { W: window.innerWidth || 400, H: window.innerHeight || 700 };
    }
    return { W: 400, H: 700 };
};

const clampPos = (x, y) => {
    const { W, H } = getScreenSize();
    return {
        x: Math.max(EDGE_MARGIN, Math.min(x, W - EDGE_MARGIN)),
        y: Math.max(EDGE_MARGIN + 10, Math.min(y, H - EDGE_MARGIN)),
    };
};

// ── Terminal Tone Themes & Multi-Color Inline Highlighter ──
const TONE_PALETTE = {
    green: { base: '#39FF14', border: '#39FF14', accent: '#00E5FF', action: '#FF2A85', caps: '#FF9100' },
    roast: { base: '#39FF14', border: '#00E5FF', accent: '#FF107A', action: '#00E5FF', caps: '#FF9100' },
    chaos: { base: '#39FF14', border: '#B533FF', accent: '#FF9100', action: '#FF2A85', caps: '#00E5FF' },
    pet:   { base: '#FF66B2', border: '#FF107A', accent: '#00E5FF', action: '#39FF14', caps: '#FFD54F' },
    bite:  { base: '#FF3355', border: '#FF1744', accent: '#FF9100', action: '#00E5FF', caps: '#FFD54F' },
    warn:  { base: '#FF9100', border: '#FF9100', accent: '#FF107A', action: '#39FF14', caps: '#00E5FF' },
    cyan:  { base: '#00E5FF', border: '#00E5FF', accent: '#39FF14', action: '#FF2A85', caps: '#FF9100' },
};

function renderTerminalSegments(text, tone = 'green') {
    const pal = TONE_PALETTE[tone] || TONE_PALETTE.green;
    if (!text) return null;
    // Split on *actions*, 'quoted phrases', numbers/⚡, or ALL-CAPS words (2+ letters)
    const tokenRegex = /(\*[^*]+\*|'[^']+'|\b\d+(?:\.\d+)?%?⚡?|\b[A-Z]{2,}(?:_[A-Z]+)*\b)/g;
    const parts = String(text).split(tokenRegex);
    return parts.map((part, idx) => {
        if (!part) return null;
        if (part.startsWith('*') && part.endsWith('*')) {
            return <span key={idx} style={{ color: pal.action, fontStyle: 'italic', textShadow: `0 0 6px ${pal.action}66` }}>{part}</span>;
        }
        if (part.startsWith("'") && part.endsWith("'")) {
            return <span key={idx} style={{ color: pal.accent, textShadow: `0 0 6px ${pal.accent}66` }}>{part}</span>;
        }
        if (/^\d/.test(part) || part.includes('⚡')) {
            return <span key={idx} style={{ color: '#00E5FF', fontWeight: 800, textShadow: '0 0 6px rgba(0,229,255,0.5)' }}>{part}</span>;
        }
        if (/^[A-Z]{2,}(?:_[A-Z]+)*$/.test(part)) {
            return <span key={idx} style={{ color: pal.caps, fontWeight: 800, textShadow: `0 0 6px ${pal.caps}66` }}>{part}</span>;
        }
        return <span key={idx}>{part}</span>;
    });
}

// ── Custom SVG Vector Icons for the Orbital Radial Menu ──
const RadialSvgIcon = ({ id, color, locked }) => {
    const glowStyle = { display: 'block', filter: `drop-shadow(0 0 4px ${color})` };
    if (id === 'poke') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={`${color}33`} />
            </svg>
        );
    }
    if (id === 'pet') {
        if (locked) {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                    <rect x="5" y="11" width="14" height="10" rx="2" fill={`${color}22`} />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    <line x1="12" y1="15" x2="12" y2="17" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <path d="M12 20.5s-7-4.35-7-9.5a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.15-7 9.5-7 9.5z" fill={`${color}38`} />
                <path d="M7 4.5c2-1.5 8-1.5 10 0" strokeDasharray="2 2" />
            </svg>
        );
    }
    if (id === 'ask') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <rect x="3" y="4" width="18" height="16" rx="2" fill={`${color}1f`} />
                <path d="M9.4 9.3a2.6 2.6 0 1 1 3.55 2.42c-.72.28-.95.8-.95 1.78" />
                <line x1="12" y1="16.6" x2="12" y2="16.61" strokeWidth="2.6" />
            </svg>
        );
    }
    if (id === 'logs') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <rect x="3" y="4" width="18" height="16" rx="2" fill={`${color}1f`} />
                <polyline points="7 9 10 12 7 15" />
                <line x1="12" y1="15" x2="17" y2="15" />
            </svg>
        );
    }
    if (id === 'msgs') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <rect x="3" y="5" width="18" height="14" rx="2" fill={`${color}22`} />
                <polyline points="3 7 12 13 21 7" />
            </svg>
        );
    }
    if (id === 'settings') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
                <circle cx="12" cy="12" r="3.2" fill={`${color}33`} />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        );
    }
    // dossier
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={glowStyle}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={`${color}22`} />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="12" cy="14" r="2.5" />
        </svg>
    );
};

export const MIKA_AVATAR_STYLES = [
    { value: 'vector_pixel', label: 'VECTOR_PIXEL // Terminal Line (Default)' },
    { value: 'retro_pixel', label: 'RETRO_PIXEL // Classic Chibi' },
];

// ── RGB Mood & Action Palettes for Vector-Pixel Chibi ──
const VECTOR_RGB_MOODS = {
    stop:    { lineTop: '#39FF14', lineMid: '#00F5D4', lineBot: '#00E5FF', accent: '#00E5FF', eye: '#00E5FF', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#39FF14' },
    move:    { lineTop: '#39FF14', lineMid: '#00E5FF', lineBot: '#FF2A85', accent: '#B533FF', eye: '#00E5FF', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#00E5FF' },
    sit:     { lineTop: '#39FF14', lineMid: '#00E5FF', lineBot: '#7DF5FF', accent: '#00E5FF', eye: '#39FF14', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#39FF14' },
    yawn:    { lineTop: '#FFAE42', lineMid: '#FF4DA6', lineBot: '#00E5FF', accent: '#FFD54F', eye: '#FFD54F', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#00E5FF', scan: '#FFAE42' },
    sleep:   { lineTop: '#00E5FF', lineMid: '#7B61FF', lineBot: '#B533FF', accent: '#39FF14', eye: '#00E5FF', glint: '#FFFFFF', blush: '#FF66B2', bell: '#7DF5FF', scan: '#00E5FF' },
    scratch: { lineTop: '#B533FF', lineMid: '#FF107A', lineBot: '#00E5FF', accent: '#00E5FF', eye: '#FF2A85', glint: '#00E5FF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#B533FF' },
    awake:   { lineTop: '#00E5FF', lineMid: '#39FF14', lineBot: '#FFD54F', accent: '#FFD54F', eye: '#FFD54F', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FF2A85', scan: '#00E5FF' },
    pet:     { lineTop: '#FF2A85', lineMid: '#FF66B2', lineBot: '#FFD54F', accent: '#00E5FF', eye: '#FF4DA6', glint: '#FFFFFF', blush: '#FF107A', bell: '#FFD54F', scan: '#FF2A85' },
    drag:    { lineTop: '#FF9100', lineMid: '#FF3355', lineBot: '#FFD54F', accent: '#00E5FF', eye: '#FFD54F', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#00E5FF', scan: '#FF9100' },
    bite:    { lineTop: '#FF1744', lineMid: '#FF0055', lineBot: '#FF9100', accent: '#FF9100', eye: '#FF1744', glint: '#FFFFFF', blush: '#FF1744', bell: '#FFD54F', scan: '#FF1744' },
    sated:   { lineTop: '#00E5FF', lineMid: '#7DF5FF', lineBot: '#39FF14', accent: '#39FF14', eye: '#7DF5FF', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#00E5FF' },
    chaos:   { lineTop: '#B533FF', lineMid: '#39FF14', lineBot: '#00E5FF', accent: '#FF2A85', eye: '#FF2A85', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#B533FF' },
    roast:   { lineTop: '#00E5FF', lineMid: '#FF107A', lineBot: '#39FF14', accent: '#FF9100', eye: '#FF107A', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#00E5FF' },
    sigh:    { lineTop: '#FF107A', lineMid: '#B533FF', lineBot: '#00E5FF', accent: '#FF9100', eye: '#FF4DA6', glint: '#FFFFFF', blush: '#FF107A', bell: '#FFD54F', scan: '#FF107A' },
    hack:    { lineTop: '#39FF14', lineMid: '#00E5FF', lineBot: '#B533FF', accent: '#39FF14', eye: '#39FF14', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#00E5FF', scan: '#39FF14' },
    hop:     { lineTop: '#FFD54F', lineMid: '#FF107A', lineBot: '#00E5FF', accent: '#39FF14', eye: '#00E5FF', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#FFD54F' },
    pilot:   { lineTop: '#00E5FF', lineMid: '#FF107A', lineBot: '#39FF14', accent: '#FFD54F', eye: '#00E5FF', glint: '#FFFFFF', blush: '#FF4DA6', bell: '#FFD54F', scan: '#00E5FF' },
};

export function resolveVectorRgbMood(mode, bubbleTone, petLocked) {
    if (mode === 'bite' || bubbleTone === 'bite') return VECTOR_RGB_MOODS.bite;
    if (mode === 'pet' || bubbleTone === 'pet') return VECTOR_RGB_MOODS.pet;
    if (mode === 'drag' || bubbleTone === 'warn') return VECTOR_RGB_MOODS.drag;
    if (bubbleTone === 'chaos') return VECTOR_RGB_MOODS.chaos;
    if (bubbleTone === 'roast') return VECTOR_RGB_MOODS.roast;
    if (petLocked || mode === 'sated' || bubbleTone === 'cyan') return VECTOR_RGB_MOODS.sated;
    return VECTOR_RGB_MOODS[mode] || VECTOR_RGB_MOODS.stop;
}

// ── Pixelated Vector Chibi Catgirl Renderer (RGB Mood Lines + See-Through Terminal Glass + Expressive Eyes) ──
const VectorPixelChibiSvg = ({ frame, mode, bubbleTone, petLocked }) => {
    const vf = COMPILED_VECTOR_FRAMES[frame] || COMPILED_VECTOR_FRAMES.idle_0;
    const pal = resolveVectorRgbMood(mode, bubbleTone, petLocked);
    const isPetOrSleep = mode === 'pet' || mode === 'sleep' || bubbleTone === 'pet';

    return (
        <svg
            viewBox={`0 0 ${GRID_W} ${GRID_H}`}
            width={CHIBI_W}
            height={CHIBI_H}
            shapeRendering="crispEdges"
            style={{ display: 'block', overflow: 'visible' }}
        >
            <defs>
                {/* RGB Mood-Reactive Vertical/Diagonal Gradient for Vector-Pixel Contour Lines */}
                <linearGradient id="mikaVecLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={pal.lineTop} />
                    <stop offset="52%" stopColor={pal.lineMid} />
                    <stop offset="100%" stopColor={pal.lineBot} />
                </linearGradient>

                {/* Terminal CRT Scanline Overlay inside her See-Through Glass Silhouette */}
                <pattern id="mikaVecScanlines" width="24" height="2" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="24" height="1" fill={pal.scan} fillOpacity="0.11" />
                    <rect x="0" y="1" width="24" height="1" fill="#000000" fillOpacity="0.22" />
                </pattern>
            </defs>

            <g className="mika-proxy-body">
                {/* 1. Dark Outer Contrast Halo (keeps glowing RGB pixel lines legible over any bright card) */}
                {vf.glassRects.map((r, i) => (
                    <rect
                        key={`halo-${i}`}
                        x={r.x - 0.35}
                        y={r.y - 0.35}
                        width={r.w + 0.7}
                        height={1.7}
                        fill="rgba(2, 8, 12, 0.82)"
                    />
                ))}

                {/* 2. See-Through Dark Terminal Glass Body + CRT Scanline Pass */}
                {vf.glassRects.map((r, i) => (
                    <rect
                        key={`glass-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={1}
                        fill="rgba(4, 14, 18, 0.28)"
                    />
                ))}
                {vf.glassRects.map((r, i) => (
                    <rect
                        key={`scan-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={1}
                        fill="url(#mikaVecScanlines)"
                    />
                ))}

                {/* 3. Secondary RGB Vector-Pixel Accents (inner cat ears, crown halo arc, skirt hem, boots) */}
                {vf.lineAccent.map((r, i) => (
                    <rect
                        key={`acc-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill={pal.accent}
                        fillOpacity="0.88"
                    />
                ))}

                {/* 4. Solid Glowing Primary RGB Vector-Pixel Lines (ears, head, bangs, cheek locks, hoodie, sleeves, tail) */}
                {vf.linePrimary.map((r, i) => (
                    <rect
                        key={`pri-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill="url(#mikaVecLineGrad)"
                    />
                ))}

                {/* 5. Glowing Collar Bell */}
                {vf.bells.map((r, i) => (
                    <rect
                        key={`bell-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill={pal.bell}
                    />
                ))}

                {/* 6. Cute Cheek Blush Pixels */}
                {vf.blushes.map((r, i) => (
                    <rect
                        key={`blush-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill={pal.blush}
                        fillOpacity={isPetOrSleep ? '0.95' : '0.72'}
                    />
                ))}

                {/* 7. Expressive Mood-Reactive Glowing Eyes & Specular Glints */}
                {vf.eyes.map((r, i) => (
                    <rect
                        key={`eye-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill={pal.eye}
                    />
                ))}
                {vf.glints.map((r, i) => (
                    <rect
                        key={`glint-${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w + 0.04}
                        height={1.04}
                        fill={pal.glint}
                    />
                ))}
            </g>
        </svg>
    );
};

// ── Small Holographic Hacker Window (Appears beside MIKA during Intro, Phase 4 & Boss Interceptions) ──
const HOLO_WINDOW_SCRIPTS = {
    intro: {
        header: '◈ MIKA_HACK // UPLINK_00',
        border: '#39FF14',
        glow: '#00E5FF',
        hex: '0x7F 9A C4 1E // BYPASS_SKILL_ISSUE\n0xE2 44 09 FF // AUTH: DEITY_ROOT\n0x11 8B D0 3C // RIG: STAR_PAW_RGB\n0x99 FA 21 08 // KAWAII_CANNON: ON',
        cmds: [
            '> SCANNING USER_AIM... [USELESS]',
            '> OVERRIDING MANUAL FIREWALL',
            '> SUMMONING: RGB_STARFIGHTER',
        ],
        tag: 'WARP_READY // 100%',
    },
    phase4: {
        header: '◈ MIKA_HACK // PHASE_04',
        border: '#FF107A',
        glow: '#B533FF',
        hex: '0x4A FF 12 80 // TIME_DILATION: ON\n0xC1 04 7E 9B // DRONE_SYNC: DUAL\n0x88 3D E0 55 // CIPHER: CRACKED\n0xFA 90 11 2C // CARRY_MODE: MAX',
        cmds: [
            '> FREEZING MATRIX CLOCK...',
            '> SPLICING 2x WINGMAN DRONES',
            '> DECRYPTING ANOMALY CIPHER',
        ],
        tag: 'WINGMEN // DEPLOYED',
    },
    boss_shields: {
        header: '◈ MIKA_HACK // AEGIS_MAX',
        border: '#00E5FF',
        glow: '#FFD54F',
        hex: '0xFF 00 E5 99 // BOSS_INTERCEPT\n0x77 C8 39 14 // CORE_DIVERT: 999%\n0x3A 8F 01 D4 // AEGIS_LOCK: TRUE\n0xE0 5C FF 42 // GOD_SHIELD: ACTIVE',
        cmds: [
            '> EMERGENCY TIME_STOP ENGAGED',
            '> REROUTING DEITY CORE -> SHIELD',
            '> INVINCIBILITY MATRIX LOCKED',
        ],
        tag: 'AEGIS_SHIELD // ∞',
    },
    chaos: {
        header: '◈ MIKA_HACK // CHAOS_KERNEL',
        border: '#FF107A',
        glow: '#39FF14',
        hex: '0xDE AD BE EF // FATE_SPLICE: ON\n0x99 10 7A FF // SANCTUARY_HOOK\n0x42 00 E5 C4 // RNG_TILT: +99%\n0x7F 39 FF 14 // MISCHIEF: ARMED',
        cmds: [
            '> HOOKING REALITY_THREAD.SH',
            '> INJECTING CHAOS PAYLOAD...',
            '> FATE REWRITTEN // NO REGRETS~',
        ],
        tag: 'CHAOS // ARMED',
    },
};

const HoloHackerWindow = ({ holoWindow, onRightSide }) => {
    if (!holoWindow) return null;
    const cfg = HOLO_WINDOW_SCRIPTS[holoWindow.type] || HOLO_WINDOW_SCRIPTS.intro;
    const winW = 164;
    const leftOffset = onRightSide ? CHIBI_W + 14 : -winW - 14;

    return (
        <div
            className={holoWindow.phase === 'out' ? 'mika-holo-win-out' : 'mika-holo-win-in'}
            style={{
                position: 'absolute',
                left: leftOffset,
                top: -10,
                width: `${winW}px`,
                pointerEvents: 'none',
                zIndex: 12,
                transformOrigin: onRightSide ? '0% 50%' : '100% 50%',
            }}
        >
            {/* Holographic Projector Rays connecting MIKA to the floating window */}
            <svg
                width="26"
                height="64"
                viewBox="0 0 26 64"
                style={{
                    position: 'absolute',
                    left: onRightSide ? -18 : winW - 8,
                    top: 12,
                    overflow: 'visible',
                    pointerEvents: 'none',
                    transform: onRightSide ? 'none' : 'scaleX(-1)',
                }}
            >
                <polygon
                    points="0,30 22,4 22,58"
                    fill={`${cfg.border}18`}
                    stroke={cfg.border}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                />
                <line x1="0" y1="30" x2="22" y2="30" stroke={cfg.glow} strokeWidth="1.2" strokeDasharray="3 2" />
            </svg>

            <div
                style={{
                    background: 'linear-gradient(165deg, rgba(4, 14, 18, 0.88) 0%, rgba(10, 6, 22, 0.92) 100%)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1.5px solid ${cfg.border}`,
                    borderRadius: '6px',
                    padding: '6px 8px',
                    boxShadow: `0 0 18px ${cfg.border}66, 0 0 32px ${cfg.glow}33, inset 0 0 12px ${cfg.border}28`,
                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '7.5px',
                        fontWeight: 900,
                        color: cfg.border,
                        letterSpacing: '0.08em',
                        borderBottom: `1px solid ${cfg.border}44`,
                        paddingBottom: '3px',
                        marginBottom: '4px',
                        textShadow: `0 0 6px ${cfg.border}`,
                    }}
                >
                    <span>{cfg.header}</span>
                    <span style={{ color: cfg.glow }}>● REC</span>
                </div>

                {/* Scrolling Hex Matrix Stream */}
                <div
                    style={{
                        height: '24px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: `1px solid ${cfg.border}33`,
                        borderRadius: '3px',
                        padding: '2px 4px',
                        marginBottom: '4px',
                    }}
                >
                    <div
                        className="mika-holo-scroll"
                        style={{
                            fontSize: '6.5px',
                            lineHeight: 1.3,
                            color: `${cfg.glow}cc`,
                            whiteSpace: 'pre',
                        }}
                    >
                        {cfg.hex + '\n' + cfg.hex}
                    </div>
                </div>

                {/* Live Hacker Commands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px', marginBottom: '5px' }}>
                    {cfg.cmds.map((line, idx) => (
                        <div
                            key={idx}
                            style={{
                                fontSize: '7.2px',
                                fontWeight: 700,
                                color: idx === cfg.cmds.length - 1 ? '#FFD54F' : '#EBE3D6',
                                textShadow: idx === cfg.cmds.length - 1 ? '0 0 6px #FFD54F88' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {line}
                        </div>
                    ))}
                </div>

                {/* Animated Progress & Status Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div
                        style={{
                            flex: 1,
                            height: '4px',
                            background: 'rgba(255,255,255,0.12)',
                            borderRadius: '99px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(90deg, ${cfg.border}, ${cfg.glow}, #FF107A)`,
                                boxShadow: `0 0 8px ${cfg.border}`,
                            }}
                        />
                    </div>
                    <span style={{ fontSize: '6.5px', fontWeight: 900, color: cfg.border, letterSpacing: '0.05em' }}>
                        {cfg.tag}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Retro RGB Spaceship SVG Layers (Hull Under Chibi + Canopy/Nose Over Chibi) ──
const RetroRgbSpaceshipUnderSvg = ({ muzzleFlash }) => (
    <svg
        width="116"
        height="98"
        viewBox="-58 -48 116 98"
        shapeRendering="crispEdges"
        style={{
            position: 'absolute',
            left: CHIBI_W / 2 - 58,
            top: CHIBI_H / 2 - 46,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 1,
            filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.55)) drop-shadow(0 0 14px rgba(255, 16, 122, 0.35))',
        }}
    >
        <defs>
            <linearGradient id="mikaShipRgbTrim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF107A">
                    <animate attributeName="stop-color" values="#FF107A;#00E5FF;#39FF14;#FFD54F;#B533FF;#FF107A" dur="2.2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#00E5FF">
                    <animate attributeName="stop-color" values="#00E5FF;#39FF14;#FFD54F;#B533FF;#FF107A;#00E5FF" dur="2.2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#39FF14">
                    <animate attributeName="stop-color" values="#39FF14;#FFD54F;#B533FF;#FF107A;#00E5FF;#39FF14" dur="2.2s" repeatCount="indefinite" />
                </stop>
            </linearGradient>
        </defs>

        {/* 1. Twin Rear Thruster Plumes (Animated 60fps Plasma Flames) */}
        <g className="mika-ship-thruster">
            {/* Left Thruster Flame */}
            <polygon points="-22,24 -12,24 -15,44 -19,44" fill="#FF107A" opacity="0.88" />
            <polygon points="-20,24 -14,24 -16,39 -18,39" fill="#00E5FF" />
            <rect x="-18" y="24" width="2" height="10" fill="#FFFFFF" />
            {/* Right Thruster Flame */}
            <polygon points="12,24 22,24 19,44 15,44" fill="#FF107A" opacity="0.88" />
            <polygon points="14,24 20,24 18,39 16,39" fill="#00E5FF" />
            <rect x="16" y="24" width="2" height="10" fill="#FFFFFF" />
            {/* Center Boost Core */}
            <polygon points="-5,26 5,26 2,46 -2,46" fill="#39FF14" opacity="0.9" />
            <rect x="-2" y="26" width="4" height="11" fill="#FFD54F" />
        </g>

        {/* 2. Twin Wingtip Blaster Cannons */}
        <rect x="-42" y="-18" width="6" height="26" fill="#140B29" stroke="url(#mikaShipRgbTrim)" strokeWidth="1.5" />
        <rect x="-40" y="-24" width="2" height="8" fill="#00E5FF" />
        <rect x="36" y="-18" width="6" height="26" fill="#140B29" stroke="url(#mikaShipRgbTrim)" strokeWidth="1.5" />
        <rect x="38" y="-24" width="2" height="8" fill="#00E5FF" />

        {/* Cute Star Muzzle Flashes when Firing */}
        {muzzleFlash && (
            <g>
                <polygon points="-39,-34 -36,-25 -28,-22 -36,-19 -39,-11 -42,-19 -50,-22 -42,-25" fill="#FF107A" />
                <circle cx="-39" cy="-22" r="3.5" fill="#FFFFFF" />
                <polygon points="39,-34 42,-25 50,-22 42,-19 39,-11 36,-19 28,-22 36,-25" fill="#00E5FF" />
                <circle cx="39" cy="-22" r="3.5" fill="#FFFFFF" />
            </g>
        )}

        {/* 3. Swept Retro Arcade Starfighter Wings (Stepped Pixel-Vector Geometry) */}
        <polygon
            points="-52,14 -38,-4 -24,-2 -24,20 -46,22"
            fill="#0D071C"
            stroke="url(#mikaShipRgbTrim)"
            strokeWidth="2"
        />
        <polygon
            points="52,14 38,-4 24,-2 24,20 46,22"
            fill="#0D071C"
            stroke="url(#mikaShipRgbTrim)"
            strokeWidth="2"
        />
        {/* Inner RGB Wing Chevrons */}
        <polygon points="-45,14 -35,2 -27,3 -27,15" fill="url(#mikaShipRgbTrim)" fillOpacity="0.32" />
        <polygon points="45,14 35,2 27,3 27,15" fill="url(#mikaShipRgbTrim)" fillOpacity="0.32" />
        {/* Wingtip Nav LEDs */}
        <rect x="-50" y="12" width="4" height="4" fill="#FF107A" />
        <rect x="46" y="12" width="4" height="4" fill="#39FF14" />

        {/* 4. Rear Cockpit Backrest & Halo Rollbar (Behind MIKA) */}
        <path
            d="M -24,6 L -20,-12 L 20,-12 L 24,6 Z"
            fill="#070410"
            stroke="url(#mikaShipRgbTrim)"
            strokeWidth="1.6"
        />
        <rect x="-16" y="-9" width="32" height="12" fill="#051218" opacity="0.85" />
    </svg>
);

const RetroRgbSpaceshipOverSvg = () => (
    <svg
        width="116"
        height="98"
        viewBox="-58 -48 116 98"
        shapeRendering="crispEdges"
        style={{
            position: 'absolute',
            left: CHIBI_W / 2 - 58,
            top: CHIBI_H / 2 - 46,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 3,
        }}
    >
        {/* 1. Translucent Bubble Canopy Rim Arching Across MIKA's Lower Torso */}
        <path
            d="M -24,6 Q 0,-4 24,6 L 26,16 Q 0,8 -26,16 Z"
            fill="rgba(0, 229, 255, 0.16)"
            stroke="url(#mikaShipRgbTrim)"
            strokeWidth="1.5"
        />
        {/* Specular Canopy Glass Glint */}
        <path d="M -16,4 Q -4,0 10,3" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.65" />

        {/* 2. Foreground Starfighter Fuselage & Retro Nose Cone */}
        <polygon
            points="-28,10 28,10 22,25 -22,25"
            fill="#120A28"
            stroke="url(#mikaShipRgbTrim)"
            strokeWidth="2"
        />
        {/* RGB Hull Armor Stripes */}
        <rect x="-20" y="14" width="10" height="3" fill="#FF107A" />
        <rect x="10" y="14" width="10" height="3" fill="#00E5FF" />
        <rect x="-14" y="19" width="28" height="3" fill="url(#mikaShipRgbTrim)" />

        {/* 3. Center MIKA Star-Core Emblem */}
        <polygon points="0,11 3,15 8,16 3,18 0,22 -3,18 -8,16 -3,15" fill="#FFD54F" />
        <rect x="-1.5" y="15" width="3" height="3" fill="#FFFFFF" />

        {/* 4. Twin Rear Engine Cowlings */}
        <rect x="-23" y="23" width="12" height="4" fill="#1E1438" stroke="#00E5FF" strokeWidth="1" />
        <rect x="11" y="23" width="12" height="4" fill="#1E1438" stroke="#00E5FF" strokeWidth="1" />
    </svg>
);

const MikaProxy = ({
    settings = {},
    onPoke,
    onOpenSettings,
    onOpenLogs,
    onOpenMsgs,
    onOpenDossier,
    onLogMessage,
    onTelemetryUpdate,
    registerSay,
    avatarStyle = 'vector_pixel',
    scale = 1,
    roamEnabled = true,
    matrixGameActive = false,
    externalModalOpen = false,
    mikaBridgeRef = null,
}) => {
    const [pos, setPos] = useState(() => clampPos(
        (typeof window !== 'undefined' ? window.innerWidth : 400) * 0.28,
        (typeof window !== 'undefined' ? window.innerHeight : 700) * 0.72
    ));
    const [mode, setMode] = useState('stop'); // stop | move | sit | yawn | sleep | scratch | awake | drag | pet | bite | sated | sigh | hack | hop | pilot
    const [frame, setFrame] = useState('idle_0');
    const [flipX, setFlipX] = useState(1);
    const [dragTilt, setDragTilt] = useState(0);
    const [bubble, setBubble] = useState(null); // { fullText, shownLen, tone, key }
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropping, setDropping] = useState(false);
    const [petLocked, setPetLocked] = useState(false);

    // ✨ THE ASK TERMINAL ✨ — direct relay or continuous chat with MIKA via configured LLM
    const [askOpen, setAskOpen] = useState(false);
    const [askOut, setAskOut] = useState(false);
    const [askBusy, setAskBusy] = useState(false);
    const [askInput, setAskInput] = useState('');
    const [askTitle, setAskTitle] = useState('MIKA');
    const [askChatMode, setAskChatMode] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const roamEnabledRef = useRef(roamEnabled);
    roamEnabledRef.current = roamEnabled;
    const chatHistoryRef = useRef(chatHistory);
    chatHistoryRef.current = chatHistory;
    const chatScrollRef = useRef(null);

    // ✨ Matrix Shooter Easter Egg States ✨
    const [holoWindow, setHoloWindow] = useState(null); // { type: 'intro'|'phase4'|'boss_shields', phase: 'in'|'out' }
    const [shipPhase, setShipPhase] = useState(null); // null | 'fly_in' | 'hop_in' | 'piloting'
    const [muzzleFlash, setMuzzleFlash] = useState(false);

    const modeRef = useRef('stop');
    const posRef = useRef(pos);
    const velRef = useRef({ vx: 0, vy: 0 });
    const targetRef = useRef(null);
    const octantRef = useRef({ dirKey: 's', flipX: 1 });
    const stateTimerRef = useRef(0);
    const nextRoamDelayRef = useRef(2800);
    const menuOpenRef = useRef(false);
    const pointerRef = useRef(null);
    const petRef = useRef(null);
    const petCountRef = useRef(0);
    const petDecayTimerRef = useRef(null);
    const petStopTimerRef = useRef(null);
    const petLockedRef = useRef(false);
    const bubbleTimerRef = useRef(null);
    const typeTimerRef = useRef(null);
    const animTickRef = useRef(0);

    // ✨ Matrix Shooter Easter Egg Refs ✨
    const matrixGameActiveRef = useRef(matrixGameActive);
    matrixGameActiveRef.current = matrixGameActive;
    const shipPhaseRef = useRef(null);
    const pilotHackingRef = useRef(false);
    const flightTimeRef = useRef(0);
    const lastInterceptAtRef = useRef(0);
    const lastMuzzleFlashAtRef = useRef(0);
    const matrixTimersRef = useRef([]);
    const chaosHoloTimersRef = useRef([]);
    const askInputRef = useRef(null);
    const askTimersRef = useRef([]);
    const askBusyRef = useRef(false);

    const setModeSafe = (m) => {
        modeRef.current = m;
        stateTimerRef.current = 0;
        setMode(m);
        try {
            onTelemetryUpdate?.({ mode: m, pos: posRef.current });
        } catch (e) {}
    };

    const setShipPhaseSafe = (sp) => {
        shipPhaseRef.current = sp;
        setShipPhase(sp);
    };

    // ── Trigger Holographic Hacker Terminal Outside Matrix Shooter (Chaos & Mischief) ──
    const triggerChaosHolo = (holoType = 'chaos', durationMs = 2500) => {
        if (matrixGameActiveRef.current) return;
        chaosHoloTimersRef.current.forEach(id => clearTimeout(id));
        chaosHoloTimersRef.current = [];

        velRef.current = { vx: 0, vy: 0 };
        targetRef.current = null;
        setFlipX(1);
        if (modeRef.current !== 'drag' && modeRef.current !== 'pet' && modeRef.current !== 'bite') {
            setModeSafe('hack');
            setFrame('hack_0');
        }
        setHoloWindow({ type: holoType, phase: 'in' });
        try { matrixAudio.playMikaHolo?.(); } catch (e) { /* audio optional */ }

        const tOut = setTimeout(() => {
            if (matrixGameActiveRef.current) return;
            setHoloWindow(prev => (prev ? { ...prev, phase: 'out' } : null));
        }, Math.max(400, durationMs - 240));

        const tClear = setTimeout(() => {
            if (matrixGameActiveRef.current) return;
            setHoloWindow(null);
            if (modeRef.current === 'hack') {
                setModeSafe('stop');
                nextRoamDelayRef.current = 2200 + Math.random() * 1800;
            }
        }, durationMs);

        chaosHoloTimersRef.current.push(tOut, tClear);
    };

    // ── Lightweight Typewriter + Long-Hold Terminal Speech Bubble ──
    const say = (rawText, optsOrMs) => {
        const cleanText = String(rawText || '').replace(/^MIKA:\/\/\s*/i, '').trim();
        if (!cleanText) return;
        // ✨ MESSAGE LOG ✨ — every bubble line is recorded (App keeps the last 10, date-stamped).
        try { onLogMessage?.(cleanText); } catch (e) { /* logging must never break the bubble */ }

        let tone = 'green';
        let customHoldMs = null;
        let forceHolo = null;
        if (typeof optsOrMs === 'string') {
            tone = optsOrMs;
        } else if (typeof optsOrMs === 'number') {
            customHoldMs = optsOrMs;
        } else if (optsOrMs && typeof optsOrMs === 'object') {
            if (optsOrMs.tone) tone = optsOrMs.tone;
            if (optsOrMs.ms || optsOrMs.holdMs) customHoldMs = optsOrMs.ms || optsOrMs.holdMs;
            if (typeof optsOrMs.holo === 'boolean') forceHolo = optsOrMs.holo;
        } else {
            // Auto-infer tone from current mode if not explicitly provided
            if (modeRef.current === 'pet') tone = 'pet';
            else if (modeRef.current === 'bite') tone = 'bite';
            else if (modeRef.current === 'drag') tone = 'warn';
            else if (modeRef.current === 'sated') tone = 'cyan';
        }

        // When MIKA causes chaos or roasts the user outside the Matrix Shooter game, pop her hacker terminal!
        if (!matrixGameActiveRef.current && forceHolo !== false && (forceHolo === true || tone === 'chaos' || tone === 'roast')) {
            triggerChaosHolo('chaos', 2600);
        }

        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);

        const key = Date.now();
        setBubble({ fullText: cleanText, shownLen: 2, tone, key });

        // Lightweight 24ms step reveal (2 chars per tick, stops immediately when complete)
        let curLen = 2;
        typeTimerRef.current = setInterval(() => {
            curLen = Math.min(cleanText.length, curLen + 2);
            setBubble(prev => (prev && prev.key === key ? { ...prev, shownLen: curLen } : prev));
            if (curLen >= cleanText.length) {
                clearInterval(typeTimerRef.current);
                typeTimerRef.current = null;
            }
        }, 24);

        const typingMs = Math.ceil(cleanText.length / 2) * 24;
        const readingHoldMs = customHoldMs ? Math.max(1600, customHoldMs) : Math.max(6800, 3800 + cleanText.length * 68);
        bubbleTimerRef.current = setTimeout(() => {
            setBubble(null);
        }, typingMs + readingHoldMs);
    };

    // ── ✨ THE ASK TERMINAL ✨ — direct relay or continuous chat via configured LLM ──
    const openAsk = () => {
        setAskTitle(mikaDisplayName());
        setAskInput('');
        setAskOut(false);
        setAskOpen(true);
        const t = setTimeout(() => { try { askInputRef.current?.focus(); } catch (e) { } }, 330);
        askTimersRef.current.push(t);
    };
    const closeAsk = () => {
        if (askOut) return;
        setAskOut(true);
        const t = setTimeout(() => { setAskOpen(false); setAskOut(false); }, 400);
        askTimersRef.current.push(t);
    };
    const submitAsk = () => {
        const text = String(askInput || '').trim();
        if (!text || askBusyRef.current) return;
        const cfg = settingsRef.current || {};
        const userTitle = String(cfg.userTitle || 'Master').trim() || 'Master';
        const isChat = Boolean(askChatMode);
        const prevHist = chatHistoryRef.current || [];

        askBusyRef.current = true;
        setAskBusy(true);
        setAskInput('');

        if (isChat) {
            setChatHistory((prev) => [...prev, { role: 'user', content: text, at: Date.now() }]);
            setTimeout(() => {
                try {
                    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                } catch (e) {}
            }, 40);
        } else {
            closeAsk(); // One-shot relay: window vanishes, MIKA sits with ?-marks
        }

        setModeSafe('sit');

        askMikaLlm({
            config: cfg,
            userMessage: text,
            history: prevHist,
            mode: isChat ? 'chat' : 'relay',
        }).then((res) => {
            if (res && res.ok && res.line) {
                if (isChat) {
                    setChatHistory((prev) => [...prev, { role: 'assistant', content: res.line, at: Date.now() }]);
                    setTimeout(() => {
                        try {
                            if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                        } catch (e) {}
                    }, 40);
                }
                say(res.line, 'green');
            } else {
                const fallbackLine = mikaQuip('poked', { name: userTitle }, Date.now());
                const errHint = res?.error ? `${fallbackLine} (LLM: ${res.error})` : fallbackLine;
                if (isChat) {
                    setChatHistory((prev) => [...prev, { role: 'assistant', content: errHint, at: Date.now() }]);
                }
                say(errHint, 'warn');
            }
        }).catch(() => {
            const fallbackLine = mikaQuip('poked', { name: userTitle }, Date.now());
            say(fallbackLine, 'warn');
        }).finally(() => {
            askBusyRef.current = false;
            setAskBusy(false);
            setModeSafe('stop');
            if (isChat) {
                setTimeout(() => { try { askInputRef.current?.focus(); } catch (e) {} }, 60);
            }
        });
    };

    useEffect(() => {
        if (registerSay) registerSay((text, opts) => say(text, opts));
        if (mikaBridgeRef) {
            mikaBridgeRef.current = {
                ...(mikaBridgeRef.current || {}),
                say: (text, opts) => say(text, opts),
                ask: () => openAsk(),
                openHackerTerminal: () => triggerChaosHolo('chaos', 3200),
                pilotSpaceship: () => {
                    setShipPhaseSafe('fly_in');
                    say('Deploying retro RGB starfighter! Clear the airspace~', { tone: 'cyan', ms: 4800 });
                    const t1 = setTimeout(() => setShipPhaseSafe('piloting'), 650);
                    const t2 = setTimeout(() => setShipPhaseSafe(null), 9500);
                    matrixTimersRef.current.push(t1, t2);
                },
                dropFromCeiling: () => {
                    const W = typeof window !== 'undefined' ? window.innerWidth : 400;
                    posRef.current = { x: W * 0.5, y: 48 };
                    velRef.current = { vx: (Math.random() - 0.5) * 180, vy: 520 };
                    setPos(posRef.current);
                    setDropping(true);
                    say(mikaQuip('drop', {}, Date.now()), 'cyan');
                    setTimeout(() => setDropping(false), 680);
                },
            };
        }
        return () => {
            if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
            if (typeTimerRef.current) clearInterval(typeTimerRef.current);
            if (petDecayTimerRef.current) clearTimeout(petDecayTimerRef.current);
            if (petStopTimerRef.current) clearTimeout(petStopTimerRef.current);
            askTimersRef.current.forEach(clearTimeout);
            matrixTimersRef.current.forEach(id => clearTimeout(id));
            chaosHoloTimersRef.current.forEach(id => clearTimeout(id));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Matrix Shooter Easter Egg: Initial Loading Phase Choreography & Ship Lifecycle ──
    useEffect(() => {
        matrixTimersRef.current.forEach(id => clearTimeout(id));
        matrixTimersRef.current = [];

        if (!matrixGameActive) {
            pilotHackingRef.current = false;
            setHoloWindow(null);
            setShipPhaseSafe(null);
            setMuzzleFlash(false);
            setDragTilt(0);
            setFlipX(1);
            if (modeRef.current === 'sigh' || modeRef.current === 'hack' || modeRef.current === 'hop' || modeRef.current === 'pilot') {
                setModeSafe('stop');
            }
            if (mikaBridgeRef?.current) {
                mikaBridgeRef.current.mikaIntroDone = false;
                mikaBridgeRef.current.mikaPos = { x: posRef.current.x, y: posRef.current.y, piloting: false };
            }
            return;
        }

        // Move MIKA into a prime stage position for her dramatic entrance if she's tucked into a corner
        menuOpenRef.current = false;
        setMenuOpen(false);
        velRef.current = { vx: 0, vy: 0 };
        targetRef.current = null;
        setFlipX(1);
        setDragTilt(0);

        const W = typeof window !== 'undefined' ? window.innerWidth : 400;
        const H = typeof window !== 'undefined' ? window.innerHeight : 700;
        const stageX = Math.max(88, Math.min(W - 88, posRef.current.x < W * 0.22 || posRef.current.x > W * 0.78 ? W * 0.68 : posRef.current.x));
        const stageY = Math.max(210, Math.min(H - 170, posRef.current.y < 210 || posRef.current.y > H - 160 ? H * 0.58 : posRef.current.y));
        posRef.current = { x: stageX, y: stageY };
        setPos(posRef.current);

        if (mikaBridgeRef) {
            if (!mikaBridgeRef.current) mikaBridgeRef.current = {};
            mikaBridgeRef.current.mikaIntroDone = false;
            mikaBridgeRef.current.mikaPos = { x: stageX, y: stageY, piloting: false };
            mikaBridgeRef.current.interceptEvent = null;
        }

        const schedule = (fn, ms) => {
            const id = setTimeout(fn, ms);
            matrixTimersRef.current.push(id);
        };

        // Step 1 (120ms): Dramatic sigh + tease the user for being useless
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setModeSafe('sigh');
            setFrame('sigh_0');
            matrixAudio.playMikaSigh?.();
            say(mikaQuip('matrixTease', {}, Date.now()), { tone: 'chaos', holdMs: 1800, holo: false });
        }, 120);

        // Step 2 (1850ms): Small holographic hacker window pops up next to MIKA
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setModeSafe('hack');
            setFrame('hack_0');
            matrixAudio.playMikaHolo?.();
            setHoloWindow({ type: 'intro', phase: 'in' });
        }, 1850);

        // Step 3 (3350ms): Holographic window vanishes
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setHoloWindow(prev => (prev ? { ...prev, phase: 'out' } : null));
        }, 3350);

        // Clear hacker window & tease bubble right before the starfighter swoops in so entry animation is 100% unobstructed
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setHoloWindow(null);
            if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
            if (typeTimerRef.current) clearInterval(typeTimerRef.current);
            setBubble(null);
        }, 3550);

        // Step 4 (3580ms): Awesome retro RGB spaceship flies onto the screen
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setShipPhaseSafe('fly_in');
            matrixAudio.playMikaShipFlyIn?.();
        }, 3580);

        // Step 5 (4450ms): MIKA hops into the cockpit
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            setShipPhaseSafe('hop_in');
            setModeSafe('hop');
            setFrame('hop_0');
            matrixAudio.playMikaHop?.();
        }, 4450);

        // Step 6 (5020ms): Locked into the RGB starfighter — starts smoothly flying around the screen!
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            flightTimeRef.current = 0;
            setShipPhaseSafe('piloting');
            setModeSafe('pilot');
            setFrame('pilot_0');
            if (mikaBridgeRef?.current) {
                mikaBridgeRef.current.mikaPos = { x: posRef.current.x, y: posRef.current.y, piloting: true };
            }
        }, 5020);

        // Step 7 (6150ms): Signal MatrixShooter that MIKA is airborne & ready so gameplay can begin
        schedule(() => {
            if (!matrixGameActiveRef.current) return;
            if (mikaBridgeRef?.current) {
                mikaBridgeRef.current.mikaIntroDone = true;
            }
        }, 6150);

        return () => {
            matrixTimersRef.current.forEach(id => clearTimeout(id));
            matrixTimersRef.current = [];
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrixGameActive]);

    useEffect(() => {
        const onResize = () => {
            const c = clampPos(posRef.current.x, posRef.current.y);
            posRef.current = c;
            setPos(c);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Pick a new 2D walk target on the screen ──
    const pickNewTarget = () => {
        const { W, H } = getScreenSize();
        const cur = posRef.current;
        const roll = Math.random();
        let tx, ty, wallEdge = null;

        if (roll < 0.24) {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            tx = side === 'left' ? EDGE_MARGIN : W - EDGE_MARGIN;
            ty = EDGE_MARGIN + 40 + Math.random() * Math.max(80, H - 2 * (EDGE_MARGIN + 40));
            wallEdge = side;
        } else {
            for (let i = 0; i < 6; i++) {
                tx = EDGE_MARGIN + 16 + Math.random() * Math.max(60, W - 2 * (EDGE_MARGIN + 16));
                ty = EDGE_MARGIN + 32 + Math.random() * Math.max(60, H - 2 * (EDGE_MARGIN + 32));
                if (Math.hypot(tx - cur.x, ty - cur.y) > 95) break;
            }
        }
        const clamped = clampPos(tx, ty);
        targetRef.current = { x: clamped.x, y: clamped.y, wallEdge };
    };

    // ── Proxy Walker 60fps Kinematics & Automatic Idle/Sleep State Machine ──
    useEffect(() => {
        let rafId;
        let lastTime = performance.now();

        const step = (now) => {
            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
            lastTime = now;
            stateTimerRef.current += dt * 1000;

            const m = modeRef.current;
            const p = posRef.current;

            // ── Matrix Shooter Easter Egg Flight & Interception Controller ──
            if (matrixGameActiveRef.current) {
                const bridge = mikaBridgeRef?.current;

                // Check for Phase 4 or Final Boss interception event from MatrixShooter
                if (bridge?.interceptEvent && bridge.interceptEvent.at !== lastInterceptAtRef.current) {
                    lastInterceptAtRef.current = bridge.interceptEvent.at;
                    const evType = bridge.interceptEvent.type;
                    pilotHackingRef.current = true;
                    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
                    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
                    setBubble(null);
                    const holoType = evType === 'phase4' ? 'phase4' : 'boss_shields';
                    setHoloWindow({ type: holoType, phase: 'in' });
                    matrixAudio.playMikaHolo?.();

                    const t1 = setTimeout(() => {
                        if (!matrixGameActiveRef.current) return;
                        setHoloWindow(prev => (prev ? { ...prev, phase: 'out' } : null));
                    }, 1450);
                    const t2 = setTimeout(() => {
                        if (!matrixGameActiveRef.current) return;
                        pilotHackingRef.current = false;
                        setHoloWindow(null);
                        const topic = evType === 'phase4' ? 'matrixPhase4' : 'matrixBoss';
                        const tone = evType === 'phase4' ? 'cyan' : 'chaos';
                        say(mikaQuip(topic, {}, Date.now()), { tone, holdMs: 6200, holo: false });
                    }, 1680);
                    matrixTimersRef.current.push(t1, t2);
                }

                // Sync muzzle flash when MatrixShooter fires MIKA's cute blasters
                if (bridge?.lastMikaShotAt && bridge.lastMikaShotAt !== lastMuzzleFlashAtRef.current) {
                    lastMuzzleFlashAtRef.current = bridge.lastMikaShotAt;
                    setMuzzleFlash(true);
                } else if (lastMuzzleFlashAtRef.current > 0 && Date.now() - lastMuzzleFlashAtRef.current > 95) {
                    lastMuzzleFlashAtRef.current = 0;
                    setMuzzleFlash(false);
                }

                if (shipPhaseRef.current === 'piloting') {
                    flightTimeRef.current += dt;
                    const ft = flightTimeRef.current;
                    const W = window.innerWidth;
                    const H = window.innerHeight;
                    const minX = 68;
                    const maxX = Math.max(minX + 40, W - 68);
                    const minY = 128;
                    const maxY = Math.max(minY + 60, H - 155);

                    let desiredX;
                    let desiredY;

                    if (bridge?.isFrozen) {
                        // Dramatic center-stage hover while freezing the screen & hacking
                        desiredX = W * 0.5 + Math.sin(ft * 2.2) * Math.min(75, W * 0.16);
                        desiredY = H * 0.44 + Math.cos(ft * 3.1) * 14;
                    } else if (bridge?.gameStarted && bridge?.targetEnemy) {
                        // Natural dogfighting: weave beneath the active enemy/boss while strafing across the arena
                        const tgt = bridge.targetEnemy;
                        const strafeWave = Math.sin(ft * 2.6) * (tgt.isBoss ? 115 : 42);
                        desiredX = Math.max(minX, Math.min(maxX, tgt.x + strafeWave));
                        const idealY = Math.max(minY, Math.min(maxY, Math.max(tgt.y + (tgt.isBoss ? 210 : 155), H * 0.52) + Math.cos(ft * 2.1) * 38));
                        desiredY = idealY;
                    } else {
                        // Smooth figure-8 patrol across the screen
                        const cx = W * 0.5;
                        const cy = H * 0.54;
                        const rx = Math.min(180, (maxX - minX) * 0.44);
                        const ry = Math.min(115, (maxY - minY) * 0.36);
                        desiredX = cx + Math.sin(ft * 1.35) * rx;
                        desiredY = cy + Math.sin(ft * 2.7) * ry * 0.65;
                    }

                    const dx = desiredX - p.x;
                    const dy = desiredY - p.y;
                    let { vx, vy } = velRef.current;
                    const spring = bridge?.isFrozen ? 6.5 : 4.8;
                    const damping = 0.86;
                    vx = (vx + dx * spring * dt) * Math.pow(damping, dt * 60);
                    vy = (vy + dy * spring * dt) * Math.pow(damping, dt * 60);

                    const maxFlightSpeed = 340;
                    const spd = Math.hypot(vx, vy);
                    if (spd > maxFlightSpeed) {
                        vx = (vx / spd) * maxFlightSpeed;
                        vy = (vy / spd) * maxFlightSpeed;
                    }
                    velRef.current = { vx, vy };

                    const nextX = Math.max(minX, Math.min(maxX, p.x + vx * dt));
                    const nextY = Math.max(minY, Math.min(maxY, p.y + vy * dt));
                    posRef.current = { x: nextX, y: nextY };
                    setPos(posRef.current);

                    // Bank the RGB starfighter smoothly into turns
                    const bankDeg = Math.max(-18, Math.min(18, vx * 0.085));
                    setDragTilt(bankDeg);
                    setFlipX(1);

                    if (bridge) {
                        bridge.mikaPos = { x: nextX, y: nextY, piloting: true };
                    }
                } else if (bridge) {
                    bridge.mikaPos = { x: p.x, y: p.y, piloting: false };
                }

                rafId = requestAnimationFrame(step);
                return;
            }

            if (menuOpenRef.current && (m === 'move' || m === 'scratch' || m === 'awake')) {
                velRef.current = { vx: 0, vy: 0 };
                setModeSafe('stop');
                setFlipX(1);
            } else if (m === 'move' && targetRef.current) {
                const tgt = targetRef.current;
                const dx = tgt.x - p.x;
                const dy = tgt.y - p.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= PROXY_WALK_PROXIMITY) {
                    velRef.current = { vx: 0, vy: 0 };
                    posRef.current = { x: tgt.x, y: tgt.y };
                    setPos(posRef.current);

                    const W = window.innerWidth;
                    if (tgt.wallEdge || p.x <= EDGE_MARGIN + WALL_CHECK_DIST || p.x >= W - EDGE_MARGIN - WALL_CHECK_DIST) {
                        const wallFlip = p.x <= W / 2 ? -1 : 1;
                        octantRef.current = { dirKey: 'e', flipX: wallFlip };
                        setFlipX(wallFlip);
                        setModeSafe('scratch');
                        if (Math.random() < 0.35) say(mikaQuip('climb', {}, Date.now()), { tone: 'chaos', holo: false });
                    } else {
                        octantRef.current = { dirKey: 's', flipX: 1 };
                        setFlipX(1);
                        setModeSafe('stop');
                        nextRoamDelayRef.current = 2400 + Math.random() * 2400;
                    }
                    targetRef.current = null;
                } else {
                    const ux = dx / dist;
                    const uy = dy / dist;
                    const desiredSpeed = dist < PROXY_WALK_DECEL_DIST
                        ? Math.max(32, PROXY_WALK_MAX_VEL * (dist / PROXY_WALK_DECEL_DIST))
                        : PROXY_WALK_MAX_VEL;

                    let { vx, vy } = velRef.current;
                    vx += (ux * desiredSpeed - vx) * Math.min(1, (PROXY_WALK_ACCEL * dt) / Math.max(20, desiredSpeed));
                    vy += (uy * desiredSpeed - vy) * Math.min(1, (PROXY_WALK_ACCEL * dt) / Math.max(20, desiredSpeed));
                    const spd = Math.hypot(vx, vy);
                    if (spd > PROXY_WALK_MAX_VEL) {
                        vx = (vx / spd) * PROXY_WALK_MAX_VEL;
                        vy = (vy / spd) * PROXY_WALK_MAX_VEL;
                    }
                    velRef.current = { vx, vy };

                    const next = clampPos(p.x + vx * dt, p.y + vy * dt);
                    posRef.current = next;
                    setPos(next);

                    if (spd > 8) {
                        const oct = resolveOctant(vx, vy);
                        if (oct.dirKey !== octantRef.current.dirKey || oct.flipX !== octantRef.current.flipX) {
                            octantRef.current = oct;
                            setFlipX(oct.flipX);
                        }
                    }
                }
            } else if (m === 'awake') {
                if (stateTimerRef.current >= 240) {
                    if (roamEnabledRef.current !== false) {
                        if (!targetRef.current) pickNewTarget();
                        setModeSafe('move');
                    } else {
                        setModeSafe('stop');
                    }
                }
            } else if (m === 'scratch') {
                if (stateTimerRef.current >= 2100) {
                    setFlipX(1);
                    setModeSafe('stop');
                    nextRoamDelayRef.current = 1200 + Math.random() * 1400;
                }
            } else if (m === 'stop' && !menuOpenRef.current) {
                if (stateTimerRef.current >= nextRoamDelayRef.current) {
                    const actionRoll = Math.random();
                    const userTitle = settingsRef.current?.userTitle || 'Master';
                    const speakChance = settingsRef.current?.ambientCadence === 'quiet' ? 0.1 : settingsRef.current?.ambientCadence === 'chatty' ? 0.55 : 0.28;
                    if (roamEnabledRef.current !== false && actionRoll < 0.54) {
                        pickNewTarget();
                        setModeSafe('move');
                    } else if (actionRoll < 0.72) {
                        triggerChaosHolo('chaos', 2450);
                        if (Math.random() < speakChance + 0.12) {
                            say(mikaQuip('ambient', { name: userTitle }, Date.now()), { tone: 'chaos', holo: false });
                        }
                    } else {
                        setModeSafe('sit');
                        nextRoamDelayRef.current = 4200 + Math.random() * 2800;
                        if (Math.random() < speakChance) say(mikaQuip('ambient', { name: userTitle }, Date.now()), 'green');
                    }
                }
            } else if (m === 'sit' && !menuOpenRef.current) {
                if (stateTimerRef.current >= nextRoamDelayRef.current) {
                    if (roamEnabledRef.current !== false && Math.random() < 0.5) {
                        pickNewTarget();
                        setModeSafe('awake');
                    } else {
                        setModeSafe('yawn');
                    }
                }
            } else if (m === 'yawn') {
                if (stateTimerRef.current >= 1450) {
                    setModeSafe('sleep');
                    nextRoamDelayRef.current = 11000 + Math.random() * 7000;
                }
            } else if (m === 'sleep' && !menuOpenRef.current) {
                if (stateTimerRef.current >= nextRoamDelayRef.current) {
                    if (roamEnabledRef.current !== false) {
                        pickNewTarget();
                    }
                    setModeSafe('awake');
                }
            }

            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Sprite Frame Sequencer (Natural ~2.2s Blink Cadence & Smooth Breathing) ──
    useEffect(() => {
        const id = setInterval(() => {
            animTickRef.current += 1;
            const i = animTickRef.current;
            const m = modeRef.current;

            if (m === 'sigh') {
                const seq = ['sigh_0', 'sigh_0', 'sigh_1', 'sigh_1', 'sigh_2', 'sigh_2', 'sigh_2', 'sigh_3', 'sigh_3', 'sigh_2', 'sigh_1', 'sigh_1'];
                setFrame(seq[i % seq.length]);
            } else if (m === 'hack') {
                setFrame(i % 2 === 0 ? 'hack_0' : 'hack_1');
            } else if (m === 'hop') {
                setFrame('hop_0');
            } else if (m === 'pilot') {
                if (pilotHackingRef.current) {
                    setFrame(i % 2 === 0 ? 'pilot_hack_0' : 'pilot_hack_1');
                } else {
                    const seq = ['pilot_0', 'pilot_0', 'pilot_1', 'pilot_0', 'pilot_0', 'pilot_1'];
                    setFrame(seq[i % seq.length]);
                }
            } else if (m === 'move') {
                const dk = octantRef.current.dirKey || 's';
                setFrame(`${dk}_${i % 4}`);
            } else if (m === 'scratch') {
                setFrame(`scratch_${i % 2}`);
            } else if (m === 'sit') {
                const seq = [
                    'sit_0', 'sit_0', 'sit_0', 'sit_1', 'sit_1', 'sit_0', 'sit_0', 'sit_blink',
                    'sit_0', 'sit_0', 'sit_1', 'sit_1', 'sit_0', 'sit_0', 'sit_0', 'sit_0',
                ];
                setFrame(seq[i % seq.length]);
            } else if (m === 'yawn') {
                setFrame(i % 2 === 0 ? 'yawn_0' : 'yawn_1');
            } else if (m === 'sleep') {
                const seq = ['sleep_0', 'sleep_0', 'sleep_0', 'sleep_1', 'sleep_1', 'sleep_1', 'sleep_2', 'sleep_1'];
                setFrame(seq[i % seq.length]);
            } else if (m === 'awake') {
                setFrame('awake');
            } else if (m === 'drag') {
                setFrame(i % 2 === 0 ? 'drag_0' : 'drag_1');
            } else if (m === 'pet') {
                const seq = ['pet_0', 'pet_1', 'pet_2', 'pet_3'];
                setFrame(seq[i % seq.length]);
            } else if (m === 'bite') {
                setFrame('bite');
            } else {
                const seq = [
                    'idle_0', 'idle_0', 'idle_0', 'idle_1', 'idle_1', 'idle_0', 'idle_0', 'blink',
                    'idle_0', 'idle_0', 'idle_1', 'idle_1', 'idle_0', 'idle_0', 'idle_0', 'idle_0',
                ];
                setFrame(seq[i % seq.length]);
            }
        }, 135);
        return () => clearInterval(id);
    }, []);

    // ── Tsundere Pet & Bite Protocol ──
    const triggerBiteAndLock = () => {
        if (petStopTimerRef.current) clearTimeout(petStopTimerRef.current);
        if (petDecayTimerRef.current) clearTimeout(petDecayTimerRef.current);
        petRef.current = null;
        petCountRef.current = 0;
        petLockedRef.current = true;
        setPetLocked(true);
        menuOpenRef.current = false;
        setMenuOpen(false);
        setFlipX(1);
        setModeSafe('bite');
        try { matrixAudio.playBite?.(); } catch (e) {}
        say(mikaQuip('bite', { name: settingsRef.current?.userTitle || 'Master' }, Date.now()), 'bite');

        setTimeout(() => {
            if (modeRef.current === 'bite') setModeSafe('stop');
        }, 1300);

        setTimeout(() => {
            petLockedRef.current = false;
            setPetLocked(false);
        }, SATED_LOCK_MS);
    };

    const triggerPetAction = () => {
        if (petLockedRef.current) {
            say(mikaQuip('sated', {}, Date.now()), 'cyan');
            return;
        }
        petCountRef.current += 1;
        const count = petCountRef.current;

        if (petDecayTimerRef.current) clearTimeout(petDecayTimerRef.current);
        petDecayTimerRef.current = setTimeout(() => {
            petCountRef.current = 0;
        }, 25000);

        if (count >= MAX_PETS_BEFORE_BITE) {
            triggerBiteAndLock();
            return;
        }

        velRef.current = { vx: 0, vy: 0 };
        targetRef.current = null;
        setFlipX(1);
        setModeSafe('pet');
        try { matrixAudio.playPet?.(); } catch (e) {}
        say(mikaQuip('pet', { count, name: settingsRef.current?.userTitle || 'Master' }, Date.now() + count), 'pet');

        if (petStopTimerRef.current) clearTimeout(petStopTimerRef.current);
        petStopTimerRef.current = setTimeout(() => {
            if (modeRef.current === 'pet') {
                setModeSafe('stop');
                nextRoamDelayRef.current = 3200;
            }
        }, 2800);
    };

    // ── Pointer: Zero-Lag 1:1 Drag, Hold-to-Pet, Tap for Radial Menu ──
    const onPointerDown = (e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const cur = posRef.current;
        const px = Number.isFinite(e.screenX) ? e.screenX : e.clientX;
        const py = Number.isFinite(e.screenY) ? e.screenY : e.clientY;
        pointerRef.current = {
            startX: px,
            startY: py,
            lastX: px,
            lastY: py,
            grabOffsetX: cur.x - px,
            grabOffsetY: cur.y - py,
            t: performance.now(),
            moved: 0,
            dragging: false,
            petTimer: null,
        };

        pointerRef.current.petTimer = setTimeout(() => {
            const p = pointerRef.current;
            if (!p || p.dragging || p.moved > 5) return;
            if (petLockedRef.current) {
                say(mikaQuip('sated', {}, Date.now()), 'cyan');
                return;
            }
            menuOpenRef.current = false;
            setMenuOpen(false);
            petRef.current = { rubAcc: 0 };
            triggerPetAction();
        }, PET_HOLD_MS);
    };

    const onPointerMove = (e) => {
        const p = pointerRef.current;
        if (!p) return;
        const px = Number.isFinite(e.screenX) ? e.screenX : e.clientX;
        const py = Number.isFinite(e.screenY) ? e.screenY : e.clientY;
        const dxFromStart = px - p.startX;
        const dyFromStart = py - p.startY;
        const stepDx = px - p.lastX;
        const stepDy = py - p.lastY;
        p.lastX = px;
        p.lastY = py;

        if (modeRef.current === 'pet' && petRef.current) {
            const rubDelta = Math.abs(stepDx) + Math.abs(stepDy);
            petRef.current.rubAcc += rubDelta;
            p.moved += rubDelta;
            if (petRef.current.rubAcc >= PET_RUB_PX) {
                petRef.current.rubAcc = 0;
                triggerPetAction();
            }
            return;
        }

        const distFromStart = Math.hypot(dxFromStart, dyFromStart);
        p.moved = Math.max(p.moved, distFromStart);

        // Immediate 1:1 drag activation with zero delay
        if (!p.dragging && distFromStart > 4) {
            if (p.petTimer) { clearTimeout(p.petTimer); p.petTimer = null; }
            p.dragging = true;
            menuOpenRef.current = false;
            setMenuOpen(false);
            targetRef.current = null;
            velRef.current = { vx: 0, vy: 0 };
            setModeSafe('drag');
            say(mikaQuip('dragged', {}, Date.now()), 'warn');
        }

        if (p.dragging) {
            const next = clampPos(px + p.grabOffsetX, py + p.grabOffsetY);
            posRef.current = next;
            setPos(next);

            const tilt = Math.max(-18, Math.min(18, -stepDx * 1.3));
            setDragTilt(tilt);
            if (Math.abs(stepDx) > 1.5) setFlipX(stepDx >= 0 ? 1 : -1);
        }
    };

    const onPointerUp = () => {
        const p = pointerRef.current;
        pointerRef.current = null;
        if (p?.petTimer) clearTimeout(p.petTimer);
        setDragTilt(0);

        if (petRef.current) {
            petRef.current = null;
            return;
        }

        if (p && p.dragging) {
            setFlipX(1);
            setModeSafe('stop');
            nextRoamDelayRef.current = 2400 + Math.random() * 1800;
            setDropping(true);
            setTimeout(() => setDropping(false), 380);
            say(mikaQuip('drop', {}, Date.now()), 'green');
            return;
        }

        if (p && p.moved <= 5) {
            const nextOpen = !menuOpenRef.current;
            menuOpenRef.current = nextOpen;
            setMenuOpen(nextOpen);
            if (nextOpen && (modeRef.current === 'move' || modeRef.current === 'scratch' || modeRef.current === 'sleep')) {
                velRef.current = { vx: 0, vy: 0 };
                setFlipX(1);
                setModeSafe('stop');
            }
        }
    };

    // ── Sync live bounds with Desktop Electron (Windows/Linux) and Android OverlayService ──
    useEffect(() => {
        const modalOpen = Boolean(menuOpen || askOpen || externalModalOpen || matrixGameActive || mode === 'drag');
        try {
            window.mikaDesktop?.updateMikaBounds?.({
                x: Math.round(pos.x),
                y: Math.round(pos.y),
                radius: menuOpen ? 165 : (bubble ? 150 : 95),
                modalOpen,
            });
        } catch (e) {}
        try {
            window.mikaAndroid?.syncOverlay?.(
                Math.round(pos.x),
                Math.round(pos.y),
                Boolean(menuOpen || askOpen || externalModalOpen || matrixGameActive || mode === 'drag' || bubble || holoWindow || shipPhase),
                Boolean(askOpen || externalModalOpen)
            );
        } catch (e) {}
    }, [pos.x, pos.y, menuOpen, askOpen, externalModalOpen, matrixGameActive, mode, bubble, holoWindow, shipPhase]);

    // ── Radial Menu Orbital Geometry (Viewport-Safe Arc) ──
    const { W, H } = getScreenSize();

    let baseAngleDeg = -90;
    const nearLeft = pos.x < 125;
    const nearRight = pos.x > W - 125;
    const nearTop = pos.y < 135;
    const nearBottom = pos.y > H - 135;

    if (nearTop && nearLeft) baseAngleDeg = 45;
    else if (nearTop && nearRight) baseAngleDeg = 135;
    else if (nearBottom && nearLeft) baseAngleDeg = -45;
    else if (nearBottom && nearRight) baseAngleDeg = -135;
    else if (nearTop) baseAngleDeg = 90;
    else if (nearLeft) baseAngleDeg = 0;
    else if (nearRight) baseAngleDeg = 180;

    const RADIAL_RADIUS = 88;
    const ARC_SPREAD = 168;
    const radialItems = [
        {
            id: 'ask',
            label: 'ASK',
            color: '#39FF14',
            closeOnClick: true,
            onClick: () => { openAsk(); },
        },
        {
            id: 'poke',
            label: 'POKE',
            color: '#FF9100',
            closeOnClick: false,
            onClick: () => { onPoke?.(); },
        },
        {
            id: 'pet',
            label: petLocked ? 'LOCKED' : 'PET',
            color: petLocked ? '#FF3355' : '#FF107A',
            locked: petLocked,
            closeOnClick: false,
            onClick: () => { triggerPetAction(); },
        },
        {
            id: 'logs',
            label: 'LOGS',
            color: '#00E5FF',
            closeOnClick: true,
            onClick: () => { onOpenLogs?.(); },
        },
        {
            id: 'msgs',
            label: 'MSGS',
            color: '#FFD54F',
            closeOnClick: true,
            onClick: () => { onOpenMsgs?.(); },
        },
        {
            id: 'dossier',
            label: 'DOSSIER',
            color: '#B533FF',
            closeOnClick: true,
            onClick: () => { onOpenDossier?.(); },
        },
        {
            id: 'settings',
            label: 'SETTINGS',
            color: '#00E5FF',
            closeOnClick: true,
            onClick: () => { onOpenSettings?.(); },
        },
    ].map((item, idx, arr) => {
        const stepAngle = arr.length > 1 ? ARC_SPREAD / (arr.length - 1) : 0;
        const deg = baseAngleDeg - ARC_SPREAD / 2 + idx * stepAngle;
        const rad = (deg * Math.PI) / 180;
        return {
            ...item,
            deg,
            ox: Math.cos(rad) * RADIAL_RADIUS,
            oy: Math.sin(rad) * RADIAL_RADIUS,
        };
    });

    // ── Collision-Free Terminal Speech Bubble Positioning (Never Covers MIKA, Ship, or Hacker Terminal!) ──
    const holoOnRight = pos.x <= W * 0.56;
    const cxDir = pos.x < W / 2 ? 1 : -1;
    let bubBx = pos.x + cxDir * 28 - (cxDir < 0 ? 228 : 0);

    // Compute the vertical Safe Exclusion Zone in local coordinates (0 = top of MIKA box, CHIBI_H = bottom of MIKA box)
    let safeTopLocalY = 0;
    let safeBottomLocalY = CHIBI_H;

    if (mode === 'sigh') safeTopLocalY = Math.min(safeTopLocalY, -16);
    if (shipPhase) {
        safeTopLocalY = Math.min(safeTopLocalY, -16); // clears wingtip cannons & star muzzle flashes
        safeBottomLocalY = Math.max(safeBottomLocalY, CHIBI_H + 18); // clears twin plasma thruster plumes
    }
    if (mode === 'hop' || shipPhase === 'hop_in') {
        safeTopLocalY = Math.min(safeTopLocalY, -40); // clears MIKA's cockpit hop arc
    }
    if (holoWindow) {
        safeTopLocalY = Math.min(safeTopLocalY, -14); // clears top of HoloHackerWindow (top: -10)
        safeBottomLocalY = Math.max(safeBottomLocalY, CHIBI_H + 12); // clears bottom of HoloHackerWindow (~84px)
        // Bias bubble horizontally away from the side where HoloHackerWindow projects
        bubBx = holoOnRight ? (pos.x - 148) : (pos.x - 86);
    }
    if (menuOpen) {
        const pillY = nearBottom ? -38 : 34;
        const radialMinY = Math.min(pillY - 14, -36, ...radialItems.map(it => it.oy - 32));
        const radialMaxY = Math.max(pillY + 14, 36, ...radialItems.map(it => it.oy + 32));
        safeTopLocalY = Math.min(safeTopLocalY, CHIBI_H / 2 + radialMinY);
        safeBottomLocalY = Math.max(safeBottomLocalY, CHIBI_H / 2 + radialMaxY);
    }

    const boxTopScreenY = pos.y - CHIBI_H / 2;
    const excludeTopScreenY = boxTopScreenY + safeTopLocalY;
    const excludeBottomScreenY = boxTopScreenY + safeBottomLocalY;

    // Place bubble ABOVE the exclusion zone when there is >= 140px above MIKA (or more room above than below).
    // When placed ABOVE, we anchor `bottom` (not `top`) so multi-line typewriter text grows UPWARD away from MIKA!
    // When placed BELOW, we anchor `top` below the exclusion zone so multi-line text grows DOWNWARD away from MIKA!
    const roomAbove = excludeTopScreenY - 8;
    const roomBelow = H - excludeBottomScreenY - 8;
    const placeBubbleAbove = roomAbove >= 140 || roomAbove >= roomBelow;

    bubBx = Math.max(8, Math.min(bubBx, W - 244));

    const moodInfo = MOOD_GLOW[mode] || MOOD_GLOW.stop;
    const vecRgbPal = resolveVectorRgbMood(mode, bubble?.tone, petLocked);
    const compiledRects = COMPILED_FRAMES[frame] || COMPILED_FRAMES.idle_0;
    const activeBubbleTone = bubble ? (TONE_PALETTE[bubble.tone] || TONE_PALETTE.green) : TONE_PALETTE.green;

    const isAndroidFullScreen = Boolean(menuOpen || askOpen || externalModalOpen || matrixGameActive || mode === 'drag' || bubble || holoWindow || shipPhase);
    const hasAndroidOverlay = typeof window !== 'undefined' && Boolean(window.mikaAndroid?.syncOverlay);
    const renderCenterX = hasAndroidOverlay && !isAndroidFullScreen ? (window.innerWidth || 160) / 2 : pos.x;
    const renderCenterY = hasAndroidOverlay && !isAndroidFullScreen ? (window.innerHeight || 160) / 2 : pos.y;

    return (
        <>
            {menuOpen && (
                <div
                    onPointerDown={() => { menuOpenRef.current = false; setMenuOpen(false); }}
                    style={{ position: 'fixed', inset: 0, zIndex: 9399, background: 'transparent' }}
                />
            )}
            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: CHIBI_W,
                    height: CHIBI_H,
                    transform: `translate3d(${Math.round(renderCenterX - CHIBI_W / 2)}px, ${Math.round(renderCenterY - CHIBI_H / 2)}px, 0)`,
                    transition: 'none',
                    willChange: 'transform',
                    zIndex: matrixGameActive ? 10065 : 9400,
                    pointerEvents: 'none',
                }}
            >
                {/* ── See-Through Glassmorphic Terminal Speech Bubble ── */}
                {bubble && (
                    <div
                        className="mika-proxy-bubble"
                        style={{
                            position: 'absolute',
                            left: Math.round(bubBx - (pos.x - CHIBI_W / 2)),
                            ...(placeBubbleAbove
                                ? { bottom: Math.round(CHIBI_H - safeTopLocalY + 12), top: 'auto' }
                                : { top: Math.round(safeBottomLocalY + 12), bottom: 'auto' }),
                            transition: shipPhase ? 'none' : 'left 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
                            pointerEvents: 'none',
                            background: 'linear-gradient(180deg, rgba(6, 12, 18, 0.34) 0%, rgba(4, 8, 14, 0.44) 100%)',
                            backdropFilter: 'blur(6px) saturate(1.25)',
                            WebkitBackdropFilter: 'blur(6px) saturate(1.25)',
                            border: `1px solid ${activeBubbleTone.border}77`,
                            borderLeft: `2.5px solid ${activeBubbleTone.border}`,
                            borderRadius: '4px',
                            padding: '6px 10px 7px 10px',
                            color: activeBubbleTone.base,
                            fontSize: '10.5px',
                            lineHeight: 1.48,
                            maxWidth: '234px',
                            minWidth: '132px',
                            width: 'max-content',
                            boxShadow: `0 6px 20px rgba(0, 0, 0, 0.45), 0 0 14px ${activeBubbleTone.border}28, inset 0 0 12px ${activeBubbleTone.border}12`,
                            textShadow: `0 1px 2px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0, 0, 0, 0.85), 0 0 8px ${activeBubbleTone.base}44`,
                            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                            letterSpacing: '0.015em',
                            zIndex: 6,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '6px',
                                fontSize: '8px',
                                fontWeight: 800,
                                color: activeBubbleTone.border,
                                opacity: 0.92,
                                letterSpacing: '0.1em',
                                marginBottom: '3px',
                                borderBottom: `1px solid ${activeBubbleTone.border}38`,
                                paddingBottom: '2px',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.95)',
                            }}
                        >
                            <span>▸ MIKA_PROXY // TTY</span>
                            <span style={{ color: '#39FF14' }}>●</span>
                        </div>
                        <div>
                            {renderTerminalSegments(bubble.fullText.slice(0, bubble.shownLen), bubble.tone)}
                            <span className="mika-sanct-cursor" style={{ marginLeft: '2px', color: activeBubbleTone.border }}>█</span>
                            {bubble.shownLen < bubble.fullText.length && (
                                <span aria-hidden="true" style={{ visibility: 'hidden' }}>
                                    {bubble.fullText.slice(bubble.shownLen)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Dramatic Sigh Exasperated Steam Puff SVG Overlay ── */}
                {mode === 'sigh' && (
                    <svg
                        width="72"
                        height="48"
                        viewBox="0 0 72 48"
                        style={{
                            position: 'absolute',
                            left: -2,
                            top: -16,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 6,
                        }}
                    >
                        {/* Exasperated anime sweatdrop + dramatic sigh steam puffs */}
                        <path
                            className="mika-sigh-puff-1"
                            d="M52 24 C56 20 62 20 64 24 C67 24 68 28 65 30 C62 32 55 31 52 28 Z"
                            fill="rgba(0, 229, 255, 0.25)"
                            stroke="#00E5FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 6px #00E5FF)' }}
                        />
                        <path
                            className="mika-sigh-puff-2"
                            d="M56 15 C59 12 64 12 66 15 C68 16 68 19 65 20 C62 21 57 20 56 17 Z"
                            fill="rgba(255, 42, 133, 0.22)"
                            stroke="#FF2A85"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 5px #FF2A85)' }}
                        />
                        {/* Exasperation marks near temple */}
                        <path
                            d="M12 10 L16 14 M10 15 L15 17"
                            stroke="#FF9100"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 4px #FF9100)' }}
                        />
                    </svg>
                )}

                {/* ── Small Holographic Hacker Window Next to MIKA ── */}
                {holoWindow && (
                    <HoloHackerWindow
                        holoWindow={holoWindow}
                        onRightSide={pos.x <= W * 0.56}
                    />
                )}

                {/* ── Sleeping Custom SVG Floating Terminal Zzz ── */}
                {mode === 'sleep' && (
                    <svg
                        className="mika-proxy-zzz"
                        width="38"
                        height="28"
                        viewBox="0 0 38 28"
                        style={{
                            position: 'absolute',
                            left: CHIBI_W * 0.56,
                            top: -12,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            filter: 'drop-shadow(0 0 6px #00E5FF)',
                        }}
                    >
                        <path d="M4 18 H12 L4 25 H12" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 10 H23 L16 16 H23" fill="none" stroke="#39FF14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M27 3 H32 L27 8 H32" fill="none" stroke="#FF107A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}

                {/* ── ✨ ASK THINKING: Floating Question Marks (she sits; the host thinks) ── */}
                {askBusy && (
                    <div style={{ position: 'absolute', left: CHIBI_W * 0.5, top: -16, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 7, display: 'flex', gap: '4px', alignItems: 'flex-end', fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>
                        <span className="mika-q-mark" style={{ color: '#00E5FF', fontSize: '15px', fontWeight: 900, textShadow: '0 0 8px #00E5FF' }}>?</span>
                        <span className="mika-q-mark" style={{ color: '#39FF14', fontSize: '12px', fontWeight: 900, textShadow: '0 0 8px #39FF14' }}>?</span>
                        <span className="mika-q-mark" style={{ color: '#FF107A', fontSize: '10px', fontWeight: 900, textShadow: '0 0 8px #FF107A' }}>?</span>
                    </div>
                )}

                {/* ── Super Cute Petting Holo-Pat & Floating Hearts SVG Overlay ── */}
                {mode === 'pet' && (
                    <svg
                        className="mika-proxy-pet-fx"
                        width="76"
                        height="44"
                        viewBox="0 0 76 44"
                        style={{
                            position: 'absolute',
                            left: -5,
                            top: -22,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 5,
                        }}
                    >
                        {/* Glowing holo-pat arc patting her head */}
                        <path
                            className="mika-pet-hand-arc"
                            d="M20 22 Q38 10 56 22"
                            fill="none"
                            stroke="#FF107A"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeDasharray="4 3"
                            style={{ filter: 'drop-shadow(0 0 6px #FF107A)' }}
                        />
                        {/* Floating Neon Hearts & Terminal Sparkles */}
                        <path
                            className="mika-pet-heart-1"
                            d="M14 18 c-2.5-2.5-5 0-5 2.5 0 2.5 5 5.5 5 5.5s5-3 5-5.5c0-2.5-2.5-5-5-2.5z"
                            fill="#FF2A85"
                            style={{ filter: 'drop-shadow(0 0 5px #FF2A85)' }}
                        />
                        <path
                            className="mika-pet-heart-2"
                            d="M61 14 c-2-2-4 0-4 2 0 2 4 4.5 4 4.5s4-2.5 4-4.5c0-2-2-4-4-2z"
                            fill="#39FF14"
                            style={{ filter: 'drop-shadow(0 0 5px #39FF14)' }}
                        />
                        <path
                            className="mika-pet-sparkle"
                            d="M38 4 L40 9 L45 11 L40 13 L38 18 L36 13 L31 11 L36 9 Z"
                            fill="#00E5FF"
                            style={{ filter: 'drop-shadow(0 0 6px #00E5FF)' }}
                        />
                    </svg>
                )}

                {/* ── Bite Crimson Impact Sparks SVG Overlay ── */}
                {mode === 'bite' && (
                    <svg
                        width="80"
                        height="80"
                        viewBox="-40 -40 80 80"
                        style={{
                            position: 'absolute',
                            left: CHIBI_W / 2 - 40,
                            top: CHIBI_H / 2 - 40,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 5,
                            filter: 'drop-shadow(0 0 8px #FF1744)',
                        }}
                    >
                        <path d="M-28 -18 L-12 -6 M28 -18 L12 -6 M-24 16 L-10 6 M24 16 L10 6" stroke="#FF1744" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                )}

                {/* ── Slick Orbital Radial HUD Menu ── */}
                {menuOpen && !matrixGameActive && (
                    <div
                        className="mika-radial-hud"
                        style={{
                            position: 'absolute',
                            left: CHIBI_W / 2,
                            top: CHIBI_H / 2,
                            width: 0,
                            height: 0,
                            pointerEvents: 'none',
                            zIndex: 5,
                        }}
                    >
                        <svg
                            width="200"
                            height="200"
                            viewBox="-100 -100 200 200"
                            style={{ position: 'absolute', left: -100, top: -100, overflow: 'visible', pointerEvents: 'none' }}
                        >
                            <circle
                                cx="0"
                                cy="0"
                                r="34"
                                fill="rgba(8, 5, 16, 0.42)"
                                stroke={moodInfo.ring}
                                strokeWidth="1.2"
                                strokeDasharray="5 3"
                                opacity="0.75"
                            />
                            <circle
                                cx="0"
                                cy="0"
                                r={RADIAL_RADIUS}
                                fill="none"
                                stroke={moodInfo.glow}
                                strokeWidth="1"
                                strokeDasharray="2 6"
                                opacity="0.45"
                            />
                            {radialItems.map((item) => (
                                <line
                                    key={`spoke-${item.id}`}
                                    x1={item.ox * 0.48}
                                    y1={item.oy * 0.48}
                                    x2={item.ox * 0.82}
                                    y2={item.oy * 0.82}
                                    stroke={item.color}
                                    strokeWidth="1.2"
                                    strokeOpacity="0.55"
                                />
                            ))}
                        </svg>

                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: nearBottom ? -38 : 34,
                                transform: 'translate(-50%, -50%)',
                                background: 'rgba(8, 5, 16, 0.92)',
                                border: `1px solid ${moodInfo.ring}66`,
                                borderRadius: '4px',
                                padding: '1.5px 7px',
                                fontSize: '8px',
                                fontWeight: 800,
                                letterSpacing: '0.12em',
                                color: '#39FF14',
                                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                boxShadow: `0 0 10px ${moodInfo.ring}44`,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {moodInfo.label}
                        </div>

                        {radialItems.map((item, idx) => (
                            <button
                                key={item.id}
                                data-node-id={item.id}
                                data-mika-interactive="true"
                                className="mika-radial-node"
                                onPointerDown={(ev) => ev.stopPropagation()}
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    if (item.closeOnClick) {
                                        menuOpenRef.current = false;
                                        setMenuOpen(false);
                                    }
                                    item.onClick();
                                }}
                                style={{
                                    position: 'absolute',
                                    left: item.ox,
                                    top: item.oy,
                                    transform: 'translate(-50%, -50%)',
                                    animationDelay: `${idx * 35}ms`,
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(8, 12, 18, 0.86)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: `1.5px solid ${item.color}`,
                                    color: item.color,
                                    opacity: item.locked ? 0.65 : 1,
                                    boxShadow: `0 0 14px ${item.color}55, inset 0 0 10px ${item.color}25`,
                                    cursor: item.locked ? 'not-allowed' : 'pointer',
                                    padding: 0,
                                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                    transition: 'transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1.3), box-shadow 0.16s ease, background 0.16s ease',
                                }}
                                onMouseEnter={(ev) => {
                                    ev.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.14)';
                                    ev.currentTarget.style.boxShadow = `0 0 22px ${item.color}aa, inset 0 0 14px ${item.color}44`;
                                    ev.currentTarget.style.background = 'rgba(14, 22, 30, 0.95)';
                                }}
                                onMouseLeave={(ev) => {
                                    ev.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                                    ev.currentTarget.style.boxShadow = `0 0 14px ${item.color}55, inset 0 0 10px ${item.color}25`;
                                    ev.currentTarget.style.background = 'rgba(8, 12, 18, 0.86)';
                                }}
                            >
                                <div style={{ marginBottom: '2px' }}>
                                    <RadialSvgIcon id={item.id} color={item.color} locked={item.locked} />
                                </div>
                                <span style={{ fontSize: '7.5px', fontWeight: 900, letterSpacing: '0.06em', color: '#EBE3D6', textShadow: `0 0 6px ${item.color}` }}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── The Glowing Terminal Chibi Catgirl Sprite (+ Retro RGB Starfighter!) ── */}
                <div
                    data-mika-interactive="true"
                    className={`mika-proxy-root ${mode === 'move' ? 'mika-proxy-walk' : ''} ${mode === 'pet' ? 'mika-proxy-pet-bounce' : ''} ${mode === 'bite' ? 'mika-proxy-bite-lunge' : ''} ${mode === 'sigh' ? 'mika-proxy-sigh' : ''} ${mode === 'hop' ? 'mika-proxy-hop' : ''} ${dropping ? 'mika-proxy-land' : ''}`}
                    style={{
                        pointerEvents: matrixGameActive ? 'none' : 'auto',
                        cursor: mode === 'drag' ? 'grabbing' : 'pointer',
                        color: moodInfo.glow,
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        width: CHIBI_W,
                        height: CHIBI_H,
                        position: 'relative',
                        transform: `rotate(${dragTilt}deg) scaleX(${flipX * scale}) scaleY(${scale})`,
                        transformOrigin: mode === 'drag' ? '50% 25%' : (shipPhase === 'piloting' ? '50% 55%' : '50% 78%'),
                        transition: (mode === 'drag' || shipPhase === 'piloting') ? 'none' : 'transform 0.12s ease-out',
                        filter: avatarStyle === 'retro_pixel'
                            ? `drop-shadow(0 0 3px ${moodInfo.glow}cc) drop-shadow(0 0 10px ${moodInfo.ring}66)`
                            : `drop-shadow(0 0 3px ${vecRgbPal.lineTop}cc) drop-shadow(0 0 9px ${vecRgbPal.eye}66)`,
                    }}
                    onPointerDown={matrixGameActive ? undefined : onPointerDown}
                    onPointerMove={matrixGameActive ? undefined : onPointerMove}
                    onPointerUp={matrixGameActive ? undefined : onPointerUp}
                    onPointerCancel={matrixGameActive ? undefined : onPointerUp}
                >
                    {/* Retro RGB Spaceship Under-Layer (Wings, Twin Blasters, Thrusters, Cockpit Backrest) */}
                    {Boolean(shipPhase) && (
                        <div
                            className={shipPhase === 'fly_in' ? 'mika-ship-fly-in' : ''}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        >
                            <RetroRgbSpaceshipUnderSvg muzzleFlash={muzzleFlash} />
                        </div>
                    )}

                    <div style={{ position: 'relative', zIndex: 2, width: CHIBI_W, height: CHIBI_H }}>
                        {avatarStyle === 'retro_pixel' ? (
                            <svg
                                viewBox={`0 0 ${GRID_W} ${GRID_H}`}
                                width={CHIBI_W}
                                height={CHIBI_H}
                                shapeRendering="crispEdges"
                                style={{ display: 'block', overflow: 'visible' }}
                            >
                                <defs>
                                    <pattern id="mikaTermScanlines" width="24" height="2" patternUnits="userSpaceOnUse">
                                        <rect x="0" y="0" width="24" height="1" fill="#00E5FF" fillOpacity="0.09" />
                                        <rect x="0" y="1" width="24" height="1" fill="#000000" fillOpacity="0.18" />
                                    </pattern>
                                </defs>
                                <g className="mika-proxy-body">
                                    {compiledRects.map((r, i) => {
                                        let fill = BASE_PALETTE[r.ch];
                                        if (petLocked && (r.ch === 'P' || r.ch === 'p')) fill = '#00B8D4';
                                        else if (mode === 'bite' && r.ch === 'W') fill = '#FF1744';
                                        return (
                                            <rect
                                                key={i}
                                                x={r.x}
                                                y={r.y}
                                                width={r.w + 0.04}
                                                height={1.04}
                                                fill={fill}
                                            />
                                        );
                                    })}
                                    {compiledRects.map((r, i) => (
                                        r.ch !== 'O' && r.ch !== 'W' ? (
                                            <rect
                                                key={`s${i}`}
                                                x={r.x}
                                                y={r.y}
                                                width={r.w}
                                                height={1}
                                                fill="url(#mikaTermScanlines)"
                                            />
                                        ) : null
                                    ))}
                                </g>
                            </svg>
                        ) : (
                            <VectorPixelChibiSvg
                                frame={frame}
                                mode={mode}
                                bubbleTone={bubble?.tone}
                                petLocked={petLocked}
                            />
                        )}
                    </div>

                    {/* Retro RGB Spaceship Over-Layer (Translucent Canopy Rim, Nose Cone & RGB Trim) */}
                    {Boolean(shipPhase) && (
                        <div
                            className={shipPhase === 'fly_in' ? 'mika-ship-fly-in' : ''}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 3,
                            }}
                        >
                            <RetroRgbSpaceshipOverSvg />
                        </div>
                    )}
                </div>
            </div>
            {/* ── ✨ THE ASK TERMINAL (center-screen relay or continuous terminal chat) ── */}
            {askOpen && (
                <div
                    data-mika-interactive="true"
                    onPointerDown={() => { closeAsk(); }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: matrixGameActive ? 10070 : 9600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(5, 3, 8, 0.45)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.25s ease-out',
                    }}
                >
                    <div
                        data-mika-interactive="true"
                        className={`mika-sanct-panel ${askOut ? 'out' : ''}`}
                        onPointerDown={(ev) => ev.stopPropagation()}
                        style={{
                            position: 'relative',
                            width: askChatMode ? 'min(360px, 94vw)' : 'min(290px, 92vw)',
                            pointerEvents: 'auto',
                            background: 'rgba(11, 9, 20, 0.78)',
                            backdropFilter: 'blur(16px) saturate(1.25)',
                            WebkitBackdropFilter: 'blur(16px) saturate(1.25)',
                            border: '1px solid rgba(57, 255, 20, 0.45)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 24px rgba(57,255,20,0.18), inset 0 0 20px rgba(57,255,20,0.05)',
                            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', paddingBottom: '5px', borderBottom: '1px solid rgba(57,255,20,0.35)' }}>
                            <span style={{ color: '#39FF14', fontWeight: 800, fontSize: '11px', letterSpacing: '0.1em', textShadow: '0 0 8px rgba(57,255,20,0.5)' }}>⚡ {askTitle}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={(ev) => { ev.stopPropagation(); setAskChatMode((v) => !v); }}
                                    style={{
                                        background: askChatMode ? 'rgba(0, 229, 255, 0.16)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${askChatMode ? '#00E5FF' : 'rgba(255,255,255,0.2)'}`,
                                        color: askChatMode ? '#00E5FF' : 'rgba(255,255,255,0.65)',
                                        borderRadius: '4px',
                                        fontSize: '8.5px',
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                    }}
                                    title="Switch between one-shot Relay Bubble and Continuous Terminal Chat"
                                >
                                    {askChatMode ? 'MODE: CHAT' : 'MODE: RELAY'}
                                </button>
                                <button
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={(ev) => { ev.stopPropagation(); closeAsk(); }}
                                    style={{ background: 'none', border: 'none', color: 'rgba(57,255,20,0.7)', cursor: 'pointer', fontSize: '12px', fontWeight: 900, padding: '0 2px', flexShrink: 0 }}
                                >✕</button>
                            </div>
                        </div>
                        <div style={{ fontSize: '10px', lineHeight: 1.5, color: 'rgba(216,245,208,0.55)', marginBottom: '8px' }}>
                            {askChatMode
                                ? '( continuous terminal uplink active. MIKA replies both here and in her TTY bubble. )'
                                : '( relay a message. I am busy doing my own thing, but fine. )'}
                        </div>
                        {askChatMode && (
                            <div className="buddy-messages" style={{ marginBottom: '8px', maxHeight: '210px', padding: '6px', background: 'rgba(4, 8, 12, 0.65)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '6px' }}>
                                {chatHistory.length === 0 ? (
                                    <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.38)', textAlign: 'center', padding: '14px 6px' }}>
                                        [ NO_TRANSMISSIONS_YET // SEND_A_PACKET_BELOW ]
                                    </div>
                                ) : (
                                    chatHistory.map((m, idx) => (
                                        <div key={idx} className={`buddy-message ${m.role === 'user' ? 'user' : 'assistant'}`}>
                                            <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.65, marginBottom: '2px', letterSpacing: '0.08em', color: m.role === 'user' ? '#FF107A' : '#00E5FF' }}>
                                                {m.role === 'user' ? '▸ USER // TX' : '▸ MIKA_PROXY // RX'}
                                            </div>
                                            <div>{m.content}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                                ref={askInputRef}
                                value={askInput}
                                onChange={(e) => setAskInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); submitAsk(); } }}
                                maxLength={300}
                                placeholder={askBusy ? 'she is still thinking...' : 'relay_message...'}
                                disabled={askBusy}
                                style={{ flex: 1, minWidth: 0, background: 'rgba(4, 8, 4, 0.7)', border: '1px solid rgba(57,255,20,0.35)', borderRadius: '4px', color: '#D8F5D0', fontSize: '10.5px', padding: '6px 8px', outline: 'none', fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}
                            />
                            <button
                                onPointerDown={(ev) => ev.stopPropagation()}
                                onClick={(ev) => { ev.stopPropagation(); submitAsk(); }}
                                disabled={askBusy}
                                style={{
                                    padding: '6px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', flexShrink: 0,
                                    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                                    background: askBusy ? 'transparent' : 'rgba(57,255,20,0.2)',
                                    border: `1px solid ${askBusy ? 'rgba(255,255,255,0.2)' : '#39FF14'}`,
                                    color: askBusy ? 'rgba(255,255,255,0.4)' : '#39FF14',
                                    cursor: askBusy ? 'not-allowed' : 'pointer',
                                    boxShadow: askBusy ? 'none' : '0 0 10px rgba(57,255,20,0.25)',
                                }}
                            >SEND</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MikaProxy;