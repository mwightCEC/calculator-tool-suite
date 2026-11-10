import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { Anchor } from '@mantine/core';
import classes from './FaqLink.module.css';

interface FaqLinkProps {
  /** The calculator's id from the tool registry, which is its section's anchor on the FAQ page. */
  toolId: string;
  /** e.g. "How this is calculated". */
  label: string;
}

/** A results card's link to the calculator's method section on the FAQ page. */
export function FaqLink({ toolId, label }: FaqLinkProps) {
  return (
    <div className={classes.root}>
      <Anchor component={Link} href={`/faq#${toolId}`} className={classes.link}>
        {label}
        <IconArrowRight size={14} stroke={2.25} aria-hidden="true" />
      </Anchor>
    </div>
  );
}
