//*
//
// Web Cam in Browser
// see: https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Webcam-Texture.html
//
//*

// Global Variables
var frequencies = [];


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

function gotStream(stream) {
	if (window.URL) {   
		camvideo.src = window.URL.createObjectURL(stream);   
	} else { // Opera   
		camvideo.src = stream;   
	}
	camvideo.onerror = function(e) {   
		stream.stop();   
	};
	stream.onended = noStream;


	/* 
	// Audio Processing
	// see: http://srchea.com/experimenting-with-web-audio-api-three-js-webgl
	*/

    // creates the audio context
    var audioContext = window.AudioContext || window.webkitAudioContext;
    var context = new audioContext();

    // creates an audio node from the microphone incoming stream
    var audioInput = context.createMediaStreamSource(stream);


    // create a ScriptProcessorNode
    var node = context.createScriptProcessor(2048, 1, 1);

    var analyser;

    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.6;
    analyser.fftSize = 512;

    node.onaudioprocess = function(e) {

    	try {
			
			frequencies = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(frequencies);

		}
		catch (e){
			console.log('node.onaudioprocess',e.message);
		}
	}

	audioInput.connect(node);
	audioInput.connect(analyser);
	node.connect(context.destination);

}

function noStream(e) {
	var msg = 'No camera available.';
	if (e.code == 1) {   
		msg = 'User denied access to use camera.';   
	}
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

//init control panel
	var params = new WCMParams();
	var gui = new dat.GUI();
	gui.add(params, 'saturation', 0, 1).name('Saturation').onChange(onParamsChange);
	gui.add(params, 'hue', 0, 2).name('Hue').onChange(onParamsChange);
	gui.close();

function WCMParams() {
	this.saturation = 0;
	this.hue = 2;
}

function onParamsChange() {
	for ( i = 0; i < cube_count; i++ ) {
		material = materials[ i ];
		material.saturation = params.saturation;
		material.hue = params.hue;

		material.color.setHSL( material.hue, material.saturation, 0.7 );

	}
}


// postprocessing shader
var composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );

var effect = new THREE.ShaderPass( THREE.DotScreenShader );
	effect.uniforms[ 'scale' ].value = 4;
	composer.addPass( effect );

var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
	effect.uniforms[ 'amount' ].value = 0.0015;
	effect.renderToScreen = true;
	composer.addPass( effect );	


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

for ( i = 0; i < xgrid; i ++ ) {
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
		cube.startx = cube.position.x;
		cube.starty = cube.position.y;
		cube.dx = 0.001 * ( 0.5 - Math.random() );
		cube.dy = 0.001 * ( 0.5 - Math.random() );
		scene.add(cube);
		cubes.push(cube);
		cube_count++;
	}
}

var counter = 1;
// Rendering 
function render() {


	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}

	requestAnimationFrame( render );

	if(isRotate) {
		// rotate scene
		var rotSpeed = .005
		var x = camera.position.x,
        	z = camera.position.z;

		camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
    	camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
    	camera.lookAt(scene.position);	
	}
	
    // adjust audio visualization
    if(isVisualizer) {
    	var k = 0;
		for(var i = 0; i < cubes.length; i++) {
        	var scale = frequencies[k] / 30;
        	scale = Math.round(scale * 100) / 100;
        	cubes[i].scale.z = (scale < 1 ? 1 : scale);
        	k += (k < frequencies.length ? 1 : 0); 
		}

    }

    if(isExplode) {
				for ( i = 0; i < cube_count; i ++ ) {

								cube = cubes[ i ];

								cube.rotation.x += 10 * cube.dx;
								cube.rotation.y += 10 * cube.dy;

								cube.position.x += 200 * cube.dx * (counter/2);
								cube.position.y += 200 * cube.dy * (counter/2);
								cube.position.z += 200 * cube.dx * (counter/2);
				}
			counter ++;
    }

	renderer.render( scene, camera );

	if(isShader) {
		composer.render();	
	}
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

var isVisualizer = false;
var isRotate = false;
var isShader = false;
var isExplode = false;

$(document).ready(function() {

	$('.js-visualizer').on('click', function() {
		if(isVisualizer) {
			isVisualizer = false;	
			$(this).text('Start Visualizer');
		} else {
			isVisualizer = true;	
			$(this).text('Stop Visualizer');
		}
	})

	$('.js-rotate').on('click', function() {
		if(isRotate) {
			isRotate = false;	
			$(this).text('Start Rotation');
		} else {
			isRotate = true;	
			$(this).text('Stop Rotation');
		}
	})

	$('.js-shader').on('click', function() {
		if(isShader) {
			isShader = false;
			$(this).text('Activate Shader');
		} else {
			isShader = true;
			$(this).text('Deactivate Shader');
		}
	})

	$('.js-explode').on('click', function() {
		/*if(isExplode) {
			isExplode = false;
		} else {
			isExplode = true; 
		}*/
		isExplode = true;
		counter = 1;
	})

	$('.js-reset').on('click', function() {		
		// Reset Visualizer
		for(var i = 0; i < cubes.length; i++) {
        	cubes[i].scale.z = 1;
		}
		// Reset Rotation
		camera.position.x = 0;
    	camera.position.z = 500;
    	camera.lookAt(scene.position);	
		
		// Reset Cubes
		isExplode = false;
		for ( i = 0; i < cube_count; i ++ ) {

			cube = cubes[ i ];

			cube.rotation.x = 0;
			cube.rotation.y = 0;
			cube.position.x = cube.startx;
			cube.position.y = cube.starty;
			cube.position.z = 0;
		}
		

  //   	for ( i = 1; i <= xgrid; i ++ ) {
		// 	for ( j = 0; j < ygrid; j ++ ) {
		// 		cubes[j*i].position.x =   ( i - xgrid/2 ) * xsize;
		// 		cubes[j*i].position.y =   ( j - ygrid/2 ) * ysize;
		// 	}
		// }

	})

})








