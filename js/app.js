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
	navigator.getUserMedia({video: true}, gotStream, noStream);
}
function gotStream(stream) 
{
	if (window.URL) 
		{   camvideo.src = window.URL.createObjectURL(stream);   } 
	else // Opera
		{   camvideo.src = stream;   }
	camvideo.onerror = function(e) 
	{   stream.stop();   };
	stream.onended = noStream;
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
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
container = document.getElementById( 'threeJS' );
container.appendChild( renderer.domElement );



// Creates Figure (Cube)
var geometry = new THREE.BoxGeometry( 2, 2, 2 );
var material = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );
var cube = new THREE.Mesh( geometry, material );

scene.add( cube );

camera.position.z = 5;



// Rendering 
function render() {

	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}

	requestAnimationFrame( render );
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
render();















