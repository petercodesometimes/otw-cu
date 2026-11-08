import test from 'node:test';
import assert from 'node:assert/strict';
import { optimize } from '../src/features/planning/optimizer.js';
import { walk } from '../src/features/planning/walking.js';
import { mins } from '../src/lib/time.js';

test('waits for opening and reserves arrival buffer', () => {
  const tasks = [{ id: 1, loc: 'wien', duration: 8 }];
  const result = optimize(tasks, 590, 640, 'low', 'mudd', 5);
  assert.equal(result.route.length, 1);
  assert.equal(result.route[0].begin, 600);
  assert.ok(result.finish + 5 <= 640);
});
test('rejects an impossible deadline', () => {
  const result = optimize([{ id: 1, loc: 'wien', duration: 8, deadline: 600 }], 590, 640, 'low', 'mudd', 5);
  assert.equal(result.route.length, 0);
});
test('closing time and final journey must fit', () => {
  assert.equal(optimize([{ id: 1, loc: 'wien', duration: 8 }], 1078, 1150, 'wien', 'mudd', 5).route.length, 0);
  assert.equal(optimize([{ id: 1, loc: 'wien', duration: 8 }], 600, 613, 'wien', 'mudd', 5).route.length, 0);
});
test('completion count takes priority and includes final walk', () => {
  const tasks = [{ id: 1, loc: 'butler', duration: 4 }, { id: 2, loc: 'wien', duration: 8 }, { id: 3, loc: 'market', duration: 20 }];
  const result = optimize(tasks, 735, 780, 'low', 'mudd', 5);
  assert.equal(result.route.length, 2);
  assert.ok(result.finish + 5 <= 780);
  assert.equal(walk('low', 'low'), 0);
});
test('empty time input is invalid', () => assert.ok(Number.isNaN(mins(''))));
