var container;
var camera, scene, renderer;
var uniforms;
var rt1,rt2;
var micInput;

const DO_MIC = false;

const NUM_CHANNELS = 20;
const BUFFER_LEN   = 1;
var channelBuffers;
var curChannels;
var curChannelColors;

var audioEl;
var audioCtx;
var analyser;
var frequencyData;

var audioSetupDone = false;

var sNoise = new SimplexNoise();
var curTime = 0;

function setupAudio(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var input;
    if (stream) {
        input = audioCtx.createMediaStreamSource(stream);
        console.log("mic started");
    }
    else {
        audioEl = document.getElementById('audioSource');
        audioEl.muted = true;
        audioEl.pause();
        input = audioCtx.createMediaElementSource(audioEl);
    }

    analyser     = audioCtx.createAnalyser();

    input.connect(analyser);
    if (!stream) analyser.connect(audioCtx.destination);
    analyser.smoothingTimeConstant = 0.91;
    analyser.fftSize = Math.pow(2,15);

    frequencyData    = new Uint8Array(analyser.frequencyBinCount);
    avgLastMax = frequencyData.length*.75;
    avgLastMaxCount = 1000;

    audioSetupDone   = true;
    curChannels      = new Array(NUM_CHANNELS).fill(0);
    curChannelColors = new Array(NUM_CHANNELS).fill([]);
    channelBuffers   = new Array(NUM_CHANNELS).fill([]);
}

function resetChannels() {
    for (var i = 0; i < curChannels.length; i++) curChannels[i] = 0;
}

function getAvg(lst) {
    var sum = 0;
    for (var i = 0; i < lst.length; i++) sum += lst[i];
    return sum/lst.length;
}

var avgLastMax = 0;
var avgLastMaxCount = 0;
var avgLastMin = 0;
var avgLastMinCount = 0;

function cleanData(data) {
    var newData = [];
    var i = data.length-1;
    while (data[i] == 0 && i > 0) i--;

    avgLastMax = ((avgLastMax*avgLastMaxCount) + i);
    if (avgLastMaxCount < 50000) avgLastMaxCount++;
    avgLastMax = Math.ceil(avgLastMax/avgLastMaxCount);

    var j = 0;
    while (data[j] == 0 && j < i) j++;

    avgLastMin = ((avgLastMin*avgLastMinCount) + j);
    if (avgLastMinCount < 50000) avgLastMinCount++;
    avgLastMin = Math.ceil(avgLastMin/avgLastMinCount);

    for (i = avgLastMax; i >= avgLastMin; i--) newData.push(data[i]);
    return newData;
}

function updateChannels() {

    analyser.getByteFrequencyData(frequencyData);

    var curFreqData = cleanData(frequencyData);
    var frameChannels = new Array(NUM_CHANNELS).fill(0);
    var frameCounts   = new Array(NUM_CHANNELS).fill(0);
    var bandWidth = Math.ceil(curFreqData.length/NUM_CHANNELS);
    for (var i = 0; i < curFreqData.length; i++) {
        let channelInd = Math.floor(i/bandWidth);
        frameChannels[channelInd] += (isNaN(curFreqData[i]) ? 0 : curFreqData[i]);
        frameCounts[channelInd]++;
    }

    var sum = 0;
    var lowersum = 0;
    var uppersum = 0;
    for (var i = 0; i < frameChannels.length; i++) {
        if (frameCounts[i] > 0) channelBuffers[i].push(frameChannels[i]/frameCounts[i]);
        if (channelBuffers[i].length > BUFFER_LEN) channelBuffers[i].splice(0,1); // pop first element
        var curChannelVal = getAvg(channelBuffers[i]);
        curChannels[i] = curChannelVal;
        sum += curChannelVal;
        if (uniforms && i < frameChannels.length/3) {
            lowersum += Math.abs(curChannelVal - uniforms.u_last_channels.value[i]);
        }
        if (uniforms && i > 2*frameChannels.length/3) {
            uppersum += Math.abs(curChannelVal - uniforms.u_last_channels.value[i]);
        }
        curChannelColors[i] = new THREE.Vector3(
            Math.abs(sNoise.noise2D((i/(NUM_CHANNELS)), curTime/10. - 0.1) + .9)/2.,
            Math.abs(sNoise.noise2D((i/(NUM_CHANNELS)), curTime/10. + 0.0) + .9)/2.,
            Math.abs(sNoise.noise2D((i/(NUM_CHANNELS)), curTime/10. + 0.1) + .9)/2.
        );
    }
    return [sum/NUM_CHANNELS,lowersum/(NUM_CHANNELS/3),uppersum/(NUM_CHANNELS/3)];
}

function init() {

    updateChannels();

    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    uniforms = {
        u_time: { type: "f", value: curTime },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        backbuffer: { type: "t", value: null },
        u_mouse_down: { type: "b", value: false },
        u_seed:       { type: "f", value: Math.random()*10},
        u_channels:  { type: "fv1", value: curChannels},
        u_last_channels:  { type: "fv1", value: curChannels},
        u_channel_colors:  { type: "v3v", value: curChannels},
        u_channel_avg:  { type: "f", value: 0},
        u_bass_avg:  { type: "f", value: 0},
        u_high_avg:  { type: "f", value: 0},
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
    curTime += 0.05;
    uniforms.u_time.value = curTime;
    // if (Math.floor(curTime*20) % 2 == 0) {
    //     uniforms.u_last_channels.value = curChannels.slice(0);
    // }
    uniforms.u_last_channels.value = curChannels.slice(0);
    var avgVals = updateChannels();
    uniforms.u_channels.value       = curChannels.slice(0);
    uniforms.u_channel_colors.value = curChannelColors.slice(0);
    uniforms.u_channel_avg.value    = avgVals[0];
    uniforms.u_bass_avg.value    = avgVals[1];
    uniforms.u_high_avg.value    = avgVals[2];

    renderer.render(scene, camera, rt1, false);
    renderer.render(scene, camera);
    swapBuffer();
}

window.onload = function () {
    if (DO_MIC) {
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(stream => {
            setupAudio(stream);
            init();
            animate();
        }, error => {
            console.log("can't get mic");
            console.log(error);
        });
    }
    else {
        setupAudio();
        init();
        animate();
        document.body.addEventListener("click",function () {
            audioEl.muted = !audioEl.muted;
            if (audioEl.paused) audioEl.play();
            else audioEl.pause();
            console.log("music started");
        });
    }
}
