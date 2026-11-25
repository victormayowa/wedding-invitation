/* The reply card: show only the questions that apply. The form works without this file. */
(() => {
  'use strict';

  const form = document.querySelector('[data-reply-form]');
  if (!form) return;

  const groups = form.querySelectorAll('[data-when-attending]');
  const sync = () => {
    const choice = form.querySelector('input[name="attending"]:checked');
    groups.forEach((g) => g.classList.toggle('is-hidden', choice?.value === 'no'));
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'attending') sync();
  });
  sync();

  const stepper = form.querySelector('[data-stepper]');
  if (stepper) {
    const input = stepper.querySelector('input');
    const [less, more] = stepper.querySelectorAll('[data-step]');
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 1;
    const update = () => {
      const v = Number.parseInt(input.value, 10) || min;
      less.disabled = v <= min;
      more.disabled = v >= max;
    };
    [less, more].forEach((b) => {
      b.hidden = false;
      b.addEventListener('click', () => {
        const v = (Number.parseInt(input.value, 10) || min) + Number(b.dataset.step);
        input.value = String(Math.min(max, Math.max(min, v)));
        update();
      });
    });
    input.addEventListener('input', update);
    update();
  }

  const summary = document.querySelector('[data-error-summary]');
  if (summary) summary.focus();

  const submit = form.querySelector('[type="submit"]');
  const label = submit.textContent;
  form.addEventListener('submit', () => {
    window.setTimeout(() => {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }, 0);
  });
  window.addEventListener('pageshow', () => {
    submit.disabled = false;
    submit.textContent = label;
  });
})();
