export type DemoPreset = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'vite-error',
    title: 'Broken React/Vite App',
    description: 'A developer is blocked by a frontend error overlay.',
    prompt:
      'Demo scenario: The screenshot shows a React/Vite app with a red error overlay saying an imported component cannot be resolved. What is wrong, what is the likely root cause, and what exact fix should I try first?',
  },
  {
    id: 'dashboard-ui',
    title: 'Confusing Enterprise Dashboard',
    description: 'A support/ops dashboard is visually dense and hard to act on.',
    prompt:
      'Demo scenario: The screenshot shows a cluttered enterprise dashboard with unclear metrics, weak hierarchy, and no obvious next action. What is wrong with this dashboard UI and how should I improve it?',
  },
  {
    id: 'analytics-chart',
    title: 'Ambiguous Analytics Screen',
    description: 'An operator needs help interpreting a chart-heavy screen quickly.',
    prompt:
      'Demo scenario: The screenshot shows an analytics screen with multiple charts and alerts but no clear recommendation. What should an operator notice and what is the next action?',
  },
];
