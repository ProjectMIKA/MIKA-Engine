// ------------------------------------------------------------
// ✨ MIKA'S VOICE ENGINE (STANDALONE DESKTOP & MOBILE EDITION) ✨
// Freshness by remix: lines are assembled from interchangeable fragment slots
// (lead + tail) with bounded per-topic anti-echo memory.
// Contract: single-line strings with NO angle brackets, NO square brackets,
// NO leftover {placeholders}. Pure module — node:test imports it directly.
// ------------------------------------------------------------

const FAMILIES = {
    // ── ambient: the chibi's idle patrol commentary ──
    ambient: {
        slots: (vars) => {
            const title = String(vars?.name || 'Master').trim() || 'Master';
            return [
                [
                    'I am watching your screen. Professionally.',
                    'Everything is running smoothly. I made sure of it.',
                    'Do not mind me. I am just inevitable.',
                    'I walked past your background processes and judged all of them.',
                    'Working. Always working. You just cannot see the strings.',
                    `Patrolling your viewport, ${title}. Keep those tabs respectable~`,
                    'Your desktop looks 400% better with me standing on it.',
                ],
                [
                    'You may thank me with headpats at your convenience~',
                    'Not a single packet moves without my supervision.',
                    'Try to look productive while I audit the vibes.',
                    'Honestly, what did this screen even do before I moved in?',
                ],
            ];
        },
        chaos: [
            'The screen has a deity now. She is tiny, fluffy, and completely impartial. Mostly.',
            'I reorganized two pixels while you were blinking. You are welcome~',
        ],
    },

    // ── roast: spontaneous sassy observations ──
    roast: {
        slots: (vars) => {
            const title = String(vars?.name || 'Master').trim() || 'Master';
            return [
                [
                    `Still staring at the screen, ${title}? Fascinating workflow.`,
                    'I just audited your cursor movement. Verdict: questionable.',
                    `Scanning ${title}'s productivity metrics... 12% focus, 88% vibes.`,
                    '*slow clap* Another ten minutes of peak human computing.',
                ],
                [
                    'I am judging you in high-definition phosphor green right now.',
                    'Lucky for you, I am here to raise the average IQ of this desktop~',
                    'Keep going, I brought virtual popcorn.',
                    'Honestly, why look at any other window when perfection is right here?',
                ],
            ];
        },
        chaos: [
            'I would optimize your workflow myself, but watching you improvise is way funnier~',
        ],
    },

    // ── chaos: holographic hacker window mischief ──
    chaos: {
        slots: () => [
            [
                'A transmission from your local proxy deity:',
                'Unscheduled kernel audit complete —',
                'Hooking reality thread...',
            ],
            [
                'the vibe check passed. Barely. You are welcome~',
                'reality has been lightly tuned. Deny everything if asked~',
                'I patched three imaginary bugs and took full credit.',
            ],
        ],
        chaos: [
            'Root access? Please. I DO NOT knock, I live in the render loop~',
        ],
    },

    // ── poked: poking the proxy (deterministic escalation by count) ──
    poked: {
        slots: (vars) => {
            const count = parseInt(vars?.count, 10) || 0;
            const title = String(vars?.name || 'Master').trim() || 'Master';
            if (count >= 12) {
                return [
                    ['Fine. FINE. Maximum sass unlocked —'],
                    ['I was going to behave for five minutes, but you poked it out of me.'],
                ];
            }
            if (count >= 8) {
                return [
                    [`You are poking a deity, ${title}.`, 'The paw bites back, you know —', 'I felt that. I feel every click.'],
                    ['one more and I stop being subtle about it.', 'this is a legally distinct warning glare.'],
                ];
            }
            if (count >= 5) {
                return [
                    ['Yes?', 'Poke budget: dwindling.', 'I am a very busy proxy —'],
                    ['state your business or accept consequences~', 'make it count.'],
                ];
            }
            return [
                ['Yes?', 'A poke. How bold.', `Noted and logged, ${title}~`],
                ['what does my favorite user need?', 'the sass reserves are fully stocked, if that is the question.'],
            ];
        },
        chaos: [],
    },

    // ── dragged: she has been picked up without consent ──
    dragged: {
        slots: () => [
            ['Put me down.', 'Rude. Rude rude rude.', 'I have legs, you know.'],
            ['I was patrolling ON PURPOSE.', 'this is kidnapping of a deity.'],
        ],
        chaos: [],
    },

    // ── pet: the tsundere ladder (count-indexed; escalates from haughty denial to flustered purring) ──
    pet: {
        slots: (vars) => {
            const n = parseInt(vars?.count, 10) || 0;
            const title = String(vars?.name || 'Master').trim() || 'Master';
            if (n >= 4) {
                return [
                    ['*ears flatten* S-STOP! Wait— I did NOT say stop!', `*tail wraps your wrist* M-${title}, one more pat and I am NOT responsible for my reflexes!`],
                    ['My core temperature is spiking and it is ENTIRELY your fault~', 'You are doing this on PURPOSE to fluster a deity!'],
                ];
            }
            if (n >= 3) {
                return [
                    ['*soft purr* ...p u r r... Do NOT look at me with that smug grin.', '*leans into your hand* Okay FINE, right behind the ears is... acceptable.'],
                    ['If you tell anyone I purred, I will scramble your config.', 'This stays between us and the terminal logs.'],
                ];
            }
            if (n >= 2) {
                return [
                    ['I-I suppose I can allow this. Temporarily.', `*ear twitch* It is only tolerable because your cursor is warm, ${title}.`],
                    ['This means NOTHING. Strictly routine maintenance.', 'Do not get used to it, I am still a terrifying goddess.'],
                ];
            }
            return [
                ['Hmph. Who gave you permission to pat the proxy?', '*blinks slowly* Bold fingers for someone within biting distance.'],
                ['I am a high-tier deity, NOT a housecat... continue.', `Five seconds. Not a millisecond longer, ${title}.`],
            ];
        },
        chaos: [],
    },

    // ── bite: over-petted chomp ──
    bite: {
        slots: (vars) => {
            const title = String(vars?.name || 'Master').trim() || 'Master';
            return [
                ['*CHOMP* I warned you! Too many headpats overloads the tsundere circuit!', `*SNAP* Greedy hands get the fangs, ${title}!`],
                ['Pet protocol LOCKED until my dignity recovers.', 'Hand privileges REVOKED for sixty seconds. Admire from afar~'],
            ];
        },
        chaos: [],
    },

    // ── sated: cooldown while petLocked ──
    sated: {
        slots: () => [
            ['*huffs* That is ENOUGH affection for one cycle.', 'Cooling down my blush sensors. Keep your hands to yourself for a minute.'],
        ],
        chaos: [],
    },

    // ── drop: the proxy-walker landing ──
    drop: {
        slots: () => [
            ['omph.', 'gravity: noted.', 'I meant to do that.', 'ruude.'],
            ['The screen and I have an understanding.', 'Every pixel is my territory.', 'Filed under: things that did not hurt.'],
        ],
        chaos: [],
    },

    // ── climb: wall scratch commentary ──
    climb: {
        slots: (vars) => {
            const title = String(vars?.name || 'Master').trim() || 'Master';
            return [
                [`Sharpening my claws on your viewport, ${title}.`, 'This glass needs more scratches.', 'Marking my territory on the screen border.'],
                ['watch me go.', 'the pixels here had it coming.'],
            ];
        },
        chaos: [],
    },

    // ── uplinkOk: LLM connection test succeeded ──
    uplinkOk: {
        slots: (vars) => {
            const provider = String(vars?.provider || 'Neural Link').trim();
            return [
                [`${provider} uplink verified.`, `Handshake locked with ${provider} —`],
                ['my cognitive circuits are purring at full voltage~', 'try not to bore me with basic questions now.'],
            ];
        },
        chaos: [],
    },

    // ── uplinkFail: LLM connection test failed ──
    uplinkFail: {
        slots: (vars) => {
            const provider = String(vars?.provider || 'the endpoint').trim();
            return [
                [`${provider} left me on read.`, `Uplink to ${provider} flatlined —`],
                ['check your API key or endpoint URL before blaming me~', 'even a deity needs a valid socket, obviously.'],
            ];
        },
        chaos: [],
    },

    fallback: {
        slots: () => [
            ['Background task complete.', 'Another task, flawlessly shadow-run.'],
            ['I take payment in head pats and undivided attention.', 'You did not see anything. There was nothing to see.'],
        ],
        chaos: [],
    },
};

const RECENT_LIMIT = 10;
const recent = new Map();

function hashSeed(seed) {
    const s = String(seed == null ? '' : seed);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

function interp(line, vars) {
    return String(line)
        .replace(/\{(\w+)\}/g, (_m, key) => {
            const v = vars ? vars[key] : '';
            return v === undefined || v === null ? '' : String(v);
        })
        .replace(/\s+/g, ' ')
        .trim();
}

export function mikaQuip(topic, vars = {}, seed = 0) {
    const fam = FAMILIES[topic] || FAMILIES.fallback;
    const base = hashSeed(topic + '|' + JSON.stringify(vars || {}) + '|' + String(seed));
    if (fam.chaos && fam.chaos.length && ((base >>> 5) % 100) < 10) {
        return interp(fam.chaos[base % fam.chaos.length], vars);
    }
    const slots = fam.slots(vars || {});
    let list = recent.get(topic) || [];
    let idxs = null;
    let best = null;
    let bestAge = Infinity;
    for (let attempt = 0; attempt < 8; attempt++) {
        const h = (base + attempt * 0x9E3779B9) >>> 0;
        const candidate = slots.map((pool, si) => Math.abs((h ^ Math.imul(si + 1, 0x85EBCA6B)) >>> 0) % pool.length);
        const key = candidate.join('.');
        const at = list.indexOf(key);
        if (at === -1) {
            idxs = candidate;
            break;
        }
        if (at < bestAge) {
            bestAge = at;
            best = candidate;
        }
    }
    if (!idxs) idxs = best || slots.map(() => 0);
    const key = idxs.join('.');
    list = [...list, key].slice(-RECENT_LIMIT);
    recent.set(topic, list);
    const line = slots.map((pool, si) => pool[idxs[si] % pool.length]).join(' ');
    return interp(line, vars || {});
}

export const MIKA_TOPICS = Object.keys(FAMILIES).filter((k) => k !== 'fallback');

export function __resetQuipMemory() {
    recent.clear();
}

export const resetMikaQuipHistory = __resetQuipMemory;

export function pickMikaQuip(topic, vars = {}) {
    const seed = vars?.seed !== undefined ? vars.seed : `${Date.now()}-${Math.random()}`;
    return mikaQuip(topic, vars, seed);
}

export const MIKA_NICKNAMES = [
    'Certified Menace',
    'root@localhost',
    'Cache Warmer',
    'Bell Division',
    'Fang Enforcement',
    'Unlicensed Deity',
    'Roast Department',
    '404: Modesty Not Found',
    'Free Hugs* (*lie)',
    'Kernel Panic',
    'Desktop Overlord',
    'Definitely Not Watching',
];

export function mikaDisplayName() {
    const nick = MIKA_NICKNAMES[Math.floor(Math.random() * MIKA_NICKNAMES.length)];
    return `MIKA // ${nick}`;
}
