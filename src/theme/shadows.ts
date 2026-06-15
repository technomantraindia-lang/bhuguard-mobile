import { ViewStyle } from 'react-native';

export const shadows = {
  card: {
    shadowColor: '#064D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  elevated: {
    shadowColor: '#064D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
};
