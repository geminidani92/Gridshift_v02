// game/levels.js
// Dati globali: mappa nodi + archi + configurazione livelli

const GameState = {
  currentLevelIndex: 0,
  nodes: [],
  score: 0
};

// ---------------------------
// Mappa lineare Phase 1 (5 livelli + boss nel prototipo attuale)
// ---------------------------
const MapNodesConfig = [
  { id: 1, x: 150, y: 270, type: "start",  state: "unlocked", levelIndex: 0 },
  { id: 2, x: 320, y: 190, type: "normal", state: "locked",   levelIndex: 1 },
  { id: 3, x: 320, y: 350, type: "normal", state: "locked",   levelIndex: 2 },
  { id: 4, x: 520, y: 190, type: "normal", state: "locked",   levelIndex: 3 },
  { id: 5, x: 520, y: 350, type: "normal", state: "locked",   levelIndex: 4 },
  { id: 6, x: 720, y: 270, type: "boss",   state: "locked",   levelIndex: 5 }
];

// La nuova mappa è una Phase Progress Scene lineare: completare un livello
// deve sbloccare solo il livello immediatamente successivo. La vecchia world map
// aveva un bivio 1->2 e 1->3, che sbloccava due livelli contemporaneamente.
const MapEdges = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 }
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

  // LEVEL 3
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

  // LEVEL 4
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

  // LEVEL 5 - Boss semplice
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
      { gx: 6, gy: 5, kind: "orange" }
    ]
  }
];