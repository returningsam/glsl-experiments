var container;
var camera, scene, renderer, geometry;
var uniforms;
var controls;

function init() {
    container = document.getElementById( 'container' );

    const near = 0.01;
    const far = 1000;
    const fieldOfView = 65;
    camera = new THREE.PerspectiveCamera(fieldOfView, window.innerWidth/window.innerHeight, near, far);
    camera.position.z = 25;
    controls = new THREE.OrbitControls( camera );
    controls.update();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    scene = new THREE.Scene();

    geometry = new THREE.SphereBufferGeometry( 10, 1000, 1000 );
    // var geometry = new THREE.CircleBufferGeometry( 10, 1000 );
    // var geometry = new THREE.PlaneBufferGeometry( 10, 10, 500, 500 );

    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() }
    };

    var material = new THREE.RawShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.DoubleSide
    } );

    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );

    document.onmousemove = function(e){
        uniforms.u_mouse.value.x = e.pageX
        uniforms.u_mouse.value.y = e.pageY
    }
}

function onWindowResize( event ) {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

var angle = 5;
var angleDiff = 0.05;

function render() {
    uniforms.u_time.value += 0.05;
    renderer.render( scene, camera );
    controls.update();
}

window.onload = function () {
    init();
    animate();
}
