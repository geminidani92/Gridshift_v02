// game/hud.js
// HUD Neon System (GridShift prototype)

const HUD = (() => {
  // Palette HUD (coerente con skin neon)
  const C = {
    neon: "#00e5ff",
    neonSoft: "rgba(0, 229, 255, 0.65)",
    neonFaint: "rgba(0, 229, 255, 0.35)",
    glass: "rgba(10, 14, 22, 0.72)",
    glassEdge: "rgba(0, 229, 255, 0.18)",
    white: "#eaf6ff",
    win: "#00ff88",
    danger: "#ff1744"
  };

  function panel(ctx, x, y, w, h) {
    // sfondo "glass"
    ctx.fillStyle = C.glass;
    ctx.fillRect(x, y, w, h);

    // bordo sottile neon
    ctx.strokeStyle = C.glassEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // barra neon in alto (accent)
    ctx.fillStyle = "rgba(0, 229, 255, 0.10)";
    ctx.fillRect(x, y, w, 3);
  }

  function glowText(ctx, text, x, y, color, font, align = "left") {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    // passata "crisp" sopra (meno blur) per leggibilità
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.9;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function plainText(ctx, text, x, y, color, font, align = "left") {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function formatScore(score) {
    // 000123 vibe arcade
    const s = Math.max(0, score | 0).toString();
    return s.padStart(6, "0");
  }

  function drawStageHUD(ctx, title, score) {
    // Top panel
    const x = 12, y = 10, w = ctx.canvas.width - 24, h = 64;
    panel(ctx, x, y, w, h);

    // Title (primario)
    glowText(ctx, title, x + 14, y + 28, C.neon, "700 20px system-ui, sans-serif", "left");

    // Controls (fondo)
    plainText(
      ctx,
      "WASD/Frecce: muovi   •   Space/J: impulso   •   ESC: mappa",
      x + 14,
      y + 50,
      C.neonFaint,
      "13px system-ui, sans-serif",
      "left"
    );

    // Score (a destra)
    plainText(ctx, "SCORE", x + w - 140, y + 24, C.neonFaint, "12px system-ui, sans-serif", "left");
    glowText(ctx, formatScore(score), x + w - 14, y + 46, C.neonSoft, "700 20px system-ui, sans-serif", "right");
  }

  function drawMapHUD(ctx, score) {
    const x = 12, y = 10, w = ctx.canvas.width - 24, h = 64;
    panel(ctx, x, y, w, h);

    glowText(ctx, "Mappa – Percorso", x + 14, y + 28, C.neon, "700 20px system-ui, sans-serif", "left");

    plainText(
      ctx,
      "WASD/Frecce: sposta cursore   •   Invio/Space: entra",
      x + 14,
      y + 50,
      C.neonFaint,
      "13px system-ui, sans-serif",
      "left"
    );

    plainText(ctx, "SCORE", x + w - 140, y + 24, C.neonFaint, "12px system-ui, sans-serif", "left");
    glowText(ctx, formatScore(score), x + w - 14, y + 46, C.neonSoft, "700 20px system-ui, sans-serif", "right");
  }

  function drawMessage(ctx, text) {
    // overlay scuro con vignetta leggera
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // box centrale "glass"
    const w = Math.min(520, ctx.canvas.width - 80);
    const h = 120;
    const x = (ctx.canvas.width - w) / 2;
    const y = (ctx.canvas.height - h) / 2;

    panel(ctx, x, y, w, h);

    // colore in base al testo (semplice ma efficace)
    const upper = (text || "").toUpperCase();
    let col = C.neon;
    if (upper.includes("VITTORIA") || upper.includes("WIN")) col = C.win;
    if (upper.includes("COLPITO") || upper.includes("HIT") || upper.includes("MORT")) col = C.danger;

    glowText(ctx, text, ctx.canvas.width / 2, y + 72, col, "800 30px system-ui, sans-serif", "center");

    // hint sotto
    plainText(
      ctx,
      "Premi ESC per tornare alla mappa",
      ctx.canvas.width / 2,
      y + 100,
      "rgba(234, 246, 255, 0.6)",
      "13px system-ui, sans-serif",
      "center"
    );

    ctx.restore();
  }

  function drawBottomMessage(ctx, text) {
    // toast in basso a sinistra (glass + neon)
    ctx.save();
    const pad = 10;
    const x = 12;
    const y = ctx.canvas.height - 44;
    const w = Math.min(ctx.canvas.width - 24, 620);
    const h = 32;

    panel(ctx, x, y, w, h);
    plainText(ctx, text, x + pad, y + 22, C.neonSoft, "13px system-ui, sans-serif", "left");

    ctx.restore();
  }

  return {
    drawStageHUD,
    drawMapHUD,
    drawMessage,
    drawBottomMessage
  };
})();
