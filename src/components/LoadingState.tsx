import { InlineLoader } from './shared/BrandedLoader';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading Bhuguard…' }: LoadingStateProps) {
  return <InlineLoader message={message} />;
}
