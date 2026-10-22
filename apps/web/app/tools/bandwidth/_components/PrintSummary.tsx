'use client';

import { useCallback } from 'react';
import type { BandwidthResult } from '@cctv/calc-core';
import {
  PrintLayout,
  printClasses as classes,
} from '../../../../components/PrintLayout/PrintLayout';
import { buildPrintSummary } from '../_lib/print-summary';
import type { BandwidthCalculatorState } from '../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../_state/share-link';

interface PrintSummaryProps {
  state: BandwidthCalculatorState;
  result: BandwidthResult;
}

/** Printable Bandwidth summary (the Export feature), shown only when printing. */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const summary = buildPrintSummary(state, result);
  const getShareUrl = useCallback(() => buildShareUrl(state, window.location.href), [state]);

  return (
    <PrintLayout
      title="Bandwidth calculation summary"
      meta="CCTV tool suite · Bandwidth"
      getShareUrl={getShareUrl}
    >
      <section className={classes.result}>
        <p className={classes.resultLabel}>
          Recorder ingest <span className={classes.source}>{summary.sourceLabel}</span>
        </p>
        <p className={classes.resultValue}>{summary.ingest.value}</p>
        {summary.ingest.likelyRange && (
          <p className={classes.resultRange}>{summary.ingest.likelyRange}</p>
        )}
      </section>

      <dl className={classes.figures}>
        {summary.keyFigures.map((figure) => (
          <div key={figure.label} className={classes.figure}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>

      {summary.links.length > 0 && (
        <>
          <h2 className={classes.heading}>Network checks</h2>
          <table className={classes.table}>
            <thead>
              <tr>
                <th scope="col">Link</th>
                <th scope="col" className={classes.number}>
                  Capacity
                </th>
                <th scope="col" className={classes.number}>
                  Load
                </th>
                <th scope="col" className={classes.number}>
                  Used
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.links.map((row) => (
                <tr key={row.key}>
                  <td>{row.link}</td>
                  <td className={classes.number}>{row.capacity}</td>
                  <td className={classes.number}>{row.load}</td>
                  <td className={classes.number}>{row.utilisation}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.warning && <p className={classes.warning}>{summary.warning}</p>}
        </>
      )}

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
            <th scope="col">Sub-stream</th>
            <th scope="col">Main bitrate per camera</th>
            <th scope="col" className={classes.number}>
              Main total
            </th>
            <th scope="col" className={classes.number}>
              Sub total
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
              <td>{group.subStream}</td>
              <td>{group.bitrate}</td>
              <td className={classes.number}>{group.mainTotal}</td>
              <td className={classes.number}>{group.subTotal}</td>
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
