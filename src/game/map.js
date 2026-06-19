// game/map.js
// Phase Progress Scene.
//
// Questa scena resta nel file map.js perché è ancora "la mappa" del gioco,
// ma non è più una world map con bivi: è una mappa lineare di avanzamento
// della Phase. Il giocatore può spostarsi a sinistra/destra solo tra i livelli
// già sbloccati, così può rigiocare livelli precedenti senza introdurre scelte
// di percorso roguelike.

const MapScene = (() => {
  let cursorIndex = 0;
  let pulseTime = 0;

  function enter() {
    ensurePhaseNodes();
    cursorIndex = findDefaultCursorIndex();
  }

  function ensurePhaseNodes() {
    if (!GameState.nodes || GameState.nodes.length === 0) {
      GameState.nodes = MapNodesConfig.map(n => ({ ...n }));
      const startNode = GameState.nodes.find(n => n.type === "start");
      if (startNode) startNode.state = "unlocked";
    }
  }

  // Quando il giocatore torna alla mappa dopo una vittoria, selezioniamo il
  // prossimo livello sbloccato. Se non ce ne sono, lasciamo il cursore sull'ultimo
  // livello completato. Questo supporta sia progressione sia replay.
  function findDefaultCursorIndex() {
    const nodes = GameState.nodes;
    const firstUnlocked = nodes.findIndex(n => n.state === "unlocked");
    if (firstUnlocked >= 0) return firstUnlocked;

    const lastCompleted = nodes.map(n => n.state).lastIndexOf("completed");
    if (lastCompleted >= 0) return lastCompleted;

    return 0;
  }

  function isSelectable(node) {
    return node && node.state !== "locked";
  }

  function moveCursor(dir) {
    const nodes = GameState.nodes;
    if (!nodes || nodes.length === 0) return;

    let next = cursorIndex + dir;
    while (next >= 0 && next < nodes.length) {
      if (isSelectable(nodes[next])) {
        cursorIndex = next;
        AudioSys.play("ui_move");
        return;
      }
      next += dir;
    }
  }

  function startSelectedLevel() {
    const node = GameState.nodes[cursorIndex];
    if (!isSelectable(node)) return;

    GameState.currentLevelIndex = node.levelIndex;
    StageScene.startLevel(node.levelIndex);
    AudioSys.play("ui_confirm");
    Engine.setScene(StageScene);
  }

  function update(dt) {
    pulseTime += dt;

    // Navigazione lineare: questa non è una world map, quindi niente su/giù.
    if (Input.isPressed("ArrowLeft") || Input.isPressed("KeyA")) {
      moveCursor(-1);
    }
    if (Input.isPressed("ArrowRight") || Input.isPressed("KeyD")) {
      moveCursor(1);
    }

    if (Input.isPressed("Enter") || Input.isPressed("Space")) {
      startSelectedLevel();
    }
  }

  function draw(ctx) {
    drawBackdrop(ctx);
    drawHeader(ctx);
    drawPhaseProgress(ctx);
    drawSelectedLevelInfo(ctx);
    drawFooterHint(ctx);
  }

  // Fondale contemplativo ispirato al riferimento: città astratta, profondità,
  // luce e atmosfera. Non rappresenta la mappa; è il layer emotivo della Phase.
  function drawBackdrop(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#07131f");
    bg.addColorStop(0.45, "#102536");
    bg.addColorStop(1, "#070b12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Nebbia morbida sull'orizzonte.
    const fog = ctx.createRadialGradient(w * 0.5, h * 0.62, 20, w * 0.5, h * 0.62, w * 0.65);
    fog.addColorStop(0, "rgba(0, 229, 255, 0.16)");
    fog.addColorStop(0.45, "rgba(0, 120, 170, 0.10)");
    fog.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    drawDistantCity(ctx);
    drawStairPath(ctx);
    drawAmbientParticles(ctx);
  }

  function drawDistantCity(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const baseY = h - 70;

    ctx.save();
    ctx.globalAlpha = 0.72;

    // Skyline geometrica: pochi blocchi grandi, non dettaglio illustrativo.
    const towers = [
      { x: 42,  y: 360, w: 46, h: 96 },
      { x: 112, y: 330, w: 58, h: 128 },
      { x: 208, y: 382, w: 42, h: 76 },
      { x: 292, y: 312, w: 72, h: 146 },
      { x: 390, y: 356, w: 50, h: 102 },
      { x: 502, y: 288, w: 88, h: 172 },
      { x: 644, y: 334, w: 56, h: 122 },
      { x: 760, y: 300, w: 78, h: 160 },
      { x: 860, y: 370, w: 40, h: 88 }
    ];

    for (const t of towers) {
      const g = ctx.createLinearGradient(t.x, t.y, t.x, baseY);
      g.addColorStop(0, "rgba(18, 43, 62, 0.78)");
      g.addColorStop(1, "rgba(3, 8, 14, 0.92)");
      ctx.fillStyle = g;
      ctx.fillRect(t.x, t.y, t.w, t.h);

      ctx.fillStyle = "rgba(0, 229, 255, 0.55)";
      if ((t.x / 2) % 3 > 1) ctx.fillRect(t.x + t.w * 0.62, t.y + t.h * 0.34, 4, 4);
      if ((t.x / 3) % 2 > 1) ctx.fillRect(t.x + t.w * 0.28, t.y + t.h * 0.68, 5, 5);
    }

    ctx.restore();
  }

  function drawStairPath(ctx) {
    const selected = GameState.nodes[cursorIndex];
    const selectedLevel = selected ? cursorIndex + 1 : 1;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Base monumentale sotto la progressione: una scala/passerella semplice,
    // leggibile e poco costosa da renderizzare.
    const startX = w * 0.38;
    const startY = h * 0.78;
    const stepW = 42;
    const stepH = 12;
    const rise = 13;

    ctx.save();
    for (let i = 0; i < 9; i++) {
      const x = startX + i * 30;
      const y = startY - i * rise;
      const active = i < selectedLevel;

      ctx.fillStyle = active ? "rgba(218, 244, 230, 0.82)" : "rgba(28, 44, 58, 0.82)";
      ctx.fillRect(x, y, stepW, stepH);

      ctx.strokeStyle = active ? "rgba(255, 230, 86, 0.45)" : "rgba(0, 229, 255, 0.10)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, stepW - 1, stepH - 1);
    }

    // Faro/colonna del livello selezionato.
    const beamX = Math.min(w - 170, startX + Math.max(0, selectedLevel - 1) * 30 + stepW * 0.5);
    const beamY = startY - Math.max(0, selectedLevel - 1) * rise;
    const beam = ctx.createLinearGradient(beamX, beamY - 150, beamX, beamY + 30);
    beam.addColorStop(0, "rgba(255, 230, 86, 0)");
    beam.addColorStop(0.52, "rgba(255, 230, 86, 0.26)");
    beam.addColorStop(1, "rgba(255, 230, 86, 0)");

    ctx.fillStyle = beam;
    ctx.fillRect(beamX - 10, beamY - 150, 20, 180);

    ctx.restore();
  }

  function drawAmbientParticles(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.save();
    for (let i = 0; i < 42; i++) {
      const x = (i * 83 + 37) % w;
      const y = 90 + ((i * 47 + 19) % Math.floor(h * 0.62));
      const blink = 0.35 + 0.45 * Math.sin(pulseTime * 1.4 + i);
      ctx.fillStyle = `rgba(0, 229, 255, ${0.10 + blink * 0.18})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  function drawHeader(ctx) {
    const w = ctx.canvas.width;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = Theme.colors.mapText;
    ctx.font = "22px system-ui, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("P H A S E  1", w / 2, 42);

    ctx.strokeStyle = Theme.colors.accentFaint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, 64);
    ctx.lineTo(w / 2 - 28, 64);
    ctx.moveTo(w / 2 + 28, 64);
    ctx.lineTo(w / 2 + 120, 64);
    ctx.stroke();

    drawDiamond(ctx, w / 2, 64, 6, Theme.colors.accent, false);
    ctx.restore();
  }

  // Barra lineare come nel riferimento: è la vera mappa della Phase.
  // Il fondale sotto è solo atmosfera.
  function drawPhaseProgress(ctx) {
    const nodes = GameState.nodes;
    const count = nodes.length;
    const w = ctx.canvas.width;
    const y = 108;
    const startX = 70;
    const endX = w - 70;
    const gap = count > 1 ? (endX - startX) / (count - 1) : 0;

    ctx.save();
    ctx.lineWidth = 2;

    // Linea di progressione divisa per segmenti, così i tratti futuri restano spenti.
    for (let i = 0; i < count - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const ax = startX + i * gap;
      const bx = startX + (i + 1) * gap;
      const active = a.state !== "locked" && b.state !== "locked";

      ctx.strokeStyle = active ? Theme.colors.accentSoft : Theme.colors.mapPathLocked;
      ctx.beginPath();
      ctx.moveTo(ax + 13, y);
      ctx.lineTo(bx - 13, y);
      ctx.stroke();
    }

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      const x = startX + i * gap;
      const selected = i === cursorIndex;
      const boss = node.type === "boss";

      drawPhaseNode(ctx, node, x, y, selected, boss);
      drawPhaseLabel(ctx, node, x, y + 34, i);
    }

    ctx.restore();
  }

  function drawPhaseNode(ctx, node, x, y, selected, boss) {
    const locked = node.state === "locked";
    const completed = node.state === "completed";
    const unlocked = node.state === "unlocked";
    const pulse = 0.5 + 0.5 * Math.sin(pulseTime * 4);

    let color = Theme.colors.mapPathLocked;
    if (completed) color = Theme.colors.accent;
    if (unlocked) color = Theme.colors.mapSelected;
    if (boss && !locked) color = Theme.colors.mapSelected;

    const radius = selected ? 15 + pulse * 2 : 11;

    if (selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
    }

    if (boss) {
      drawStar(ctx, x, y, selected ? 18 : 14, color, locked);
    } else {
      drawDiamond(ctx, x, y, radius, color, locked);
    }

    ctx.shadowBlur = 0;
  }

  function drawPhaseLabel(ctx, node, x, y, index) {
    const locked = node.state === "locked";
    const selected = index === cursorIndex;
    const boss = node.type === "boss";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = selected ? "700 13px system-ui, sans-serif" : "12px system-ui, sans-serif";
    ctx.fillStyle = locked ? "rgba(234, 246, 255, 0.48)" : Theme.colors.mapText;
    ctx.fillText(boss ? "BOSS" : String(node.id), x, y);
    ctx.restore();
  }

  function drawSelectedLevelInfo(ctx) {
    const node = GameState.nodes[cursorIndex];
    if (!node) return;

    const w = ctx.canvas.width;
    const boss = node.type === "boss";
    const title = boss ? "BOSS DELLA PHASE" : `LIVELLO ${node.id}`;
    const state = node.state === "completed" ? "COMPLETATO" : "PROSSIMO LIVELLO";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = node.state === "completed" ? Theme.colors.accent : Theme.colors.mapSelected;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(state, w / 2, 168);

    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText(title, w / 2, 194);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(234, 246, 255, 0.72)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Ogni passo è una scelta di precisione.", w / 2, ctx.canvas.height - 42);

    ctx.restore();
  }

  function drawFooterHint(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = Theme.colors.accentFaint;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("← / → seleziona livello sbloccato   •   SPAZIO / INVIO entra", ctx.canvas.width / 2, ctx.canvas.height - 20);
    ctx.restore();
  }

  function drawDiamond(ctx, x, y, r, color, locked) {
    ctx.save();
    ctx.strokeStyle = locked ? Theme.colors.mapPathLocked : color;
    ctx.fillStyle = locked ? "rgba(51, 54, 63, 0.65)" : "rgba(0, 229, 255, 0.16)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!locked) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawStar(ctx, x, y, r, color, locked) {
    ctx.save();
    ctx.strokeStyle = locked ? Theme.colors.mapPathLocked : color;
    ctx.fillStyle = locked ? "rgba(51, 54, 63, 0.45)" : "rgba(255, 230, 86, 0.18)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  return {
    enter,
    update,
    draw
  };
})();