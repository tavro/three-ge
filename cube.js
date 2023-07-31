import * as THREE from 'three';

class Cube {
    constructor(x, y, z, size) {
        this.size = size;

        this.x = x;
        this.y = y; // + (this.size / 2);
        this.z = z;

        this.geometry = new THREE.BoxGeometry(size, size, size);
        this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(this.x, this.y, this.z);

        this.currentPath = undefined;
        this.targetPoint = undefined;
    }

    moveTowards() {
        if (!this.currentPath || this.currentPath.length === 0) return;

        if (!this.targetPoint) {
            this.targetPoint = this.currentPath[0];
        }

        const targetVector = new THREE.Vector3(this.targetPoint.x, this.targetPoint.y, this.targetPoint.z);
        const currentPosition = this.mesh.position.clone();
        const distanceToTarget = currentPosition.distanceTo(targetVector);

        const speed = 10;

        if (distanceToTarget <= speed) { // Cube has arrived
            this.mesh.position.set(targetVector.x, targetVector.y, targetVector.z);
            this.currentPath.shift();
            this.targetPoint = this.currentPath[0];
        } else {
            const direction = targetVector.clone().sub(currentPosition).normalize();
            const movement = direction.multiplyScalar(speed);
            this.mesh.position.add(movement);
        }
    }

    setGridPosition(x, y) {
        this.gridX = x;
        this.gridY = y;
    }

    getMesh() {
        return this.mesh;
    }
}

export default Cube;
