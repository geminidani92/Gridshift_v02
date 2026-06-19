// game/levels.js
// Dati globali: progressione Phase + configurazione livelli

const GameState = {
  currentLevelIndex: 0,
  nodes: [],
  score: 0
};

// ---------------------------
// Mappa lineare Phase 1 (10 livelli + boss)
// ---------------------------
const MapNodesConfig = [
  { id: 1,  x: 0, y: 0, type: "start",  state: "unlocked", levelIndex: 0 },
  { id: 2,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 1 },
  { id: 3,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 2 },
  { id: 4,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 3 },
  { id: 5,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 4 },
  { id: 6,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 5 },
  { id: 7,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 6 },
  { id: 8,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 7 },
  { id: 9,  x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 8 },
  { id: 10, x: 0, y: 0, type: "normal", state: "locked",   levelIndex: 9 },
  { id: 11, x: 0, y: 0, type: "boss",   state: "locked",   levelIndex: 10 }
];

// Progressione lineare: completare un livello sblocca solo il successivo.
const MapEdges = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 9, to: 10 },
  { from: 10, to: 11 }
];

function getNodeById(id) {
  return GameState.nodes.find(n => n.id === id);
}

function areNodesConnected(aId, bId) {
  return MapEdges.some(e =>
    (e.from === aId && e.to === bId) ||
    (e.to === aId && e.from === bId)
  );
}

function unlockSuccessors(node) {
  const nodes = GameState.nodes;
  for (const e of MapEdges) {
    if (e.from === node.id) {
      const t = nodes.find(n2 => n2.id === e.to);
      if (t && t.state === "locked") {
        t.state = "unlocked";
      }
    }
  }
}

// ---------------------------
// Configurazione livelli griglia
// "." normale
// "#" bloccata
// speciali: trigger / goal / chain(n)
//
// Nota produzione: i livelli 6-10 sono placeholder deterministici "random-like".
// Servono a rendere completa e giocabile la Phase 1; li rifiniremo con playtest.
// ---------------------------

const LevelsConfig = [
  // LEVEL 0 - Intro
  {
    name: "Level 1",
    cols: 10,
    rows: 6,
    layout: [
      "..........",
      "..####....",
      "..####....",
      "..####....",
      "..####....",
      ".........."
    ],
    specials: [
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 4, gy: 1, kind: "red" }
    ]
  },

  // LEVEL 1 - Introduce trigger
  {
    name: "Level 2",
    cols: 10,
    rows: 6,
    layout: [
      "..##......",
      "..##......",
      "..........",
      ".....##...",
      ".....##...",
      ".........."
    ],
    specials: [
      { x: 2, y: 2, type: "trigger" },
      { x: 7, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 1, gy: 0, kind: "red" },
      { gx: 8, gy: 3, kind: "orange" }
    ]
  },

  // LEVEL 2 - Chain(1,2)
  {
    name: "Level 3",
    cols: 10,
    rows: 6,
    layout: [
      "..........",
      "..####....",
      "..#..#....",
      "..#..#....",
      "..#..#....",
      ".........."
    ],
    specials: [
      { x: 1, y: 0, type: "chain", index: 1 },
      { x: 8, y: 0, type: "chain", index: 2 },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 3, gy: 2, kind: "red" },
      { gx: 6, gy: 3, kind: "orange" }
    ]
  },

  // LEVEL 3 - Trigger + single chain
  {
    name: "Level 4",
    cols: 10,
    rows: 6,
    layout: [
      "....##....",
      "....##....",
      "..........",
      "..####....",
      "..........",
      "....##...."
    ],
    specials: [
      { x: 0, y: 2, type: "trigger" },
      { x: 9, y: 2, type: "chain", index: 1 },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 4, gy: 0, kind: "red" },
      { gx: 4, gy: 5, kind: "orange" }
    ]
  },

  // LEVEL 4 - Split lanes
  {
    name: "Level 5",
    cols: 10,
    rows: 6,
    layout: [
      "..##..##..",
      "..##..##..",
      "..........",
      "..........",
      "..##..##..",
      "..##..##.."
    ],
    specials: [
      { x: 1, y: 2, type: "chain", index: 1 },
      { x: 8, y: 3, type: "chain", index: 2 },
      { x: 5, y: 2, type: "trigger" },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 2, gy: 2, kind: "red" },
      { gx: 7, gy: 3, kind: "orange" }
    ]
  },

  // LEVEL 5 - Open field with staggered blockers
  {
    name: "Level 6",
    cols: 10,
    rows: 6,
    layout: [
      "..........",
      ".##...##..",
      ".....#....",
      "....#.....",
      "..##...##.",
      ".........."
    ],
    specials: [
      { x: 0, y: 5, type: "chain", index: 1 },
      { x: 9, y: 0, type: "chain", index: 2 },
      { x: 5, y: 3, type: "trigger" },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 1, gy: 4, kind: "red" },
      { gx: 8, gy: 1, kind: "red" },
      { gx: 6, gy: 4, kind: "orange" }
    ]
  },

  // LEVEL 6 - Central corridor
  {
    name: "Level 7",
    cols: 10,
    rows: 6,
    layout: [
      "..##..##..",
      "..........",
      "###....###",
      "..........",
      "..##..##..",
      ".........."
    ],
    specials: [
      { x: 1, y: 1, type: "chain", index: 1 },
      { x: 8, y: 1, type: "chain", index: 2 },
      { x: 4, y: 3, type: "trigger" },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 5, gy: 1, kind: "orange" },
      { gx: 4, gy: 3, kind: "red" },
      { gx: 8, gy: 5, kind: "red" }
    ]
  },

  // LEVEL 7 - Three-step chain
  {
    name: "Level 8",
    cols: 10,
    rows: 6,
    layout: [
      "..........",
      "..#....#..",
      "..#....#..",
      "..........",
      "..#....#..",
      ".........."
    ],
    specials: [
      { x: 0, y: 0, type: "chain", index: 1 },
      { x: 5, y: 3, type: "chain", index: 2 },
      { x: 9, y: 5, type: "chain", index: 3 },
      { x: 7, y: 1, type: "trigger" },
      { x: 9, y: 0, type: "goal" }
    ],
    enemies: [
      { gx: 3, gy: 0, kind: "red" },
      { gx: 6, gy: 5, kind: "orange" },
      { gx: 8, gy: 2, kind: "red" }
    ]
  },

  // LEVEL 8 - Compressed routes
  {
    name: "Level 9",
    cols: 10,
    rows: 6,
    layout: [
      ".#..##..#.",
      "..........",
      "..##..##..",
      "..........",
      ".#..##..#.",
      ".........."
    ],
    specials: [
      { x: 2, y: 1, type: "chain", index: 1 },
      { x: 7, y: 3, type: "chain", index: 2 },
      { x: 4, y: 5, type: "trigger" },
      { x: 9, y: 5, type: "goal" }
    ],
    enemies: [
      { gx: 1, gy: 1, kind: "orange" },
      { gx: 8, gy: 4, kind: "orange" },
      { gx: 5, gy: 0, kind: "red" }
    ]
  },

  // LEVEL 9 - Phase 1 finale prima del boss
  {
    name: "Level 10",
    cols: 10,
    rows: 6,
    layout: [
      "..........",
      ".##.##.##.",
      "..........",
      "..#....#..",
      "..........",
      ".##.##.##."
    ],
    specials: [
      { x: 0, y: 2, type: "chain", index: 1 },
      { x: 5, y: 0, type: "chain", index: 2 },
      { x: 9, y: 4, type: "chain", index: 3 },
      { x: 4, y: 2, type: "trigger" },
      { x: 9, y: 0, type: "goal" }
    ],
    enemies: [
      { gx: 2, gy: 0, kind: "red" },
      { gx: 7, gy: 2, kind: "orange" },
      { gx: 1, gy: 4, kind: "red" },
      { gx: 8, gy: 5, kind: "orange" }
    ]
  },

  // LEVEL 10 - Boss semplice Phase 1
  {
    name: "Boss",
    cols: 12,
    rows: 7,
    layout: [
      "....####....",
      "....#..#....",
      "............",
      "..######....",
      "............",
      "....#..#....",
      "....####...."
    ],
    specials: [
      { x: 5, y: 3, type: "goal" },
      { x: 2, y: 2, type: "chain", index: 1 },
      { x: 9, y: 2, type: "chain", index: 2 },
      { x: 2, y: 4, type: "trigger" }
    ],
    enemies: [
      { gx: 5, gy: 1, kind: "red" },
      { gx: 6, gy: 5, kind: "orange" },
      { gx: 10, gy: 3, kind: "red" }
    ]
  }
];