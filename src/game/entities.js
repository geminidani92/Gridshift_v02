// game/entities.js
// StageScene: gestisce griglia, tile, onde, integrazione player/nemici

const StageScene = (() => {
  let TILE_SIZE = 40;
  let OFFSET_X = 120;
  let OFFSET_Y = 80;
  const WAVE_STEP_TIME = 0.08;

  let levelIndex = 0;
  let levelDef = null;
  let cols = 0, rows = 0;

  let tiles = []; // tiles[y][x] = { kind, value, lockedByWave, waveId, chainIndex }
  let waves = []; // { id, type, segments:[{x,y,timer,_done}], lockedTiles, done }
  let nextWaveId = 1;

  let stageWon = false;
  let messageTimer = 0;
  
  // Stato della sequenza delle chain tile (1,2,3,...)
  let chainProgress = 0; // ultimo numero corretto raggiunto
  let chainMax = 0;      // valore massimo tra le chain presenti nel livello

  //funzione per calcolare il layout
	function computeLayout() {
	  const canvas = Engine.getCanvas();

	  // Spazio “riservato” per HUD + margini
	  const TOP_UI = 90;      // HUD alto circa 64 + respiro
	  const PAD_X  = 40;
	  const PAD_Y  = 30;

	  const availW = canvas.width  - PAD_X * 2;
	  const availH = canvas.height - TOP_UI - PAD_Y * 2;

	  // scegli tile size che ci sta, con clamp
	  const sizeByW = Math.floor(availW / cols);
	  const sizeByH = Math.floor(availH / rows);
	  TILE_SIZE = Math.max(26, Math.min(64, Math.min(sizeByW, sizeByH)));

	  const gridW = cols * TILE_SIZE;
	  const gridH = rows * TILE_SIZE;

	  OFFSET_X = Math.floor((canvas.width - gridW) / 2);
	  OFFSET_Y = TOP_UI + Math.floor((canvas.height - TOP_UI - gridH) / 2);
	}

  function startLevel(idx) {
    levelIndex = idx;
    levelDef = LevelsConfig[idx];

    cols = levelDef.cols;
    rows = levelDef.rows;

    // tiles setup
    tiles = [];
    for (let y = 0; y < rows; y++) {
      tiles[y] = [];
      const rowStr = levelDef.layout[y] || "";
      for (let x = 0; x < cols; x++) {
        const ch = rowStr[x] || ".";
        let kind = "normal";
        if (ch === "#") kind = "blocked";

        tiles[y][x] = {
          kind,
          value: 0,
          lockedByWave: false,
          waveId: null,
          chainIndex: null,
		  flash: 1, // 0..1 (1 = nessun flash, colore stabile)
		  flashDir: 0 // 1 = andando verso ON, -1 = andando verso OFF, 0 = stabile
        };
      }
    }

    // speciali
    if (levelDef.specials) {
      for (const s of levelDef.specials) {
        const t = tiles[s.y][s.x];
        if (!t) continue;
        if (s.type === "trigger") t.kind = "trigger";
        if (s.type === "goal")   t.kind = "goal";
        if (s.type === "chain")  { t.kind = "chain"; t.chainIndex = s.index || 1; }
      }
    }
    
	// Inizializza stato chain
    chainProgress = 0;
    chainMax = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = tiles[y][x];
        if (t.kind === "chain") {
          if (t.chainIndex > chainMax) {
            chainMax = t.chainIndex;
          }
        }
      }
    }

    // player
    Player.resetOnLevel(tiles, cols, rows);

    // nemici
    EnemySystem.initFromLevel(
      levelDef,
      tiles,
      cols,
      rows,
      Player.obj.gx,
      Player.obj.gy
    );

    waves = [];
    nextWaveId = 1;
    stageWon = false;
    messageTimer = 0;
	computeLayout();
  }

  function enter() {
    // chiamata da Engine.setScene
  }

  // ---------------------------
  // ONDE
  // ---------------------------
  function canStartWaveFrom(x, y) {
    const t = tiles[y][x];
    if (!t || t.kind === "blocked") return false;
    if (t.lockedByWave) return false;
    return true;
  }

  function startWaveFromPlayer() {
    const { gx, gy } = Player.obj;
    if (!Player.obj.alive) return;
    if (!canStartWaveFrom(gx, gy)) return;

    const originTile = tiles[gy][gx];
    const originValue = originTile.value;
    const waveType = originValue === 0 ? "paint" : "erase";

    // niente onde di tipo opposto in contemporanea
    for (const w of waves) {
      if (!w.done && w.type !== waveType) {
        messageTimer = 1.0;
        return;
      }
    }

    const prevValues = tiles.map(row => row.map(t => t.value));

    // flip immediato della tile sotto il player
    const prevOrigin = originTile.value;
    originTile.value = waveType === "paint" ? 1 : 0;
    onTileFlipped(gx, gy, prevOrigin, originTile.value);

    const waveId = nextWaveId++;
    const segments = [];
    const lockedTiles = [];

    lockTileForWave(gx, gy, waveId, lockedTiles, segments, 0);

    const dirs = [
      { dx:  1, dy:  0 },
      { dx: -1, dy:  0 },
      { dx:  0, dy:  1 },
      { dx:  0, dy: -1 }
    ];

    for (const d of dirs) {
      let cx = gx + d.dx;
      let cy = gy + d.dy;
      let steps = 1;
      let foundAnchor = false;

      const anchorTarget = (waveType === "paint") ? 1 : 0;

      while (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
        const tile = tiles[cy][cx];

        if (tile.kind === "blocked") break;
        if (tile.lockedByWave && tile.waveId !== waveId) break;

        // anchor: tile che aveva il valore "target"
        if (prevValues[cy][cx] === anchorTarget) {
          foundAnchor = true;
          const dist = steps - 1;
          for (let i = 1; i <= dist; i++) {
            const ix = gx + d.dx * i;
            const iy = gy + d.dy * i;
            const t2 = tiles[iy][ix];
            if (t2.kind === "blocked") continue;
            if (t2.lockedByWave && t2.waveId !== waveId) break;
            lockTileForWave(ix, iy, waveId, lockedTiles, segments, i);
          }
          break;
        }

        cx += d.dx;
        cy += d.dy;
        steps++;
      }

      if (!foundAnchor) {
        // nessuna tile in quella direzione, ok
      }
    }

    waves.push({
      id: waveId,
      type: waveType,
      segments,
      lockedTiles,
      done: segments.length === 0
    });

    AudioSys.play("wave");
  }

  function lockTileForWave(x, y, waveId, lockedTiles, segments, delaySteps) {
    const t = tiles[y][x];
    if (!t.lockedByWave) {
      t.lockedByWave = true;
      t.waveId = waveId;
      lockedTiles.push({ x, y });
      segments.push({
        x,
        y,
        timer: delaySteps * WAVE_STEP_TIME,
        _done: false
      });
    }
  }

  // Chiamata ogni volta che una tile cambia valore (0->1 o 1->0)
  function onTileFlipped(x, y, prevValue, newValue) {
    const t = tiles[y][x];
	if (!t) return;

	//aggiunta dell'envelope dei colori
	// Colore ADSR: se diventa ON, parte un flash (attack->decay). Se diventa OFF, flash diverso indicato dopo.
	if (prevValue === 0 && newValue === 1) {
	  t.flash = 0; // start envelope
	  t.flashDir = 1; // accensione
	}
	
	//se diventa OFF, parte un flash diverso
	if (prevValue === 1 && newValue === 0) {
	  t.flash = 0;
	  t.flashDir = -1; // spegnimento
	}

    // ---- LOGICA CHAIN ----
    if (t.kind === "chain") {
      // Se una chain torna a 0, resettiamo il progresso
      if (newValue === 0) {
        chainProgress = 0;
        return;
      }

      // Se è una attivazione 0->1, controlliamo l'ordine
      if (prevValue === 0 && newValue === 1) {
        const idx = t.chainIndex || 1;
        const expected = chainProgress + 1;

        if (idx === expected) {
          // ok, avanziamo nella sequenza
          chainProgress = idx;
        } else {
          // ordine sbagliato: reset della sequenza
          chainProgress = 0;
          // tutte le chain tornano a 0
          for (let yy = 0; yy < rows; yy++) {
            for (let xx = 0; xx < cols; xx++) {
              const tt = tiles[yy][xx];
              if (tt.kind === "chain") {
                tt.value = 0;
              }
            }
          }
        }
      }
    }

    // ---- LOGICA TRIGGER ----
    if (t.kind === "trigger") {
      // facciamo partire l'effetto solo su 0->1
      if (prevValue === 0 && newValue === 1) {
        const dirs = [
          { dx:  1, dy:  0 },
          { dx: -1, dy:  0 },
          { dx:  0, dy:  1 },
          { dx:  0, dy: -1 }
        ];
        for (const d of dirs) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const nt = tiles[ny][nx];
          // se la tile è bloccata, la sblocchiamo
          if (nt.kind === "blocked") {
            nt.kind = "normal";
            nt.value = 0;
            nt.lockedByWave = false;
            nt.waveId = null;
          }
        }
      }
    }

    // Per ora le goal non hanno logica speciale: si comportano come normali
  }


    function updateWaves(dt) {
    for (const w of waves) {
      if (w.done) continue;

      let allDone = true;

      // 1) aggiorna i timer
      for (const seg of w.segments) {
        if (seg.timer > 0) {
          seg.timer -= dt;
          if (seg.timer < 0) seg.timer = 0;
        }
      }

      // 2) quando il timer arriva a 0, flippa la tile
      for (const seg of w.segments) {
        if (seg.timer === 0 && !seg._done) {
          const t = tiles[seg.y][seg.x];
          const prevVal = t.value;

          if (w.type === "paint") t.value = 1;
          else t.value = 0;

          // logica tile (chain, trigger, ecc.)
          onTileFlipped(seg.x, seg.y, prevVal, t.value);

          // nemici colpiti dall'onda
          EnemySystem.onWaveFlip(seg.x, seg.y);

          seg._done = true;
          AudioSys.play("flip");
        }
      }

      // 3) controlla se tutti i segmenti di quest'onda sono finiti
      for (const seg of w.segments) {
        if (!seg._done) {
          allDone = false;
          break;
        }
      }

      // 4) se sì, sblocca le tile della wave e marca done
      if (allDone) {
        for (const p of w.lockedTiles) {
          const t = tiles[p.y][p.x];
          if (t.waveId === w.id) {
            t.lockedByWave = false;
            t.waveId = null;
          }
        }
        w.done = true;
      }
    }
  }

/*
	function updateTileEnvelopes(dt) {
	  // Attack/Decay in secondi
	  const ATTACK = 0.05; // flash subito
	  const DECAY  = 0.18; // ritorno morbido al base

	  // Convertiamo in velocità di avanzamento 0..1
	  // useremo: flash = 0 all'inizio, poi va a 1 (stabile)
	  const speed = 1 / (ATTACK + DECAY);

	  for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
		  const t = tiles[y][x];
		  if (t.kind === "blocked") continue;

		  // Solo se è ON ha senso "stabilizzare" verso 1
		  if (t.value === 1) {
			if (t.flash < 1) {
			  t.flash += dt * speed;
			  if (t.flash > 1) t.flash = 1;
			}
		  } else {
			// OFF: tienilo stabile (nessun envelope)
			t.flash = 1;
		  }
		}
	  }
	}
*/

	//FUNZIONE che gestisce la velocità dell'envelope
	function updateTileEnvelopes(dt) {
	  const SPEED = 6; // velocità generale envelope

	  for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
		  const t = tiles[y][x];
		  if (t.kind === "blocked") continue;

		  if (t.flashDir !== 0) {
			t.flash += dt * SPEED;

			if (t.flash >= 1) {
			  t.flash = 1;
			  t.flashDir = 0; // finito envelope
			}
		  }
		}
	  }
	}


  // ---------------------------
  // VITTORIA / SCONFITTA
  // ---------------------------
  function checkStageVictory() {
    // tutte le tile non bloccate devono essere a 1
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = tiles[y][x];
        if (t.kind === "blocked") continue;
        if (t.value !== 1) return false;
      }
    }

    // se esistono chain nel livello, la sequenza deve essere completa
    if (chainMax > 0 && chainProgress !== chainMax) {
      return false;
    }

    return true;
  }



  function handleVictory() {
    stageWon = true;
    messageTimer = 1.5;
    AudioSys.play("win");

    const nodes = GameState.nodes;
    const node = nodes.find(n => n.levelIndex === levelIndex);
    if (node && node.state !== "completed") {
      node.state = "completed";
      unlockSuccessors(node);
    }

    setTimeout(() => {
      Engine.setScene(MapScene);
    }, 800);
  }

  function restartLevel() {
    startLevel(levelIndex);
  }

  // ---------------------------
  // UPDATE + DRAW
  // ---------------------------
  function update(dt) {
    if (!Player.obj.alive) {
      messageTimer -= dt;
      if (messageTimer <= 0) {
        restartLevel();
      }
      return;
    }

    if (Input.isPressed("Escape")) {
      Engine.setScene(MapScene);
      return;
    }

    Player.update(dt, tiles, cols, rows);

    if (Input.isPressed("Space") || Input.isPressed("KeyJ")) {
      startWaveFromPlayer();
    }

    updateWaves(dt);
	updateTileEnvelopes(dt); //per l'envelope che va aggiornato dopo l'onda
    EnemySystem.update(dt);
    EnemySystem.checkPlayerCollision(Player.obj);

    if (!stageWon && checkStageVictory()) {
      handleVictory();
    }

    if (messageTimer > 0) {
      messageTimer -= dt;
    }
  }

  // ---------------------------
  // SETUP DI DRAW E FUNZIONI DI SUPPORTO
  // ---------------------------

	function lerp(a, b, t) { return a + (b - a) * t; }

  //conversione da esadecimale a RGB 
	function hexToRgb(hex) {
	  const h = hex.replace("#", "");
	  return {
		r: parseInt(h.slice(0,2), 16),
		g: parseInt(h.slice(2,4), 16),
		b: parseInt(h.slice(4,6), 16)
	  };
	}

  //colori basic
	const ON_ATTACK = hexToRgb(Theme.colors.tileOnAttack);
	const ON_BASE   = hexToRgb(Theme.colors.tileOnBase);

  //effetto flash
	function onColorFromFlash(flash01) {
	  // flash01: 0=appena acceso (molto attack), 1=stabile (base)
	  //const t = flash01; // lineare (poi possiamo fare easing)
	  //const t = flash01 * flash01; // ease-in (decay più dolce)
	  const t = 1 - Math.pow(1 - flash01, 3); // ease-out (attack più aggressivo)

	  const r = Math.round(lerp(ON_ATTACK.r, ON_BASE.r, t));
	  const g = Math.round(lerp(ON_ATTACK.g, ON_BASE.g, t));
	  const b = Math.round(lerp(ON_ATTACK.b, ON_BASE.b, t));
	  return `rgb(${r},${g},${b})`;
	}


  //ora disegna con draw

  function draw(ctx) {
    // sfondo globale
    ctx.fillStyle = Theme.colors.background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);


    // HUD sopra
    HUD.drawStageHUD(ctx, levelDef ? levelDef.name : "Stage", GameState.score);

    // griglia (tile) disegnata sopra il pavimento dell'arena
    // griglia
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = tiles[y][x];
        const sx = OFFSET_X + x * TILE_SIZE;
        const sy = OFFSET_Y + y * TILE_SIZE;

        // --- SFONDO TILE --- vecchio
		/*
		if (t.kind === "blocked") {
		  ctx.fillStyle = "#0a0c12"; //#00e5ff
		} else {
		  if (t.value === 0) {
			ctx.fillStyle = "#1a1f2e";
		  } else {
			ctx.fillStyle = "#00e5ff";
			ctx.shadowColor = "#00e5ff";
			ctx.shadowBlur = 12;
		  }
		}
		*/
		
		// --- SFONDO TILE --- nuovo 
		// --- SFONDO TILE --- con ATTACK + RELEASE
		if (t.kind === "blocked") {
		  ctx.fillStyle = Theme.colors.tileBlocked;
		}
		else {
		  if (t.value === 1) {
			// tile ON normale (attack → sustain)
			ctx.fillStyle = onColorFromFlash(t.flash);
		  }
		  else {
			// tile OFF
			if (t.flashDir === -1) {
			  // stiamo facendo release visivo
			  ctx.fillStyle = onColorFromFlash(1 - t.flash);
			} else {
			  ctx.fillStyle = Theme.colors.tileOff; // OFF stabile
			}
		  }
		}


		//variabili per la gestione del bordo con GAP 
		const GAP = 2; // prova 1 o 2
		const px = sx + GAP / 2;
		const py = sy + GAP / 2;
		const sz = TILE_SIZE - GAP;
		// base fill
		ctx.fillRect(px, py, sz, sz);
		ctx.shadowBlur = 0; //nuova aggiunta
		
		//glow solo sul bordo
		/*
		if (t.kind !== "blocked" && t.value === 1) {
		  ctx.shadowColor = "#00e5ff";
		  ctx.shadowBlur = 10;

		  ctx.strokeStyle = "rgba(0, 229, 255, 0.9)";
		  ctx.lineWidth = 2;
		  ctx.strokeRect(px + 1, py + 1, sz - 2, sz - 2);

		  ctx.shadowBlur = 0;
		}
		*/
		
		if (t.kind !== "blocked" && t.value === 1) {
		  const glow = 6 + (1 - t.flash) * 18; // forte all'inizio, poi cala
		  ctx.shadowColor = Theme.colors.tileOnGlow;
		  ctx.shadowBlur = glow;
		  // bordo (se lo usi)
		  ctx.strokeStyle = Theme.colors.tileOnGlow; //"rgba(0,229,255,0.9)";
		  ctx.lineWidth = 2;
		  ctx.strokeRect(px + 1, py + 1, sz - 2, sz - 2);
		  ctx.shadowBlur = 0;
		}

		

        // --- BORDO BASE SEMPRE VISIBILE ---
		//ctx.strokeStyle = "rgba(0, 229, 255, 0.2)"; //nuovo colore
		ctx.strokeStyle = Theme.colors.tileBorder; //nuovo colore 2
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, sz - 1, sz - 1);
		
        // --- ICONA / EVIDENZA TILE SPECIALE ---
        if (t.kind === "trigger") {
          // Trigger: solo un "+" al centro per ora
          ctx.fillStyle = "#ff9800";
          ctx.font = "bold 16px sans-serif";
          const txt = "+";
          const tw = ctx.measureText(txt).width;
          const tx = sx + TILE_SIZE / 2 - tw / 2;
          const ty = sy + TILE_SIZE / 2 + 6;
          ctx.fillText(txt, tx, ty);

        } else if (t.kind === "goal") {
          // Goal: stellina semplice (solo estetica per ora)
          ctx.fillStyle = "#ffeb3b";
          ctx.font = "16px sans-serif";
          const txt = "★";
          const tw = ctx.measureText(txt).width;
          const tx = sx + TILE_SIZE / 2 - tw / 2;
          const ty = sy + TILE_SIZE / 2 + 6;
          ctx.fillText(txt, tx, ty);

        } else if (t.kind === "chain") {
          // CHAIN: bordo + numero colorati, niente dischi

          const idx = t.chainIndex || 1;
          const done = idx <= chainProgress;

          // se la chain è già "raggiunta" → verde, altrimenti arancione
          const borderColor = done ? "#8bc34a" : "#ff9800";
          const textColor   = borderColor;

          // Bordo interno evidenziato
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Numero al centro
          ctx.fillStyle = textColor;
          ctx.font = "bold 16px sans-serif";
          const txt = String(idx);
          const tw = ctx.measureText(txt).width;
          const tx = sx + TILE_SIZE / 2 - tw / 2;
          const ty = sy + TILE_SIZE / 2 + 6;
          ctx.fillText(txt, tx, ty);

        } else if (t.kind === "blocked") {
          // Bloccata: mettiamo un "#" giusto per ricordarlo
          ctx.fillStyle = "#b0bec5";
          ctx.font = "14px sans-serif";
          const txt = "#";
          const tw = ctx.measureText(txt).width;
          const tx = sx + TILE_SIZE / 2 - tw / 2;
          const ty = sy + TILE_SIZE / 2 + 5;
          ctx.fillText(txt, tx, ty);
        }

        // --- EVIDENZA TILE BLOCCATA DALL'ONDA ---
        if (t.lockedByWave) {
          ctx.strokeStyle = Theme.colors.tileWaveLock;
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 4, sy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
      }
    }


    EnemySystem.draw(ctx, OFFSET_X, OFFSET_Y, TILE_SIZE);
    Player.draw(ctx, OFFSET_X, OFFSET_Y, TILE_SIZE);

    if (!Player.obj.alive) {
      HUD.drawMessage(ctx, "Sei stato colpito!");
    } else if (stageWon) {
      HUD.drawMessage(ctx, "VITTORIA!");
    } else if (messageTimer > 0) {
      HUD.drawBottomMessage(ctx, "Non puoi lanciare un'onda opposta adesso.");
    }
  }

  return {
    enter,
    update,
    draw,
    startLevel
  };
})();