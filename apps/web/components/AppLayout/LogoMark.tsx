import classes from './LogoMark.module.css';

/** Decorative camera mark; the adjacent text provides the accessible name. */
export function LogoMark() {
  return (
    <svg className={classes.mark} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className={classes.tile} width="32" height="32" rx="6" />
      <path className={classes.body} d="M7 12h13l5-3v14l-5-3H7z" />
      <circle className={classes.lens} cx="13" cy="16" r="2.5" />
    </svg>
  );
}
