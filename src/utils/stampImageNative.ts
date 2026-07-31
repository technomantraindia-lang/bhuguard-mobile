import { Image, NativeModules } from 'react-native';

import type { LivePhotoWatermarkMeta } from './livePhotoWatermarkFormat';
import { getLivePhotoWatermarkLines } from './livePhotoWatermarkFormat';

type PhotoManipulatorModule = {
  printText: (
    uri: string,
    texts: Array<Record<string, unknown>>,
    mimeType: string,
  ) => Promise<string>;
  TextAlign?: { END: string };
  TextDirection?: { LTR: string };
};

function resolvePhotoManipulatorModule(): PhotoManipulatorModule | null {
  if (!NativeModules.RNPhotoManipulator && !NativeModules.PhotoManipulator) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-photo-manipulator') as {
      default?: PhotoManipulatorModule;
      printText?: PhotoManipulatorModule['printText'];
      TextAlign?: PhotoManipulatorModule['TextAlign'];
      TextDirection?: PhotoManipulatorModule['TextDirection'];
    };
    const printText = mod.default?.printText ?? mod.printText;
    if (typeof printText !== 'function') {
      return null;
    }

    return {
      printText,
      TextAlign: mod.TextAlign ?? mod.default?.TextAlign,
      TextDirection: mod.TextDirection ?? mod.default?.TextDirection,
    };
  } catch {
    return null;
  }
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

export function isPhotoManipulatorAvailable(): boolean {
  return Boolean(
    NativeModules.RNPhotoManipulator ??
      NativeModules.PhotoManipulator ??
      resolvePhotoManipulatorModule(),
  );
}

export function isViewShotAvailable(): boolean {
  return Boolean(NativeModules.RNViewShot);
}

export async function stampImageWithPhotoManipulator(
  uri: string,
  meta: LivePhotoWatermarkMeta,
): Promise<string> {
  const RNPhotoManipulator = resolvePhotoManipulatorModule();
  if (!RNPhotoManipulator) {
    throw new Error('Photo manipulator native module is unavailable on this install.');
  }

  const { width, height } = await getImageSize(uri);
  const lines = getLivePhotoWatermarkLines(meta);
  const fontSize = Math.max(11, Math.round(width * 0.028));
  const lineHeight = Math.round(fontSize * 1.35);
  const padding = Math.max(8, Math.round(width * 0.02));
  const totalTextHeight = lines.length * lineHeight;
  const startY = height - padding - totalTextHeight;
  const anchorX = width - padding;
  const align = RNPhotoManipulator.TextAlign?.END ?? 'END';
  const direction = RNPhotoManipulator.TextDirection?.LTR ?? 'LTR';

  const texts = lines.flatMap((line, index) => {
    const y = startY + index * lineHeight;

    return [
      {
        position: { x: anchorX, y },
        text: line,
        textSize: fontSize,
        color: '#000000',
        thickness: 3,
        align,
        direction,
      },
      {
        position: { x: anchorX, y },
        text: line,
        textSize: fontSize,
        color: '#FFFFFF',
        align,
        direction,
        shadowRadius: 4,
        shadowOffset: { x: 0, y: 1 },
        shadowColor: '#000000',
      },
    ];
  });

  return RNPhotoManipulator.printText(uri, texts, 'image/jpeg');
}
