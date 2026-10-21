'use client';

import { OVERHEAD_PERCENTS, type OverheadPercent } from '@cctv/calc-core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import { OVERHEAD_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';

interface OverheadCardProps {
  overheadPercent: OverheadPercent;
  onChange: (overheadPercent: OverheadPercent) => void;
}

export function OverheadCard({ overheadPercent, onChange }: OverheadCardProps) {
  return (
    <InputCard id="bandwidth-overhead-title" title="Overhead">
      <FieldRow
        label="Allowance"
        help="Added to every total to cover network protocol overhead and short bitrate bursts above the average."
        controlId="bandwidth-overhead"
      >
        <OptionButtons
          id="bandwidth-overhead"
          value={String(overheadPercent)}
          onChange={(value) => {
            const percent = parseOption(OVERHEAD_PERCENTS, value);
            if (percent !== undefined) {
              onChange(percent);
            }
          }}
          options={OVERHEAD_OPTIONS}
          aria-labelledby={fieldLabelId('bandwidth-overhead')}
        />
      </FieldRow>
    </InputCard>
  );
}
