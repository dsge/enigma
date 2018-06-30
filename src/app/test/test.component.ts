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

  protected cube: Mesh;
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
    const geometry = new BoxGeometry( 2, 2, 2 );
    const material = new MeshBasicMaterial({
      color: 0x343d46,
    });
    this.cube = new Mesh( geometry, material );
    this.addWireframe(this.cube);
    this.scene.add( this.cube );

    const origin = new Vector3( 0, 1.1, 0 );
    const length = 3;
    const hex = 0xffff00;

    const arrowHelper = new ArrowHelper( new Vector3(0, 0, 1), origin, length, hex);
    this.cube.add( arrowHelper );

    const gridHelper = new GridHelper( 50, 50 );
    gridHelper.position.y = - 1;
    this.scene.add( gridHelper );

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
      new EdgesGeometry( this.cube.geometry, 1 ),
      new LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    (mesh.material as Material).polygonOffset = true;
    (mesh.material as Material).polygonOffsetFactor = 1; // positive value pushes polygon further away
    (mesh.material as Material).polygonOffsetUnits = 1;
    return mesh.add(wireframe);
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

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;

    this.handlePlayerMovement(delta);

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
        angle = baseAngle + 180 + 45;
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
    if (angle !== null){
      ret.y = angle * Math.PI / 180;
    }

    return ret;
  }

  protected handlePlayerMovement(delta) {
    const userMovementSpeed = 7 * delta;
    const shouldBeRotatedTo = this.playerShouldBeRotatedTo(this.cube.rotation);
    if (this.userControlService.tryingToGoForward.getValue()) {
      this.cube.position.z -= userMovementSpeed;
    }
    if (this.userControlService.tryingToGoBackwards.getValue()) {
      this.cube.position.z += userMovementSpeed;
    }
    if (this.userControlService.tryingToGoLeft.getValue()) {
      this.cube.position.x -= userMovementSpeed;
    }
    if (this.userControlService.tryingToGoRight.getValue()) {
      this.cube.position.x += userMovementSpeed;
    }

    if (this.upwardsMomentum !== null) {
      this.upwardsMomentum -= 0.01;
      this.cube.position.y += this.upwardsMomentum;

      if (this.cube.position.y <= 0) {
        this.cube.position.y = 0;
        this.upwardsMomentum = null;
        this.alreadyDoubleJumped = false;
        if (this.userControlService.tryingToJump.getValue()) {
          this.userControlService.tryingToJump.next(true); // keep jumping
        }
      }
    }
    const turningRate = 200 * delta;

    const lookingNow = new Vector3( 0, 0, 1 );
    lookingNow.applyQuaternion( this.cube.quaternion );


    const shouldLookAtAfterTurning = (new Vector3).addVectors(shouldBeRotatedTo, this.cube.position);

    const lookAt = (new Vector3).addVectors(shouldLookAtAfterTurning, lookingNow);



    // this.cube.lookAt(shouldLookAtAfterTurning);
    // if (shouldBeRotatedTo.y - this.cube.rotation.y)


    let currentAngle = this.radToDeg(this.cube.rotation.y) % 360;
    const targetAngle = this.radToDeg(shouldBeRotatedTo.y);
    if ( Math.abs(targetAngle - currentAngle) >= turningRate) {
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
    this.cube.rotation.y = this.degToRad(currentAngle);

    this.playerCamera.position.z = this.cube.position.z + 10;
    this.playerCamera.position.x = this.cube.position.x;
  }

  protected radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }

  protected degToRad(deg: number): number {
    return deg * Math.PI / 180;
  }

}
