'use client';

import type { RecordedStreams } from '@cctv/calc-core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { RECORDED_STREAMS_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';

interface RecordingCardProps {
  recordedStreams: RecordedStreams;
  onChange: (recordedStreams: RecordedStreams) => void;
}

export function RecordingCard({ recordedStreams, onChange }: RecordingCardProps) {
  return (
    <InputCard id="bandwidth-recording-title" title="Recording">
      <FieldRow
        label="Recorded streams"
        help="Streams the recorder pulls from every camera. Some recorders also record the sub-stream, for example for faster playback or smart search."
        controlId="bandwidth-recorded-streams"
      >
        <OptionButtons
          id="bandwidth-recorded-streams"
          value={recordedStreams}
          onChange={onChange}
          options={RECORDED_STREAMS_OPTIONS}
          aria-labelledby={fieldLabelId('bandwidth-recorded-streams')}
        />
      </FieldRow>
    </InputCard>
  );
}
