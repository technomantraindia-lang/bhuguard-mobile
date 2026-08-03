import { OfficerTabNavigator } from '../../../navigation/OfficerTabNavigator';
import { useFieldOfficerMandatoryCheckIn } from '../../../hooks/useFieldOfficerMandatoryCheckIn';
import { FieldOfficerMandatoryCheckInScreen } from './FieldOfficerMandatoryCheckInScreen';

/**
 * Blocks access to the FO tab navigator until an active duty check-in
 * session is confirmed with the server. Fail-closed on status errors.
 */
export function FieldOfficerCheckInGate() {
  const checkIn = useFieldOfficerMandatoryCheckIn();

  if (checkIn.phase === 'granted') {
    return <OfficerTabNavigator />;
  }

  return (
    <FieldOfficerMandatoryCheckInScreen
      phase={checkIn.phase}
      statusMessage={checkIn.statusMessage}
      stage={checkIn.stage}
      submitting={checkIn.submitting}
      submitError={checkIn.submitError}
      onRetryStatus={checkIn.checkStatus}
      onSubmitCheckIn={() => {
        void checkIn.submitCheckIn();
      }}
    />
  );
}
