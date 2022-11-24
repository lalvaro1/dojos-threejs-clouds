import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Uniform } from 'three';
import { Vector3 } from 'three';
import { earth_fragmentShader } from './shaders/earth_fragment.glsl';
import { earth_vertexShader } from './shaders/earth_vertex.glsl';
import { clouds_fragmentShader } from './shaders/clouds_fragment.glsl';
import { clouds_vertexShader } from './shaders/clouds_vertex.glsl';
import { final_fragmentShader } from './shaders/final_fragment.glsl';
import { final_vertexShader } from './shaders/final_vertex.glsl';
import { night_fragmentShader } from './shaders/night_fragment.glsl';
import { night_vertexShader } from './shaders/night_vertex.glsl';
import { atmos_fragmentShader } from './shaders/atmos_fragment.glsl';
import { atmos_vertexShader } from './shaders/atmos_vertex.glsl';
import { beam_fragmentShader } from './shaders/beam_fragment.glsl';
import { beam_vertexShader } from './shaders/beam_vertex.glsl';

let camera, renderer, controls;
let glowScene, earthScene, cloudScene;
let earthMesh, nightMesh, cloudsMesh, atmosMesh, beamMesh;
let composer1, composer2, composer3;
let bloomPass;

let nightRenderPass, renderScene, finalPass;

const earthUniforms = {
    sun:  new Uniform(new Vector3(1,1,1)),
    time: { value: 0 },
    ground: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth.jpg" ) },
    mask: { type: "t", value: new THREE.TextureLoader().load( "./textures/mask.png" ) },   
    normalMap: { type: "t", value: new THREE.TextureLoader().load( "./textures/earth_normal_map.png") },     
    clouds: { type: "t", value: new THREE.TextureLoader().load( "./textures/clouds.jpg", function ( texture ) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    })},         
    night: { type: "t", value: new THREE.TextureLoader().load( "./textures/night.jpg") },        
    cloudPos : { value: 0 },     
};

const cloudsUniforms = {
    sun:  new Uniform(new Vector3(1,1,1)),    
    clouds: earthUniforms.clouds,
    cloudPos : { value: 0 },                  
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
    PARAM_clipping : {value: 0},
};

const finalUniforms = {
    glowLayer: { type: "t", value: null },    
    cloudLayer: { type: "t", value: null },        
    tDiffuse: { type: "t", value: null },    
};

const beamUniforms = {
    time: { value: 0 },
    segments : { value: 0 },
    speed : { value: 0 },
    stretching : { value: 0 },
    intensity : { value: 0 },
    minAlpha : { value: 0 },    
    rayColor: new Uniform(new Vector3(1,1,1)),
    baseColor: new Uniform(new Vector3(1,1,1)),        
}

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
    camera.position.set( 0, 0.25, 1.);
    controls.update();

    const earthGeometry = new THREE.SphereGeometry( 0.5, 100, 100);
    const cloudsGeometry = new THREE.SphereGeometry( 0.505, 100, 100);
    const atmosPlane = new THREE.PlaneGeometry( 4, 4 );
    const beamGeometry = new THREE.ConeGeometry(0.025, 0.6, 64, 8, 0, 3.1415*2);

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

    const beamMaterial = new THREE.ShaderMaterial({
        fragmentShader : beam_fragmentShader,
        vertexShader : beam_vertexShader,        
        uniforms : beamUniforms,
        glslVersion: THREE.GLSL3,
        side : THREE.DoubleSide,
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

    beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
    beamMesh.translateY(0.6);
//    earthScene.add(beamMesh);

    nightMesh = new THREE.Mesh(earthGeometry, nightMaterial);
    glowScene.add(nightMesh);
    glowScene.add(beamMesh);
    nightMesh.parent = earthMesh;

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
    inner: 0.4991,
    outter: 0.58,
    ray: 0.0022,
    mie: 0.002,
    clipping : 1.05,
};

let beamSettings = {
    segments : 116,
    speed : 30,
    stretching : 8.43,
    intensity : 0.18,
    minAlpha : 0.7,
    rayColor : '#ffa400',
    baseColor : '#ffa400',        
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
    atmosFolder.add(atmosSettings, 'inner', 0.495 , 0.505, 0.0001);    
    atmosFolder.add(atmosSettings, 'outter', 0 , 2, 0.01);    
    atmosFolder.add(atmosSettings, 'ray', 0 , 0.005, 0.00001);    
    atmosFolder.add(atmosSettings, 'mie', 0 , 0.005, 0.00001);     
    atmosFolder.add(atmosSettings, 'clipping', 0, 3, 0.005);               

    const beamFolder = settingsUI.addFolder('Beam');
    beamFolder.add(beamSettings, 'stretching', 0.25 , 10, 0.01);    
    beamFolder.add(beamSettings, 'speed', 0 , 50, 0.01);        
    beamFolder.add(beamSettings, 'segments', 0 , 500, 1);        
    beamFolder.add(beamSettings, 'intensity', 0 , 2, 0.01);                
    beamFolder.add(beamSettings, 'minAlpha', 0 , 1, 0.01);        
    beamFolder.addColor(beamSettings, 'rayColor'); 
    beamFolder.addColor(beamSettings, 'baseColor');             
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

    const sun = new Vector3(0.88,0.17,0.44);

    earthUniforms.time.value = time;
    beamUniforms.time.value = time;

    controls.update();

    atmosUniforms.PARAM_intensity.value = atmosSettings.intensity;
    atmosUniforms.PARAM_inner.value = atmosSettings.inner;
    atmosUniforms.PARAM_outter.value = atmosSettings.outter;
    atmosUniforms.PARAM_ray.value = atmosSettings.ray;
    atmosUniforms.PARAM_mie.value = atmosSettings.mie;
    atmosUniforms.PARAM_clipping.value = atmosSettings.clipping;    

    atmosMesh.rotation.setFromRotationMatrix( camera.matrix );

    earthMesh.rotation.x = 0.5;
    earthMesh.rotation.y = -1.5 - 0.05 * time;

    composer1.render();
    composer3.render();    

    finalUniforms.glowLayer.value = composer1.readBuffer.texture;
    finalUniforms.cloudLayer.value = composer3.readBuffer.texture;    

    nightUniforms.color.value = colorStrToVec3(settings.glowColor);
    beamUniforms.rayColor.value = colorStrToVec3(beamSettings.rayColor);
    beamUniforms.baseColor.value = colorStrToVec3(beamSettings.baseColor);    
  
    earthUniforms.sun.value = sun;
    cloudsUniforms.sun.value = sun;
    atmosUniforms.sun.value = sun;

    beamUniforms.intensity.value = beamSettings.intensity;
    beamUniforms.segments.value = beamSettings.segments;
    beamUniforms.speed.value = beamSettings.speed;
    beamUniforms.stretching.value = beamSettings.stretching;
    beamUniforms.minAlpha.value = beamSettings.minAlpha;                

    const cloudPos = 0.0 * time;
    earthUniforms.cloudPos.value = cloudPos;
    cloudsUniforms.cloudPos.value = cloudPos;    

    composer2.render();

    requestAnimationFrame(animate);
}

init();
initGUI();
animate();
