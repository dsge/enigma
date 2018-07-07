import {
  Group,
  PlaneBufferGeometry,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshFaceMaterial,
  Vector3,
} from 'three';

export class Map extends Group {
  public floor: Mesh;
  public spawnPosition: Vector3;

  constructor(size: number = 50, segments = 50) {
    super();

    this.floor = this.createFloor(size, segments);
    this.add(this.floor);
  }

  protected createFloor(size, segments): Mesh {
    const geometry = this.createFloorGeomerty(size, segments);
    const materialEven = new MeshBasicMaterial({color: 0xccccfc});
    const materialOdd = new MeshBasicMaterial({color: 0x444464});
    const materials = [materialEven, materialOdd];

    for (const x of Array.from(Array(segments).keys())) {
      for (const y of Array.from(Array(segments).keys())) {
        const i = x * segments + y;
        const j = 2 * i;
        geometry.faces[ j ].materialIndex = geometry.faces[ j + 1 ].materialIndex = (x + y) % 2;
      }
    }

    return new Mesh(geometry, new MeshFaceMaterial(materials));
  }

  protected createFloorGeomerty(size, segments): PlaneGeometry {
    const geometry = new PlaneGeometry(size, size, segments, segments);
    return geometry;
  }
}
