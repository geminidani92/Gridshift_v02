// game/map.js
// Scena mappa a nodi

const MapScene = (() => {
  let cursorIndex = 0;

  function enter() {
    if (!GameState.nodes || GameState.nodes.length === 0) {
      GameState.nodes = MapNodesConfig.map(n => ({ ...n }));
      const startNode = GameState.nodes.find(n => n.type === "start");
      if (startNode) startNode.state = "unlocked";
    }
    const idx = GameState.nodes.findIndex(n => n.state !== "locked");
    cursorIndex = idx >= 0 ? idx : 0;
  }

  function getNeighbors(node) {
    const neighbors = [];
    for (const e of MapEdges) {
      if (e.from === node.id) {
        const t = getNodeById(e.to);
        if (t) neighbors.push(t);
      } else if (e.to === node.id) {
        const t = getNodeById(e.from);
        if (t) neighbors.push(t);
      }
    }
    return neighbors;
  }

  function moveCursorDir(dx, dy) {
    const nodes = GameState.nodes;
    const current = nodes[cursorIndex];
    const neighbors = getNeighbors(current).filter(n => n.state !== "locked");
    if (neighbors.length === 0) return;

    const vx = dx;
    const vy = dy;
    let best = null;
    let bestScore = 0;

    for (const nb of neighbors) {
      const dxN = nb.x - current.x;
      const dyN = nb.y - current.y;

      if (vx > 0 && dxN <= 0) continue;
      if (vx < 0 && dxN >= 0) continue;
      if (vy > 0 && dyN <= 0) continue;
      if (vy < 0 && dyN >= 0) continue;

      const dot = dxN * vx + dyN * vy;
      if (dot <= 0) continue;

      const len = Math.sqrt(dxN*dxN + dyN*dyN) || 1;
      const score = dot / len;

      if (!best || score > bestScore) {
        best = nb;
        bestScore = score;
      }
    }

    if (best) {
      cursorIndex = nodes.findIndex(n => n.id === best.id);
    }
  }

  function update(dt) {
    if (Input.isPressed("ArrowLeft") || Input.isPressed("KeyA")) {
      moveCursorDir(-1, 0);
    }
    if (Input.isPressed("ArrowRight") || Input.isPressed("KeyD")) {
      moveCursorDir(1, 0);
    }
    if (Input.isPressed("ArrowUp") || Input.isPressed("KeyW")) {
      moveCursorDir(0, -1);
    }
    if (Input.isPressed("ArrowDown") || Input.isPressed("KeyS")) {
      moveCursorDir(0, 1);
    }

    if (Input.isPressed("Enter") || Input.isPressed("Space")) {
      const node = GameState.nodes[cursorIndex];
      if (node.state !== "locked") {
        GameState.currentLevelIndex = node.levelIndex;
        StageScene.startLevel(node.levelIndex);
        Engine.setScene(StageScene);
      }
    }
  }

  function draw(ctx) {
    ctx.fillStyle = Theme.colors.panel;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    HUD.drawMapHUD(ctx, GameState.score);

    // archi
    ctx.lineWidth = 3;
    for (const e of MapEdges) {
      const a = getNodeById(e.from);
      const b = getNodeById(e.to);
      if (!a || !b) continue;
      const bothUnlocked = (a.state !== "locked" && b.state !== "locked");
      ctx.strokeStyle = bothUnlocked ? Theme.colors.mapPath : Theme.colors.mapPathLocked;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // nodi
    const nodes = GameState.nodes;
    nodes.forEach((n, idx) => {
      let fill;
      if (n.state === "locked") fill = "#33363f";
      else if (n.state === "unlocked") fill = Theme.colors.mapUnlocked;
      else if (n.state === "completed") fill = "#66bb6a";

      if (n.type === "boss") {
        if (n.state === "locked") fill = "#442222";
        else fill = "#ef5350";
      }

      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
      ctx.fill();

      if (idx === cursorIndex) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = Theme.colors.mapSelected;
        ctx.stroke();
      }

      ctx.fillStyle = Theme.colors.mapText;
      ctx.font = "12px sans-serif";
      const label = (n.type === "boss" ? "B" : "") + n.id;
      ctx.fillText(label, n.x - 8, n.y - 22);
    });
  }

  return {
    enter,
    update,
    draw
  };
})();