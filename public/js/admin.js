/* Admin conveniences. Every action also works without this file. */
(() => {
  'use strict';

  document.addEventListener('submit', (e) => {
    const message = e.target.dataset.confirm;
    if (message && !window.confirm(message)) e.preventDefault();
  });

  document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const before = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = before;
      }, 1800);
    } catch {
      window.prompt('Copy:', text);
    }
  });

  const file = document.querySelector('[data-csv-file]');
  const area = document.getElementById('csv');
  if (file && area) {
    file.addEventListener('change', async () => {
      const f = file.files?.[0];
      if (f) area.value = await f.text();
    });
  }
})();
