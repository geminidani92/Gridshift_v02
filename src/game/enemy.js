// game/enemy.js
// Gestione nemici (red, orange)

const EnemySystem = (() => {
  let enemies = [];
  let cols = 0, rows = 0;
  let tilesRef = null;

  function manhattanDist(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  function findSafeEnemyPosition(prefX, prefY, playerGX, playerGY, tiles) {
    const SAFE_DIST = 3;
    if (manhattanDist(prefX, prefY, playerGX, playerGY) > SAFE_DIST) {
      return { x: prefX, y: prefY };
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = tiles[y][x];
        if (t.kind === "blocked") continue;
        const d = manhattanDist(x, y, playerGX, playerGY);
        if (d > SAFE_DIST) {
          return { x, y };
        }
      }
    }
    return { x: prefX, y: prefY }; // fallback
  }

  function initFromLevel(levelDef, tiles, c, r, playerGX, playerGY) {
    cols = c;
    rows = r;
    tilesRef = tiles;
    enemies = [];

    if (levelDef.enemies) {
      for (const e of levelDef.enemies) {
        const pos = findSafeEnemyPosition(e.gx, e.gy, playerGX, playerGY, tiles);
        enemies.push({
          gx: pos.x,
          gy: pos.y,
          kind: e.kind,    // "red" | "orange"
          state: "alive",  // "alive" | "edible"
          aiTimer: 0
        });
      }
    }
  }

  function update(dt) {
    if (!tilesRef) return;

    for (const e of enemies) {
      if (e.state !== "alive") continue;

      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiTimer = 0.6 + Math.random() * 0.4;

        const dirs = [
          { dx:  1, dy:  0 },
          { dx: -1, dy:  0 },
          { dx:  0, dy:  1 },
          { dx:  0, dy: -1 }
        ];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const nx = e.gx + d.dx;
        const ny = e.gy + d.dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const t = tilesRef[ny][nx];
          if (t.kind !== "blocked") {
            e.gx = nx;
            e.gy = ny;

            if (e.kind === "red" && !t.lockedByWave && t.kind === "normal") {
              t.value = 1 - t.value;
            }
            if (e.kind === "orange") {
              const nd = dirs[Math.floor(Math.random() * dirs.length)];
              const ax = e.gx + nd.dx;
              const ay = e.gy + nd.dy;
              if (ax >= 0 && ax < cols && ay >= 0 && ay < rows) {
                const at = tilesRef[ay][ax];
                if (!at.lockedByWave && at.kind === "normal") {
                  at.value = 1 - at.value;
                }
              }
            }
          }
        }
      }
    }
  }

  function onWaveFlip(x, y) {
    // chiamato da onde quando flippano una tile
    for (const e of enemies) {
      if (e.state === "alive" && e.gx === x && e.gy === y) {
        e.state = "edible";
      }
    }
  }

  function checkPlayerCollision(playerObj) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.gx === playerObj.gx && e.gy === playerObj.gy) {
        if (e.state === "alive") {
          playerObj.alive = false;
          AudioSys.play("player_hit");
        } else if (e.state === "edible") {
          GameState.score += 100;
          enemies.splice(i, 1);
          AudioSys.play("enemy_eaten");
        }
      }
    }
  }

  function draw(ctx, offsetX, offsetY, tileSize) {
    for (const e of enemies) {
		const sx = offsetX + e.gx * tileSize + tileSize / 4;
		const sy = offsetY + e.gy * tileSize + tileSize / 4;
		const size = tileSize / 2;

		if (e.state === "alive") {
		  if (e.kind === "red") {
			ctx.fillStyle = "#ff1744";
			ctx.shadowColor = "#ff1744";
			}
		  else if (e.kind === "orange") {
			ctx.fillStyle = "#ff9100";
			ctx.shadowColor = "#ff9100";
			}
		  ctx.shadowBlur = 10;
		}
		else if (e.state === "edible") {
		  ctx.fillStyle = "#00e5ff";
		  ctx.shadowColor = "#00e5ff";
		  ctx.shadowBlur = 10;
		}

		ctx.fillRect(sx, sy, size, size);
		ctx.shadowBlur = 0;

    }
  }

  return {
    initFromLevel,
    update,
    onWaveFlip,
    checkPlayerCollision,
    draw
  };
})();
