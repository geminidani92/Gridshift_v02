// game/player.js
// Gestione player su griglia

const Player = (() => {
  const obj = {
    gx: 0,
    gy: 0,
    color: "#ffeb3b",
    alive: true

  };

	// Movimento a ripetizione quando tieni premuto
	let moveHoldDir = null; // {dx, dy, codes: [...]}
	let moveHoldTimer = 0;
	const MOVE_INITIAL_DELAY = 0.10; // ritardo prima del repeat
	const MOVE_REPEAT_DELAY  = 0.10; // intervallo tra passi successivi


  function resetOnLevel(tiles, cols, rows) {
    obj.alive = true;
    // trova prima tile non bloccata
    outer: for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (tiles[y][x].kind !== "blocked") {
          obj.gx = x;
          obj.gy = y;
          break outer;
        }
      }
    }
  }

  function tryMove(dx, dy, tiles, cols, rows) {
    const nx = obj.gx + dx;
    const ny = obj.gy + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    const t = tiles[ny][nx];
    if (t.kind === "blocked") return;
    obj.gx = nx;
    obj.gy = ny;
  }

  function update(dt, tiles, cols, rows) {
    if (!obj.alive) return;

    // 1) controlliamo se c'è UNA nuova direzione premuta in questo frame
    const dirs = [
      { dx: -1, dy:  0, codes: ["ArrowLeft", "KeyA"] },
      { dx:  1, dy:  0, codes: ["ArrowRight", "KeyD"] },
      { dx:  0, dy: -1, codes: ["ArrowUp", "KeyW"] },
      { dx:  0, dy:  1, codes: ["ArrowDown", "KeyS"] }
    ];

    let newDir = null;

    for (const d of dirs) {
      if (d.codes.some(c => Input.isPressed(c))) {
        newDir = d;
        break;
      }
    }

    if (newDir) {
      // Primo passo immediato nella nuova direzione
      tryMove(newDir.dx, newDir.dy, tiles, cols, rows);
      moveHoldDir = newDir;
      moveHoldTimer = MOVE_INITIAL_DELAY;
      return;
    }

    // 2) Se non c'è un nuovo input ma stiamo TENENDO premuto
    if (moveHoldDir) {
      const stillDown = moveHoldDir.codes.some(c => Input.isDown(c));

      if (!stillDown) {
        // tasto rilasciato → stop repeat
        moveHoldDir = null;
        return;
      }

      // tasto ancora giù → countdown del repeat
      moveHoldTimer -= dt;
      if (moveHoldTimer <= 0) {
        // nuovo passo
        tryMove(moveHoldDir.dx, moveHoldDir.dy, tiles, cols, rows);
        moveHoldTimer = MOVE_REPEAT_DELAY;
      }
    }
  }


function draw(ctx, offsetX, offsetY, tileSize) {
  const px = offsetX + obj.gx * tileSize + tileSize / 4;
  const py = offsetY + obj.gy * tileSize + tileSize / 4;
  const size = tileSize / 2;

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 15;
  ctx.fillRect(px, py, size, size);
  ctx.shadowBlur = 0;
}


  return {
    obj,
    resetOnLevel,
    update,
    draw
  };
})();
