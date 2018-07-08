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
  Face3,
  Euler,
  Vector2
} from 'three';
import {GameLoopService} from './game-loop.service';
import { UserControlService } from './user-control.service';
import { MapService } from './map.service';

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

  constructor(
    protected gameLoopService: GameLoopService,
    protected userControlService: UserControlService,
    protected mapService: MapService
  ) {
    super();

    this.playerCharacter = this.createPlayerCharacter();
    this.addWireframe(this.playerCharacter);

    this.add(this.playerCharacter);
    this.add(this.createIndicatorRing());

    this.gameLoopService.loop.subscribe(this.loop.bind(this));
  }

  protected loop(delta) {
    this.handlePlayerMovement(delta);
    this.handlePlayerJumping(delta);

    const turningRate = this.turningSpeed * delta;

    this.rotation.y = this.getPlayerRotationY(
      this.rotation.y,
      this.playerShouldBeRotatedTo(this.rotation).y,
      turningRate
    );
  }


  protected playerShouldBeRotatedTo(currentRotation: Euler): Vector3 {
    const ret = new Vector3(0, currentRotation.y, 0);
    let angle = null;
    const baseAngle = 0;
    if (this.userControlService.tryingToGoForward.getValue()) {
      angle = baseAngle + 180;
      if (this.userControlService.tryingToGoLeft.getValue()) {
        angle = baseAngle - 180 + 45;
      }
      if (this.userControlService.tryingToGoRight.getValue()) {
        angle = baseAngle + 180 - 45;
      }
    }
    if (this.userControlService.tryingToGoBackwards.getValue()) {
      angle = baseAngle + 0;
      if (this.userControlService.tryingToGoLeft.getValue()) {
        angle = baseAngle + 0 - 45;
      }
      if (this.userControlService.tryingToGoRight.getValue()) {
        angle = baseAngle + 0 + 45;
      }
    }
    if (!this.userControlService.tryingToGoForward.getValue() && !this.userControlService.tryingToGoBackwards.getValue()) {
      if (this.userControlService.tryingToGoLeft.getValue()) {
        angle = baseAngle - 90;
      }
      if (this.userControlService.tryingToGoRight.getValue()) {
        angle = baseAngle + 90;
      }
    }
    if (angle !== null) {
      ret.y = angle * Math.PI / 180;
    }

    return ret;
  }


  protected handlePlayerMovement(delta) {
    const userMovementSpeed = this.movementSpeed * delta;
    let movingInDirections = 0;
    let moveZ = 0;
    let moveX = 0;

    if (this.userControlService.tryingToGoForward.getValue()) {
      moveZ -= userMovementSpeed;
      movingInDirections++;
    }
    if (this.userControlService.tryingToGoBackwards.getValue()) {
      moveZ += userMovementSpeed;
      movingInDirections++;
    }
    if (this.userControlService.tryingToGoLeft.getValue()) {
      moveX -= userMovementSpeed;
      movingInDirections++;
    }
    if (this.userControlService.tryingToGoRight.getValue()) {
      moveX += userMovementSpeed;
      movingInDirections++;
    }
    if (movingInDirections > 1) {
      moveZ /= Math.sqrt(2);
      moveX /= Math.sqrt(2);
    }
    this.position.z += moveZ;
    this.position.x += moveX;

    this.position.y = this.mapService.currentMap.getFloorLevelAt(this.position);
  }

  protected handlePlayerJumping(delta) {
    if (this.upwardsMomentum !== null) {
      this.upwardsMomentum -= this.jumpGravity;
      this.playerCharacter.position.y += this.upwardsMomentum;

      if (this.playerCharacter.position.y <= 0) {
        this.playerCharacter.position.y = 0;
        this.upwardsMomentum = null;
        this.alreadyDoubleJumped = false;
        if (this.userControlService.tryingToJump.getValue()) {
          this.userControlService.tryingToJump.next(true); // keep jumping
        }
      }
    }
  }

  protected getPlayerRotationY(currentRotationRad, targetRotationRad, turningRate: number): number {
    /**
     * https://stackoverflow.com/a/41113257
     */
    let currentAngle = this.radToDeg(currentRotationRad) % 360;
    const targetAngle = this.radToDeg(targetRotationRad);
    if ( Math.abs(targetAngle - currentAngle) >= turningRate && Math.abs(targetAngle - currentAngle) < 359) {
      let addto = 0;
      if (targetAngle - currentAngle < 0) {
        addto = 360;
      }
      if ( targetAngle - currentAngle + addto <= 180 ) {
        currentAngle += turningRate;
      } else {
         currentAngle -= turningRate;
      }
    } else {
      currentAngle = targetAngle;
    }
    return this.degToRad(currentAngle);
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

  protected radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }

  protected degToRad(deg: number): number {
    return deg * Math.PI / 180;
  }
}
