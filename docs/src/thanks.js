// width and height of window
let width = window.innerWidth;
let height = window.innerHeight;

// file name of shader and img
let material;
let scene, composer, renderer, camera;
let dummy_camera;
let time;
let bloomPass;

window.onload = ()=>{
  lastframe = Date.now();
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( width ,height );
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);
  dummy_camera = new THREE.Camera();
  dummy_camera.position.z = 1;

  composer = new THREE.EffectComposer(renderer);
  let renderPass = new THREE.RenderPass(scene, dummy_camera);
  bloomPass = new THREE.UnrealBloomPass( 2, 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.5;
  bloomPass.strength = 0.0;
  bloomPass.radius = 0.0;
  let copyPass = new THREE.ShaderPass(THREE.CopyShader);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  init();
  camera = new Camera(70, window.innerWidth   / window.innerHeight, 1, 10000);
  camera.radius = 10;
  dt = 0;
  time = 0;
  scene.add(camera);
  loop();
}

let textures;
let mesh;
function init() {

    var geometry = new THREE.PlaneGeometry(2, 2);

    //setup renderTargets
    let parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapT: THREE.ClampToEdgeWrapping,
        wrapS: THREE.ClampToEdgeWrapping,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    };

    // initialize buffer and texture
    rtFront = new THREE.WebGLRenderTarget(width, height, parameters);
    textureLoader = new THREE.TextureLoader();

    textures = {};
    loadTexture('bg', 'images/space_pano.jpg');
    loadTexture('star', 'images/space_pano.jpg');
    loadTexture('disk', 'images/thankyou.png');



    // setup shaderMaterials, variables passed into shader
    uniforms = {
      time: { type: 'f', value: 0.0 },
      resolution: { type: "v2", value: new THREE.Vector2(width, height) },
      cam_pos: {type:"v3", value: new THREE.Vector3()},
      cam_vel: {type:"v3", value: new THREE.Vector3()},
      cam_up: {type:"v3", value: new THREE.Vector3()},
      fov: {type:"f", value: 0.0},
      bg_texture: {type: "t", value: null},
      star_texture: {type: "t", value: null},
      disk_texture: {type: "t", value:null}
    };

    material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( "vertexShader" ).textContent
    } );

    let loader = new THREE.FileLoader();
    //Change number of raymarcher steps
    loader.load('ray_marcher.glsl', (data)=> {
      let defines = `#define STEP 0.15
      #define NSTEPS 200`
      material.fragmentShader = defines + data
      material.fragmentShader.needsUpdate = true;
      material.needsUpdate = true;
      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh);
    })
}
const loadTexture = (name, image, interpolation=THREE.LinearFilter ,wrap = THREE.ClampToEdgeWrapping)=>{
    textures[name]= null
    textureLoader.load(image, (texture)=> {
      texture.magFilter = interpolation
      texture.minFilter = interpolation
      texture.wrapT = wrap
      texture.wrapS = wrap
      textures[name] = texture
    })
  }

function loop() {
  dt = (Date.now() - lastframe)/1000;
  time += dt;
  renderer.setPixelRatio( window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio( window.devicePixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.update(dt);
  updateUniforms();
  requestAnimationFrame( loop );
  render();
  lastframe = Date.now();
}

function updateUniforms() {
  uniforms.time.value = time;
  uniforms.resolution.value.x = window.innerWidth;
  uniforms.resolution.value.y = window.innerHeight;
  uniforms.cam_pos.value = camera.position;
  uniforms.cam_up.value = camera.up;
  uniforms.fov.value = camera.fov;
  uniforms.cam_vel.value = camera.velocity;
  uniforms.bg_texture.value = textures['bg'];
  uniforms.star_texture.value = textures['star'];
  uniforms.disk_texture.value = textures['disk'];
}

function render() {
    composer.render();
}
