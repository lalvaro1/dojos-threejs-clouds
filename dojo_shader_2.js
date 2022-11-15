import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Uniform } from 'three';
import { Vector3 } from 'three';

let camera, renderer, controls;
let mainScene, glowScene;
let earthMesh, nightMesh, cloudsMesh;
let composer1, composer2;
let bloomPass;

let nightRenderPass, renderScene, finalPass;

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

const nightUniforms = {
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },             
    color: new Uniform(new Vector3(1,1,1)),
};

const finalUniforms = {
    glowLayer: { type: "t", value: null },    
    tDiffuse: { type: "t", value: null },    
};

const settings = {
    glowColor : '#ffa400',
}

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    glowScene = new THREE.Scene();
    mainScene = new THREE.Scene();    
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

    const nightGeometry = new THREE.SphereGeometry( 15, 100, 100);

    const nightMaterial = new THREE.ShaderMaterial({
        fragmentShader : night_fragmentShader,
        vertexShader : night_vertexShader,        
        uniforms : nightUniforms,
        glslVersion: THREE.GLSL3   
    });

    const finalMaterial = new THREE.ShaderMaterial({
        fragmentShader : final_fragmentShader,
        vertexShader : final_vertexShader,        
        uniforms : finalUniforms,
        glslVersion: THREE.GLSL3   
    });

    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    glowScene.add(earthMesh);

    nightMesh = new THREE.Mesh(earthGeometry, nightMaterial);
    nightMesh.parent = earthMesh;
    mainScene.add(nightMesh);
   
    cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    glowScene.add(cloudsMesh);

    window.addEventListener('resize', onWindowResize, false);

    cloudsMesh.parent = earthMesh;

    nightRenderPass = new RenderPass( mainScene, camera );
    nightRenderPass.renderToScreen = false;
    renderScene = new RenderPass( glowScene, camera );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 4.75, 0.96, 0.0);
    
    bloomPass.needsSwap = false;
    bloomPass.clear = false;

    composer1 = new EffectComposer( renderer );
    composer1.addPass( nightRenderPass );
    composer1.addPass( bloomPass );
    composer1.addPass( bloomPass );    

    finalPass = new ShaderPass(finalMaterial);

    composer2 = new EffectComposer( renderer );
    composer2.addPass( renderScene );
    composer2.addPass( finalPass );
}

function initGUI() {

    var settingsUI = new dat.GUI();
    const generalFolder = settingsUI.addFolder('Glow');

    generalFolder.add(bloomPass, 'strength', 0 , 5, 0.01);    
    generalFolder.add(bloomPass, 'radius', 0 , 1, 0.001);        
    generalFolder.add(bloomPass, 'threshold', 0, 1, 0.001);    
    generalFolder.addColor(settings, 'glowColor');        
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer1.setSize( width, height );
    composer2.setSize( width, height );
}

function colorStrToVec3(colorStr) {
    const r = parseInt(colorStr.slice(1,3), 16);
    const g = parseInt(colorStr.slice(3,5), 16);
    const b = parseInt(colorStr.slice(5,8), 16);
    
    return new Vector3(r/255., g/255., b/255.);
}


function animate(millis) {

    let time = millis * 0.001;

    earthUniforms.time.value = time;

    controls.update();

    earthMesh.rotation.x = 0.5;
    earthMesh.rotation.y = -1.5 - 0.05 * time;

    nightMesh.rotation.x = 0.5;
    nightMesh.rotation.y = -1.5 - 0.05 * time;

    composer1.render();
    finalUniforms.glowLayer.value = composer1.readBuffer.texture;
    nightUniforms.color.value = colorStrToVec3(settings.glowColor);
  
    composer2.render();

    requestAnimationFrame(animate);
}

init();
//initGUI();
animate();
