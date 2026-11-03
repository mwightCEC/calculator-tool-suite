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
        <p className={classes.resultLabel}>
          {summary.headline.label} <span className={classes.source}>{summary.doriLevel}</span>
        </p>
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

      <h2 className={classes.heading}>DORI distances</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col" className={classes.number}>
              Density
            </th>
            <th scope="col" className={classes.number}>
              Up to
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.doriRows.map((row) => (
            <tr key={row.level}>
              <td>
                {row.label}
                {row.met && ' (met)'}
              </td>
              <td className={classes.number}>{row.density}</td>
              <td className={classes.number}>{row.distance}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={classes.heading}>Lens comparison</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Lens</th>
            <th scope="col" className={classes.number}>
              FOV
            </th>
            <th scope="col" className={classes.number}>
              {summary.solvingDistance ? 'Up to' : 'Width'}
            </th>
            {!summary.solvingDistance && (
              <>
                <th scope="col" className={classes.number}>
                  Density
                </th>
                <th scope="col">DORI</th>
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
              {!summary.solvingDistance && (
                <>
                  <td className={classes.number}>{row.density}</td>
                  <td>{row.level}</td>
                </>
              )}
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
