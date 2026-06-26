import * as FileSystem from 'expo-file-system/legacy';

export interface SignaturePoint {
  x: number;
  y: number;
}

const SIGNATURE_STROKE_WIDTH = 3;
const SIGNATURE_INK_RGBA = [0, 0, 0, 255] as const;

function pathFromStroke(stroke: SignaturePoint[]): string {
  if (stroke.length === 0) {
    return '';
  }

  return stroke.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function hasSignatureInk(strokes: SignaturePoint[][], currentStroke: SignaturePoint[] = []): boolean {
  return strokes.length > 0 || currentStroke.length > 0;
}

function setPixel(
  pixels: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
): void {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }

  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function fillCircle(
  pixels: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: readonly [number, number, number, number],
): void {
  const radiusSquared = radius * radius;

  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;

      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(pixels, width, height, x, y, color);
      }
    }
  }
}

function drawSegment(
  pixels: Uint8Array,
  width: number,
  height: number,
  from: SignaturePoint,
  to: SignaturePoint,
  strokeWidth: number,
  color: readonly [number, number, number, number],
): void {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance));

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;
    fillCircle(pixels, width, height, x, y, strokeWidth / 2, color);
  }
}

function rasterizeSignature(
  strokes: SignaturePoint[][],
  width: number,
  height: number,
): Uint8Array {
  const pixels = new Uint8Array(width * height * 4);

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = 255;
    pixels[index + 1] = 255;
    pixels[index + 2] = 255;
    pixels[index + 3] = 255;
  }

  for (const stroke of strokes) {
    for (let index = 0; index < stroke.length; index += 1) {
      const point = stroke[index];

      fillCircle(pixels, width, height, point.x, point.y, SIGNATURE_STROKE_WIDTH / 2, SIGNATURE_INK_RGBA);

      if (index > 0) {
        drawSegment(
          pixels,
          width,
          height,
          stroke[index - 1],
          point,
          SIGNATURE_STROKE_WIDTH,
          SIGNATURE_INK_RGBA,
        );
      }
    }
  }

  return pixels;
}

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

const CRC32_TABLE = crc32Table();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let index = 0; index < data.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  const mod = 65521;

  for (let index = 0; index < data.length; index += 1) {
    a = (a + data[index]) % mod;
    b = (b + a) % mod;
  }

  return ((b << 16) | a) >>> 0;
}

function zlibEncodeStored(data: Uint8Array): Uint8Array {
  const chunks: number[] = [0x78, 0x01];
  let offset = 0;

  while (offset < data.length) {
    const blockSize = Math.min(data.length - offset, 65535);
    const isFinal = offset + blockSize >= data.length;

    chunks.push(isFinal ? 0x01 : 0x00);
    chunks.push(blockSize & 0xff, (blockSize >> 8) & 0xff);
    chunks.push((~blockSize) & 0xff, ((~blockSize) >> 8) & 0xff);

    for (let index = 0; index < blockSize; index += 1) {
      chunks.push(data[offset + index]);
    }

    offset += blockSize;
  }

  const checksum = adler32(data);
  chunks.push(
    (checksum >> 24) & 0xff,
    (checksum >> 16) & 0xff,
    (checksum >> 8) & 0xff,
    checksum & 0xff,
  );

  return new Uint8Array(chunks);
}

function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const rowSize = 1 + width * 4;
  const raw = new Uint8Array(height * rowSize);
  let rawOffset = 0;

  for (let y = 0; y < height; y += 1) {
    raw[rawOffset] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), rawOffset + 1);
    rawOffset += rowSize;
  }

  const compressed = zlibEncodeStored(raw);
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const chunks: Uint8Array[] = [signature];
  const chunkTypes = [
    { type: 'IHDR', data: ihdr },
    { type: 'IDAT', data: compressed },
    { type: 'IEND', data: new Uint8Array(0) },
  ];

  for (const chunk of chunkTypes) {
    const typeBytes = new TextEncoder().encode(chunk.type);
    const length = chunk.data.length;
    const chunkBuffer = new Uint8Array(12 + length);
    const chunkView = new DataView(chunkBuffer.buffer);
    chunkView.setUint32(0, length);
    chunkBuffer.set(typeBytes, 4);
    chunkBuffer.set(chunk.data, 8);
    const crc = crc32(chunkBuffer.subarray(4, 8 + length));
    chunkView.setUint32(8 + length, crc);
    chunks.push(chunkBuffer);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const png = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }

  return png;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const byte3 = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(triplet >> 18) & 0x3f];
    output += alphabet[(triplet >> 12) & 0x3f];
    output += index + 1 < bytes.length ? alphabet[(triplet >> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? alphabet[triplet & 0x3f] : '=';
  }

  return output;
}

export async function exportSignatureStrokesToPngFile(
  strokes: SignaturePoint[][],
  width: number,
  height: number,
): Promise<string> {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const pngBytes = encodePng(safeWidth, safeHeight, rasterizeSignature(strokes, safeWidth, safeHeight));
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!directory) {
    throw new Error('No writable directory available for signature image.');
  }

  const targetPath = `${directory}signature-${Date.now()}.png`;

  await FileSystem.writeAsStringAsync(targetPath, uint8ToBase64(pngBytes), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return targetPath;
}

export { pathFromStroke };
