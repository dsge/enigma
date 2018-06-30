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
  Mesh,
  Clock,
  GridHelper,
  Vector3,
  Euler,
  ArrowHelper,
} from 'three';
import * as Three from 'three';
import CameraControls from 'camera-controls';
import {Player} from '../player';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  protected player: Player;
  protected playerRenderer: WebGLRenderer;
  protected orbitRenderer: WebGLRenderer;
  protected scene: Scene;
  protected playerCamera: PerspectiveCamera;
  protected orbitCamera: PerspectiveCamera;
  protected orbitControls: CameraControls;
  protected clock = new Clock();

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
    this.player = new Player();
    return this.player;
  }

  protected initUserControlEvents() {
    const initialMomentum = this.player.initialJumpMomentum;
    this.userControlService.tryingToJump.subscribe((value) => {
      if (value) {
        if (this.player.upwardsMomentum === null) { // jump
          this.player.upwardsMomentum = initialMomentum;
        } else { // double jump
          if (!this.player.alreadyDoubleJumped) {
            this.player.alreadyDoubleJumped = true;
            this.player.upwardsMomentum = initialMomentum;
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

  protected addArrow(mesh: Mesh) {
    const origin = new Vector3( 0, 1.1, 0 );
    const length = 1;
    const hex = 0xffff00;

    const arrowHelper = new ArrowHelper( new Vector3(0, 0, 1), origin, length, hex);
    mesh.add( arrowHelper );
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
    this.orbitControls.update( delta );

    requestAnimationFrame( this.animate.bind(this) );

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

    const turningRate = this.player.turningSpeed * delta;

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
    const userMovementSpeed = this.player.movementSpeed * delta;
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
    if (this.player.upwardsMomentum !== null) {
      this.player.upwardsMomentum -= this.player.jumpGravity;
      this.player.playerCharacter.position.y += this.player.upwardsMomentum;

      if (this.player.playerCharacter.position.y <= 0) {
        this.player.playerCharacter.position.y = 0;
        this.player.upwardsMomentum = null;
        this.player.alreadyDoubleJumped = false;
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
