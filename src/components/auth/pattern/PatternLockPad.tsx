import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

const CELL = 3;
const MIN_POINTS = 4;
/** Adjacent (incl. diagonal) max distance between cell centres in grid units. */
const MAX_STEP = Math.SQRT2 + 0.05;

export type PatternLockPadProps = {
  disabled?: boolean;
  onComplete: (sequence: string) => void;
  onCleared?: () => void;
  errorText?: string | null;
  hintText?: string | null;
};

type Point = { x: number; y: number };

function indexFromCoord(col: number, row: number): number {
  return row * CELL + col;
}

function cellCenter(index: number, size: number, pad: number): Point {
  const col = index % CELL;
  const row = Math.floor(index / CELL);
  const step = (size - pad * 2) / (CELL - 1);
  return {
    x: pad + col * step,
    y: pad + row * step,
  };
}

function hitTest(x: number, y: number, size: number, pad: number, radius: number): number | null {
  for (let i = 0; i < CELL * CELL; i += 1) {
    const c = cellCenter(i, size, pad);
    const dx = x - c.x;
    const dy = y - c.y;
    if (dx * dx + dy * dy <= radius * radius) {
      return i;
    }
  }
  return null;
}

function isAdjacent(a: number, b: number): boolean {
  const ac = a % CELL;
  const ar = Math.floor(a / CELL);
  const bc = b % CELL;
  const br = Math.floor(b / CELL);
  const dc = ac - bc;
  const dr = ar - br;
  const dist = Math.sqrt(dc * dc + dr * dr);
  return dist > 0 && dist <= MAX_STEP;
}

function PatternLockPadComponent({
  disabled = false,
  onComplete,
  onCleared,
  errorText,
  hintText,
}: PatternLockPadProps) {
  const [size, setSize] = useState(280);
  const [path, setPath] = useState<number[]>([]);
  const [finger, setFinger] = useState<Point | null>(null);
  const pathRef = useRef<number[]>([]);
  const completedRef = useRef(false);

  const pad = size * 0.14;
  const nodeRadius = Math.max(14, size * 0.055);
  const hitRadius = nodeRadius * 1.85;

  const reset = useCallback(() => {
    pathRef.current = [];
    completedRef.current = false;
    setPath([]);
    setFinger(null);
    onCleared?.();
  }, [onCleared]);

  const commitPoint = useCallback((index: number) => {
    const current = pathRef.current;
    if (current.includes(index)) {
      return;
    }
    if (current.length > 0 && !isAdjacent(current[current.length - 1], index)) {
      return;
    }
    const next = [...current, index];
    pathRef.current = next;
    setPath(next);
  }, []);

  const finish = useCallback(() => {
    const sequence = pathRef.current.map(String).join('');
    setFinger(null);
    if (sequence.length < MIN_POINTS) {
      reset();
      return;
    }
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onComplete(sequence);
  }, [onComplete, reset]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const w = Math.floor(event.nativeEvent.layout.width);
    if (w > 0) {
      setSize((current) => (current === w ? current : w));
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          if (disabled) {
            return;
          }
          completedRef.current = false;
          pathRef.current = [];
          setPath([]);
          const { locationX, locationY } = event.nativeEvent;
          setFinger({ x: locationX, y: locationY });
          const hit = hitTest(locationX, locationY, size, pad, hitRadius);
          if (hit != null) {
            commitPoint(hit);
          }
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
          if (disabled) {
            return;
          }
          const { locationX, locationY } = event.nativeEvent;
          setFinger({ x: locationX, y: locationY });
          const hit = hitTest(locationX, locationY, size, pad, hitRadius);
          if (hit != null) {
            commitPoint(hit);
          }
        },
        onPanResponderRelease: () => {
          if (disabled) {
            return;
          }
          finish();
        },
        onPanResponderTerminate: () => {
          reset();
        },
      }),
    [commitPoint, disabled, finish, hitRadius, pad, reset, size],
  );

  const centres = useMemo(
    () => Array.from({ length: CELL * CELL }, (_, i) => cellCenter(i, size, pad)),
    [pad, size],
  );

  return (
    <View style={styles.wrap} accessibilityLabel="Pattern lock pad">
      {hintText ? <Text style={styles.hint}>{hintText}</Text> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
      <View
        style={[styles.board, { width: size, height: size }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {path.length > 1
          ? path.slice(1).map((to, idx) => {
              const from = path[idx];
              const a = centres[from];
              const b = centres[to];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={`line-${from}-${to}`}
                  pointerEvents="none"
                  style={[
                    styles.line,
                    {
                      width: length,
                      left: a.x,
                      top: a.y - 2,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })
          : null}
        {finger && path.length > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.line,
              (() => {
                const a = centres[path[path.length - 1]];
                const dx = finger.x - a.x;
                const dy = finger.y - a.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                return {
                  width: length,
                  left: a.x,
                  top: a.y - 2,
                  transform: [{ rotate: `${angle}deg` }],
                  opacity: 0.55,
                };
              })(),
            ]}
          />
        ) : null}
        {centres.map((centre, index) => {
          const selected = path.includes(index);
          return (
            <View
              key={`node-${index}`}
              pointerEvents="none"
              accessibilityLabel={`Pattern point ${index + 1}${selected ? ', selected' : ''}`}
              style={[
                styles.node,
                {
                  width: nodeRadius * 2,
                  height: nodeRadius * 2,
                  borderRadius: nodeRadius,
                  left: centre.x - nodeRadius,
                  top: centre.y - nodeRadius,
                },
                selected ? styles.nodeSelected : null,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.actions}>
        <Text
          style={styles.action}
          onPress={disabled ? undefined : reset}
          accessibilityRole="button"
          accessibilityLabel="Reset pattern"
        >
          Reset
        </Text>
        <Text
          style={styles.action}
          onPress={disabled ? undefined : reset}
          accessibilityRole="button"
          accessibilityLabel="Retry pattern"
        >
          Retry
        </Text>
      </View>
    </View>
  );
}

export const PatternLockPad = memo(PatternLockPadComponent);
export const PATTERN_MIN_POINTS = MIN_POINTS;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  hint: {
    fontSize: 14,
    color: '#1F3D2C',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  error: {
    fontSize: 13,
    color: '#B53B3B',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  board: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15,122,69,0.18)',
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    backgroundColor: '#D7E8DB',
    borderWidth: 2,
    borderColor: '#0F7A45',
  },
  nodeSelected: {
    backgroundColor: '#0F7A45',
  },
  line: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#0F7A45',
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  actions: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 4,
  },
  action: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F7A45',
    textDecorationLine: 'underline',
  },
});
