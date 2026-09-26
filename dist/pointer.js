(() => {
  'use strict';

  // No external assets or custom cursor image: this works in any desktop browser.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const follower = document.createElement('div');
  follower.className = 'pointer-follower';
  follower.setAttribute('aria-hidden', 'true');
  document.body.appendChild(follower);

  let frame = 0;
  let visible = false;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  const enabled = () => finePointer.matches && !reducedMotion.matches;
  const render = () => {
    follower.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const hide = () => {
    visible = false;
    cancelAnimationFrame(frame);
    frame = 0;
    follower.classList.remove('is-visible', 'is-interactive', 'is-pressed');
  };
  const follow = () => {
    frame = 0;
    if (!visible || !enabled()) return;

    x += (targetX - x) * .24;
    y += (targetY - y) * .24;
    const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < .15;
    if (settled) {
      x = targetX;
      y = targetY;
    }
    render();
    if (!settled) frame = requestAnimationFrame(follow);
  };

  document.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType !== 'mouse') {
      hide();
      return;
    }

    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) {
      x = targetX;
      y = targetY;
      render();
      visible = true;
      follower.classList.add('is-visible');
    }

    const interactive = event.target instanceof Element && event.target.closest(
      'a[href], button:not(:disabled), summary, [role="button"], [role="tab"]'
    );
    follower.classList.toggle('is-interactive', Boolean(interactive));
    if (!frame) frame = requestAnimationFrame(follow);
  }, { passive: true });

  document.addEventListener('pointerdown', event => {
    if (visible && event.pointerType === 'mouse') {
      follower.classList.add('is-pressed');
    }
  }, { passive: true });
  document.addEventListener('pointerup', () => {
    follower.classList.remove('is-pressed');
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) hide();
  }, { passive: true });
  document.addEventListener('pointercancel', hide, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') hide();
  });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  finePointer.addEventListener('change', hide);
  reducedMotion.addEventListener('change', hide);
})();
