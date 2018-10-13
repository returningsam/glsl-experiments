var container;
var camera, scene, renderer;
var uniforms;
var rt1,rt2;

function init() {
    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        backbuffer: { type: "t", value: null },
        u_mouse_down: { type: "b", value: false },
        u_seed:       { type: "f", value: Math.random()*10}
    };

    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    } );

    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setPixelRatio( window.devicePixelRatio );

    rt1 = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    rt2 = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });

    container.appendChild( renderer.domElement );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousedown', handleMouseDown, false );
    window.addEventListener( 'mouseup', handleMouseUp, false );

    document.onmousemove = function(e){
        uniforms.u_mouse.value.x = e.clientX;
        uniforms.u_mouse.value.y = e.clientY;
    }
}

function handleMouseDown() {
    uniforms.u_mouse_down.value = true;
}

function handleMouseUp() {
    uniforms.u_mouse_down.value = false;
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

function swapBuffer() {
    var a = rt2;
    rt2 = rt1;
    rt1 = a;
    uniforms.backbuffer.value = rt2;
}

var framesRendered = 0;
const numToRender = 72000;

function render() {
    // if ( framesRendered < numToRender && cvg) {
    //     cvg.addFrame(renderer.domElement);
    //     console.log("rendered: " + ((framesRendered/numToRender)*100).toFixed(1) + "%");
    // }
    // framesRendered++;

    uniforms.u_time.value += 0.05;
    renderer.render(scene, camera, rt1, false);
    renderer.render(scene, camera);
    swapBuffer();

    // if (framesRendered == numToRender) {
    //     cvg.render('cellular');
    //     console.log("done rendering");
    // }
}

window.onload = function () {
    init();
    animate();
}
