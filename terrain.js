import * as THREE from 'three';
import { ImprovedNoise } from 'jsm/math/ImprovedNoise.js';

class TerrainGenerator {
    constructor(width, height, resolution = 100) {
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.geometry = new THREE.PlaneGeometry(width * this.resolution, height * this.resolution, width - 1, height - 1);
        this.geometry.rotateX(-Math.PI / 2);
        this.position = this.geometry.attributes.position;
        this.position.usage = THREE.DynamicDrawUsage;
        this.planeVertices = this.position.array;

        const { vertices, heights } = this.generateHeight(this.width, this.height);
        for (let i = 0, j = 0, l = this.planeVertices.length; i < l; i++, j += 3) {
            this.planeVertices[j + 1] = heights[i] * 10;
        }

        // Create a 2D array to hold the grid of vectors
        const verts = this.planeVertices;
        this.grid = [];
        for (let i = 0; i < (height - 1); i++) {
            const row = [];
            for (let j = 0; j < (width - 1); j++) {
                const index = i * (width - 1) + j;
                const x = verts[index * 3];
                const y = verts[index * 3 + 1];
                const z = verts[index * 3 + 2];

                const vector = new THREE.Vector3(x, y, z);
                row.push(vector);
            }
            this.grid.push(row);
        }

        this.texture = this.createPerlinNoiseTexture(this.width, this.height);
        this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
        this.texture.repeat.set(1, 1);
        this.texture.encoding = THREE.sRGBEncoding;

        this.material = new THREE.MeshBasicMaterial({ map: this.texture });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    findPath(x1, y1, x2, y2) {
        const rows = this.grid.length;
        const cols = this.grid[0].length;
        const visited = new Array(rows).fill().map(() => new Array(cols).fill(false));
        const queue = [];
        const parents = {};

        const isValid = (x, y) => x >= 0 && x < rows && y >= 0 && y < cols && this.grid[x][y] !== 1;

        const directions = [
            [-1, 0], // Up
            [1, 0],  // Down
            [0, -1], // Left
            [0, 1]   // Right
        ];

        queue.push([x1, y1]);
        visited[x1][y1] = true;

        while (queue.length > 0) {
            const [x, y] = queue.shift();

            if (x === x2 && y === y2) {
            // Reconstruct the path from end to start
            const path = [];
            let current = [x2, y2];
            while (current) {
                path.unshift(current);
                current = parents[current.join(',')];
            }
            return path;
            }

            for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (isValid(newX, newY) && !visited[newX][newY]) {
                queue.push([newX, newY]);
                visited[newX][newY] = true;
                parents[`${newX},${newY}`] = [x, y];
            }
            }
        }

        // If no path is found
        return null;
    }

    getRandomGridPosition() {
        const x = Math.floor(Math.random() * this.grid.length);
        const y = Math.floor(Math.random() * this.grid[0].length);
        return { x: x, y: y };
    }

    getVertexInGrid(x, y) {
        return this.grid[x][y];
    }

    getMesh() {
        return this.mesh;
    }

    generateHeight(width, height) {
        const size = width * height;
        const heights = new Float32Array(size);
        const perlin = new ImprovedNoise();
        const z = Math.random() * 100;

        const vertices = [];

        let quality = 1;

        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < size; i++) {
                const x = i % width, y = ~~(i / width);
                heights[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
                vertices.push({ x, y, z: heights[i] * 10 });
            }
            quality *= 5;
        }

        return { vertices, heights };
    }

    createPerlinNoiseTexture(width, height) {
        const data = new Uint8Array(width * height * 3);
        const perlin = new ImprovedNoise();
        let quality = 1;

        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < data.length; i += 3) {
                const x = i % (width * 3) / 3, y = ~~(i / (width * 3));
                const value = perlin.noise(x / quality, y / quality, 0) * 0.5 + 0.5; // Normalize to [0, 1]
                const greenValue = value * 255;
                data[i] = 0;                // Red channel
                data[i + 1] = greenValue;   // Green channel
                data[i + 2] = 0;            // Blue channel
            }
            quality *= 5;
        }

        const texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat);
        texture.needsUpdate = true;
        return texture;
    }
}

export default TerrainGenerator;
