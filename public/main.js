function randomColor() {
    return {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
    };
}

var users = {};
var sites = {};

function activateUser(key) {
    if (!users[key]) {
        users[key] = {
            color: randomColor(),
            sites: {}
        };
    }
    if (!users[key].life) {
        users[key].x = (Math.random() - 0.5) * width * 0.8;
        users[key].y = (Math.random() - 0.5) * height * 0.8;
    }
    users[key].life = 1;
    users[key].lifesp = 0.001;
}

function deactivateUser(key) {
    if (!users[key]) return;
    //
}

function updateUsers() {
    for (var i in users) {
        var u = users[i];
        if (u.life <= 0) { continue; }
        u.life -= u.lifesp;
        for (var s in u.sites) {
            var lnk = u.sites[s];
            if (lnk.life < 0) { continue; }
            triggerLink(i, s);
            lnk.life -= lnk.lifesp;
            lnk.spike -= lnk.spikesp;
        }
    }
}

function activateSite(key) {
    if (!sites[key]) {
        sites[key] = {
            color: randomColor(),
            attractor: addAttractor(0, 0, 600, true)
        };
    }
    if (!sites[key].life) {
        sites[key].x = (Math.random() - 0.5) * width * 0.8;
        sites[key].y = (Math.random() - 0.5) * height * 0.8;
    }
    sites[key].life = 1;
    sites[key].lifesp = 0.004;
}

function deactivateSites(key) {
    if (!sites[key]) return;
}

function updateSites() {
    for (var i in sites) {
        var site = sites[i];
        if (site.life > 0) {
            attractors[site.attractor].x = site.x;
            attractors[site.attractor].y = site.y;
            site.life -= site.lifesp;
            if(site.life < 0) {
                attractors[site.attractor].disabled = true;
            } else {
                attractors[site.attractor].s = 500 * site.life * site.life;
                attractors[site.attractor].disabled = false;
            }
        }

        //attractors[site.attractor].s = site.y;
    }
}

function packetIn(u, s) {
    activateUser(u);
    activateSite(s);
    var user = users[u];
    var site = sites[s];
    if (!user.sites[s]) {
        user.sites[s] = {};
    }
    user.sites[s].life = 1;
    user.sites[s].lifesp = 0.01;
    user.sites[s].spike = 1;
    user.sites[s].spikesp = 0.1;
}


function triggerLink(u, s) {
    var user = users[u];
    var site = sites[s];
    var dx = site.x - user.x;
    var dy = site.y - user.y;
    var dsq = dx * dx + dy * dy;
    var d = Math.sqrt(dsq);
    var nx = dx / d * 3;
    var ny = dy / d * 3;
    for (var i = 0; i < 100; i++) {
        if (i % 15 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].life) {
            var p = emit(user.x, user.y, nx * 0.5 + 30 * (Math.random() - 0.5), ny* 0.5 + 30 * (Math.random() - 0.5), 1, 0.007, site.color);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
        if (i % 6 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].spike) {
            var p = emit(user.x, user.y, nx * 15 + 11 * (Math.random() - 0.5), ny * 15 + 11 * (Math.random() - 0.5), 1, 0.001, site.color, 3);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
        if (i % 30 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].life * 2) {
            var p = emit(user.x, user.y, nx * 0.5 + 3 * (Math.random() - 0.5), ny* 0.5 + 3 * (Math.random() - 0.5), 1, 0.0005, site.color, 5);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
    }
}


var width = window.innerWidth;
var height = window.innerHeight;
var wd2 = width / 2;
var hd2 = height / 2;

var GPU_Particles = 50000;


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
        life: 0,
        lifesp: 0,
        glitch: 0,
        atttracted: [],
        nrepelled: []
    });
}




function toggle() {
    packetIn("doge", "ball");
    packetIn("doge", "ball2");
    packetIn("laji", "ball2");
    packetIn("laji", "c");
    packetIn("rbb", "c");
    packetIn("rbb2", "c2");
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

    var forceT = t * 600 * a.s / dsq * m * (p.mult ? p.mult : 1);
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
    }) - 1;
}

function emit(x, y, vx, vy, life, lifesp, color, multiplier) {
    if (empty.length == 0) return;
    color = color || { r: 1, g: 1, b: 1 };
    var p = particles[empty.pop()];
    p.life = life;
    p.lifesp = lifesp;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.mult = multiplier;
    p.color = color;
    return p;
}

// addAttractor(100, 100, 222, false);

// addAttractor(-100, 100, 222, false);
// addAttractor(-100, -100, 222, false);
// addAttractor(100, -100, 222, false);


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
renderer.domElement.style.display = 'none';


var geometry = new THREE.Geometry();
geometry.colors = [];
for (var i = 0; i < GPU_Particles; i++) {
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry.colors.push(new THREE.Color(0xffffff));
}
var material = new THREE.PointCloudMaterial({
    size: 33,
    transparent: true,
    opacity: 0.1,
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
ln = new THREE.Line(lineGeometry, lineMaterial, THREE.LinePieces);
scene.add(ln);

//#2nd pass
renderer2 = new THREE.CanvasRenderer();
renderer2.setSize(width, height);
container.appendChild(renderer2.domElement);
doublebuffer = renderer2.domElement;
doublebuffer.style.display = 'none';

//#3rd pass
renderer3 = new THREE.CanvasRenderer();
renderer3.setSize(width, height);
container.appendChild(renderer3.domElement);
canvas = renderer3.domElement;




var prevTime = Date.now();

function render() {

    // for (var i = 0; i < 45; i++) {
    //     var t = emit(0, 0, (0.5 - Math.random()) * 14, (0.5 - Math.random()) * 14, 1, 0.01);
    // }



    var curTime = Date.now();
    var t = (curTime - prevTime) / 100;

    updateSites();
    updateUsers();


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
                if (particles[i].nrepelled.indexOf(j) >= 0) continue;
                attract(i, j, t, -0.05);
            }
        }

        particles[i].x += particles[i].vx * (t + particles[i].glitch);
        particles[i].y += particles[i].vy * (t + particles[i].glitch);
        particles[i].glitch = 0;
        geometry.vertices[i].x = particles[i].x;
        geometry.vertices[i].y = particles[i].y;

        lineGeometry.vertices[i2 + 1].x = lineGeometry.vertices[i2].x;
        lineGeometry.vertices[i2 + 1].y = lineGeometry.vertices[i2].y;
        lineGeometry.vertices[i2].x = geometry.vertices[i].x;
        lineGeometry.vertices[i2].y = geometry.vertices[i].y;

        geometry.colors[i].r = particles[i].color.r * Math.pow(particles[i].life, 3) * 0.8;
        geometry.colors[i].g = particles[i].color.g * Math.pow(particles[i].life, 4) * 0.8;
        geometry.colors[i].b = particles[i].color.b * Math.pow(particles[i].life, 1) * 0.8;

        if (particles[i].life < 1) {
            lineGeometry.colors[i2 + 1].r = lineGeometry.colors[i2].r;
            lineGeometry.colors[i2 + 1].g = lineGeometry.colors[i2].g;
            lineGeometry.colors[i2 + 1].b = lineGeometry.colors[i2].b;
            lineGeometry.colors[i2].r = geometry.colors[i].r;
            lineGeometry.colors[i2].g = geometry.colors[i].g;
            lineGeometry.colors[i2].b = geometry.colors[i].b;
        }

        particles[i].life -= particles[i].lifesp;

        if (particles[i].x < -wd2 || particles[i].x > wd2 || particles[i].y < -hd2 || particles[i].y > hd2) {
            particles[i].life = 0;
        }
    }

    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    lineGeometry.verticesNeedUpdate = true;
    lineGeometry.colorsNeedUpdate = true;
    renderer.render(scene, camera);

    prevTime = curTime;


    var bufferctx = doublebuffer.getContext("2d");
    bufferctx.fillStyle = "rgba(0,0,0,0.35)";
    bufferctx.globalCompositeOperation = "source-over";
    bufferctx.fillRect(0, 0, width * 2, height * 2);
    bufferctx.globalCompositeOperation = "lighter";
    bufferctx.drawImage(renderer.domElement, 0, 0);


    var ctx = canvas.getContext("2d");
    ctx.drawImage(doublebuffer, 0, 0);
    
    
}



(function animate() { render(); requestAnimationFrame(animate); })();
