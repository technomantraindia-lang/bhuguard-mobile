import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

interface FullscreenImageModalProps {
  visible: boolean;
  uri: string | null;
  title?: string;
  subtitle?: string | null;
  onClose: () => void;
}

/**
 * In-form full-screen image viewer. Does not navigate away from the parent screen,
 * so Biochar Production form state and scroll position stay intact.
 */
export function FullscreenImageModal({
  visible,
  uri,
  title = 'Evidence Photo',
  subtitle = null,
  onClose,
}: FullscreenImageModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [displaySize, setDisplaySize] = useState({
    width: windowWidth,
    height: Math.max(windowHeight - 140, 320),
  });

  useEffect(() => {
    if (!uri || !visible) {
      return;
    }

    let cancelled = false;

    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled) {
          return;
        }

        const maxWidth = windowWidth;
        const maxHeight = windowHeight - 140;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);

        setDisplaySize({
          width: Math.max(Math.round(width * scale), 1),
          height: Math.max(Math.round(height * scale), 1),
        });
      },
      () => {
        if (!cancelled) {
          setDisplaySize({
            width: windowWidth,
            height: Math.max(windowHeight - 140, 320),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [uri, visible, windowWidth, windowHeight]);

  return (
    <Modal
      visible={visible && Boolean(uri)}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close full screen image"
          >
            <Text style={styles.close}>Close</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
          minimumZoomScale={1}
          centerContent
          bouncesZoom={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: displaySize.width, height: displaySize.height }}
              resizeMode="contain"
              accessibilityLabel="Full screen evidence image"
            />
          ) : null}
        </ScrollView>

        <Text style={styles.footerHint}>View only · Pinch to zoom where supported</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  close: { color: '#fff', fontWeight: '700', fontSize: 16 },
  titleWrap: { flex: 1, alignItems: 'flex-end' },
  title: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'right' },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 4, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  footerHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
