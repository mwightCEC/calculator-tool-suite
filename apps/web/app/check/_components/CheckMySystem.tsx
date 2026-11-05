'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { Alert, Button, Loader, Stack, Text, Title } from '@mantine/core';
import { decodeCartHash, type CartLinkResult } from '../_lib/cart-payload';
import { describeCartSummary } from '../_lib/check-labels';
import { planChecks } from '../_lib/plan-checks';
import { allowedReturnUrl } from '../_lib/return-url';
import { NotCheckedList } from './NotCheckedList';
import { VoltageDropCheckCard } from './VoltageDropCheckCard';

/**
 * The page a cart's "Check my system" button opens. The cart arrives in the URL
 * fragment (#cart=…), which browsers never send to a server, so it is read here
 * in the browser after the page loads.
 */
export function CheckMySystem() {
  const [result, setResult] = useState<CartLinkResult | null>(null);

  useEffect(() => {
    const read = () => setResult(decodeCartHash(window.location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  return (
    <Stack gap="lg" maw={760}>
      <div>
        <Title order={2}>Check my system</Title>
        <Text c="dimmed">
          Checks for the products in your cart, ready to open in the calculators.
        </Text>
      </div>
      <CheckContent result={result} />
    </Stack>
  );
}

function CheckContent({ result }: { result: CartLinkResult | null }) {
  if (result === null) {
    return <Loader size="sm" aria-label="Reading your cart" />;
  }
  if (result.status === 'none') {
    return (
      <Stack gap="sm" align="flex-start">
        <Text>
          This page opens from the Check my system button in a cart. To start from scratch, choose a
          calculator.
        </Text>
        <Button component={Link} href="/" variant="light">
          All tools
        </Button>
      </Stack>
    );
  }
  if (result.status === 'invalid') {
    return (
      <Alert color="amber" icon={<IconAlertTriangle />} title="This cart link couldn’t be read">
        <Stack gap="sm" align="flex-start">
          <Text size="sm">
            It may be incomplete or from a newer version. You can still use the calculators on their
            own.
          </Text>
          <Button component={Link} href="/" variant="light" size="xs">
            All tools
          </Button>
        </Stack>
      </Alert>
    );
  }

  const { cart } = result;
  const plan = planChecks(cart);
  const returnUrl = allowedReturnUrl(cart.returnUrl);

  return (
    <Stack gap="lg">
      <Text fw={500}>{describeCartSummary(plan.summary)}</Text>

      {plan.voltageDrop.length ? (
        <Stack gap="md">
          {plan.voltageDrop.map((check) => (
            <VoltageDropCheckCard key={`${check.kind}:${check.volts}`} check={check} />
          ))}
          <Text size="sm" c="dimmed">
            Your cart can’t say how long each cable is, so every run starts at 100 ft of 18 AWG.
            Enter your real lengths and wire size in the calculator: the results depend on them.
          </Text>
        </Stack>
      ) : (
        <Alert color="gray" title="Nothing in this cart can be checked yet">
          <Text size="sm">
            The products below explain why. You can still use the calculators on their own.
          </Text>
        </Alert>
      )}

      {plan.skipped.length > 0 && <NotCheckedList lines={plan.skipped} />}

      {returnUrl && (
        <Button
          component="a"
          href={returnUrl}
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          w="fit-content"
        >
          Back to cart
        </Button>
      )}
    </Stack>
  );
}
