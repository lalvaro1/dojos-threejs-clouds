import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Uniform } from 'three';
import { Vector3 } from 'three';

let camera, renderer, controls;
let glowScene, earthScene, cloudScene;
let earthMesh, nightMesh, cloudsMesh, atmosMesh;
let composer1, composer2, composer3;
let bloomPass;

let nightRenderPass, renderScene, finalPass;

const earthUniforms = {
    sun:  new Uniform(new Vector3(1,1,1)),
    time: { value: 0 },
    ground: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth.jpg" ) },
    mask: { type: "t", value: new THREE.TextureLoader().load( "./textures/mask.png" ) },   
    normalMap: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth_normal_map.png") },     
    clouds: { type: "t", value: new THREE.TextureLoader().load( "./textures/clouds.jpg") },         
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },             
};

const cloudsUniforms = {
    sun:  new Uniform(new Vector3(1,1,1)),    
    clouds: earthUniforms.clouds,         
};

const nightUniforms = {
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },             
    color: new Uniform(new Vector3(1,1,1)),
};

const atmosUniforms = {
    sun:  new Uniform(new Vector3(1,1,1)),   
    PARAM_intensity : {value: 8.86},
    PARAM_inner : {value: 12.81},
    PARAM_outter : {value: 30.08},
    PARAM_ray : {value: 0.56},
    PARAM_mie : {value: 0.17},
};

const finalUniforms = {
    glowLayer: { type: "t", value: null },    
    cloudLayer: { type: "t", value: null },        
    tDiffuse: { type: "t", value: null },    
};

const settings = {
    glowColor : '#ffa400',
}

function init() {

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    earthScene = new THREE.Scene();
    glowScene = new THREE.Scene();    
    cloudScene = new THREE.Scene();    

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    camera.position.set( 0, 2, 4);
    controls.update();

    const earthGeometry = new THREE.SphereGeometry( 0.5, 100, 100);
    const cloudsGeometry = new THREE.SphereGeometry( 0.505, 100, 100);
    const atmosPlane = new THREE.PlaneGeometry( 4, 4 );

    // Shaders / materials

    const earthMaterial = new THREE.ShaderMaterial({
        fragmentShader : earth_fragmentShader,
        vertexShader : earth_vertexShader,        
        uniforms : earthUniforms,
        glslVersion: THREE.GLSL3   
    });

    const cloudsMaterial = new THREE.ShaderMaterial({
        fragmentShader : clouds_fragmentShader,
        vertexShader : clouds_vertexShader,        
        uniforms : cloudsUniforms,
        glslVersion: THREE.GLSL3,
        transparent: true,   
    });

    const nightMaterial = new THREE.ShaderMaterial({
        fragmentShader : night_fragmentShader,
        vertexShader : night_vertexShader,        
        uniforms : nightUniforms,
        glslVersion: THREE.GLSL3   
    });

    const atmosMaterial = new THREE.ShaderMaterial({
        fragmentShader : atmos_fragmentShader,
        vertexShader : atmos_vertexShader,        
        uniforms : atmosUniforms,
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        glslVersion: THREE.GLSL3   
    });

    const finalPassMaterial = new THREE.ShaderMaterial({
        fragmentShader : final_fragmentShader,
        vertexShader : final_vertexShader,        
        uniforms : finalUniforms,
        glslVersion: THREE.GLSL3   
    });

    // Scenes
    atmosMesh = new THREE.Mesh( atmosPlane, atmosMaterial );
    earthScene.add( atmosMesh );

    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthScene.add(earthMesh);

    nightMesh = new THREE.Mesh(earthGeometry, nightMaterial);
    nightMesh.parent = earthMesh;
    glowScene.add(nightMesh);

    cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudScene.add(cloudsMesh);

    window.addEventListener('resize', onWindowResize, false);

    cloudsMesh.parent = earthMesh;


    // Render Passes

    nightRenderPass = new RenderPass( glowScene, camera );
    nightRenderPass.renderToScreen = false;
    renderScene = new RenderPass( earthScene, camera );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 4.75, 0.96, 0.0);
    
    bloomPass.needsSwap = false;
    bloomPass.clear = false;
    
    composer1 = new EffectComposer( renderer );
    composer1.addPass( nightRenderPass );
    composer1.addPass( bloomPass );
    composer1.renderToScreen = false;

    composer3 = new EffectComposer( renderer );
    let renderCloudScene = new RenderPass( cloudScene, camera );    
    composer3.addPass( renderCloudScene );
    composer3.renderToScreen = false;

    finalPass = new ShaderPass(finalPassMaterial);

    composer2 = new EffectComposer( renderer );
    composer2.addPass( renderScene );
    composer2.addPass( finalPass );
}

let atmosSettings = {
    intensity: 27,
    inner: 0.493,
    outter: 1.23,
    ray: 0.0022,
    mie: 0.002,
};

function initGUI() {

    var settingsUI = new dat.GUI();
    const generalFolder = settingsUI.addFolder('Glow');

    generalFolder.add(bloomPass, 'strength', 0 , 5, 0.01);    
    generalFolder.add(bloomPass, 'radius', 0 , 1, 0.001);        
    generalFolder.add(bloomPass, 'threshold', 0, 1, 0.001);    
    generalFolder.addColor(settings, 'glowColor');      
    
    const atmosFolder = settingsUI.addFolder('Atmos');
    atmosFolder.add(atmosSettings, 'intensity', 0 , 50, 0.01);    
    atmosFolder.add(atmosSettings, 'inner', 0 , 20, 0.01);    
    atmosFolder.add(atmosSettings, 'outter', 15 , 50, 0.01);    
    atmosFolder.add(atmosSettings, 'ray', 0 , 5, 0.01);    
    atmosFolder.add(atmosSettings, 'mie', 0 , 5, 0.01);                    
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer1.setSize( width, height );
    composer2.setSize( width, height );
    composer3.setSize( width, height );    
}

function colorStrToVec3(colorStr) {
    const r = parseInt(colorStr.slice(1,3), 16);
    const g = parseInt(colorStr.slice(3,5), 16);
    const b = parseInt(colorStr.slice(5,8), 16);
    
    return new Vector3(r/255., g/255., b/255.);
}


function animate(millis) {

    let time = millis * 0.001;

    let sun = new Vector3(1,0,0);
    //normalize(vec3(1, -0.2, -0.5))

    earthUniforms.time.value = time;

    controls.update();

    atmosUniforms.PARAM_intensity.value = atmosSettings.intensity;
    atmosUniforms.PARAM_inner.value = atmosSettings.inner;
    atmosUniforms.PARAM_outter.value = atmosSettings.outter;
    atmosUniforms.PARAM_ray.value = atmosSettings.ray;
    atmosUniforms.PARAM_mie.value = atmosSettings.mie;

    atmosMesh.rotation.setFromRotationMatrix( camera.matrix );

    earthMesh.rotation.x = 0.5;
    earthMesh.rotation.y = -1.5 - 0.05 * time;

    nightMesh.rotation.x = 0.5;
    nightMesh.rotation.y = -1.5 - 0.05 * time;

    composer1.render();
    composer3.render();    

    finalUniforms.glowLayer.value = composer1.readBuffer.texture;
    finalUniforms.cloudLayer.value = composer3.readBuffer.texture;    

    nightUniforms.color.value = colorStrToVec3(settings.glowColor);
  
    earthUniforms.sun.value = sun;
    cloudsUniforms.sun.value = sun;
    atmosUniforms.sun.value = sun;

    composer2.render();

    requestAnimationFrame(animate);
}

init();
//initGUI();
animate();
