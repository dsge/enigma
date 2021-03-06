import {
  Group,
  PlaneBufferGeometry,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshFaceMaterial,
  Vector3,
  Vector2,
  Raycaster,
  Object3D,
  BoxBufferGeometry,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  Material,
} from 'three';

export class Map extends Group {
  public floor: Mesh;
  public spawnPosition: Vector3;
  protected raycaster = new Raycaster;
  protected raycasterDownVector = new Vector3(0, -1, 0);
  protected floorCollisionResults = new Array();
  protected collisionObjects = new Array<Object3D>();

  constructor(size: number = 50, segments = 50) {
    super();

    this.floor = this.createFloor(size, segments);
    const cube = this.createCube();
    cube.position.x = -5;
    cube.position.y = -5;
    cube.position.z = 0;
    this.addWireframe(cube);
    this.collisionObjects.push(cube);
    this.add(cube);
    this.add(this.floor);
  }

  protected createCube(): Mesh {
    const geometry = new BoxBufferGeometry( 4, 4, 4, 2, 2, 2 );
    const material = new MeshBasicMaterial( { color: 0xcccccc } );
    return new Mesh( geometry, material );
  }

  protected addWireframe(mesh: Mesh) {
    const wireframe = new LineSegments(
      new EdgesGeometry( mesh.geometry, 1 ),
      new LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    (mesh.material as Material).polygonOffset = true;
    (mesh.material as Material).polygonOffsetFactor = 1; // positive value pushes polygon further away
    (mesh.material as Material).polygonOffsetUnits = 1;
    return mesh.add(wireframe);
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

  getCollisionObjects(): Array<Object3D> {
    return this.collisionObjects;
  }

  getFloorLevelAt(position: Vector3): number {
    position = position.clone();
    position.y = 15;
    this.raycaster.set(position, this.raycasterDownVector);
    this.floorCollisionResults.length = 0;
    this.raycaster.intersectObject(this.floor, false, this.floorCollisionResults);
    if (this.floorCollisionResults.length > 0 && this.floorCollisionResults[0].distance > 0) {
      const pointHeight = this.floorCollisionResults[0].point.y;
      return pointHeight - this.position.y;
    }
    return 0;
  }

  protected createFloorGeomerty(size, segments): PlaneGeometry {
    const geometry = new PlaneGeometry(size, size, segments, segments);

    const maxDifference = 0.25;
    const minDifference = maxDifference * -1;
    // geometry.vertices[0].z = 4;
    for (let rowIndex = 0; rowIndex < geometry.parameters.widthSegments; rowIndex++) {
      for (let columnIndex = 0; columnIndex < geometry.parameters.heightSegments; columnIndex++) {
        const vertex = geometry.vertices[rowIndex * geometry.parameters.widthSegments + columnIndex];
        const neighbouringVertexOtherRow = geometry.vertices[(rowIndex - 1) * geometry.parameters.widthSegments + columnIndex] || null;
        const neighbouringVertex = geometry.vertices[rowIndex * geometry.parameters.widthSegments + columnIndex - 1] || null;

        let base = vertex.z;

        if (neighbouringVertexOtherRow) {
          base = neighbouringVertexOtherRow.z;
        }
        if (neighbouringVertex) {
          if (neighbouringVertexOtherRow) {
            base = (neighbouringVertexOtherRow.z + neighbouringVertex.z) / 2;
          } else {
            base = neighbouringVertex.z;
          }
        }

        if (Math.round(Math.random())) {
          vertex.z = base + maxDifference;
        } else {
          vertex.z = base - maxDifference;
        }
      }
    }

    return geometry;
  }
}
