/* Procedural pixel-star layer shared by the home and work pages. */
(() => {
  const cosmos = document.querySelector('.cosmos');
  if (!cosmos) return;

  const compact = window.innerWidth <= 760;
  const area = Math.max(window.innerWidth * window.innerHeight, 320 * 640);
  const count = compact ? 22 : Math.min(48, Math.max(32, Math.round(area / 30000)));
  const colors = ['#ffffff', '#f8f5df', '#e4f3ff', '#f3ebff'];
  const field = document.createElement('span');
  const fragment = document.createDocumentFragment();
  field.className = 'star-field';

  for (let index = 0; index < count; index++) {
    const star = document.createElement('i');
    const roll = Math.random();
    const type = roll < .08 ? 'flare' : roll < .3 ? 'spark' : 'pin';
    let x = 2 + Math.random() * 96;
    let y = 3 + Math.random() * 89;

    // Keep the central title readable while retaining a natural scattered field.
    if (x > 17 && x < 83 && y > 31 && y < 67 && Math.random() < .86) {
      y = Math.random() < .5 ? 6 + Math.random() * 20 : 72 + Math.random() * 18;
    }

    const size = type === 'flare' ? 4 : type === 'spark' ? 2 : 1;
    const duration = 4.4 + Math.random() * 3.8;
    const alpha = .34 + Math.random() * .55;
    star.className = `space-star ${type} twinkle-${index % 3}`;
    star.style.setProperty('--x', `${x.toFixed(2)}%`);
    star.style.setProperty('--y', `${y.toFixed(2)}%`);
    star.style.setProperty('--size', `${size}px`);
    star.style.setProperty('--star-color', colors[index % colors.length]);
    star.style.setProperty('--star-alpha', alpha.toFixed(2));
    star.style.setProperty('--star-mid-alpha', (alpha * .7).toFixed(2));
    star.style.setProperty('--star-low-alpha', (alpha * .44).toFixed(2));
    star.style.setProperty('--duration', `${duration.toFixed(2)}s`);
    star.style.setProperty('--delay', `${(-Math.random() * duration).toFixed(2)}s`);
    fragment.append(star);
  }

  field.append(fragment);
  cosmos.prepend(field);
})();
