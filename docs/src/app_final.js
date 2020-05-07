var container;

var camera, scene, renderer;

var mouseX = 0, mouseY = 0;

var width = window.innerWidth;
var height = window.innerHeight;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

document.addEventListener( 'mousemove', onDocumentMouseMove, false );

var Lensing = function() {
    this.kappa_c = .2;
    this.gamma_c = .2;
    this.lens_count = 1;
    this.lens_mass = .1;
    this.distance = .1;
    this.radius = .01;
}
//var g = new dat.GUI();
// Lensing parameters
//var lenseFolder = g.addFolder("Lensing");
var lenseObj = new Lensing();
//lenseFolder.add(lenseObj, "distance", 0.03, 1).step(.01).listen();
//lenseFolder.add(lenseObj, "radius", 0.001, .1).step(.001).listen();

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
    camera.position.z = 3200;

    var path = "images/cubemap/dark-s_";
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];

    var textureCube = new THREE.CubeTextureLoader().load( urls );

    scene = new THREE.Scene();
    // scene.background = textureCube;
    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    var shader = "black_hole.html";
    uniforms = {
        u_distance: { value: lenseObj.distance },
        u_r_s: { value: lenseObj.radius },
        // u_gamma_c: { value: lenseObj.gamma_c },
        // u_lens_mass: { value: lenseObj.lens_mass },
        u_resolution: { type: "v2", value: new THREE.Vector2(width, height) },
        u_currentTexture: { type: "t", value: "rtFront "},
        u_texture: { type: "t", value: "texture" },
        u_mouse: { type: "v3", value: new THREE.Vector3() },
        u_frameCount: { type: "i", value: -1. },
        u_w: { value: width },
        u_h: { value: height },
        u_time: { value: performance.now() },
        u_paused: {type: 'i', value: 1},
        tCube: { type: "t", value: textureCube }
    };

    // uniforms[ "tCube" ].value = textureCube;

    material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        fragmentShader: document.getElementById( "index" ).textContent,
        vertexShader: document.getElementById( "vertexShader" ).textContent
    } );

    let mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX ) * 10;
    mouseY = ( event.clientY - windowHalfY ) * 10;
    uniforms.u_mouse.value.x = mouseX;
    uniforms.u_mouse.value.y = mouseY;
    console.log(uniforms.u_mouse);
}

function animate() {

    requestAnimationFrame( animate );

    render();

}

function render() {
    camera.position.x += ( mouseX - camera.position.x ) * .05;
    camera.position.y += ( - mouseY - camera.position.y ) * .05;

    camera.lookAt( scene.position );

    renderer.render( scene, camera );
}
