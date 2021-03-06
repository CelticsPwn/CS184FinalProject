// width and height of window
let width = window.innerWidth;
let height = window.innerHeight;

// file name of shader and img
let current_texture = "black_hole";
let img = 'images/space.jpg';
let material;

let camera = new THREE.OrthographicCamera();
let mouseposition = {
    x: 0,
    y: 0
};

// -----------------------------------------------------------------------------
// GUI
// -----------------------------------------------------------------------------
var Lensing = function() {
    this.kappa_c = .2;
    this.gamma_c = .2;
    this.lens_count = 1;
    this.lens_mass = .1;
    this.distance = .1;
    this.radius = .01;
}
var g = new dat.GUI();
// Lensing parameters
var lenseFolder = g.addFolder("Lensing");
var lenseObj = new Lensing();
lenseFolder.add(lenseObj, "distance", 0.03, 1).step(.01).listen();
lenseFolder.add(lenseObj, "radius", 0.001, .1).step(.001).listen();

init();
loop();


function init() {
    // initialize some stuff
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( width ,height );
    document.body.appendChild(renderer.domElement);
    camera.position.z = 1;
    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    //setup renderTargets
    let parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    };

    // initialize buffer and texture
    rtFront = new THREE.WebGLRenderTarget(width, height, parameters);

    var texture = new THREE.TextureLoader().load( 'images/space_pano.jpg' );

    // setup shaderMaterials, variables passed into shader
    uniforms = {
        u_distance: { value: lenseObj.distance },
        u_r_s: { value: lenseObj.radius },
        u_resolution: { type: "v2", value: new THREE.Vector2(width, height) },
        u_currentTexture: { type: "t", value: rtFront },
        u_texture: { type: "t", value: texture },
        u_mouse: { type: "v3", value: new THREE.Vector3() },
        u_frameCount: { type: "i", value: -1. },
        u_w: { value: width },
        u_h: { value: height },
        u_time: { value: performance.now() },
        u_paused: {type: 'i', value: 1},
    };

    console.log(uniforms.u_lens_count);

    material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        fragmentShader: document.getElementById( current_texture ).textContent,
        vertexShader: document.getElementById( "vertexShader" ).textContent
    } );


    material.fragmentShader.needsUpdate = true;

    let mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'pointermove', onPointerMove, false );
}

function onPointerMove(event) {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let ratio = height / width;
    if(height > width) {
        mouseposition.x = (event.pageX - width / 2) / width;
        mouseposition.y = (event.pageY - height / 2) / height * -1 * ratio;
    } else {
        mouseposition.x = (event.pageX - width / 2) / width / ratio;
        mouseposition.y = (event.pageY - height / 2) / height * -1;
    }
    window.addEventListener('pointerdown', ()=> {
        uniforms.u_mouse.value.z = 1;
    });
    window.addEventListener('pointerup', ()=> {
        uniforms.u_mouse.value.z = 0;
    });
    event.preventDefault();
}

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
    requestAnimationFrame( loop );
    render();
}

function render() {
    //update uniforms
    uniforms.u_frameCount.value++;
    uniforms.u_distance.value = lenseObj.distance;
    uniforms.u_r_s.value = lenseObj.radius;
    uniforms.u_mouse.value.x = mouseposition.x + .5;
    uniforms.u_mouse.value.y = mouseposition.y + .5;
    uniforms.u_time.value = performance.now();
    renderer.render( scene, camera );
    renderer.render( scene, camera, rtFront, true );
}