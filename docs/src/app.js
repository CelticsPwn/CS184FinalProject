// width and height of window
let width = window.innerWidth;
let height = window.innerHeight;

// file name of shader and img
let current_texture = "black_hole";
let img = 'images/space.jpg';
let material;
let scene, composer, renderer;
let camera;
let renderPass, bloomPass, shaderPass;
let time;

window.onload = ()=>{
  lastframe = Date.now();
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000, 1.0)
  renderer.setSize( width ,height );
  document.body.appendChild(renderer.domElement);
  camera = new Camera(60, width / height, 1, 10000);
  camera.radius = 10;
  dt = 0;
  time = 0;
  //camera.position.z = 1;
  scene.add(camera);
  composer = new THREE.EffectComposer(renderer);
  renderPass = new THREE.RenderPass(scene, camera);
  bloomPass = new THREE.UnrealBloomPass(2.0, 3, 0, 0.5);
  shaderPass = new THREE.ShaderPass(THREE.CopyShader);
  composer.addPass(renderPass);
  shaderPass.renderToScreen  =true;
  composer.addPass(bloomPass);
  composer.addPass(shaderPass);
  init();
  loop();
}

// let camera = new Camera(60, width / height, 1, 10000);
// camera.radius = 10;
// dt = 0;
// time = 0;
// let mouseposition = {
//     x: 0,
//     y: 0
// };
//
// let scene, composer, renderer;
// composer = new THREE.EffectComposer(renderer);
// let renderPass = new THREE.RenderPass(scene, camera);
// let bloomPass = new THREE.UnrealBloomPass(2.0, 3, 0, 0.5);
// composer.addPass(renderPass);
// composer.addPass(bloomPass);
//
// init();
// loop();

let textures;
function init() {

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

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

    textures = {};
    //textures['bg'] = new THREE.TextureLoader().load( 'images/space_pano.jpg' );
    textures['star'] = new THREE.TextureLoader().load( 'images/stars.jpg' );
    //Change to some fiery texture
    textures['disk'] = new THREE.TextureLoader().load( 'images/red_cloud.jpg' );


    // setup shaderMaterials, variables passed into shader
    uniforms = {
      time: { type: 'f', value: 0.0 },
      resolution: { type: "v2", value: new THREE.Vector2(width, height) },
      cam_pos: {type:"v3", value: new THREE.Vector3()},
      cam_vel: {type:"v3", value: new THREE.Vector3()},
      cam_dir: {type:"v3", value: new THREE.Vector3()},
      cam_up: {type:"v3", value: new THREE.Vector3()},
      fov: {type:"f", value: 0.0},
      //bg_texture: {type: "t", value: null},
      star_texture: {type: "t", value: null},
      disk_texture: {type: "t", value:null}
    };

    console.log(uniforms.u_lens_count);

    material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        fragmentShader: document.getElementById( current_texture ).textContent,
        vertexShader: document.getElementById( "vertexShader" ).textContent
    } );

    loader = new THREE.FileLoader();
    //Change number of raymarcher steps
    loader.load('ray_marcher.glsl', (data)=> {
      let defines = `#define STEP 0.05
      #define NSTEPS 600`
      material.fragmentShader = defines + data
      material.fragmentShader.needsUpdate = true;
      material.needsUpdate = true;
      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh);
    })


    window.addEventListener( 'resize', onWindowResize, false );
    // window.addEventListener( 'pointermove', onPointerMove, false );
}

// function onPointerMove(event) {
//     let width = window.innerWidth;
//     let height = window.innerHeight;
//     let ratio = height / width;
//     if(height > width) {
//         mouseposition.x = (event.pageX - width / 2) / width;
//         mouseposition.y = (event.pageY - height / 2) / height * -1 * ratio;
//     } else {
//         mouseposition.x = (event.pageX - width / 2) / width / ratio;
//         mouseposition.y = (event.pageY - height / 2) / height * -1;
//     }
//     window.addEventListener('pointerdown', ()=> {
//         uniforms.u_mouse.value.z = 1;
//     });
//     window.addEventListener('pointerup', ()=> {
//         uniforms.u_mouse.value.z = 0;
//     });
//     event.preventDefault();
// }

function onWindowResize( event ) {
    uniforms.u_frameCount.value = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    renderer.setSize( width, height );
    uniforms.u_resolution.value.x = width;
    uniforms.u_resolution.value.y = height;
    uniforms.u_mouse.value = new THREE.Vector3();

    let parameters = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    };
    rtFront = new THREE.WebGLRenderTarget(width, height, parameters);
}

function loop() {
  dt = (Date.now() - lastframe)/1000;
  time += dt;
  renderer.setSize(window.innerWidth, window.innerHeight);
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
  uniforms.cam_dir.value = camera.direction;
  uniforms.cam_up.value = camera.up;
  uniforms.fov.value = camera.fov;
  uniforms.cam_vel.value = camera.velocity;
  //uniforms.bg_texture.value = textures['bg'];
  uniforms.star_texture.value = textures['star'];
  uniforms.disk_texture.value = textures['disk'];
}

function render() {
    //update uniforms
    //uniforms.u_frameCount.value++;
    // uniforms.u_mouse.value.x += ( mouseposition.x - uniforms.u_mouse.value.x );
    // uniforms.u_mouse.value.y += ( mouseposition.y - uniforms.u_mouse.value.y );
    //uniforms.u_distance.value = lenseObj.distance;
    //uniforms.u_r_s.value = lenseObj.radius;
    // uniforms.u_gamma_c.value = lenseObj.gamma_c;
    // uniforms.u_lens_mass.value = lenseObj.lens_mass;
    //uniforms.u_mouse.value.x = mouseposition.x + .5;
    //uniforms.u_mouse.value.y = mouseposition.y + .5;
    //uniforms.u_time.value = performance.now();
    // renderer.render( scene, camera );
    // renderer.render( scene, camera, rtFront, true );
    composer.render();
}
