import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { LivePhotoWatermarkMeta } from '../../utils/livePhotoWatermarkFormat';
import { LivePhotoWatermarkStamp } from './LivePhotoWatermarkStamp';

export interface LivePhotoWatermarkProcessorHandle {
  applyWatermark: (uri: string, meta: LivePhotoWatermarkMeta) => Promise<string>;
}

interface PendingWatermarkJob {
  uri: string;
  meta: LivePhotoWatermarkMeta;
  width: number;
  height: number;
  resolve: (uri: string) => void;
  reject: (error: Error) => void;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

export const LivePhotoWatermarkProcessor = forwardRef<LivePhotoWatermarkProcessorHandle>(
  function LivePhotoWatermarkProcessor(_props, ref) {
    const captureViewRef = useRef<View>(null);
    const [job, setJob] = useState<PendingWatermarkJob | null>(null);
    const processingRef = useRef(false);

    const runCapture = useCallback(async (activeJob: PendingWatermarkJob) => {
      if (!captureViewRef.current || processingRef.current) {
        return;
      }

      processingRef.current = true;

      try {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
        await new Promise((resolve) => setTimeout(resolve, 60));

        const watermarkedUri = await captureRef(captureViewRef, {
          format: 'jpg',
          quality: 0.92,
          result: 'tmpfile',
        });

        activeJob.resolve(watermarkedUri);
      } catch (error) {
        activeJob.reject(error instanceof Error ? error : new Error('Failed to watermark photo.'));
      } finally {
        processingRef.current = false;
        setJob(null);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        applyWatermark: async (uri: string, meta: LivePhotoWatermarkMeta) => {
          const { width, height } = await getImageSize(uri);

          return new Promise<string>((resolve, reject) => {
            setJob({
              uri,
              meta,
              width,
              height,
              resolve,
              reject,
            });
          });
        },
      }),
      [],
    );

    return (
      <View pointerEvents="none" style={styles.hiddenHost}>
        {job ? (
          <View
            ref={captureViewRef}
            collapsable={false}
            style={{ width: job.width, height: job.height, backgroundColor: '#000000' }}
          >
            <Image
              source={{ uri: job.uri }}
              style={{ width: job.width, height: job.height }}
              resizeMode="cover"
              onLoadEnd={() => {
                void runCapture(job);
              }}
            />
            <LivePhotoWatermarkStamp meta={job.meta} imageWidth={job.width} />
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  hiddenHost: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    opacity: 0,
  },
});
