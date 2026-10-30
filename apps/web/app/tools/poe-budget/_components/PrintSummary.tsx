'use client';

import { useCallback } from 'react';
import type { PoeResult } from '@cctv/calc-core';
import {
  PrintLayout,
  printClasses as classes,
} from '../../../../components/PrintLayout/PrintLayout';
import { buildPrintSummary } from '../_lib/print-summary';
import type { PoeCalculatorState } from '../_state/poe-calculator-state';
import { buildShareUrl } from '../_state/share-link';

interface PrintSummaryProps {
  state: PoeCalculatorState;
  result: PoeResult;
}

/** Printable PoE budget summary (the Export feature), shown only when printing. */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const summary = buildPrintSummary(state, result);
  const getShareUrl = useCallback(() => buildShareUrl(state, window.location.href), [state]);

  return (
    <PrintLayout
      title="PoE budget summary"
      meta="Clinton Tool Suite · PoE budget"
      getShareUrl={getShareUrl}
    >
      <section className={classes.result}>
        <p className={classes.resultLabel}>
          PoE budget used <span className={classes.source}>{summary.statusLabel}</span>
        </p>
        <p className={classes.resultValue}>{summary.usage.value}</p>
        <p className={classes.resultRange}>{summary.usage.detail}</p>
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
            <th scope="col">Power</th>
            <th scope="col">Cable</th>
            <th scope="col" className={classes.number}>
              Per device
            </th>
            <th scope="col" className={classes.number}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.groups.map((group) => (
            <tr key={group.key}>
              <td>{group.name}</td>
              <td className={classes.number}>{group.devices}</td>
              <td>{group.power}</td>
              <td>{group.cable}</td>
              <td className={classes.number}>{group.perDevice}</td>
              <td className={classes.number}>{group.total}</td>
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
