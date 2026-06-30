// core/theme.js
// Palette centralizzata del gioco.
//
// Regola pratica:
// - colori gameplay/UI globali: accent, tile, text, map...
// - colori specifici della schermata Phase 1: phase...
//
// Se vogliamo cambiare look senza cercare stringhe sparse nei file,
// partiamo da qui.

const Theme = {
  colors: {
    accent: "#00e5ff",
    accentBright: "#00ffff",
    accentSoft: "rgba(0, 229, 255, 0.65)",
    accentFaint: "rgba(0, 229, 255, 0.35)",
    accentRgb: "0, 229, 255",

    background: "#10121c",
    panel: "#13151f",
    tileOff: "#1a1f2e",
    tileBlocked: "#0a0c12",
    tileOnAttack: "#00ffff",
    tileOnBase: "#124b5a",
    tileOnGlow: "#00ffff",
    tileWaveLock: "#00d5ff",
    tileBorder: "rgba(255,255,255,0.08)",

    text: "#eaf6ff",

    mapPath: "#4f7cff",
    mapPathLocked: "#44495a",
    mapUnlocked: "#4fc3f7",
    mapSelected: "#ffeb3b",
    mapText: "#eaf6ff",

    success: "#8bc34a",
    warning: "#ff9800",
    danger: "#ff1744",

    // -----------------------------------------------------------------------
    // Phase Progress Scene / sfondo contemplativo
    // -----------------------------------------------------------------------
    // Questi token controllano la schermata della mappa Phase 1.
    // Quando useremo un'immagine statica come fondale, resteranno comunque utili
    // per overlay, luce gialla, barra e fallback procedurale.

    phaseSkyTop: "#06101c",
    phaseSkyMid: "#0b2232",
    phaseSkyLow: "#091520",
    phaseSkyBottom: "#05070c",

    phaseHazeCore: "rgba(0, 229, 255, 0.18)",
    phaseHazeMid: "rgba(0, 120, 170, 0.10)",
    phaseHazeOuter: "rgba(0, 40, 65, 0.07)",

    phaseStarRgb: "0, 229, 255",

    phaseFarTop: "rgba(25, 57, 78, 0.40)",
    phaseFarFront: "rgba(9, 24, 38, 0.76)",
    phaseFarSide: "rgba(4, 12, 22, 0.88)",
    phaseFarEdge: "rgba(0, 229, 255, 0.045)",

    phaseMidTop: "rgba(25, 68, 86, 0.46)",
    phaseMidFront: "rgba(7, 22, 34, 0.92)",
    phaseMidSide: "rgba(3, 10, 18, 0.98)",
    phaseMidEdge: "rgba(0, 229, 255, 0.07)",

    phaseForegroundTop: "rgba(20, 47, 60, 0.72)",
    phaseForegroundFront: "rgba(4, 13, 22, 0.96)",
    phaseForegroundSide: "rgba(2, 7, 13, 1)",
    phaseForegroundEdge: "rgba(0, 229, 255, 0.08)",

    phaseWindowLight: "rgba(0, 229, 255, 0.55)",

    phaseStairActiveTop: "rgba(210, 236, 226, 0.90)",
    phaseStairActiveFront: "rgba(72, 92, 91, 0.86)",
    phaseStairActiveSide: "rgba(28, 42, 44, 0.94)",
    phaseStairInactiveTop: "rgba(31, 52, 64, 0.86)",
    phaseStairInactiveFront: "rgba(12, 24, 34, 0.90)",
    phaseStairInactiveSide: "rgba(6, 14, 23, 0.96)",
    phaseStairInactiveEdge: "rgba(0, 229, 255, 0.10)",

    // Luce dinamica del gradino selezionato.
    // Cambiando questi valori si cambia subito il colore della selezione.
    phaseLightRgb: "255, 230, 86",
    phaseLightCoreRgb: "255, 246, 170",
    phaseLight: "rgba(255, 230, 86, 0.82)",
    phaseLightSoft: "rgba(255, 230, 86, 0.34)",
    phaseLightGlow: "rgba(255, 230, 86, 0.95)",
    phaseLightEdge: "rgba(255, 230, 86, 0.65)",
    phaseLightFill: "rgba(255, 230, 86, 0.14)",

    phaseSummitFrontActive: "rgba(82, 62, 24, 0.86)",
    phaseSummitSideActive: "rgba(34, 24, 12, 0.96)",
    phaseSummitTopInactive: "rgba(34, 54, 66, 0.78)",
    phaseSummitFrontInactive: "rgba(12, 24, 34, 0.92)",
    phaseSummitSideInactive: "rgba(5, 12, 20, 0.98)",
    phaseSummitEdgeInactive: "rgba(234, 246, 255, 0.12)",

    phaseShadow: "rgba(0, 0, 0, 0.26)",
    phaseOverlayTop: "rgba(0, 0, 0, 0)",
    phaseOverlayMid: "rgba(42, 96, 120, 0.10)",
    phaseOverlayBottom: "rgba(0, 0, 0, 0.30)",
    phaseVignetteMid: "rgba(0, 0, 0, 0.08)",
    phaseVignetteOuter: "rgba(0, 0, 0, 0.54)",
    phaseProgressBand: "rgba(3, 8, 14, 0.36)",
    phaseProgressBandSoft: "rgba(3, 8, 14, 0.28)"
  }
};