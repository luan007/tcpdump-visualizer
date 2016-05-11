var users = {};
var sites = {};
var width = window.innerWidth;
var height = window.innerHeight;
var wd2 = width / 2;
var hd2 = height / 2;

var GPU_Particles = 100000;


//particles
var particles = [];
var attractors = [];
var empty = [];

for (var i = 0; i < GPU_Particles; i++) {
    particles.push({
        x: 0,
        y: 0,
        color: {
            r: 1,
            g: 1,
            b: 1
        },
        mode: 0,
        vx: 0,
        vy: 0,
        life: -1,
        lifesp: 0,
        atttracted: [],
        nrepelled: []
    });
    empty.push(i);
}


var MIN = 50;
var MINSQ = MIN * MIN;

//j = index of particles
//k = index of attractor 
//t = deltaT
//m = force Multiplier
function attract(j, k, t, m) {
    var p = particles[j];
    var a = attractors[k];
    if (a.disabled) return;

    var dx = a.x - p.x;
    var dy = a.y - p.y;
    var dsq = dx * dx + dy * dy;
    dsq = dsq < MINSQ ? MINSQ : dsq;
    var d = Math.sqrt(dsq);

    var forceT = t * 600 * a.s / dsq;
    //fx / force = dx / dsq;
    //
    var vvx = forceT * dx / d;
    var vvy = forceT * dy / d;

    p.vx += vvx;
    p.vy += vvy;
}

function addAttractor(x, y, s, disabled) {
    return attractors.push({
        x: x,
        y: y,
        s: s,
        disabled: disabled
    }) -1;
}

function emit(x, y, vx, vy, life, lifesp, color) {
    if (empty.length == 0) return;
    color = color || { r: 1, g: 1, b: 1 };
    var p = particles[empty.pop()];
    p.life = life;
    p.lifesp = lifesp;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    return p;
}

addAttractor(500, 100, 600, false);


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
//  camer?a = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.z = Math.sqrt(width * width + height * height);
    
scene = new THREE.Scene();

//#1st pass
renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
// renderer.domElement.style.display = 'none';


var geometry = new THREE.Geometry();
geometry.colors = [];
for (var i = 0; i < GPU_Particles; i++) {
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry.colors.push(new THREE.Color(0xffffff));
}
var material = new THREE.PointCloudMaterial({
    size: 35,
    transparent: true,
    opacity: 0.3,
    vertexColors: true,
    blending: THREE.AdditiveBlending
});
pc = new THREE.PointCloud(geometry, material);
scene.add(pc);



var lineGeometry = new THREE.Geometry();
lineGeometry.colors = [];
for (var i = 0; i < GPU_Particles; i++) {
    lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    lineGeometry.colors.push(new THREE.Color(0xffffff));
    lineGeometry.colors.push(new THREE.Color(0xffffff));
}
var lineMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 1,
    vertexColors: true,
    blending: THREE.AdditiveBlending
});
ln = new THREE.Line(lineGeometry, lineMaterial, THREE.LinePieces );
scene.add(ln);







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




var prevTime = Date.now();

function render() {

    for (var i = 0; i < 45; i++) {
        var t = emit(0, 0, (0.5 - Math.random()) * 14, (0.5 - Math.random()) * 14, 1, 0.005);
    }


    var curTime = Date.now();
    var t = (curTime - prevTime) / 100;

    for (var i = 0; i < GPU_Particles; i++) {


        if (particles[i].life == -1) continue;

        var i2 = i * 2;
        if (particles[i].life - particles[i].lifesp <= 0) {
            particles[i].x = particles[i].y = particles[i].vx = particles[i].vy = particles[i].life = particles[i].lifesp = 0;
            empty.push(i);

            geometry.vertices[i].x = geometry.vertices[i].y = 0;
            lineGeometry.vertices[i2].x = lineGeometry.vertices[i2].y = 0;
            lineGeometry.vertices[i2 + 1].x = lineGeometry.vertices[i2 + 1].y = 0;

            geometry.colors[i].r = geometry.colors[i].g = geometry.colors[i].b = 0;
            lineGeometry.colors[i2].r = lineGeometry.colors[i2].g = lineGeometry.colors[i2].b = 0;
            lineGeometry.colors[i2 + 1].r = lineGeometry.colors[i2 + 1].g = lineGeometry.colors[i2 + 1].b = 0;
            particles[i].life = -1;
            continue;
        }


        if (particles[i].attracted) {
            for (var j = 0; j < particles[i].attracted.length; j++) {
                attract(i, particles[i].attracted[j], t, 1);
            }
        } else {
            for (var j = 0; j < attractors.length; j++) {
                attract(i, j, t, 1);
            }
        }


        if (particles[i].nrepelled) {
            for (var j = 0; j < attractors.length; j++) {
                if (particles[i].nrepelled.indexOf(j)) continue;
                attract(i, j, t, -1);
            }
        }


        particles[i].x += particles[i].vx * t;
        particles[i].y += particles[i].vy * t;

        geometry.vertices[i].x = particles[i].x;
        geometry.vertices[i].y = particles[i].y;

        lineGeometry.vertices[i2 + 1].x = lineGeometry.vertices[i2].x;
        lineGeometry.vertices[i2 + 1].y = lineGeometry.vertices[i2].y;
        lineGeometry.vertices[i2].x = geometry.vertices[i].x;
        lineGeometry.vertices[i2].y = geometry.vertices[i].y;

        geometry.colors[i].r = Math.pow(particles[i].color.r * particles[i].life, 3) * 0.8;
        geometry.colors[i].g = Math.pow(particles[i].color.g * particles[i].life, 4) * 0.8;
        geometry.colors[i].b = Math.pow(particles[i].color.b * particles[i].life, 1) * 0.8;

        if (particles[i].life < 1) {
            lineGeometry.colors[i2 + 1].r = lineGeometry.colors[i2].r;
            lineGeometry.colors[i2 + 1].g = lineGeometry.colors[i2].g;
            lineGeometry.colors[i2 + 1].b = lineGeometry.colors[i2].b;
            lineGeometry.colors[i2].r = geometry.colors[i].r;
            lineGeometry.colors[i2].g = geometry.colors[i].g;
            lineGeometry.colors[i2].b = geometry.colors[i].b;
        }

        particles[i].life -= particles[i].lifesp;
        
        if(particles[i].x < -wd2 || particles[i].x > wd2 || particles[i].y < -hd2 || particles[i].y > hd2) {
            particles[i].life = 0;
        }
    }

    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    lineGeometry.verticesNeedUpdate = true;
    lineGeometry.colorsNeedUpdate = true;
    renderer.render(scene, camera);

    prevTime = curTime;
}



(function animate() { render(); requestAnimationFrame(animate); })();
