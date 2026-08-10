export const IDENTITY_COLOR_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
] as const;

type Matrix = readonly number[];

function multiply(after: Matrix, before: Matrix) {
  const output = Array<number>(20).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      output[row * 5 + column] = column === 4 ? after[row * 5 + 4] : 0;
      for (let index = 0; index < 4; index += 1) {
        output[row * 5 + column] += after[row * 5 + index] * before[index * 5 + column];
      }
    }
  }
  return output;
}

function brightness(value: number): Matrix {
  return [value, 0, 0, 0, 0, 0, value, 0, 0, 0, 0, 0, value, 0, 0, 0, 0, 0, 1, 0];
}

function contrast(value: number): Matrix {
  const offset = 128 * (1 - value);
  return [value, 0, 0, 0, offset, 0, value, 0, 0, offset, 0, 0, value, 0, offset, 0, 0, 0, 1, 0];
}

function saturation(value: number): Matrix {
  const inverse = 1 - value;
  const r = 0.2126 * inverse;
  const g = 0.7152 * inverse;
  const b = 0.0722 * inverse;
  return [
    r + value, g, b, 0, 0,
    r, g + value, b, 0, 0,
    r, g, b + value, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function channelMix(red: number, green: number, blue: number, redLift = 0, greenLift = 0, blueLift = 0): Matrix {
  return [red, 0, 0, 0, redLift, 0, green, 0, 0, greenLift, 0, 0, blue, 0, blueLift, 0, 0, 0, 1, 0];
}

type FilterRecipe = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  channels?: readonly [number, number, number];
  lift?: readonly [number, number, number];
};

export function createFilterMatrix(recipe: FilterRecipe): number[] {
  let matrix: Matrix = IDENTITY_COLOR_MATRIX;
  if (recipe.saturation !== undefined) matrix = multiply(saturation(recipe.saturation), matrix);
  if (recipe.contrast !== undefined) matrix = multiply(contrast(recipe.contrast), matrix);
  if (recipe.brightness !== undefined) matrix = multiply(brightness(recipe.brightness), matrix);
  if (recipe.channels || recipe.lift) {
    const channels = recipe.channels || [1, 1, 1];
    const lift = recipe.lift || [0, 0, 0];
    matrix = multiply(channelMix(channels[0], channels[1], channels[2], lift[0], lift[1], lift[2]), matrix);
  }
  return matrix.map((value) => Math.abs(value) < 1e-10 ? 0 : value);
}

export const PHOTO_FILTERS = [
  { id: 'original', label: 'Original', description: 'True to your photo', matrix: [...IDENTITY_COLOR_MATRIX] },
  { id: 'clarendon', label: 'Clarendon', description: 'Crisp, bright, and cool', matrix: createFilterMatrix({ brightness: 1.04, contrast: 1.2, saturation: 1.3, channels: [0.99, 1.01, 1.06], lift: [0, 1, 3] }) },
  { id: 'gingham', label: 'Gingham', description: 'Soft, faded warmth', matrix: createFilterMatrix({ brightness: 1.06, contrast: 0.84, saturation: 0.82, channels: [1.06, 1.02, 0.94], lift: [7, 5, 3] }) },
  { id: 'moon', label: 'Moon', description: 'Bold black and white', matrix: createFilterMatrix({ brightness: 1.08, contrast: 1.16, saturation: 0, channels: [1.02, 1.02, 1.04] }) },
  { id: 'lark', label: 'Lark', description: 'Airy blues and greens', matrix: createFilterMatrix({ brightness: 1.08, contrast: 0.94, saturation: 1.08, channels: [0.96, 1.04, 1.08], lift: [2, 4, 5] }) },
  { id: 'reyes', label: 'Reyes', description: 'Warm, creamy, and faded', matrix: createFilterMatrix({ brightness: 1.1, contrast: 0.78, saturation: 0.72, channels: [1.08, 1.02, 0.9], lift: [9, 7, 4] }) },
  { id: 'juno', label: 'Juno', description: 'Warm color and rich contrast', matrix: createFilterMatrix({ brightness: 1.03, contrast: 1.14, saturation: 1.34, channels: [1.08, 1.02, 0.94], lift: [2, 0, -2] }) },
  { id: 'slumber', label: 'Slumber', description: 'Dreamy amber shadows', matrix: createFilterMatrix({ brightness: 1.05, contrast: 0.88, saturation: 0.68, channels: [1.1, 1.01, 0.86], lift: [8, 5, 1] }) },
  { id: 'crema', label: 'Crema', description: 'Gentle contrast and warmth', matrix: createFilterMatrix({ brightness: 1.08, contrast: 0.86, saturation: 0.88, channels: [1.06, 1.01, 0.92], lift: [6, 5, 3] }) },
  { id: 'ludwig', label: 'Ludwig', description: 'Clean light and warm reds', matrix: createFilterMatrix({ brightness: 1.04, contrast: 1.05, saturation: 0.92, channels: [1.08, 1, 0.92], lift: [3, 1, 0] }) },
  { id: 'aden', label: 'Aden', description: 'Pastel color and soft light', matrix: createFilterMatrix({ brightness: 1.1, contrast: 0.8, saturation: 0.82, channels: [1.06, 0.99, 1.03], lift: [8, 6, 9] }) },
  { id: 'perpetua', label: 'Perpetua', description: 'Fresh blue-green lift', matrix: createFilterMatrix({ brightness: 1.07, contrast: 0.96, saturation: 1.12, channels: [0.95, 1.05, 1.1], lift: [1, 3, 6] }) },
] as const;

export type PhotoFilterId = (typeof PHOTO_FILTERS)[number]['id'];

export function applyColorMatrix(matrix: Matrix, rgba: readonly [number, number, number, number]) {
  return [0, 1, 2, 3].map((row) => Math.max(0, Math.min(255,
    matrix[row * 5] * rgba[0]
      + matrix[row * 5 + 1] * rgba[1]
      + matrix[row * 5 + 2] * rgba[2]
      + matrix[row * 5 + 3] * rgba[3]
      + matrix[row * 5 + 4],
  ))) as [number, number, number, number];
}
