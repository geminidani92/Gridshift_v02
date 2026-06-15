// core/engine.js
// Loop principale + gestione scena

const Engine = (() => {
  let canvas, ctx;
  let currentScene = null;
  let lastTime = 0;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;

    if (currentScene) {
      if (currentScene.update) currentScene.update(dt);
      if (currentScene.draw) currentScene.draw(ctx);
    }

    // fine frame input (pulisce i "pressed")
    if (typeof Input !== "undefined") {
      Input.endFrame();
    }

    requestAnimationFrame(loop);
  }

  function setScene(scene) {
    currentScene = scene;
    if (currentScene && currentScene.enter) {
      currentScene.enter();
    }
  }

  function getCanvas() {
    return canvas;
  }

  return {
    init,
    setScene,
    getCanvas
  };
})();
