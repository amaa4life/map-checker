import { checkMapText } from './map-checker';

function scene(options: {
  asset: string;
  id?: string;
  name?: string;
  scale?: [number, number, number];
  mode?: string;
  components?: string[];
}): string {
  const parts = Array.from({ length: 22 }, () => '');
  parts[0] = 'Scene';
  parts[1] = options.asset;
  parts[2] = options.id ?? '1';
  parts[8] = options.name ?? 'Object';
  const [x, y, z] = options.scale ?? [1, 1, 1];
  parts[15] = String(x);
  parts[16] = String(y);
  parts[17] = String(z);
  parts[18] = options.mode ?? 'Physical';
  return [...parts, ...(options.components ?? [])].join(',') + ';';
}

describe('checkMapText', () => {
  it('passes a file with no scene objects', () => {
    const report = checkMapText('Empty.txt', 'EditorVersion,1;\n/// note\n\n');
    expect(report.passed).toBe(true);
    expect(report.sceneObjects).toBe(0);
    expect(report.violations).toEqual([]);
  });

  it('flags every FX asset, including water prefabs in that folder', () => {
    const report = checkMapText(
      'Fx.txt',
      [scene({ asset: 'FX/WindFX1', mode: 'None' }), scene({ asset: 'fx/Water', id: '2', mode: 'None' })].join(
        '\n',
      ),
    );
    expect(report.violations.map((hit) => hit.rule)).toEqual([1, 1]);
    expect(report.violations[0].fix).toBe('Delete it. Visual FX assets are not allowed.');
  });

  it('flags Rigidbody and Floater and leaves WaterPhysics', () => {
    const report = checkMapText(
      'Physics.txt',
      [
        scene({ asset: 'Geometry/Cuboid', components: ['Rigidbody|1'] }),
        scene({ asset: 'Geometry/Cuboid', id: '2', components: ['Floater'] }),
        scene({ asset: 'Nature/Water', id: '3', components: ['WaterPhysics|1'] }),
      ].join('\n'),
    );
    expect(report.violations.map((hit) => hit.rule)).toEqual([2, 2]);
    expect(report.passed).toBe(false);
  });

  it('flags only the four cloth wagons', () => {
    const report = checkMapText(
      'Wagons.txt',
      [
        scene({ asset: 'Interact/Wagon2', mode: 'None' }),
        scene({ asset: 'Interact/Wagon2a', id: '2', mode: 'None' }),
        scene({ asset: 'Interact/Wagon2b', id: '3', mode: 'None' }),
        scene({ asset: 'Interact/Wagon2c', id: '4', mode: 'None' }),
        scene({ asset: 'Interact/Wagon1', id: '5', mode: 'None' }),
      ].join('\n'),
    );
    expect(report.ruleCounts[3]).toBe(4);
    expect(report.violations.every((hit) => hit.asset.startsWith('Interact/Wagon2'))).toBe(true);
  });

  it('limits physical cuboids to 2000 and other physical meshes to 80', () => {
    const report = checkMapText(
      'Size.txt',
      [
        scene({ asset: 'Geometry/Cuboid', scale: [2000, 1, 1] }),
        scene({ asset: 'Geometry/Cube1', id: '2', scale: [2001, 1, 1] }),
        scene({ asset: 'Geometry/Cuboid', id: '3', scale: [9000, 1, 1], mode: 'None' }),
        scene({ asset: 'Nature/Rock', id: '4', scale: [80, 1, 1] }),
        scene({ asset: 'Nature/Rock', id: '5', scale: [-81, 1, 1] }),
        scene({ asset: 'None', id: '6', scale: [500, 1, 1] }),
        scene({ asset: 'Nature/Tree', id: '7', scale: [400, 1, 1], mode: 'Region' }),
      ].join('\n'),
    );
    expect(report.violations.map((hit) => [hit.rule, hit.id])).toEqual([
      [4, '2'],
      [5, '5'],
    ]);
    expect(report.violations[1].scale).toBe('-81 1 1');
  });

  it('can record more than one rule on the same object', () => {
    const report = checkMapText(
      'Both.txt',
      scene({ asset: 'FX/Flag', scale: [1, 1, 1], components: ['Rigidbody'] }),
    );
    expect(report.violations.map((hit) => hit.rule)).toEqual([1, 2]);
    expect(report.sceneObjects).toBe(1);
  });

  it('skips a scene line whose scale cannot be read', () => {
    const parts = Array.from({ length: 22 }, () => '');
    parts[0] = 'Scene';
    parts[1] = 'Nature/Rock';
    parts[2] = '9';
    parts[8] = 'Bad';
    parts[15] = '1.2.3';
    parts[16] = '1';
    parts[17] = '1';
    parts[18] = 'Physical';
    const report = checkMapText('Bad.txt', parts.join(','));
    expect(report.passed).toBe(true);
    expect(report.sceneObjects).toBe(0);
    expect(report.skippedScale).toBe(1);
  });
});
