import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

let camera, scene, renderer, controls, scene2;
let earthMesh, cloudsMesh;
let composer, composer2, finalComposer;

let nightRenderPass;
let renderScene;
let finalPass;

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
    time: { value: 0 },
    ground: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth.jpg" ) },
    mask: { type: "t", value: new THREE.TextureLoader().load( "./textures/mask.png" ) },   
    normalMap: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth_normal_map.png") },     
    clouds: { type: "t", value: new THREE.TextureLoader().load( "./textures/clouds.jpg") },         
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },             
};


const finalUniforms = {
    earthRender: { type: "t", value: null },
    glowRender: { type: "t", value: null },    
    tDiffuse: { type: "t", value: null },    
};


function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene2 = new THREE.Scene();    
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
    scene.add(earthMesh);

    let nightMesh = new THREE.Mesh(earthGeometry, nightMaterial);
    scene2.add(nightMesh);
   
    cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    //scene.add(cloudsMesh);

    window.addEventListener('resize', onWindowResize, false);

    cloudsMesh.parent = earthMesh;

    nightRenderPass = new RenderPass( scene2, camera );
    renderScene = new RenderPass( scene, camera );

    nightRenderPass.renderToScreen = false;


    const bloomParams = {
        exposure: 1,
        bloomStrength: 1.5,
        bloomThreshold: 0,
        bloomRadius: 0
    };

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = bloomParams.bloomThreshold;
    bloomPass.strength = bloomParams.bloomStrength;
    bloomPass.radius = bloomParams.bloomRadius;

    bloomPass.needsSwap = false;
    bloomPass.clear = false;

    bloomPass.renderToScreen = false;


    composer = new EffectComposer( renderer );
    composer.addPass( nightRenderPass );
    composer.addPass( bloomPass );

    finalPass = new ShaderPass(finalMaterial);

    composer2 = new EffectComposer( renderer );
    composer2.addPass( renderScene );
    composer2.addPass( finalPass );




}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer.setSize( width, height );
    composer2.setSize( width, height );
}

function animate(millis) {

    let time = millis * 0.001;

    earthUniforms.time.value = time;

    controls.update();

    earthMesh.rotation.x = 0.5;
    earthMesh.rotation.y = -1.5 - 0.05 * time * 0.;

    composer.render();
    finalUniforms.earthRender.value = composer.readBuffer.texture;

    //    earthUniforms.glow.needsUpdate = true;

    composer2.render();


    requestAnimationFrame(animate);
}

init();
animate();
