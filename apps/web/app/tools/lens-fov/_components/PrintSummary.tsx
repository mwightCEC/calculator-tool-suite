'use client';

import { useCallback } from 'react';
import type { LensFovResult } from '@cctv/calc-core';
import {
  PrintLayout,
  printClasses as classes,
} from '../../../../components/PrintLayout/PrintLayout';
import { buildPrintSummary } from '../_lib/print-summary';
import type { LensFovCalculatorState } from '../_state/lens-fov-calculator-state';
import { buildShareUrl } from '../_state/share-link';
import { CameraView } from './visuals/CameraView';
import { CoverageDiagram } from './visuals/CoverageDiagram';
import visualClasses from './visuals/Visuals.module.css';

interface PrintSummaryProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
}

/** Printable Lens / FOV summary (the Export feature), shown only when printing. */
export function PrintSummary({ state, result }: PrintSummaryProps) {
  const summary = buildPrintSummary(state, result);
  const getShareUrl = useCallback(() => buildShareUrl(state, window.location.href), [state]);

  return (
    <PrintLayout
      title="Lens / FOV summary"
      meta="Clinton Tool Suite · Lens / FOV"
      getShareUrl={getShareUrl}
    >
      <section className={classes.result}>
        <p className={classes.resultLabel}>{summary.headline.label}</p>
        <p className={classes.resultValue}>{summary.headline.value}</p>
        <p className={classes.resultRange}>{summary.headline.detail}</p>
      </section>

      <dl className={classes.figures}>
        {summary.keyFigures.map((figure) => (
          <div key={figure.label} className={classes.figure}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>

      {summary.warnings.map((warning) => (
        <p key={warning} className={classes.warning}>
          {warning}
        </p>
      ))}

      <div className={visualClasses.printDrawings}>
        <CameraView
          result={result}
          unit={state.lengthUnit}
          focalLengthMm={state.focalLengthMm}
          showPixelGrid={false}
        />
        <CoverageDiagram
          result={result}
          unit={state.lengthUnit}
          distancePrefix={summary.solvingDistance ? 'Farthest' : undefined}
        />
      </div>

      <h2 className={classes.heading}>Lens comparison</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Lens</th>
            <th scope="col" className={classes.number}>
              H. FOV
            </th>
            {summary.solvingDistance ? (
              <th scope="col" className={classes.number}>
                Farthest distance
              </th>
            ) : (
              <>
                <th scope="col" className={classes.number}>
                  Width
                </th>
                <th scope="col" className={classes.number}>
                  Pixel density
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {summary.lensRows.map((row) => (
            <tr key={row.focalLengthMm}>
              <td>
                {row.lens}
                {row.current && ' (current)'}
              </td>
              <td className={classes.number}>{row.fov}</td>
              <td className={classes.number}>{row.reach}</td>
              {!summary.solvingDistance && <td className={classes.number}>{row.density}</td>}
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

      <h2 className={classes.heading}>Pixel density guidance</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">IEC 62676-4:2014 level</th>
            <th scope="col" className={classes.number}>
              PPM
            </th>
            <th scope="col" className={classes.number}>
              ≈ PPF
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.guidanceRows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className={classes.number}>{row.ppm}</td>
              <td className={classes.number}>{row.ppf}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={classes.heading}>Notes</h2>
      <ul className={classes.notes}>
        {summary.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </PrintLayout>
  );
}
