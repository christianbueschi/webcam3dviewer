//*
//
// Web Cam in Browser
// see: https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Webcam-Texture.html
//
//*


navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
var camvideo = document.getElementById('monitor');

if (!navigator.getUserMedia) 
{
	document.getElementById('errorMessage').innerHTML = 
	'Sorry. <code>navigator.getUserMedia()</code> is not available.';
} else {
	navigator.getUserMedia({
		audio: true,
		video: true
	}, gotStream, noStream);
}

function gotStream(stream) 
{
	if (window.URL) {   
			camvideo.src = window.URL.createObjectURL(stream);   
	} else { // Opera   
		camvideo.src = stream;   
	}
	camvideo.onerror = function(e) {   
		stream.stop();   
	};
	stream.onended = noStream;

    // creates the audio context
    audioContext = window.AudioContext || window.webkitAudioContext;
    context = new audioContext();
 
    // creates a gain node
    volume = context.createGain();
 
    // creates an audio node from the microphone incoming stream
    audioInput = context.createMediaStreamSource(stream);
 
    // connect the stream to the gain node
    audioInput.connect(volume);
 
    /* From the spec: This value controls how frequently the audioprocess event is 
    dispatched and how many sample-frames need to be processed each call. 
    Lower values for buffer size will result in a lower (better) latency. 
    Higher values will be necessary to avoid audio breakup and glitches */
    var bufferSize = 2048;

    var recorder = context.createScriptProcessor(bufferSize, 2, 2);
 
    recorder.onaudioprocess = function(e){
        console.log ('recording: ', e);

        // var left = e.inputBuffer.getChannelData (0);
        // var right = e.inputBuffer.getChannelData (1);
        // // we clone the samples
        // leftchannel.push (new Float32Array (left));
        // rightchannel.push (new Float32Array (right));
        // recordingLength += bufferSize;
    }
 
    // we connect the recorder
    volume.connect (recorder);
    recorder.connect (context.destination); 
}
function noStream(e) 
{
	var msg = 'No camera available.';
	if (e.code == 1) 
		{   msg = 'User denied access to use camera.';   }
	document.getElementById('errorMessage').textContent = msg;
}

//*
// 
// Video Texture
//
//*

var video, videoImage, videoImageContext, videoTexture;

video = document.getElementById( 'monitor' );

videoImage = document.getElementById( 'videoImage' );
videoImageContext = videoImage.getContext( '2d' );
// background color if no video present
videoImageContext.fillStyle = '#000000';
videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
videoTexture = new THREE.Texture( videoImage );
//videoTexture.minFilter = THREE.LinearFilter;
//videoTexture.magFilter = THREE.LinearFilter;


//*
//
// To actually be able to display anything with Three.js, 
// we need three things: A scene, a camera, and a renderer so we can render the scene with the camera.
//
// see: http://threejs.org/docs/#Manual/Introduction/Creating_a_scene
//
//*

// Creates Scene, Camera and Renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.z = 500;
camera.lookAt( scene.position );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
container = document.getElementById( 'threeJS' );
container.appendChild( renderer.domElement );



// Creates Figures (Cube)
var geometry;
var material;
var materials = [];
var cube;
var cubes = [];


var xgrid = 16;
var ygrid = 12;

var ux = 1 / xgrid;
var uy = 1 / ygrid;

var xsize = 360 / xgrid;
var ysize = 240 / ygrid;
var parameters = { color: 0xffffff, map: videoTexture };

var cube_count = 0;

for ( i = 0; i < xgrid; i ++ )
	for ( j = 0; j < ygrid; j ++ ) {
		var ox = i;
		var oy = j;
		geometry = new THREE.BoxGeometry( xsize, ysize, xsize );				
		change_uvs( geometry, ux, uy, ox, oy );
		materials[ cube_count ] = new THREE.MeshBasicMaterial( parameters );
		material = materials[ cube_count ];
		cube = new THREE.Mesh( geometry, material );
		cube.position.x =   ( i - xgrid/2 ) * xsize;
		cube.position.y =   ( j - ygrid/2 ) * ysize;
		cube.position.z = 0;
		scene.add(cube);
		cubes.push(cube);
		cube_count++;
}



// Rendering 
function render() {

	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}

	requestAnimationFrame( render );
	
	cubes.forEach(function(cube){
		//cube.rotation.x += 0.002;
		//cube.rotation.y += 0.002;
	});

	renderer.render( scene, camera );
}
render();


// Damit auf jedem Würfel nur der entsprechende Bereich des Videos als Textur angewendet wird
function change_uvs( geometry, unitx, unity, offsetx, offsety ) {

				var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

				for ( var i = 0; i < faceVertexUvs.length; i ++ ) {

					var uvs = faceVertexUvs[ i ];

					for ( var j = 0; j < uvs.length; j ++ ) {

						var uv = uvs[ j ];

						uv.x = ( uv.x + offsetx ) * unitx;
						uv.y = ( uv.y + offsety ) * unity;

					}

				}

}













