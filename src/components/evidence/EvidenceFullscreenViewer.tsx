import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EvidenceFullscreenViewerProps {
  uri: string;
  title?: string;
  onClose: () => void;
}

export function EvidenceFullscreenViewer({
  uri,
  title = 'Evidence Photo',
  onClose,
}: EvidenceFullscreenViewerProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [displaySize, setDisplaySize] = useState({
    width: windowWidth,
    height: Math.max(windowHeight - 120, 320),
  });

  useEffect(() => {
    let cancelled = false;

    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled) {
          return;
        }

        const maxWidth = windowWidth;
        const maxHeight = windowHeight - 120;
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
            height: Math.max(windowHeight - 120, 320),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [uri, windowWidth, windowHeight]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>Close</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
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
        <Image
          source={{ uri }}
          style={{ width: displaySize.width, height: displaySize.height }}
          resizeMode="contain"
          accessibilityLabel="Full stamped evidence image"
        />
      </ScrollView>

      <Text style={styles.footerHint}>
        Verify date, time, village, taluka, district, latitude, longitude, and GPS accuracy are fully visible.
      </Text>
    </SafeAreaView>
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
  close: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontWeight: '600', fontSize: 16, flex: 1, textAlign: 'right' },
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
