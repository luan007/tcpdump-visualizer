var users = {};
var sites = {};
var width = window.innerWidth;
var height = window.innerHeight;
var wd2 = width / 2;
var hd2 = height / 2;

var GPU_Particles = 100000;

container = document.createElement('div');
document.body.appendChild(container);

//Three.js Initialization Logic
camera = new THREE.OrthographicCamera(
    width / - 2,
    width / 2,
    height / 2,
    height / - 2,
    0.01,
    Math.sqrt(width * width + height * height)
);
scene = new THREE.Scene();

//#1st pass
renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
// renderer.domElement.style.display = 'none';

//#2nd pass
renderer2 = new THREE.CanvasRenderer();
renderer2.setSize(width, height);
container.appendChild(renderer2.domElement);
doublebuffer = renderer2.domElement;
// doublebuffer.style.display = 'none';

//#3rd pass
renderer3 = new THREE.CanvasRenderer();
renderer3.setSize(width, height);
container.appendChild(renderer3.domElement);
canvas = renderer3.domElement;





//particles
var particles = [];
var attractors = [];



function render() {
    
}



(function animate() { render(); requestAnimationFrame(animate); })();
