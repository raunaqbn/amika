import React, { useEffect, useMemo, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  ImageFormat,
  Skia,
  rect,
  type SkImage,
  useImage,
} from '@shopify/react-native-skia';
import { Check, Crop, Minus, Plus, SlidersHorizontal, X } from 'lucide-react-native';
import {
  Alert,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { border, colors, type } from '@/lib/theme';
import { Button, Spinner } from './ui';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const IDENTITY_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const FILTERS = [
  { id: 'original', label: 'Original', matrix: IDENTITY_MATRIX },
  {
    id: 'pop', label: 'Pop', matrix: [
      1.18, -0.05, -0.05, 0, 0,
      -0.04, 1.17, -0.04, 0, 0,
      -0.03, -0.04, 1.2, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'warm', label: 'Warm', matrix: [
      1.1, 0.03, 0, 0, 5,
      0.01, 1.02, 0, 0, 2,
      0, 0, 0.88, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'cool', label: 'Cool', matrix: [
      0.91, 0, 0, 0, 0,
      0, 1.01, 0.02, 0, 1,
      0, 0.03, 1.13, 0, 4,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'mono', label: 'Mono', matrix: [
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'fade', label: 'Fade', matrix: [
      0.78, 0.08, 0.08, 0, 16,
      0.08, 0.78, 0.08, 0, 14,
      0.08, 0.08, 0.78, 0, 12,
      0, 0, 0, 1, 0,
    ],
  },
] as const;

const CROPS = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'square', label: 'Square', ratio: 1 },
  { id: 'landscape', label: '4:3', ratio: 4 / 3 },
  { id: 'portrait', label: 'Portrait', ratio: 4 / 5 },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];
type CropId = (typeof CROPS)[number]['id'];

export type PhotoEditRecipe = {
  cropId: CropId;
  filterId: FilterId;
  positionX: number;
  positionY: number;
  zoom: number;
};

export const DEFAULT_PHOTO_EDIT: PhotoEditRecipe = {
  cropId: 'original',
  filterId: 'original',
  positionX: 0,
  positionY: 0,
  zoom: 1,
};

type PhotoEditorProps = {
  height: number;
  initialRecipe?: PhotoEditRecipe;
  onCancel: () => void;
  onChooseAnother: () => void;
  onUsePhoto: (photo: { height: number; recipe: PhotoEditRecipe; uri: string; width: number }) => void;
  uri: string | null;
  visible: boolean;
  width: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function recipeMatches(a: PhotoEditRecipe, b: PhotoEditRecipe) {
  return a.cropId === b.cropId
    && a.filterId === b.filterId
    && Math.abs(a.positionX - b.positionX) < 0.001
    && Math.abs(a.positionY - b.positionY) < 0.001
    && Math.abs(a.zoom - b.zoom) < 0.001;
}

function getCropRect(sourceWidth: number, sourceHeight: number, ratio: number, zoom: number, positionX: number, positionY: number) {
  let cropWidth = sourceWidth;
  let cropHeight = cropWidth / ratio;
  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * ratio;
  }
  cropWidth /= zoom;
  cropHeight /= zoom;
  const maxOriginX = Math.max(0, sourceWidth - cropWidth);
  const maxOriginY = Math.max(0, sourceHeight - cropHeight);
  return {
    height: cropHeight,
    maxOriginX,
    maxOriginY,
    originX: maxOriginX * (positionX + 1) / 2,
    originY: maxOriginY * (positionY + 1) / 2,
    width: cropWidth,
  };
}

function FilterPreview({ active, image, label, matrix, onPress }: {
  active: boolean;
  image: SkImage;
  label: string;
  matrix: readonly number[];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active, selected: active }}
      accessibilityLabel={`${label} photo filter`}
      onPress={onPress}
      style={styles.filterOption}
    >
      <View style={[styles.filterThumb, active && styles.filterThumbActive]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage image={image} x={0} y={0} width={68} height={68} fit="cover">
            <ColorMatrix matrix={[...matrix]} />
          </SkiaImage>
        </Canvas>
        {active ? <View style={styles.filterCheck}><Check size={12} color={colors.ink} strokeWidth={3} /></View> : null}
      </View>
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function PhotoEditor({ height, initialRecipe = DEFAULT_PHOTO_EDIT, onCancel, onChooseAnother, onUsePhoto, uri, visible, width }: PhotoEditorProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [filterId, setFilterId] = useState<FilterId>(initialRecipe.filterId);
  const [cropId, setCropId] = useState<CropId>(initialRecipe.cropId);
  const [positionX, setPositionX] = useState(initialRecipe.positionX);
  const [positionY, setPositionY] = useState(initialRecipe.positionY);
  const [zoom, setZoom] = useState(initialRecipe.zoom);
  const [applying, setApplying] = useState(false);
  const [imageError, setImageError] = useState('');
  const image = useImage(uri, () => setImageError('This photo could not be opened. Choose another one and try again.'));

  useEffect(() => {
    if (!visible) return;
    setFilterId(initialRecipe.filterId);
    setCropId(initialRecipe.cropId);
    setPositionX(initialRecipe.positionX);
    setPositionY(initialRecipe.positionY);
    setZoom(initialRecipe.zoom);
    setImageError('');
  }, [initialRecipe.cropId, initialRecipe.filterId, initialRecipe.positionX, initialRecipe.positionY, initialRecipe.zoom, uri, visible]);

  const selectedFilter = FILTERS.find((filter) => filter.id === filterId) || FILTERS[0];
  const selectedCrop = CROPS.find((crop) => crop.id === cropId) || CROPS[0];
  const sourceRatio = width > 0 && height > 0 ? width / height : 1;
  const outputRatio = selectedCrop.ratio || sourceRatio;
  const recipe = useMemo<PhotoEditRecipe>(() => ({ cropId, filterId, positionX, positionY, zoom }), [cropId, filterId, positionX, positionY, zoom]);
  const dirty = !recipeMatches(recipe, initialRecipe);
  const cropRect = useMemo(() => getCropRect(width, height, outputRatio, zoom, positionX, positionY), [height, outputRatio, positionX, positionY, width, zoom]);
  const canvasSize = useMemo(() => {
    const maxWidth = Math.min(screenWidth - 32, 520);
    const maxHeight = Math.min(430, Math.max(280, screenWidth * 1.08));
    let canvasWidth = maxWidth;
    let canvasHeight = canvasWidth / outputRatio;
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * outputRatio;
    }
    return { height: canvasHeight, width: canvasWidth };
  }, [outputRatio, screenWidth]);
  const drawScale = canvasSize.width / cropRect.width;
  const previewRect = {
    height: height * drawScale,
    width: width * drawScale,
    x: -cropRect.originX * drawScale,
    y: -cropRect.originY * drawScale,
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
    onPanResponderMove: (_, gesture) => {
      if (cropRect.maxOriginX > 0) setPositionX(clamp(positionX - (2 * gesture.dx) / (drawScale * cropRect.maxOriginX), -1, 1));
      if (cropRect.maxOriginY > 0) setPositionY(clamp(positionY - (2 * gesture.dy) / (drawScale * cropRect.maxOriginY), -1, 1));
    },
  }), [cropRect.maxOriginX, cropRect.maxOriginY, drawScale, positionX, positionY]);

  function resetAndCancel() {
    onCancel();
  }

  function requestClose() {
    if (applying) return;
    if (!dirty) return resetAndCancel();
    Alert.alert('Discard these edits?', 'Your original photo will stay unchanged.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: resetAndCancel },
    ]);
  }

  function chooseCrop(nextCrop: CropId) {
    setCropId(nextCrop);
    setPositionX(0);
    setPositionY(0);
    setZoom(1);
  }

  function encodeOutput(maxEdge: number, quality: number) {
    if (!image) throw new Error('The photo is still loading.');
    const edge = Math.max(1, Math.min(maxEdge, Math.floor(Math.max(cropRect.width, cropRect.height))));
    const outputWidth = Math.max(1, Math.round(outputRatio >= 1 ? edge : edge * outputRatio));
    const outputHeight = Math.max(1, Math.round(outputRatio >= 1 ? edge / outputRatio : edge));
    const surface = Skia.Surface.MakeOffscreen(outputWidth, outputHeight);
    if (!surface) throw new Error('The edited photo could not be rendered.');
    const paint = Skia.Paint();
    const colorFilter = Skia.ColorFilter.MakeMatrix([...selectedFilter.matrix]);
    let snapshot: SkImage | null = null;
    try {
      paint.setColorFilter(colorFilter);
      surface.getCanvas().drawImageRect(
        image,
        rect(cropRect.originX, cropRect.originY, cropRect.width, cropRect.height),
        rect(0, 0, outputWidth, outputHeight),
        paint,
      );
      surface.flush();
      snapshot = surface.makeImageSnapshot();
      return { bytes: snapshot.encodeToBytes(ImageFormat.JPEG, quality), height: outputHeight, width: outputWidth };
    } finally {
      snapshot?.dispose();
      colorFilter.dispose();
      paint.dispose();
      surface.dispose();
    }
  }

  async function apply() {
    if (!image) return;
    setApplying(true);
    try {
      let output = encodeOutput(1600, 84);
      if (output.bytes.length > MAX_UPLOAD_BYTES) output = encodeOutput(1200, 70);
      if (output.bytes.length > MAX_UPLOAD_BYTES) output = encodeOutput(1024, 58);
      if (output.bytes.length > MAX_UPLOAD_BYTES) throw new Error('The edited photo is still over 2 MB. Try a tighter crop.');
      const file = new File(Paths.cache, `amika-memory-${Date.now()}.jpg`);
      file.create({ overwrite: true });
      file.write(output.bytes);
      onUsePhoto({ height: output.height, recipe, uri: file.uri, width: output.width });
    } catch (error) {
      Alert.alert('Couldn’t finish this edit', error instanceof Error ? error.message : 'Please try the edit again.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={requestClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel photo edits" disabled={applying} onPress={requestClose} style={styles.headerButton}>
            <X size={21} color={colors.ink} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.kicker}>Before you keep it</Text>
            <Text style={styles.title}>Edit photo</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={applying ? 'Applying photo edits' : 'Use edited photo'} disabled={!image || applying} onPress={apply} style={[styles.useButton, (!image || applying) && styles.disabled]}>
            {applying ? <Spinner size="small" color={colors.ink} /> : <Text style={styles.useButtonText}>Use photo</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          {imageError ? (
            <View style={styles.errorState}>
              <Text style={styles.errorTitle}>This photo didn’t open</Text>
              <Text style={styles.errorBody}>{imageError}</Text>
              <Button label="Choose another photo" tone="citrus" onPress={onChooseAnother} style={styles.errorButton} />
              <Button label="Cancel" tone="quiet" onPress={onCancel} style={styles.errorButton} />
            </View>
          ) : (
            <View style={[styles.canvasFrame, canvasSize]}>
              {image ? (
                <>
                  <Canvas style={StyleSheet.absoluteFill} opaque>
                    <SkiaImage image={image} x={previewRect.x} y={previewRect.y} width={previewRect.width} height={previewRect.height} fit="fill">
                      <ColorMatrix matrix={[...selectedFilter.matrix]} />
                    </SkiaImage>
                  </Canvas>
                  <View accessibilityRole="adjustable" accessibilityLabel="Photo crop. Drag to reposition." style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
                    <View style={[styles.gridLine, styles.gridVerticalOne]} /><View style={[styles.gridLine, styles.gridVerticalTwo]} />
                    <View style={[styles.gridLine, styles.gridHorizontalOne]} /><View style={[styles.gridLine, styles.gridHorizontalTwo]} />
                    <View style={styles.dragHint}><Text style={styles.dragHintText}>Drag to position</Text></View>
                  </View>
                </>
              ) : (
                <View style={styles.loadingPhoto}><Spinner size="large" /><Text style={styles.loadingText}>Opening your photo…</Text></View>
              )}
            </View>
          )}

          {!imageError ? <>
            <View style={styles.zoomRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom <= 1} onPress={() => setZoom((value) => clamp(value - 0.25, 1, 3))} style={[styles.zoomButton, zoom <= 1 && styles.disabled]}><Minus size={20} color={colors.ink} /></Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.zoomLabel}>{zoom.toFixed(2).replace(/0$/, '')}×</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom >= 3} onPress={() => setZoom((value) => clamp(value + 0.25, 1, 3))} style={[styles.zoomButton, zoom >= 3 && styles.disabled]}><Plus size={20} color={colors.ink} /></Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}><Crop size={18} color={colors.ink} /><Text style={styles.sectionTitle}>Crop</Text></View>
              <ScrollView accessibilityRole="radiogroup" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropRow}>
                {CROPS.map((crop) => {
                  const active = crop.id === cropId;
                  return (
                    <Pressable accessibilityRole="radio" accessibilityState={{ checked: active, selected: active }} key={crop.id} onPress={() => chooseCrop(crop.id)} style={[styles.cropButton, active && styles.cropButtonActive]}>
                      <Text style={[styles.cropButtonText, active && styles.cropButtonTextActive]}>{crop.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}><SlidersHorizontal size={18} color={colors.ink} /><Text style={styles.sectionTitle}>Filters</Text></View>
              {image ? (
                <ScrollView accessibilityRole="radiogroup" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                  {FILTERS.map((filter) => (
                    <FilterPreview active={filter.id === filterId} image={image} key={filter.id} label={filter.label} matrix={filter.matrix} onPress={() => setFilterId(filter.id)} />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { minHeight: 74, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1.5, borderBottomColor: colors.line, backgroundColor: colors.periwinkle },
  headerButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, ...border },
  headerTitle: { flex: 1 },
  kicker: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { fontFamily: type.heavy, color: colors.ink, fontSize: 20, lineHeight: 23 },
  useButton: { minWidth: 96, height: 48, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  useButtonText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  disabled: { opacity: 0.5 },
  content: { padding: 16, paddingBottom: 32, gap: 18 },
  canvasFrame: { alignSelf: 'center', overflow: 'hidden', borderRadius: 18, backgroundColor: colors.paperDeep, ...border },
  loadingPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: type.medium, color: colors.muted, fontSize: 13 },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,.62)' },
  gridVerticalOne: { top: 0, bottom: 0, left: '33.333%', width: 1 },
  gridVerticalTwo: { top: 0, bottom: 0, left: '66.666%', width: 1 },
  gridHorizontalOne: { left: 0, right: 0, top: '33.333%', height: 1 },
  gridHorizontalTwo: { left: 0, right: 0, top: '66.666%', height: 1 },
  dragHint: { position: 'absolute', alignSelf: 'center', bottom: 10, minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(32,32,31,.78)' },
  dragHintText: { fontFamily: type.heavy, color: colors.white, fontSize: 11 },
  zoomRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 13 },
  zoomButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, ...border },
  zoomLabel: { minWidth: 48, fontFamily: type.heavy, color: colors.ink, fontSize: 13, textAlign: 'center' },
  section: { gap: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  cropRow: { gap: 8, paddingRight: 12 },
  cropButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.white, ...border },
  cropButtonActive: { backgroundColor: colors.periwinkle },
  cropButtonText: { fontFamily: type.heavy, color: colors.muted, fontSize: 12 },
  cropButtonTextActive: { color: colors.ink },
  filterRow: { gap: 12, paddingRight: 12 },
  filterOption: { minHeight: 96, minWidth: 70, alignItems: 'center', gap: 7 },
  filterThumb: { width: 70, height: 70, overflow: 'hidden', borderRadius: 15, padding: 2, backgroundColor: colors.white, ...border },
  filterThumbActive: { borderWidth: 3, borderColor: colors.ink, padding: 0 },
  filterCheck: { position: 'absolute', right: 4, bottom: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.periwinkle, borderWidth: 1.5, borderColor: colors.ink },
  filterLabel: { fontFamily: type.medium, color: colors.muted, fontSize: 11 },
  filterLabelActive: { fontFamily: type.heavy, color: colors.ink },
  errorState: { minHeight: 330, alignItems: 'center', justifyContent: 'center', padding: 26, borderRadius: 18, backgroundColor: colors.white, ...border },
  errorTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 21, textAlign: 'center' },
  errorBody: { maxWidth: 300, marginTop: 7, marginBottom: 18, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorButton: { alignSelf: 'stretch', marginTop: 8 },
});
