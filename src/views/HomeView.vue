<template>
  <v-toolbar class="bg-white">
    <img src="../assets/compas_logo_blue.png" width="48px" class="mx-2" />
    <v-toolbar-title> COMPAS WebViewer </v-toolbar-title>
    <v-btn @click="ping" variant="elevated" class="mx-1"> Ping </v-btn>
    <v-btn @click="boxToSubdividedMesh" variant="elevated" class="mx-1">
      Getting Started
    </v-btn>
    <v-btn @click="loadGemmaCurtain" variant="elevated" class="mx-1">
      Gemma Curtain
    </v-btn>
    <v-btn @click="loadCooper" variant="elevated" class="mx-1"> Cooper </v-btn>
    <WalletConnector />
  </v-toolbar>
  <MintingStrategies />
  <v-container class="pa-0 ma-0">
    <v-row no-gutters>
      <v-col cols="12" class="pa-0 ma-0">
        <v-sheet
          class="bg-blue-grey-lighten-4"
          :height="contentHeight"
          v-resize="onResize"
        >
          <div id="three-container"></div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="dialog.visible" width="480">
    <v-card>
      <v-card-title>{{ dialog.title }}</v-card-title>
      <v-card-text>{{ dialog.text }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="dialog.visible = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import compas from "@/api/compas";
import WalletConnector from "@/components/WalletConnector.vue";
import MintingStrategies from "@/components/MintingStrategies.vue";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

export default {
  components: {
    WalletConnector,
    MintingStrategies,
  },
  data: () => ({
    dialog: {
      visible: false,
      title: "",
      text: "",
    },
    removeFromTop: 64,
    contentHeight: window.innerHeight - 64,
    config: {
      camera: {
        fov: 75,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 1000,
      },
      grid: {
        size: 20,
        divisions: 20,
        colorCenterLine: 0x7f7f7f,
        colorGrid: 0xbfbfbf,
      },
    },
    camera: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    selectableMeshes: [],
  }),

  methods: {
    onResize() {
      this.contentHeight = window.innerHeight - this.removeFromTop;
    },

    initThree() {
      const camera = new THREE.PerspectiveCamera(
        this.config.camera.fov,
        this.config.camera.aspect,
        this.config.camera.near,
        this.config.camera.far
      );
      camera.up.set(0, 0, 1);
      camera.position.set(0, -7, 7);
      camera.lookAt(0, 0, 0);
      this.camera = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoSize: true,
      });
      renderer.setSize(window.innerWidth, this.contentHeight);
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      const container = document.getElementById("three-container");
      container.appendChild(renderer.domElement);
      container.addEventListener("mousemove", this.onMouseMove, false);
      container.addEventListener("click", this.onMeshClick, false);

      const controls = new OrbitControls(camera, renderer.domElement);
    },

    addBox() {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
      const cube = new THREE.Mesh(geometry, material);
      cube.userData.interactive = true;
      this.selectableMeshes.push(cube);
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xaaaaaa })
      );
      scene.add(cube);
      scene.add(line);
    },

    addAxes() {
      const axes = new THREE.AxesHelper(1);
      scene.add(axes);
    },

    addGrid() {
      const grid = new THREE.GridHelper(
        this.config.grid.size,
        this.config.grid.divisions,
        this.config.grid.colorCenterLine,
        this.config.grid.colorGrid
      );
      grid.rotation.x = Math.PI / 2;
      scene.add(grid);
    },

    addMesh(vertices, edges, faces) {
      const positions = new THREE.Float32BufferAttribute(vertices, 3);
      const meshgeometry = new THREE.BufferGeometry();
      meshgeometry.setAttribute("position", positions);
      meshgeometry.setIndex(faces);
      const meshmaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(meshgeometry, meshmaterial);
      mesh.userData.interactive = true;
      this.selectableMeshes.push(mesh);

      const linegeometry = new THREE.BufferGeometry();
      linegeometry.setAttribute("position", positions);
      linegeometry.setIndex(edges);
      const linematerial = new THREE.LineBasicMaterial({ color: 0x888888 });
      const line = new THREE.LineSegments(linegeometry, linematerial);

      scene.add(mesh);
      scene.add(line);
    },

    onMouseMove(event) {
      const containerRect = event.target.getBoundingClientRect();
      this.mouse.x =
        ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
      this.mouse.y =
        -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.selectableMeshes);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        mesh.material.color.set(0xff0000);
        event.target.style.cursor = "pointer";
      } else {
        this.selectableMeshes.forEach((mesh) => {
          mesh.material.color.set(0xcccccc);
        });
        event.target.style.cursor = "default";
      }
    },

    onMeshClick(event) {
      const containerRect = event.target.getBoundingClientRect();
      this.mouse.x =
        ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
      this.mouse.y =
        -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.selectableMeshes);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        this.showDialog("Mesh Clicked", "You clicked on a mesh!");
      }
    },

    showDialog(title, text) {
      this.dialog.visible = true;
      this.dialog.title = title;
      this.dialog.text = text;
    },

    ping() {
      compas.ping().then((response) => {
        this.showDialog("Info", `ping says: ${response}`);
      });
    },

    boxToSubdividedMesh() {
      compas
        .boxToSubdividedMesh({ xsize: 1, ysize: 1, zsize: 1 })
        .then((response) => {
          this.addMesh(response.vertices, response.edges, response.faces);
        });
    },

    loadGemmaCurtain() {
      compas.loadGemmaCurtain().then((response) => {
        this.addMesh(response.vertices, response.edges, response.faces);
      });
    },

    loadCooper() {
      compas.loadCooper().then((response) => {
        this.addMesh(response.vertices, response.edges, response.faces);
      });
    },
  },

  mounted() {
    this.initThree();
    this.addGrid();
  },
};
</script>
