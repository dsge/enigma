import {
  Group,
  Mesh,
  CylinderGeometry,
  MeshBasicMaterial,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  Material,
  RingGeometry,
  Geometry,
  DoubleSide,
  Vector3,
  Face3
} from 'three';

export class Player extends Group {
  public playerCharacter: Mesh;
  /**
   * how fast this entity can make a turn
   */
  public turningSpeed = 5 * 60;
  /**
   * how fast this entity can move
   */
  public movementSpeed = 7;
  /**
   * how hard this entity can start it's jump
   */
  public initialJumpMomentum = 0.2;
  /**
   * how hard the gravity slows the entity while jumping
   */
  public jumpGravity = 0.01;
  /**
   * the speed we are jumping currently
   */
  public upwardsMomentum: number = null;
  public alreadyDoubleJumped: Boolean = false;

  constructor() {
    super();

    this.playerCharacter = this.createPlayerCharacter();
    this.addWireframe(this.playerCharacter);

    this.add(this.playerCharacter);
    this.add(this.createIndicatorRing());
  }

  protected createPlayerCharacter(): Mesh {
    const geometry = new CylinderGeometry( 0.6, 0.6, 2, 16);
    const material = new MeshBasicMaterial({
      color: 0x343d46,
    });
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

  protected createIndicatorRing(): Group {
    const ring = new Mesh(
      new RingGeometry( 0.9, 1, 32 ),
      new MeshBasicMaterial( { color: 0xffff00, side: DoubleSide } )
    );
    const arrowGeometry = new Geometry();
    arrowGeometry.vertices = [
      new Vector3(0, 1.2, 0),
      new Vector3(0.2, 0.95, 0),
      new Vector3(-0.2, 0.95, 0)
    ];
    arrowGeometry.faces = [new Face3(1, 0, 2)];
    const arrow = new Mesh(
      arrowGeometry,
      new MeshBasicMaterial( { color: 0xffff00, side: DoubleSide } )
    );
    const ret = new Group();
    ret.rotateX(Math.PI / 2);
    ret.position.y = -0.98;
    ret.add(ring);
    ret.add(arrow);
    return ret;
  }
}
