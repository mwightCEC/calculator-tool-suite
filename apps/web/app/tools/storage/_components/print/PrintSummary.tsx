'use client';

import { useCallback } from 'react';
import type { StorageCalculationResult } from '@cctv/calc-core';
import {
  PrintLayout,
  printClasses as classes,
} from '../../../../../components/PrintLayout/PrintLayout';
import { buildPrintSummary } from '../../_lib/print-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';

interface PrintSummaryProps {
  state: StorageCalculatorState;
  result: StorageCalculationResult;
}

/** Printable Storage summary (the Export feature), shown only when printing. */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const summary = buildPrintSummary(state, result);
  const getShareUrl = useCallback(() => buildShareUrl(state, window.location.href), [state]);

  return (
    <PrintLayout
      title="Storage calculation summary"
      meta={`CCTV tool suite · ${summary.modeLabel}`}
      getShareUrl={getShareUrl}
    >
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
            <tr key={row.key} className={row.isTotal ? classes.total : undefined}>
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
            <tr key={group.key}>
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
    </PrintLayout>
  );
}
