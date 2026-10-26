export interface MapRule {
  id: number;
  title: string;
  checks: string;
  fix: string;
}

/** The same five checks as the mapcheck console app, in the same order. */
export const MAP_RULES: readonly MapRule[] = [
  {
    id: 1,
    title: 'Visual FX',
    checks:
      'Any asset whose path starts with FX/ is forbidden. That includes flags, fog, birds, fire, leaves, foliage generators, and water prefabs that live in that folder.',
    fix: 'Delete it. Visual FX assets are not allowed.',
  },
  {
    id: 2,
    title: 'Rigidbody and Floater',
    checks:
      'An object with a Rigidbody or Floater component is forbidden. WaterPhysics on its own is allowed.',
    fix: 'Delete it. Rigidbody and Floater are not allowed.',
  },
  {
    id: 3,
    title: 'Cloth wagons',
    checks:
      'These prefabs contain Cloth: Interact/Wagon2, Interact/Wagon2a, Interact/Wagon2b, and Interact/Wagon2c. The asset path must match exactly.',
    fix: 'Delete it. This prefab contains Cloth.',
  },
  {
    id: 4,
    title: 'Large cuboids',
    checks:
      'A physical Geometry/Cuboid or Geometry/Cube1 fails when its longest side is over 2000. The longest side is the largest absolute scale axis.',
    fix: 'Split it so each piece is at most 2000, or set collision to None if it is only visual.',
  },
  {
    id: 5,
    title: 'Large meshes',
    checks:
      'Any other physical mesh fails when its longest side is over 80. Geometry/Cuboid, Geometry/Cube1, and an asset named None are not part of this rule.',
    fix: 'Rebuild it from Cuboids, or scale the long side to 80.',
  },
];

export const ALLOWED_NOTES: readonly string[] = [
  'Collision None and Region may be any size. Size rules apply only when the collision mode is exactly Physical.',
  'An asset named None is not treated as a mesh.',
  'WaterPhysics is allowed. A Rigidbody or Floater on the same object is not.',
  'Object count does not matter. A busy map can pass, and a small map can fail.',
  'Blank lines, /// comments, and the EditorVersion line are ignored.',
];
