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
import {GameLoopService} from '../game-loop.service';
import {Map} from '../map';
import { MapService } from '../map.service';

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
  protected map: Map;

  constructor(
    protected element: ElementRef,
    protected ngZone: NgZone,
    protected userControlService: UserControlService,
    protected gameLoopService: GameLoopService,
    protected mapService: MapService
  ) { }

  ngOnInit() {
    CameraControls.install( { THREE: Three } );
    this.initCanvas(600, 600);
    this.initScene();
    this.initUserControlEvents();
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  protected initScene() {
    this.scene.add( this.initPlayer() );

    this.map = new Map(50, 50);
    this.map.rotation.x = Math.PI / 2;
    this.map.rotation.y = Math.PI;
    this.map.position.y = -1.02;
    this.mapService.currentMap = this.map;
    this.scene.add(this.map);

    const gridHelper = new GridHelper( 50, 50 );
    gridHelper.position.y = - 1;
    this.scene.add( gridHelper );

  }

  protected initPlayer() {
    this.player = new Player(this.gameLoopService, this.userControlService, this.mapService);
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

    this.gameLoopService.loop.emit(delta);

    this.focusPlayerCameraOnPlayer(this.player.position);

    this.orbitRenderer.render( this.scene, this.orbitCamera );
    this.playerRenderer.render( this.scene, this.playerCamera );
  }

  protected focusPlayerCameraOnPlayer(position: Vector3) {
    this.playerCamera.position.z = position.z + 10;
    this.playerCamera.position.x = position.x;
  }

  protected radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }

  protected degToRad(deg: number): number {
    return deg * Math.PI / 180;
  }

}
