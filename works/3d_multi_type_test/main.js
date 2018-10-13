var container;
var camera, scene, renderer, geometry;
var uniformsList;
var controls;

function createCanvasTexture() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var pxRatio = 4;
    var fSize = 600;
    canvas.width = window.innerWidth*pxRatio;
    canvas.height = window.innerHeight*pxRatio;
    ctx.fillStyle = "black";
    // ctx.fillRect(0,0,canvas.height,canvas.width);
    ctx.fillStyle = "white";
    ctx.font = "normal " + (fSize*pxRatio) + "px Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("G",canvas.width/2,canvas.height/2 + fSize);
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

function init() {
    container = document.getElementById( 'container' );

    const near = 0.01;
    const far = 1000;
    const fieldOfView = 65;
    camera = new THREE.PerspectiveCamera(fieldOfView, window.innerWidth/window.innerHeight, near, far);
    camera.position.z = 25;
    controls = new THREE.OrbitControls( camera );
    controls.update();
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 2;

    scene = new THREE.Scene();

    var material = new THREE.RawShaderMaterial( {
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.DoubleSide,
        transparent: true,
    } );

    const NUM_PLANES = 20;
    const STACK_HEIGHT = 20;
    uniformsList = [];
    for (var i = 0; i < NUM_PLANES; i++) {
        var uniforms = {
            u_time: { type: "f", value: 1.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2() },
            u_mouse: { type: "v2", value: new THREE.Vector2() },
            u_level: { type: "f", value: i/NUM_PLANES },
            textTexture: { type: "t", value: createCanvasTexture() },
        };

        uniformsList.push(uniforms);

        setTimeout(function () {
            for (var i = 0; i < uniformsList.length; i++) {
                uniformsList[i].textTexture.value = createCanvasTexture();
            }
        }, 1000);

        var curMaterial = material.clone();
        curMaterial.uniforms = uniformsList[i];

        // var geometry = new THREE.RingBufferGeometry( -1, 10, 100, 100 );
        var geometry = new THREE.PlaneBufferGeometry( 20, 20, 200, 200 );

        var mesh = new THREE.Mesh( geometry, curMaterial );
        mesh.position.set( 0, 0, (STACK_HEIGHT/NUM_PLANES)*(i-NUM_PLANES/2.) );
        scene.add( mesh );
    }

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
    for (var i = 0; i < uniformsList.length; i++) {
        uniformsList[i].u_resolution.value.x = renderer.domElement.width;
        uniformsList[i].u_resolution.value.y = renderer.domElement.height;
    }
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

var angle = 5;
var angleDiff = 0.05;

function render() {
    for (var i = 0; i < uniformsList.length; i++) {
        uniformsList[i].u_time.value += 0.05;
    }
    renderer.render( scene, camera );
    controls.update();
}

window.onload = function () {
    init();
    animate();
}
