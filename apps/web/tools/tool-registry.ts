import {
  IconAperture,
  IconBolt,
  IconDatabase,
  IconNetwork,
  IconPlug,
  type Icon,
} from '@tabler/icons-react';

export type ToolStatus = 'available' | 'coming-soon';

export interface ToolDefinition {
  id: string;
  name: string;
  /** Page heading, shown in the header bar while the tool is open. */
  title: string;
  /** Line under the title in the header bar. */
  subtitle: string;
  /** One-line summary shown on the home page grid. */
  description: string;
  icon: Icon;
  route: string;
  status: ToolStatus;
}

/** Header bar heading outside a tool, e.g. on the All tools page. */
export const SUITE_HEADING = {
  title: 'Tool Suite',
  subtitle: 'Calculators for CCTV installers and system designers.',
} as const;

/** The tool whose pages include this path, if any. */
export function findToolByPath(pathname: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => pathname.startsWith(tool.route));
}

/** Single source of truth for the sidebar and the home page tool grid. */
export const TOOLS: readonly ToolDefinition[] = [
  {
    id: 'storage',
    name: 'Storage',
    title: 'Storage Calculator',
    subtitle: 'Calculate based on storage needed or with a designated capacity.',
    description: 'Calculate based on storage needed or with a designated capacity.',
    icon: IconDatabase,
    route: '/tools/storage',
    status: 'available',
  },
  {
    id: 'bandwidth',
    name: 'Bandwidth',
    title: 'Bandwidth Calculator',
    subtitle: 'Estimate network bandwidth for camera streams and remote viewing.',
    description: 'Estimate network throughput for camera streams and remote viewing.',
    icon: IconNetwork,
    route: '/tools/bandwidth',
    status: 'available',
  },
  {
    id: 'poe-budget',
    name: 'PoE budget',
    title: 'PoE Budget Calculator',
    subtitle: 'Check camera power draw against a switch or NVR PoE budget.',
    description: 'Check camera power draw against switch and injector PoE budgets.',
    icon: IconPlug,
    route: '/tools/poe-budget',
    status: 'available',
  },
  {
    id: 'voltage-drop',
    name: 'Voltage drop',
    title: 'Voltage Drop Calculator',
    subtitle: 'Check voltage drop on low-voltage power runs to cameras and other devices.',
    description: 'Calculate voltage drop over cable runs for low-voltage power.',
    icon: IconBolt,
    route: '/tools/voltage-drop',
    status: 'available',
  },
  {
    id: 'lens-fov',
    name: 'Lens / FOV',
    title: 'Lens / FOV Calculator',
    subtitle: 'Work out field of view and pixels per foot for a lens and sensor.',
    description: 'Work out field of view and pixels per foot for a lens and sensor.',
    icon: IconAperture,
    route: '/tools/lens-fov',
    status: 'coming-soon',
  },
];
