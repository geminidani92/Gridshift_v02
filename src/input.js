// core/input.js
// Gestione input globale (tasti premuti / appena premuti)

const Input = (() => {
  const keysDown = new Set();
  const keysPressed = new Set();

  function init() {
    window.addEventListener("keydown", (e) => {
      if (!keysDown.has(e.code)) {
        keysPressed.add(e.code);
      }
      keysDown.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      keysDown.delete(e.code);
    });
  }

  function isDown(code) {
    return keysDown.has(code);
  }

  function isPressed(code) {
    return keysPressed.has(code);
  }

  function endFrame() {
    keysPressed.clear();
  }

  return {
    init,
    isDown,
    isPressed,
    endFrame
  };
})();
