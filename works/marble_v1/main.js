var container;
var camera, scene, renderer;
var uniforms;

function init() {
    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_seed: { type: "f", value: Math.random() * 1000.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() }
    };

    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
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
    renderer.setSize( window.innerWidth, window.innerHeight );
    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

var framesRendered = 0;
const numToRender = 3600*3;

function render() {
    if ( framesRendered < numToRender && cvg) {
        cvg.addFrame(renderer.domElement);
        console.log("rendered: " + ((framesRendered/numToRender)*100).toFixed(1) + "%");
    }
    framesRendered++;

    uniforms.u_time.value += 0.05;
    renderer.render( scene, camera );

    if (framesRendered == numToRender) {
        cvg.render('marble');
        console.log("done rendering");
    }
}

window.onload = function () {
    init();
    animate();
}
