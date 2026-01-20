import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cache the dictionary in memory
let dictionaryCache: string[] | null = null;

export async function GET() {
  // Return cached dictionary if available
  if (dictionaryCache) {
    return NextResponse.json({ words: dictionaryCache });
  }

  try {
    // Read dictionary.txt from the project root
    const dictionaryPath = join(process.cwd(), 'dictionary.txt');
    const fileContent = readFileSync(dictionaryPath, 'utf-8');
    
    // Split by lines, skip header line, filter empty lines, and convert to uppercase
    const words = fileContent
      .split('\n')
      .slice(2) // Skip header line and empty line
      .map(line => line.trim().toUpperCase())
      .filter(word => word.length > 0);

    // Cache it
    dictionaryCache = words;

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to load dictionary', words: [] },
      { status: 500 }
    );
  }
}