'use client';

import { useCallback } from 'react';
import type { VoltageDropResult } from '@cctv/calc-core';
import {
  PrintLayout,
  printClasses as classes,
} from '../../../../components/PrintLayout/PrintLayout';
import { buildPrintSummary } from '../_lib/print-summary';
import { buildShareUrl } from '../_state/share-link';
import type { VoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';

interface PrintSummaryProps {
  state: VoltageDropCalculatorState;
  result: VoltageDropResult;
}

/** Printable voltage drop summary (the Export feature), shown only when printing. */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const summary = buildPrintSummary(state, result);
  const getShareUrl = useCallback(() => buildShareUrl(state, window.location.href), [state]);

  return (
    <PrintLayout
      title="Voltage drop summary"
      meta="Clinton Tool Suite · Voltage drop"
      getShareUrl={getShareUrl}
    >
      <section className={classes.result}>
        <p className={classes.resultLabel}>
          Worst voltage drop <span className={classes.source}>{summary.statusLabel}</span>
        </p>
        <p className={classes.resultValue}>{summary.drop.value}</p>
        <p className={classes.resultRange}>{summary.drop.detail}</p>
      </section>

      <dl className={classes.figures}>
        {summary.keyFigures.map((figure) => (
          <div key={figure.label} className={classes.figure}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>

      {summary.problems.map((problem) => (
        <p key={problem} className={classes.warning}>
          {problem}
        </p>
      ))}

      <h2 className={classes.heading}>Device groups</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col" className={classes.number}>
              Devices
            </th>
            <th scope="col">Load each</th>
            <th scope="col">Wire</th>
            <th scope="col">Run</th>
            <th scope="col">Drop · at device</th>
            <th scope="col">Smallest wire</th>
            <th scope="col">Longest run</th>
          </tr>
        </thead>
        <tbody>
          {summary.runs.map((run) => (
            <tr key={run.key}>
              <td>{run.name}</td>
              <td className={classes.number}>{run.devices}</td>
              <td>{run.load}</td>
              <td>{run.wire}</td>
              <td>{run.run}</td>
              <td>{run.drop}</td>
              <td>{run.smallestWire}</td>
              <td>{run.longestRun}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={classes.heading}>Settings</h2>
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
    </PrintLayout>
  );
}
