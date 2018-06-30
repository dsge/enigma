import {
  Component,
  OnInit,
  ElementRef,
  NgZone
} from '@angular/core';
import {
  UserControlService
} from '../user-control.service';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  MeshBasicMaterial,
  MeshPhongMaterial,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  Clock,
  GridHelper,
  Vector3,
  Euler,
  ArrowHelper,
  CylinderGeometry,
  Group,
  RingGeometry,
  DoubleSide,
  Geometry,
  Face3
} from 'three';
import * as Three from 'three';
import CameraControls from 'camera-controls';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  protected player: Group;
  protected playerCharacter: Mesh;
  protected playerRenderer: WebGLRenderer;
  protected orbitRenderer: WebGLRenderer;
  protected scene: Scene;
  protected playerCamera: PerspectiveCamera;
  protected orbitCamera: PerspectiveCamera;
  protected orbitControls: CameraControls;
  protected clock = new Clock();
  protected upwardsMomentum: number = null;
  protected alreadyDoubleJumped: Boolean = false;

  constructor(protected element: ElementRef, protected ngZone: NgZone, protected userControlService: UserControlService) { }

  ngOnInit() {
    CameraControls.install( { THREE: Three } );
    this.initCanvas(600, 600);
    this.initScene();
    this.initUserControlEvents();
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  protected initScene() {
    this.scene.add( this.initPlayer() );

    const gridHelper = new GridHelper( 50, 50 );
    gridHelper.position.y = - 1;
    this.scene.add( gridHelper );

  }

  protected initPlayer() {
    const geometry = new CylinderGeometry( 0.6, 0.6, 2, 16);
    const material = new MeshBasicMaterial({
      color: 0x343d46,
    });
    this.playerCharacter = new Mesh( geometry, material );
    this.player = new Group();
    this.player.add(this.playerCharacter);
    this.addWireframe(this.playerCharacter);
    // this.addArrow(playerCharacter);
    this.player.add(this.createIndicatorRing());
    return this.player;
  }

  protected initUserControlEvents() {
    const initialMomentum = 0.2;
    this.userControlService.tryingToJump.subscribe((value) => {
      if (value) {
        if (this.upwardsMomentum === null) { // jump
          this.upwardsMomentum = initialMomentum;
        } else { // double jump
          if (!this.alreadyDoubleJumped) {
            this.alreadyDoubleJumped = true;
            this.upwardsMomentum = initialMomentum;
          }
        }
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    this.userControlService.handleKeyboardEvent(event);
  }

  onKeyUp(event: KeyboardEvent) {
    this.userControlService.handleKeyboardEvent(event);
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

  protected addArrow(mesh: Mesh) {
    const origin = new Vector3( 0, 1.1, 0 );
    const length = 1;
    const hex = 0xffff00;

    const arrowHelper = new ArrowHelper( new Vector3(0, 0, 1), origin, length, hex);
    mesh.add( arrowHelper );
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

  protected initCanvas(width: number, height: number) {
    const playerCanvas = this.element.nativeElement.querySelector('.player-canvas');
    const orbitCanvas = this.element.nativeElement.querySelector('.orbit-canvas');
    this.playerRenderer = new WebGLRenderer({
      canvas: playerCanvas
    });
    this.playerRenderer.setSize( width, height );
    this.orbitRenderer = new WebGLRenderer({
      canvas: orbitCanvas
    });
    this.orbitRenderer.setSize( width, height );
    if (!playerCanvas) {
      this.element.nativeElement.appendChild(this.playerRenderer.domElement);
    }
    if (!orbitCanvas) {
      this.element.nativeElement.appendChild(this.orbitRenderer.domElement);
    }

    this.scene = new Scene();
    this.orbitCamera = new PerspectiveCamera( 75, width / height, 0.1, 1000 );
    this.orbitCamera.position.z = 35;
    this.orbitCamera.position.y = 35;
    this.playerCamera = new PerspectiveCamera( 75, width / height, 0.1, 1000 );
    this.playerCamera.position.z = 10;
    this.playerCamera.position.y = 10;
    this.playerCamera.rotation.x = -53.1301024 * Math.PI / 180;

    this.orbitControls = new CameraControls( this.orbitCamera, this.orbitRenderer.domElement );
  }

  protected animate() {
    const delta = this.clock.getDelta();
    const isControlsUpdated = this.orbitControls.update( delta );

    requestAnimationFrame( this.animate.bind(this) );

    // this.player.rotation.x += 0.01;
    // this.player.rotation.y += 0.01;

    this.handlePlayerActions(delta);

    this.orbitRenderer.render( this.scene, this.orbitCamera );
    this.playerRenderer.render( this.scene, this.playerCamera );
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

  protected handlePlayerActions(delta) {
    this.handlePlayerMovement(delta);
    this.handlePlayerJumping(delta);

    const turningRate = 5 * 60 * delta;

    this.player.rotation.y = this.getPlayerRotationY(
      this.player.rotation.y,
      this.playerShouldBeRotatedTo(this.player.rotation).y,
      turningRate
    );
    this.focusPlayerCameraOnPlayer(this.player.position);
  }

  protected focusPlayerCameraOnPlayer(position: Vector3) {
    this.playerCamera.position.z = position.z + 10;
    this.playerCamera.position.x = position.x;
  }

  protected handlePlayerMovement(delta) {
    const userMovementSpeed = 7 * delta;
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
    this.player.position.z += moveZ;
    this.player.position.x += moveX;
  }

  protected handlePlayerJumping(delta) {
    if (this.upwardsMomentum !== null) {
      this.upwardsMomentum -= 0.01;
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

  protected radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }

  protected degToRad(deg: number): number {
    return deg * Math.PI / 180;
  }

}
