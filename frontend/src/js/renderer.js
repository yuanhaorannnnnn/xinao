import { THREE } from './three-modules.js';

export class PointCloudRenderer {
  constructor(scene) {
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true
    });
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  updateGeometry(positions, colors) {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}