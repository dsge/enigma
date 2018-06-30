import { Component, OnInit, ElementRef, NgZone } from '@angular/core';
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
  Mesh
} from 'three';
import { createRendererType2 } from '@angular/core/src/view';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  protected cube;
  protected renderer;
  protected scene;
  protected camera;

  constructor(protected element: ElementRef, protected ngZone: NgZone) { }

  ngOnInit() {
    this.initCanvas(640, 480);
    this.initScene();
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
  }

  protected addWireframe(mesh: Mesh){
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
    this.renderer = new WebGLRenderer();
    this.renderer.setSize( width, height );
    this.element.nativeElement.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera( 75, width / height, 0.1, 1000 );
    this.camera.position.z = 5;
  }

  protected animate() {
    requestAnimationFrame( this.animate.bind(this) );

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render( this.scene, this.camera );
  }

}
