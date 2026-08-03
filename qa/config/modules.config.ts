export interface QaModuleDef {
  id: string;
  label: string;
  phase: number;
  runner: 'preflight' | 'source' | 'unit' | 'integration' | 'api' | 'backend' | 'navigation' | 'e2e' | 'report';
}

export const QA_MODULES: QaModuleDef[] = [
  { id: 'environment', label: 'Environment Health', phase: 1, runner: 'preflight' },
  { id: 'source-health', label: 'Mobile Source Health', phase: 2, runner: 'source' },
  { id: 'translations', label: 'Translation Health', phase: 3, runner: 'source' },
  { id: 'assets', label: 'Asset Health', phase: 3, runner: 'source' },
  { id: 'api-discovery', label: 'API Endpoint Discovery', phase: 4, runner: 'api' },
  { id: 'api-health', label: 'API Health', phase: 5, runner: 'api' },
  { id: 'backend', label: 'Laravel Backend Health', phase: 6, runner: 'backend' },
  { id: 'auth', label: 'Authentication Contracts', phase: 7, runner: 'api' },
  { id: 'unit', label: 'Jest Unit Tests', phase: 8, runner: 'unit' },
  { id: 'integration', label: 'Jest Integration Tests', phase: 8, runner: 'integration' },
  { id: 'navigation', label: 'Navigation Health', phase: 9, runner: 'navigation' },
  { id: 'e2e', label: 'Maestro Android E2E', phase: 10, runner: 'e2e' },
];
