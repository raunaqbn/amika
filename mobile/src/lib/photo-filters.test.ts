import assert from 'node:assert/strict';
import test from 'node:test';
import { applyColorMatrix, PHOTO_FILTERS } from './photo-filters.ts';

test('Original leaves pixels unchanged', () => {
  assert.deepEqual(applyColorMatrix(PHOTO_FILTERS[0].matrix, [12, 98, 231, 177]), [12, 98, 231, 177]);
});

test('Every named filter has a unique, valid matrix and preserves alpha', () => {
  const matrices = new Set<string>();
  for (const filter of PHOTO_FILTERS) {
    assert.equal(filter.matrix.length, 20);
    assert.ok(filter.matrix.every(Number.isFinite));
    assert.ok(Math.abs(filter.matrix[4]) < 1);
    assert.ok(Math.abs(filter.matrix[9]) < 1);
    assert.ok(Math.abs(filter.matrix[14]) < 1);
    assert.equal(applyColorMatrix(filter.matrix, [72, 134, 219, 203])[3], 203);
    matrices.add(filter.matrix.map((value) => value.toFixed(6)).join(','));
  }
  assert.equal(matrices.size, PHOTO_FILTERS.length);
});

test('The monochrome and temperature looks behave as described', () => {
  const moon = PHOTO_FILTERS.find((filter) => filter.id === 'moon')!;
  const moonPixel = applyColorMatrix(moon.matrix, [220, 80, 30, 255]);
  assert.ok(Math.abs(moonPixel[0] - moonPixel[1]) < 1);
  assert.ok(Math.abs(moonPixel[1] - moonPixel[2]) < 3);

  const juno = PHOTO_FILTERS.find((filter) => filter.id === 'juno')!;
  const junoPixel = applyColorMatrix(juno.matrix, [128, 128, 128, 255]);
  assert.ok(junoPixel[0] > junoPixel[2]);

  const perpetua = PHOTO_FILTERS.find((filter) => filter.id === 'perpetua')!;
  const perpetuaPixel = applyColorMatrix(perpetua.matrix, [128, 128, 128, 255]);
  assert.ok(perpetuaPixel[2] > perpetuaPixel[0]);
});
