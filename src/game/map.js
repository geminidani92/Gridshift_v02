// game/map.js
// Phase Progress Scene.
//
// Questa scena resta nel file map.js perché è ancora "la mappa" del gioco.
// Non è più una world map con bivi: è una mappa lineare di avanzamento della
// Phase. Il giocatore può spostarsi a sinistra/destra solo tra i livelli già
// sbloccati, così può rigiocare livelli precedenti senza introdurre scelte di
// percorso roguelike.
//
// Struttura visiva della scena:
// 1) Barra superiore = vera mappa/progressione della Phase.
// 2) Fondale sotto = atmosfera contemplativa ispirata al riferimento PNG.
// 3) Scala/luce centrale = feedback emotivo sul livello selezionato.

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

  // ---------------------------------------------------------------------------
  // BACKDROP / ATMOSFERA
  // ---------------------------------------------------------------------------
  // Il fondale non è interattivo e non contiene informazioni di gameplay.
  // Serve a dare identità alla Phase 1: città astratta, profondità, scale,
  // luce selettiva. È disegnato proceduralmente per restare leggero e statico.

  function drawBackdrop(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    drawSkyGradient(ctx, w, h);
    drawHaze(ctx, w, h);
    drawDistantStars(ctx, w, h);

    // Layer ordinati dal più lontano al più vicino: aumenta la profondità.
    drawFarCityLayer(ctx, w, h);
    drawMidCityLayer(ctx, w, h);
    drawStairPath(ctx);
    drawForegroundCityLayer(ctx, w, h);

    drawAtmosphericVeil(ctx, w, h);
    drawVignette(ctx, w, h);
  }

  function drawSkyGradient(ctx, w, h) {
    // Cielo freddo e verticale: blu profondo in alto, quasi nero in basso.
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#06101c");
    bg.addColorStop(0.38, "#0b2232");
    bg.addColorStop(0.74, "#091520");
    bg.addColorStop(1, "#05070c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawHaze(ctx, w, h) {
    // Nebbia centrale: simula distanza e separa la barra dal fondale.
    const fog = ctx.createRadialGradient(w * 0.52, h * 0.58, 20, w * 0.52, h * 0.58, w * 0.70);
    fog.addColorStop(0, "rgba(0, 229, 255, 0.18)");
    fog.addColorStop(0.38, "rgba(0, 120, 170, 0.10)");
    fog.addColorStop(0.72, "rgba(0, 40, 65, 0.07)");
    fog.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);
  }

  function drawDistantStars(ctx, w, h) {
    // Particelle lente e quasi statiche. Non devono sembrare gameplay.
    ctx.save();
    for (let i = 0; i < 56; i++) {
      const x = (i * 83 + 37) % w;
      const y = 78 + ((i * 47 + 19) % Math.floor(h * 0.52));
      const blink = 0.35 + 0.45 * Math.sin(pulseTime * 1.1 + i);
      ctx.fillStyle = `rgba(0, 229, 255, ${0.08 + blink * 0.18})`;
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1.5, i % 7 === 0 ? 2 : 1.5);
    }
    ctx.restore();
  }

  function drawFarCityLayer(ctx, w, h) {
    // Skyline lontana: silhouette fredde, poco contrasto, molta profondità.
    ctx.save();
    ctx.globalAlpha = 0.52;

    const towers = [
      { x: 28,  y: 328, w: 46, h: 116, d: 12 },
      { x: 92,  y: 292, w: 54, h: 152, d: 14 },
      { x: 180, y: 356, w: 42, h: 92,  d: 10 },
      { x: 270, y: 276, w: 66, h: 176, d: 16 },
      { x: 380, y: 330, w: 44, h: 118, d: 12 },
      { x: 520, y: 250, w: 72, h: 204, d: 18 },
      { x: 650, y: 316, w: 50, h: 136, d: 13 },
      { x: 760, y: 260, w: 74, h: 196, d: 18 },
      { x: 874, y: 348, w: 44, h: 104, d: 12 }
    ];

    for (const t of towers) {
      drawIsoBlock(ctx, t.x, t.y, t.w, t.h, t.d, {
        top: "rgba(25, 57, 78, 0.40)",
        front: "rgba(9, 24, 38, 0.76)",
        side: "rgba(4, 12, 22, 0.88)",
        edge: "rgba(0, 229, 255, 0.045)"
      });
    }

    ctx.restore();
  }

  function drawMidCityLayer(ctx, w, h) {
    // Layer medio: blocchi più leggibili e prime finestre ciano.
    ctx.save();
    ctx.globalAlpha = 0.78;

    const blocks = [
      { x: 24,  y: 388, w: 76, h: 104, d: 20 },
      { x: 124, y: 356, w: 68, h: 132, d: 18 },
      { x: 246, y: 404, w: 74, h: 86,  d: 18 },
      { x: 338, y: 372, w: 80, h: 116, d: 20 },
      { x: 672, y: 360, w: 86, h: 132, d: 20 },
      { x: 792, y: 388, w: 82, h: 104, d: 18 },
      { x: 900, y: 348, w: 70, h: 140, d: 18 }
    ];

    for (const b of blocks) {
      drawIsoBlock(ctx, b.x, b.y, b.w, b.h, b.d, {
        top: "rgba(25, 68, 86, 0.46)",
        front: "rgba(7, 22, 34, 0.92)",
        side: "rgba(3, 10, 18, 0.98)",
        edge: "rgba(0, 229, 255, 0.07)"
      });
      drawWindowLights(ctx, b.x, b.y, b.w, b.h, b.d);
    }

    ctx.restore();
  }

  function drawForegroundCityLayer(ctx, w, h) {
    // Primo piano: blocchi grandi ai lati, come quinte sceniche.
    // Incorniciano la scala centrale senza rubare attenzione alla barra.
    ctx.save();

    const leftBlocks = [
      { x: -26, y: 470, w: 142, h: 82, d: 34 },
      { x: 92,  y: 500, w: 118, h: 64, d: 28 },
      { x: 214, y: 472, w: 104, h: 78, d: 24 }
    ];

    const rightBlocks = [
      { x: 710, y: 462, w: 128, h: 88, d: 30 },
      { x: 818, y: 502, w: 116, h: 64, d: 28 },
      { x: 906, y: 440, w: 120, h: 116, d: 32 }
    ];

    for (const b of [...leftBlocks, ...rightBlocks]) {
      drawIsoBlock(ctx, b.x, b.y, b.w, b.h, b.d, {
        top: "rgba(20, 47, 60, 0.72)",
        front: "rgba(4, 13, 22, 0.96)",
        side: "rgba(2, 7, 13, 1)",
        edge: "rgba(0, 229, 255, 0.08)"
      });
      drawWindowLights(ctx, b.x, b.y, b.w, b.h, b.d);
    }

    ctx.restore();
  }

  // Disegna un blocco pseudo-isometrico con tre facce.
  // È volutamente semplice: non vogliamo un motore 3D, solo profondità leggibile.
  function drawIsoBlock(ctx, x, y, w, h, depth, colors) {
    const skewY = depth * 0.46;

    // Top face.
    ctx.fillStyle = colors.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + depth, y - skewY);
    ctx.lineTo(x + w + depth, y - skewY);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();

    // Side face.
    ctx.fillStyle = colors.side;
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + depth, y - skewY);
    ctx.lineTo(x + w + depth, y + h - skewY);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // Front face.
    ctx.fillStyle = colors.front;
    ctx.fillRect(x, y, w, h);

    // Edge lines molto leggere: leggibilità senza rumore visivo.
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + depth, y - skewY);
    ctx.lineTo(x + w + depth, y - skewY);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();
  }

  function drawWindowLights(ctx, x, y, w, h, depth) {
    // Luci sparse: poche, piccole, ciano. Devono suggerire scala, non decorare troppo.
    ctx.save();
    ctx.fillStyle = "rgba(0, 229, 255, 0.55)";

    const seeds = [0.21, 0.43, 0.68, 0.82];
    for (let i = 0; i < seeds.length; i++) {
      const sx = x + w * seeds[i];
      const sy = y + h * ((i * 0.27 + x * 0.003) % 0.78 + 0.12);
      if ((Math.floor(x + y + i * 17) % 3) !== 0) {
        ctx.fillRect(sx, sy, 4, 4);
      }
    }

    ctx.restore();
  }

  function drawStairPath(ctx) {
    const nodes = GameState.nodes;
    const selected = nodes[cursorIndex];
    const selectedLevel = selected ? cursorIndex + 1 : 1;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // La scala è il focus emotivo del fondale: sale verso destra, come nel reference.
    // Non sostituisce la progress bar; amplifica visivamente il livello selezionato.
    const startX = w * 0.34;
    const startY = h * 0.80;
    const stepCount = Math.max(10, nodes.length);
    const stepW = 54;
    const stepH = 12;
    const stepDepth = 20;
    const dx = 30;
    const dy = 12;

    ctx.save();

    // Ombra della passerella: stacca la scala dalla città.
    ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
    ctx.beginPath();
    ctx.ellipse(startX + 180, startY + 38, 210, 32, -0.16, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < stepCount; i++) {
      const x = startX + i * dx;
      const y = startY - i * dy;
      const active = i < selectedLevel;
      const selectedStep = i === selectedLevel - 1;

      drawStairStep(ctx, x, y, stepW, stepH, stepDepth, active, selectedStep);
    }

    // Piattaforma finale: il boss è percepito come destinazione, non come bivio.
    const finalX = startX + (stepCount - 1) * dx + 40;
    const finalY = startY - (stepCount - 1) * dy - 8;
    drawSummitPlatform(ctx, finalX, finalY, cursorIndex === nodes.length - 1);

    // Luce verticale collegata al livello selezionato.
    const beamIndex = Math.min(selectedLevel - 1, stepCount - 1);
    const beamX = startX + beamIndex * dx + stepW * 0.62;
    const beamY = startY - beamIndex * dy + 4;
    drawSelectedBeam(ctx, beamX, beamY, selectedLevel);

    ctx.restore();
  }

  function drawStairStep(ctx, x, y, w, h, depth, active, selected) {
    // Colori volutamente più caldi sui gradini attivi: imitano la luce del concept.
    const top = active ? "rgba(210, 236, 226, 0.90)" : "rgba(31, 52, 64, 0.86)";
    const front = active ? "rgba(72, 92, 91, 0.86)" : "rgba(12, 24, 34, 0.90)";
    const side = active ? "rgba(28, 42, 44, 0.94)" : "rgba(6, 14, 23, 0.96)";
    const edge = active ? "rgba(255, 230, 86, 0.34)" : "rgba(0, 229, 255, 0.10)";

    drawIsoBlock(ctx, x, y, w, h, depth, { top, front, side, edge });

    if (selected) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 230, 86, 0.95)";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(255, 230, 86, 0.80)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 2, w - 10, h + 3);
      ctx.restore();
    }
  }

  function drawSummitPlatform(ctx, x, y, selected) {
    // Destinazione finale / boss: più massiccia dei gradini, ma non troppo luminosa
    // finché non è selezionata.
    drawIsoBlock(ctx, x, y, 76, 18, 28, {
      top: selected ? "rgba(255, 230, 86, 0.82)" : "rgba(34, 54, 66, 0.78)",
      front: selected ? "rgba(82, 62, 24, 0.86)" : "rgba(12, 24, 34, 0.92)",
      side: selected ? "rgba(34, 24, 12, 0.96)" : "rgba(5, 12, 20, 0.98)",
      edge: selected ? "rgba(255, 230, 86, 0.65)" : "rgba(234, 246, 255, 0.12)"
    });
  }

  function drawSelectedBeam(ctx, x, y, selectedLevel) {
    const pulse = 0.5 + 0.5 * Math.sin(pulseTime * 3.2);

    // Colonna verticale dorata: è il principale richiamo al riferimento PNG.
    const beam = ctx.createLinearGradient(x, y - 190, x, y + 42);
    beam.addColorStop(0, "rgba(255, 230, 86, 0)");
    beam.addColorStop(0.25, `rgba(255, 230, 86, ${0.08 + pulse * 0.04})`);
    beam.addColorStop(0.62, `rgba(255, 230, 86, ${0.30 + pulse * 0.10})`);
    beam.addColorStop(1, "rgba(255, 230, 86, 0)");

    ctx.save();
    ctx.fillStyle = beam;
    ctx.fillRect(x - 12, y - 190, 24, 232);

    // Core più stretto e brillante.
    ctx.fillStyle = `rgba(255, 246, 170, ${0.18 + pulse * 0.10})`;
    ctx.fillRect(x - 2, y - 158, 4, 170);

    // Piccole particelle attorno alla luce, deterministiche.
    ctx.fillStyle = "rgba(255, 230, 86, 0.78)";
    for (let i = 0; i < 12; i++) {
      const px = x + Math.sin(pulseTime * 1.3 + i * 2.1) * (14 + (i % 3) * 8);
      const py = y - 130 + i * 12 - ((selectedLevel + i) % 4) * 7;
      ctx.globalAlpha = 0.35 + 0.45 * Math.sin(pulseTime * 2.4 + i);
      ctx.fillRect(px, py, 2, 2);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawAtmosphericVeil(ctx, w, h) {
    // Velo di nebbia basso: rende i blocchi meno "piatti" e più lontani.
    const veil = ctx.createLinearGradient(0, h * 0.48, 0, h);
    veil.addColorStop(0, "rgba(0, 0, 0, 0)");
    veil.addColorStop(0.42, "rgba(42, 96, 120, 0.10)");
    veil.addColorStop(1, "rgba(0, 0, 0, 0.30)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, h * 0.42, w, h * 0.58);
  }

  function drawVignette(ctx, w, h) {
    // Vignetta: tiene lo sguardo su barra, scala e livello selezionato.
    const vignette = ctx.createRadialGradient(w * 0.52, h * 0.52, w * 0.10, w * 0.52, h * 0.52, w * 0.76);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.62, "rgba(0, 0, 0, 0.08)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.54)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------------------
  // HEADER E BARRA DI PROGRESSIONE
  // ---------------------------------------------------------------------------

  function drawHeader(ctx) {
    const w = ctx.canvas.width;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = Theme.colors.mapText;
    ctx.font = "22px system-ui, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("P H A S E  1", w / 2, 34);

    ctx.strokeStyle = Theme.colors.accentFaint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, 58);
    ctx.lineTo(w / 2 - 28, 58);
    ctx.moveTo(w / 2 + 28, 58);
    ctx.lineTo(w / 2 + 120, 58);
    ctx.stroke();

    drawDiamond(ctx, w / 2, 58, 6, Theme.colors.accent, false);
    ctx.restore();
  }

  // Barra lineare come nel riferimento: è la vera mappa della Phase.
  // Il fondale sotto è solo atmosfera.
  function drawPhaseProgress(ctx) {
    const nodes = GameState.nodes;
    const count = nodes.length;
    const w = ctx.canvas.width;
    const y = 96;
    const startX = 64;
    const endX = w - 64;
    const gap = count > 1 ? (endX - startX) / (count - 1) : 0;

    ctx.save();

    // Fascia scura morbida dietro la progressione: aumenta la leggibilità senza
    // trasformarla in un pannello HUD pesante.
    const band = ctx.createLinearGradient(0, y - 44, 0, y + 58);
    band.addColorStop(0, "rgba(0, 0, 0, 0)");
    band.addColorStop(0.34, "rgba(3, 8, 14, 0.36)");
    band.addColorStop(0.72, "rgba(3, 8, 14, 0.28)");
    band.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 48, w, 118);

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
    ctx.fillText(state, w / 2, 150);

    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText(title, w / 2, 176);
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

  // ---------------------------------------------------------------------------
  // ICONE MAPPA
  // ---------------------------------------------------------------------------

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