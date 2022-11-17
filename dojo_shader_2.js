import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { earth_fragmentShader } from './shaders/earth_fragment.glsl';
import { earth_vertexShader   } from './shaders/earth_vertex.glsl';
//import { clouds_fragmentShader } from './shaders/clouds_fragment.glsl';
//import { clouds_vertexShader   } from './shaders/clouds_vertex.glsl';

let camera, scene, renderer, controls;
let earthMesh;

const earthUniforms = {
    time: { value: 0 },
    ground: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth.jpg" ) },
    mask: { type: "t", value: new THREE.TextureLoader().load( "./textures/mask.png" ) },   
    normalMap: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth_normal_map.png") },     
    //clouds: { type: "t", value: new THREE.TextureLoader().load( "./textures/clouds.jpg") },         
};

const cloudsUniforms = {
    clouds: earthUniforms.clouds,         
};

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    camera.position.set( 0, 20, 40);
    controls.update();

    const earthGeometry = new THREE.SphereGeometry( 15, 100, 100);

    const earthMaterial = new THREE.ShaderMaterial({
        fragmentShader : earth_fragmentShader,
        vertexShader : earth_vertexShader,        
        uniforms : earthUniforms,
        glslVersion: THREE.GLSL3   
    });

    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(millis) {

    let time = millis * 0.001;

    earthUniforms.time.value = time;

    requestAnimationFrame(animate);

    controls.update();

    earthMesh.rotation.x = 0.5;
    earthMesh.rotation.y = -1.5 - 0.05 * time;
    
    renderer.render(scene, camera);
}

init();
animate();
