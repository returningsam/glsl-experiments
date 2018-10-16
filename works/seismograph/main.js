var container;
var camera, scene, renderer;
var uniforms;
var rt1,rt2;
var micInput;

const NUM_CHANNELS = 4;
const BUFFER_LEN   = 10;
var levelBuffers;
var curLevels;

var audioEl;
var audioCtx;
var analyser;
var frequencyData;

var audioSetupDone = false;

function findMax(data) {
    for (var i = data.length-1; i >= 0; i--)
        if (data[i] > 0) return i;
    return 0;
}

function setupAudio() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    audioEl = document.getElementById('audioSource');
    var audioSrc = audioCtx.createMediaElementSource(audioEl);
    analyser     = audioCtx.createAnalyser();

    audioSrc.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.smoothingTimeConstant = 0.9;

    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    audioSetupDone = true;
    curLevels    = new Array(NUM_CHANNELS).fill(0);
    levelBuffers = new Array(NUM_CHANNELS).fill([]);

    audioEl.play();
    audioEl.muted = true;
}

function resetLevels() {
    console.log(curLevels);
    for (var i = 0; i < curLevels.length; i++) curLevels[i] = 0;
}

function cleanData(data) {
    var newData = [];
    var i = data.length-1;
    while (data[i] < 0.5) i--;
    for (i = i; i >= 0; i--) {
        newData.unshift(data[i]);
    }
    return newData;
}

function updateLevels() {

    analyser.getByteFrequencyData(frequencyData);

    var curFreqData = cleanData(frequencyData);
    var frameChannels = new Array(NUM_CHANNELS).fill(0);
    var bandWidth = Math.ceil(curFreqData.length/NUM_CHANNELS);
    for (var i = 0; i < curFreqData.length; i++) {
        let channelInd = Math.floor(i/bandWidth);
        frameChannels[channelInd] += curFreqData[i];
    }

    for (var i = 0; i < frameChannels.length; i++) {
        levelBuffers[i].push(frameChannels[i]);
        if (levelBuffers[i].length > BUFFER_LEN) levelBuffers[i].splice(0,1); // pop first element
        curLevels[i] = levelBuffers[i].reduce((a,b) => a + b, 0) / levelBuffers[i].length
    }
}

function init() {
    // init audio stuff

    updateLevels();

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
        u_seed:       { type: "f", value: Math.random()*10},
        u_levels:  { type: "v3", value: new THREE.Vector3(curLevels)},
        u_last_levels:  { type: "v3", value: new THREE.Vector3(curLevels)},
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

function render() {
    uniforms.u_time.value += 0.05;
    updateLevels();
    uniforms.u_last_levels.value.x = uniforms.u_levels.value.x;
    uniforms.u_last_levels.value.y = uniforms.u_levels.value.y;
    uniforms.u_last_levels.value.z = uniforms.u_levels.value.z;
    uniforms.u_levels.value.x  = curLevels[0];
    uniforms.u_levels.value.y  = curLevels[1];
    uniforms.u_levels.value.z  = curLevels[2];

    renderer.render(scene, camera, rt1, false);
    renderer.render(scene, camera);
    swapBuffer();
}

window.onload = function () {
    setupAudio();
    init();
    animate();
    document.body.addEventListener("click",function () {
        audioEl.muted = !audioEl.muted;
    });
}
