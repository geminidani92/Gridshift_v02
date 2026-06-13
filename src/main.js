// main.js
// Avvio gioco

window.addEventListener("load", () => {
  Input.init();
  Engine.init("game");
  Engine.setScene(MapScene);
});
