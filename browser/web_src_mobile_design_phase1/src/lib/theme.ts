export type ThemePref = 'clair' | 'sombre' | 'systeme';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Applique le thème sur <html> (classe `dark`) et met à jour la couleur de la barre du navigateur. */
export function applyTheme(pref: ThemePref) {
  const dark = pref === 'sombre' || (pref === 'systeme' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#061D20' : '#0B565A');
  return dark;
}

/** Réagit aux changements du thème système quand la préférence est « Système ». */
export function watchSystemTheme(pref: ThemePref) {
  if (pref !== 'systeme') return () => {};
  const mq = media();
  const onChange = () => applyTheme('systeme');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
