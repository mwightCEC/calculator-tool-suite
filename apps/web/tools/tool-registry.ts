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
  /** One-line summary shown on the home page grid. */
  description: string;
  icon: Icon;
  route: string;
  status: ToolStatus;
}

/** Single source of truth for the sidebar and the home page tool grid. */
export const TOOLS: readonly ToolDefinition[] = [
  {
    id: 'storage',
    name: 'Storage',
    description:
      'Size recorder drives for a retention target, or estimate retention from capacity.',
    icon: IconDatabase,
    route: '/tools/storage',
    status: 'available',
  },
  {
    id: 'bandwidth',
    name: 'Bandwidth',
    description: 'Estimate network throughput for camera streams and remote viewing.',
    icon: IconNetwork,
    route: '/tools/bandwidth',
    status: 'coming-soon',
  },
  {
    id: 'poe-budget',
    name: 'PoE budget',
    description: 'Check camera power draw against switch and injector PoE budgets.',
    icon: IconPlug,
    route: '/tools/poe-budget',
    status: 'coming-soon',
  },
  {
    id: 'voltage-drop',
    name: 'Voltage drop',
    description: 'Calculate voltage drop over cable runs for low-voltage power.',
    icon: IconBolt,
    route: '/tools/voltage-drop',
    status: 'coming-soon',
  },
  {
    id: 'lens-fov',
    name: 'Lens / FOV',
    description: 'Work out field of view and pixels per foot for a lens and sensor.',
    icon: IconAperture,
    route: '/tools/lens-fov',
    status: 'coming-soon',
  },
];
