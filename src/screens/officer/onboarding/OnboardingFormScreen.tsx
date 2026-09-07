import type { ReactNode } from 'react';

import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import { OnboardingStepShell } from '../../../components/onboarding/OnboardingStepShell';

interface OnboardingFormScreenProps {
  title: string;
  subtitle: string;
  stepCurrent: number;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  footerError?: string | null;
  footerExtra?: ReactNode;
}

/** @deprecated Prefer OnboardingStepShell directly. Wrapper kept for existing step screens. */
export function OnboardingFormScreen({
  title,
  subtitle,
  stepCurrent,
  children,
  onNext,
  nextLabel,
  nextLoading = false,
  nextDisabled = false,
  footerError = null,
  footerExtra = null,
}: OnboardingFormScreenProps) {
  return (
    <OnboardingStepShell
      stepCurrent={stepCurrent}
      title={title}
      subtitle={subtitle}
      onNext={onNext}
      nextLabel={nextLabel ?? ONBOARDING_NEXT_LABELS[stepCurrent] ?? 'Continue'}
      nextLoading={nextLoading}
      nextDisabled={nextDisabled}
      footerError={footerError}
      footerExtra={footerExtra}
    >
      {children}
    </OnboardingStepShell>
  );
}

export { OnboardingTextField as FormField } from '../../../components/onboarding/OnboardingFormFields';
