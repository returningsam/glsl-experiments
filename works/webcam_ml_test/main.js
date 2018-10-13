var poseNet;

var container;
var camera, scene, renderer, video, videoTexture;
var uniforms;
var rt1,rt2;

var posePoints = [];
var poseScores = [];
const FACE_PARTS = [
    "nose",
    "rightEye",
    "leftEye",
    "rightEar",
    "leftEar",
];

function initWebcam() {

    video = document.createElement('video');
    video.width = window.innerWidth*2;
    video.height = window.innerHeight*2;
    video.playbackRate = 3.0;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
        video.srcObject = stream;
        video.play();
    }).catch(function(err) {
        console.log("An error occured! " + err);
    });
    initPoseNet();
}

function initPoseNet() {
    posenet.load(1.0).then(function(net){
        poseNet = net;
    }).then(updatePose);
}

function updatePose() {
    poseNet.estimateSinglePose(video, 0.2, true, 16).then(function (pose) {
        if (pose) {
            posePoints = [];
            poseScores = [];
            var newPoints = pose.keypoints;
            for (var i = 0; i < newPoints.length; i++) {
                if (FACE_PARTS.indexOf(newPoints[i].part) > -1) {
                    var xVal = newPoints[i].position.x/window.innerWidth;
                    var yVal = newPoints[i].position.y/window.innerHeight;
                    poseScores.push(newPoints[i].score);
                    posePoints.push(new THREE.Vector2(xVal,yVal));
                }
            }
        }
        window.requestAnimationFrame(updatePose);
    });
}

function modelLoaded() {
    console.log('Model Loaded!');
}

function init() {
    initWebcam();
    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );
    videoTexture = new THREE.Texture(video);
    videoTexture.minFilter = THREE.LinearFilter;


    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        vid_texture: { type: "t", value: videoTexture },
        u_vid_dims: { type: "v2", value: new THREE.Vector2(video.videoWidth,video.videoHeight) },
        backbuffer: { type: "t", value: null },
        posePoints: { type: "v2v", value: posePoints },
        poseScores: { type: "fv1", value: poseScores },
    };

    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });

    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setPixelRatio( window.devicePixelRatio );

    rt1 = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    rt2 = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });

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

function swapBuffer() {
    var a = rt2;
    rt2 = rt1;
    rt1 = a;
    uniforms.backbuffer.value = rt2;
}

function render() {
    uniforms.u_time.value += 0.05;
    uniforms.u_vid_dims.value.x = video.videoWidth;
    uniforms.u_vid_dims.value.y = video.videoHeight;
    uniforms.posePoints.value = posePoints;
    uniforms.poseScores.value = poseScores;
    if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
        videoTexture.needsUpdate = true;
    }
    renderer.render(scene, camera, rt1, false);
    renderer.render(scene, camera);
    swapBuffer();
}

window.onload = function () {
    init();
    animate();
}
