import type { ReactNode } from 'react';

import { useFieldOfficerMandatoryCheckIn } from '../../../hooks/useFieldOfficerMandatoryCheckIn';
import { FieldOfficerMandatoryCheckInScreen } from './FieldOfficerMandatoryCheckInScreen';

type Props = {
  children: ReactNode;
};

/**
 * Blocks the entire Field Officer app shell until an active duty check-in
 * session is confirmed with the server. Fail-closed on status errors.
 * Children (dashboard + stack routes) never mount while blocked.
 */
export function FieldOfficerCheckInGate({ children }: Props) {
  const checkIn = useFieldOfficerMandatoryCheckIn();

  if (checkIn.phase === 'granted') {
    return <>{children}</>;
  }

  return (
    <FieldOfficerMandatoryCheckInScreen
      phase={checkIn.phase}
      statusMessage={checkIn.statusMessage}
      stage={checkIn.stage}
      submitting={checkIn.submitting}
      submitError={checkIn.submitError}
      roleTitle={checkIn.roleTitle}
      userName={checkIn.userName}
      userId={checkIn.userId}
      assignedAreaSummary={checkIn.assignedAreaSummary}
      assignedAreasDetail={checkIn.assignedAreasDetail}
      onRetryStatus={() => checkIn.checkStatus()}
      onSubmitCheckIn={() => {
        void checkIn.submitCheckIn();
      }}
      onRefreshAssignments={() => {
        void checkIn.refreshAssignments();
      }}
    />
  );
}
