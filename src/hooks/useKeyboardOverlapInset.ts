import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

/**
 * Extra bottom inset needed so content is not hidden by the keyboard.
 * If Android already resized the window (adjustResize), this returns ~0
 * so KeyboardAvoidingView / padding is not applied twice.
 */
export function useKeyboardOverlapInset(): number {
  const { height: windowHeight } = useWindowDimensions();
  const closedHeightRef = useRef(windowHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (keyboardHeight === 0) {
      closedHeightRef.current = windowHeight;
    }
  }, [keyboardHeight, windowHeight]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardHeight <= 0) {
    return 0;
  }

  const resizedBy = Math.max(0, closedHeightRef.current - windowHeight);
  return Math.max(0, Math.round(keyboardHeight - resizedBy));
}

/** True whenever the software keyboard is open, including Android adjustResize. */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
