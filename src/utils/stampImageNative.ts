import { Image, NativeModules } from 'react-native';
import RNPhotoManipulator, { TextAlign, TextDirection, type MimeType } from 'react-native-photo-manipulator';

import type { LivePhotoWatermarkMeta } from './livePhotoWatermarkFormat';
import { getLivePhotoWatermarkLines } from './livePhotoWatermarkFormat';

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

export function isPhotoManipulatorAvailable(): boolean {
  return Boolean(
    NativeModules.RNPhotoManipulator ??
      NativeModules.PhotoManipulator ??
      (typeof RNPhotoManipulator?.printText === 'function'),
  );
}

export function isViewShotAvailable(): boolean {
  return Boolean(NativeModules.RNViewShot);
}

export async function stampImageWithPhotoManipulator(
  uri: string,
  meta: LivePhotoWatermarkMeta,
): Promise<string> {
  const { width, height } = await getImageSize(uri);
  const lines = getLivePhotoWatermarkLines(meta);
  const fontSize = Math.max(11, Math.round(width * 0.028));
  const lineHeight = Math.round(fontSize * 1.35);
  const padding = Math.max(8, Math.round(width * 0.02));
  const totalTextHeight = lines.length * lineHeight;
  const startY = height - padding - totalTextHeight;
  const anchorX = width - padding;

  const texts = lines.flatMap((line, index) => {
    const y = startY + index * lineHeight;

    return [
      {
        position: { x: anchorX, y },
        text: line,
        textSize: fontSize,
        color: '#000000',
        thickness: 3,
        align: TextAlign.END,
        direction: TextDirection.LTR,
      },
      {
        position: { x: anchorX, y },
        text: line,
        textSize: fontSize,
        color: '#FFFFFF',
        align: TextAlign.END,
        direction: TextDirection.LTR,
        shadowRadius: 4,
        shadowOffset: { x: 0, y: 1 },
        shadowColor: '#000000',
      },
    ];
  });

  return RNPhotoManipulator.printText(uri, texts, 'image/jpeg' as MimeType);
}
