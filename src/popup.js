const originalTextDiv = document.getElementById('original-text');
const translatedTextDiv = document.getElementById('translated-text');

window.popupAPI.onTranslationData((event, { original, translated }) => {
  originalTextDiv.textContent = original;
  translatedTextDiv.textContent = translated;

  // Use requestAnimationFrame to wait for next paint before calculating height
  requestAnimationFrame(() => {
    const height = document.body.scrollHeight;
    window.popupAPI.resizePopup(height);
  });
});