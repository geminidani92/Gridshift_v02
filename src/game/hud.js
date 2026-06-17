// game/hud.js
// HUD Neon System (GridShift prototype)

const HUD = (() => {
  const C = {
    neon: Theme.colors.accent,
    neonSoft: Theme.colors.accentSoft,
    neonFaint: Theme.colors.accentFaint,
    glass: "rgba(10, 14, 22, 0.72)",
    glassEdge: "rgba(0, 229, 255, 0.18)",
    white: Theme.colors.text,
    win: "#00ff88",
    danger: Theme.colors.danger
  };

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = C.glass;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.glassEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = "rgba(0, 229, 255, 0.10)";
    ctx.fillRect(x, y, w, 3);
  }

  function glowText(ctx, text, x, y, color, font, align = 'left') {
    ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.shadowBlur = 0; ctx.fillStyle = C.white; ctx.globalAlpha = 0.9; ctx.fillText(text, x, y);
    ctx.restore();
  }

  function plainText(ctx, text, x, y, color, font, align='left') {
    ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(text,x,y); ctx.restore();
  }

  function formatScore(score){ const s=Math.max(0,score|0).toString(); return s.padStart(6,'0'); }

  function drawStageHUD(ctx,title,score){ const x=12,y=10,w=ctx.canvas.width-24,h=64; panel(ctx,x,y,w,h); glowText(ctx,title,x+14,y+28,C.neon,'700 20px system-ui, sans-serif'); plainText(ctx,'WASD/Frecce: muovi   •   Space/J: impulso   •   ESC: mappa',x+14,y+50,C.neonFaint,'13px system-ui, sans-serif'); plainText(ctx,'SCORE',x+w-140,y+24,C.neonFaint,'12px system-ui, sans-serif'); glowText(ctx,formatScore(score),x+w-14,y+46,C.neonSoft,'700 20px system-ui, sans-serif','right'); }

  function drawMapHUD(ctx,score){ const x=12,y=10,w=ctx.canvas.width-24,h=64; panel(ctx,x,y,w,h); glowText(ctx,'Mappa – Percorso',x+14,y+28,C.neon,'700 20px system-ui, sans-serif'); plainText(ctx,'WASD/Frecce: sposta cursore   •   Invio/Space: entra',x+14,y+50,C.neonFaint,'13px system-ui, sans-serif'); plainText(ctx,'SCORE',x+w-140,y+24,C.neonFaint,'12px system-ui, sans-serif'); glowText(ctx,formatScore(score),x+w-14,y+46,C.neonSoft,'700 20px system-ui, sans-serif','right'); }

  function drawMessage(ctx,text){ ctx.save(); ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); const w=Math.min(520,ctx.canvas.width-80),h=120,x=(ctx.canvas.width-w)/2,y=(ctx.canvas.height-h)/2; panel(ctx,x,y,w,h); const upper=(text||'').toUpperCase(); let col=C.neon; if(upper.includes('VITTORIA')||upper.includes('WIN')) col=C.win; if(upper.includes('COLPITO')||upper.includes('HIT')||upper.includes('MORT')) col=C.danger; glowText(ctx,text,ctx.canvas.width/2,y+72,col,'800 30px system-ui, sans-serif','center'); plainText(ctx,'Premi ESC per tornare alla mappa',ctx.canvas.width/2,y+100,'rgba(234, 246, 255, 0.6)','13px system-ui, sans-serif','center'); ctx.restore(); }

  function drawBottomMessage(ctx,text){ ctx.save(); const x=12,y=ctx.canvas.height-44,w=Math.min(ctx.canvas.width-24,620),h=32; panel(ctx,x,y,w,h); plainText(ctx,text,x+10,y+22,C.neonSoft,'13px system-ui, sans-serif'); ctx.restore(); }

  return { drawStageHUD, drawMapHUD, drawMessage, drawBottomMessage };
})();