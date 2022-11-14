import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let camera, scene, renderer, controls;
let earthMesh, cloudsMesh;

const earthUniforms = {
    time: { value: 0 },
    ground: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth.jpg" ) },
    mask: { type: "t", value: new THREE.TextureLoader().load( "./textures/mask.png" ) },   
    normalMap: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth_normal_map.png") },     
    clouds: { type: "t", value: new THREE.TextureLoader().load( "./textures/clouds.jpg") },         
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },             
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

    const cloudsGeometry = new THREE.SphereGeometry( 15.15, 100, 100);

    const cloudsMaterial = new THREE.ShaderMaterial({
        fragmentShader : clouds_fragmentShader,
        vertexShader : clouds_vertexShader,        
        uniforms : cloudsUniforms,
        glslVersion: THREE.GLSL3,
        transparent: true,   
    });


    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(cloudsMesh);

    window.addEventListener('resize', onWindowResize, false);

    cloudsMesh.parent = earthMesh;

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
    earthMesh.rotation.y = -1.5 - 0.05 * time * 0.;

    renderer.render(scene, camera);
}

init();
animate();
