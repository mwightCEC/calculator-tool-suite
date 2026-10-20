'use client';

import { useEffect, useState } from 'react';
import type { StorageCalculationResult } from '@cctv/calc-core';
import { flushSync } from 'react-dom';
import { buildPrintSummary } from '../../_lib/print-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import classes from './PrintSummary.module.css';

interface PrintContext {
  printedAt: string;
  url: string;
}

interface PrintSummaryProps {
  state: StorageCalculatorState;
  result: StorageCalculationResult;
}

/**
 * Printable summary of the calculation (the Export feature). Hidden on screen and
 * shown only when printing, while the interactive page is hidden. Plain HTML with
 * its own stylesheet so the printout is always light, whatever the colour scheme.
 */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const [context, setContext] = useState<PrintContext | null>(null);
  const summary = buildPrintSummary(state, result);

  // The date and link are only known in the browser at print time (Export button or Ctrl+P).
  useEffect(() => {
    const capturePrintContext = () => {
      flushSync(() =>
        setContext({
          printedAt: new Date().toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          url: buildShareUrl(state, window.location.href),
        })
      );
    };
    window.addEventListener('beforeprint', capturePrintContext);
    return () => window.removeEventListener('beforeprint', capturePrintContext);
  }, [state]);

  return (
    <article className={classes.summary}>
      <header className={classes.header}>
        <h1 className={classes.title}>Storage calculation summary</h1>
        <p className={classes.meta}>
          CCTV tool suite · {summary.modeLabel}
          {context && ` · ${context.printedAt}`}
        </p>
      </header>

      <section className={classes.result}>
        <p className={classes.resultLabel}>
          {summary.headline.label} <span className={classes.source}>{summary.sourceLabel}</span>
        </p>
        <p className={classes.resultValue}>{summary.headline.value}</p>
        {summary.headline.likelyRange && (
          <p className={classes.resultRange}>{summary.headline.likelyRange}</p>
        )}
        <p className={classes.drives}>
          {summary.drives}, {summary.raid}
          {summary.sizedForHigh && ' · sized for the high estimate'}
        </p>
      </section>

      <dl className={classes.figures}>
        {summary.keyFigures.map((figure) => (
          <div key={figure.label} className={classes.figure}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className={classes.heading}>Capacity breakdown</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Segment</th>
            <th scope="col" className={classes.number}>
              Capacity
            </th>
            <th scope="col" className={classes.number}>
              Share of raw
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.capacity.map((row) => (
            <tr key={row.label} className={row.isTotal ? classes.total : undefined}>
              <td>{row.label}</td>
              <td className={classes.number}>{row.tb}</td>
              <td className={classes.number}>{row.share}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={classes.heading}>Camera groups</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col" className={classes.number}>
              Cameras
            </th>
            <th scope="col">Camera</th>
            <th scope="col">Scene</th>
            <th scope="col">Recording</th>
            <th scope="col">Bitrate per camera</th>
            <th scope="col" className={classes.number}>
              Group total
            </th>
            <th scope="col" className={classes.number}>
              Per day
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.groups.map((group) => (
            <tr key={group.name + group.camera}>
              <td>{group.name}</td>
              <td className={classes.number}>{group.cameras}</td>
              <td>{group.camera}</td>
              <td>{group.scene}</td>
              <td>{group.recording}</td>
              <td>{group.bitrate}</td>
              <td className={classes.number}>{group.totalMbps}</td>
              <td className={classes.number}>{group.perDay}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={classes.heading}>Storage settings</h2>
      <dl className={classes.settings}>
        {summary.settings.map((setting) => (
          <div key={setting.label}>
            <dt>{setting.label}</dt>
            <dd>{setting.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className={classes.heading}>Notes</h2>
      <ul className={classes.notes}>
        {summary.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      {context && (
        <p className={classes.link}>
          Open this calculation online: <span className={classes.url}>{context.url}</span>
        </p>
      )}
    </article>
  );
}
