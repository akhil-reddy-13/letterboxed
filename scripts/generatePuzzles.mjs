#!/usr/bin/env node
/**
 * Generates Letter Boxed puzzles with verified 2-word solutions.
 * Reads dictionary.txt and outputs puzzles.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dictPath = join(rootDir, 'dictionary.txt');

// Load dictionary - words only, 2+ letters, uppercase
const raw = readFileSync(dictPath, 'utf-8');
const words = raw
  .split('\n')
  .slice(2) // skip header
  .map((w) => w.trim().toUpperCase())
  .filter((w) => w.length >= 2 && /^[A-Z]+$/.test(w));

const wordSet = new Set(words);

// Build index: words by first letter, for faster lookup
const wordsByFirst = new Map();
for (const w of words) {
  const c = w[0];
  if (!wordsByFirst.has(c)) wordsByFirst.set(c, []);
  wordsByFirst.get(c).push(w);
}

/**
 * Check if we can assign 12 letters to 4 sides (3 each) such that
 * the sequence follows alternating sides.
 * sequence: array of letters in order (word1 + word2[1:])
 */
function canArrangeOnSides(sequence) {
  const letterToSide = new Map();
  const sideCounts = [0, 0, 0, 0];
  const sideMax = 3;

  for (let i = 0; i < sequence.length; i++) {
    const letter = sequence[i];
    const prevSide = i > 0 ? letterToSide.get(sequence[i - 1]) : null;

    if (letterToSide.has(letter)) {
      // Letter already placed - verify prev is different side
      const mySide = letterToSide.get(letter);
      if (prevSide !== null && prevSide === mySide) return false;
      continue;
    }

    // Assign to a side: different from prev, and not full
    let assigned = false;
    for (let s = 0; s < 4; s++) {
      if (s !== prevSide && sideCounts[s] < sideMax) {
        letterToSide.set(letter, s);
        sideCounts[s]++;
        assigned = true;
        break;
      }
    }
    if (!assigned) return false;
  }

  return sideCounts.every((c) => c === 3);
}

/**
 * Build the puzzle layout (4 sides, 3 letters each) from the sequence.
 */
function buildPuzzle(sequence) {
  const letterToSide = new Map();
  const sides = [[], [], [], []];
  const sideMax = 3;

  for (let i = 0; i < sequence.length; i++) {
    const letter = sequence[i];
    const prevSide = i > 0 ? letterToSide.get(sequence[i - 1]) : null;

    if (letterToSide.has(letter)) continue;

    for (let s = 0; s < 4; s++) {
      if (s !== prevSide && sides[s].length < sideMax) {
        letterToSide.set(letter, s);
        sides[s].push(letter);
        break;
      }
    }
  }

  // Sort letters within each side for consistent output
  sides.forEach((s) => s.sort());
  return sides;
}

const puzzles = [];
const seenLayouts = new Set();
const TARGET = 400; // Generate 400+ puzzles for daily rotation

// Iterate word pairs: word1, word2 where word2 starts with word1's last letter
let count = 0;
for (const w1 of words) {
  if (puzzles.length >= TARGET) break;
  const lastChar = w1[w1.length - 1];
  const candidates = wordsByFirst.get(lastChar) || [];
  for (const w2 of candidates) {
    if (w2.length === 1) continue;
    const combined = w1 + w2.slice(1);
    const unique = new Set(combined);
    if (unique.size !== 12) continue;
    if (!wordSet.has(w1) || !wordSet.has(w2)) continue;

    const sequence = w1 + w2.slice(1);
    if (!canArrangeOnSides(sequence)) continue;

    const sides = buildPuzzle(sequence);
    const key = sides.map((s) => s.join('')).sort().join('|');
    if (seenLayouts.has(key)) continue;
    seenLayouts.add(key);

    puzzles.push(sides);
    if (puzzles.length >= TARGET) break;
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  count: puzzles.length,
  puzzles,
};

writeFileSync(join(rootDir, 'lib', 'puzzles.json'), JSON.stringify(output, null, 0));
console.log(`Generated ${puzzles.length} puzzles`);
