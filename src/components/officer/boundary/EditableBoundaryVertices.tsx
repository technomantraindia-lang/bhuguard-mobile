import { memo, useEffect, useRef } from 'react';
import { type NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import {
  ViewAnnotation,
  type LngLat,
  type ViewAnnotationEvent,
  type ViewAnnotationRef,
} from '@maplibre/maplibre-react-native';

import { isValidLngLat } from '../../../utils/foEditVertex';
import { colors } from './foMapColors';

export type EditableVertexVisual = 'default' | 'selected' | 'invalid';

type VertexProps = {
  index: number;
  lngLat: LngLat;
  isEditing: boolean;
  visual: EditableVertexVisual;
  onPress: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrag: (index: number, lngLat: LngLat) => void;
  onDragEnd: (index: number, lngLat: LngLat | null) => void;
};

function readLngLat(event: NativeSyntheticEvent<ViewAnnotationEvent>): LngLat | null {
  const lngLat = event.nativeEvent.lngLat;
  if (!isValidLngLat(lngLat)) {
    return null;
  }
  return [lngLat[0], lngLat[1]];
}

const EditableVertexMarker = memo(function EditableVertexMarker({
  index,
  lngLat,
  isEditing,
  visual,
  onPress,
  onDragStart,
  onDrag,
  onDragEnd,
}: VertexProps) {
  const annotationRef = useRef<ViewAnnotationRef>(null);
  const previousVisualRef = useRef(visual);

  useEffect(() => {
    if (previousVisualRef.current === visual) {
      return;
    }
    previousVisualRef.current = visual;
    const frame = requestAnimationFrame(() => {
      annotationRef.current?.refresh?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [visual]);

  return (
    <ViewAnnotation
      ref={annotationRef}
      id={`boundary-vertex-${index}`}
      lngLat={lngLat}
      draggable={isEditing}
      anchor="center"
      onPress={() => onPress(index)}
      onDragStart={() => onDragStart(index)}
      onDrag={(event) => {
        const next = readLngLat(event);
        if (next) {
          onDrag(index, next);
        }
      }}
      onDragEnd={(event) => {
        onDragEnd(index, readLngLat(event));
      }}
    >
      <View collapsable={false} style={styles.hitBox}>
        <View
          collapsable={false}
          style={[
            styles.dot,
            visual === 'selected' && styles.dotSelected,
            visual === 'invalid' && styles.dotInvalid,
          ]}
        />
      </View>
    </ViewAnnotation>
  );
});

type Props = {
  coordinates: LngLat[];
  isEditing: boolean;
  selectedVertexIndex: number | null;
  invalidVertexIndex: number | null;
  onPress: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrag: (index: number, lngLat: LngLat) => void;
  onDragEnd: (index: number, lngLat: LngLat | null) => void;
};

function EditableBoundaryVerticesInner({
  coordinates,
  isEditing,
  selectedVertexIndex,
  invalidVertexIndex,
  onPress,
  onDragStart,
  onDrag,
  onDragEnd,
}: Props) {
  return (
    <>
      {coordinates.map((lngLat, index) => {
        let visual: EditableVertexVisual = 'default';
        if (invalidVertexIndex === index) {
          visual = 'invalid';
        } else if (selectedVertexIndex === index) {
          visual = 'selected';
        }

        return (
          <EditableVertexMarker
            key={`boundary-vertex-${index}`}
            index={index}
            lngLat={lngLat}
            isEditing={isEditing}
            visual={visual}
            onPress={onPress}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </>
  );
}

export const EditableBoundaryVertices = memo(EditableBoundaryVerticesInner);

const styles = StyleSheet.create({
  hitBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.editing,
    borderWidth: 3,
    borderColor: colors.cream,
  },
  dotSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.editing,
  },
  dotInvalid: {
    backgroundColor: colors.danger,
    borderColor: colors.cream,
  },
});
