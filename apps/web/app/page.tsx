import { Container, Text, Title } from '@mantine/core';

// Placeholder home page. The tool grid and app shell arrive in Milestone 3.
export default function HomePage() {
  return (
    <Container component="main" py="xl">
      <Title order={1}>CCTV tool suite</Title>
      <Text c="dimmed">Calculators for CCTV installers and system designers.</Text>
    </Container>
  );
}
