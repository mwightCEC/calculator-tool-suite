'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import classes from './PrintLayout.module.css';

/** Shared print styles for the summary content (tables, figures, notes). */
export { classes as printClasses };

interface PrintContext {
  printedAt: string;
  url: string;
}

interface PrintLayoutProps {
  title: string;
  /** Shown under the title, before the print date, e.g. "Clinton Tool Suite · Storage needed". */
  meta: string;
  /** Share link for the current state, printed at the end. */
  getShareUrl: () => string;
  children: ReactNode;
}

/**
 * Frame for a printable calculation summary (the Export feature). Hidden on screen
 * and shown only when printing, while the calculator's layout hides itself.
 * Plain HTML with its own stylesheet so the printout is always light, whatever
 * the colour scheme.
 */
export function PrintLayout({ title, meta, getShareUrl, children }: PrintLayoutProps) {
  const [context, setContext] = useState<PrintContext | null>(null);

  // The date and link are only known in the browser at print time (Export button or Ctrl+P).
  useEffect(() => {
    const capturePrintContext = () => {
      flushSync(() =>
        setContext({
          printedAt: new Date().toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          url: getShareUrl(),
        })
      );
    };
    window.addEventListener('beforeprint', capturePrintContext);
    return () => window.removeEventListener('beforeprint', capturePrintContext);
  }, [getShareUrl]);

  return (
    <article className={classes.summary}>
      <header className={classes.header}>
        <h1 className={classes.title}>{title}</h1>
        <p className={classes.meta}>
          {meta}
          {context && ` · ${context.printedAt}`}
        </p>
      </header>

      {children}

      {context && (
        <p className={classes.link}>
          Open this calculation online: <span className={classes.url}>{context.url}</span>
        </p>
      )}
    </article>
  );
}
