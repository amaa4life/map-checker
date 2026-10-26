import { MAP_RULES } from './map-rules';

export interface Violation {
  rule: number;
  id: string;
  asset: string;
  name: string;
  scale: string;
  mode: string;
  fix: string;
}

export interface MapReport {
  fileName: string;
  sceneObjects: number;
  skippedScale: number;
  violations: Violation[];
  passed: boolean;
  ruleCounts: Readonly<Record<number, number>>;
}

const WAGONS = new Set(['Interact/Wagon2', 'Interact/Wagon2a', 'Interact/Wagon2b', 'Interact/Wagon2c']);
const SCALE_TOKEN = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;

export function checkMapText(fileName: string, text: string): MapReport {
  const violations: Violation[] = [];
  let sceneObjects = 0;
  let skippedScale = 0;

  for (const line of text.split(/\r?\n/)) {
    let raw = line.trim();
    if (raw.length === 0 || raw.startsWith('///') || raw.startsWith('EditorVersion')) {
      continue;
    }

    if (raw.endsWith(';')) {
      raw = raw.slice(0, -1);
    }

    const parts = raw.split(',');
    if (parts.length < 19 || parts[0] !== 'Scene') {
      continue;
    }

    const asset = parts[1];
    const id = parts[2];
    const name = parts[8];
    const sx = parseScale(parts[15]);
    const sy = parseScale(parts[16]);
    const sz = parseScale(parts[17]);
    if (sx === null || sy === null || sz === null) {
      skippedScale++;
      continue;
    }

    sceneObjects++;
    const longest = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz));
    const mode = parts[18];
    const scale = `${formatScale(sx)} ${formatScale(sy)} ${formatScale(sz)}`;
    const physical = mode === 'Physical';

    if (asset.toLowerCase().startsWith('fx/')) {
      violations.push(hit(1, id, asset, name, scale, mode));
    }

    if (hasComponent(parts, 'Rigidbody') || hasComponent(parts, 'Floater')) {
      violations.push(hit(2, id, asset, name, scale, mode));
    }

    if (WAGONS.has(asset)) {
      violations.push(hit(3, id, asset, name, scale, mode));
    }

    if (physical && (asset === 'Geometry/Cuboid' || asset === 'Geometry/Cube1') && longest > 2000) {
      violations.push(hit(4, id, asset, name, scale, mode));
    }

    if (
      physical &&
      asset !== 'Geometry/Cuboid' &&
      asset !== 'Geometry/Cube1' &&
      asset !== 'None' &&
      longest > 80
    ) {
      violations.push(hit(5, id, asset, name, scale, mode));
    }
  }

  const ruleCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const violation of violations) {
    ruleCounts[violation.rule]++;
  }

  return {
    fileName,
    sceneObjects,
    skippedScale,
    violations,
    passed: violations.length === 0,
    ruleCounts,
  };
}

function hit(
  rule: number,
  id: string,
  asset: string,
  name: string,
  scale: string,
  mode: string,
): Violation {
  return {
    rule,
    id,
    asset,
    name,
    scale,
    mode,
    fix: MAP_RULES[rule - 1].fix,
  };
}

function parseScale(token: string): number | null {
  const text = token.trim();
  if (!SCALE_TOKEN.test(text)) {
    return null;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Matches the console app's 0.#### scale format. */
function formatScale(value: number): string {
  const text = value.toFixed(4).replace(/\.?0+$/, '');
  return text === '-0' ? '0' : text;
}

function hasComponent(parts: string[], component: string): boolean {
  for (let i = 22; i < parts.length; i++) {
    const field = parts[i];
    const split = field.indexOf('|');
    const name = split < 0 ? field : field.slice(0, split);
    if (name === component) {
      return true;
    }
  }

  return false;
}
