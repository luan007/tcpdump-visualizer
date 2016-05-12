var socket = io('http://localhost:3000');
socket.on('access', function (data) {
    // console.log(data);
    packetIn(data.src, data.dst);
});

socket.on('host', function (data) {
    // packetIn(data.src, data.dst);
    tagSite(data.src.dst, data.host);
});

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
    if (users[key].life <= 0 || !users[key].life) {
        users[key].x = (Math.random() - 0.5) * width * 0.8;
        users[key].y = (Math.random() - 0.5) * height * 0.8;
        users[key].vx = (Math.random() - 0.5) * 2.5;
        users[key].vy = (Math.random() - 0.5) * 2.5;
    }
    users[key].life = 1;
    users[key].lifesp = 0.001;
}

function deactivateUser(key) {
    if (!users[key]) return;
    //
}

function updateUsers(t) {
    for (var i in users) {
        var u = users[i];
        if (u.life <= 0) { continue; }
        u.life -= u.lifesp;
        u.x += u.vx * t;
        u.y += u.vy * t;
        if (u.x > wd2 || u.x < -wd2) u.x = -u.x;
        if (u.y > hd2 || u.y < -hd2) u.y = -u.y;
        for (var s in u.sites) {
            var lnk = u.sites[s];
            if (lnk.life < 0) { continue; }
            triggerLink(i, s);
            lnk.life -= lnk.lifesp;
            lnk.spike -= lnk.spikesp;
        }
    }
}

function tagSite(key, v) {
    activateSite(key);
    sites[key].host = v;
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
        sites[key].vx = (Math.random() - 0.5) * 1.5;
        sites[key].vy = (Math.random() - 0.5) * 1.5;
    }
    sites[key].life = 1;
    sites[key].lifesp = 0.004;
}

function deactivateSites(key) {
    if (!sites[key]) return;
}

function updateSites(t) {
    for (var i in sites) {
        var site = sites[i];
        if (site.life > 0) {
            site.x += site.vx * t;
            site.y += site.vy * t;
            if (site.x > wd2 || site.x < -wd2) site.x = -site.x;
            if (site.y > hd2 || site.y < -hd2) site.y = -site.y;
            attractors[site.attractor].x = site.x;
            attractors[site.attractor].y = site.y;
            site.life -= site.lifesp;
            if (site.life < 0) {
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
    for (var i = 0; i < 50; i++) {
        if (i % 15 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].life) {
            var p = emit(user.x, user.y, nx * 0.5 + 30 * (Math.random() - 0.5), ny * 0.5 + 30 * (Math.random() - 0.5), 1, 0.007, site.color);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
        if (i % 6 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].spike) {
            var p = emit(user.x, user.y, nx * 15 + 11 * (Math.random() - 0.5), ny * 15 + 11 * (Math.random() - 0.5), 1, 0.001, site.color, 3);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
        if (i % 30 == 0 && empty.length > 0 && Math.random() < users[u].sites[s].life * 2) {
            var p = emit(user.x, user.y, nx * 0.5 + 3 * (Math.random() - 0.5), ny * 0.5 + 3 * (Math.random() - 0.5), 1, 0.0005, site.color, 4);
            p.attracted = [site.attractor];
            p.nrepelled = p.attracted;
        }
    }
}


var width, height, realw, realh, wd2, hd2, rwd2, rhd2;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    realw = width * devicePixelRatio;
    realh = height * devicePixelRatio;
    wd2 = width / 2;
    hd2 = height / 2;
    rwd2 = realw / 2 + 55;
    rhd2 = realh / 2 + 55
}

window.onresize = resize();

//adjust this to kill lag :p
var GPU_Particles = 50000;


//particles
var particles = [];
var attractors = [];
var empty = [];

var gridStep = 24;
var gridParams = [];
var gridW = Math.floor(width / gridStep);
var gridH = Math.floor(height / gridStep);

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

var gridgeometry = new THREE.Geometry();
gridgeometry.colors = [];
for (var i = 0; i < gridW * gridH; i++) {
    gridgeometry.vertices.push(new THREE.Vector3((i % gridW) * gridStep - width / 2, Math.ceil(i / gridW) * gridStep - height / 2));
    gridgeometry.colors.push(new THREE.Color(0xffffff));
}
var gridmaterial = new THREE.PointCloudMaterial({
    size: 5,
    transparent: true,
    opacity: 0.3,
    vertexColors: true,
    // blending: THREE.AdditiveBlending
});
pcgrid = new THREE.PointCloud(gridgeometry, gridmaterial);
scene.add(pcgrid);


var geometry = new THREE.Geometry();
geometry.colors = [];
for (var i = 0; i < GPU_Particles; i++) {
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry.colors.push(new THREE.Color(0xffffff));
}
var material = new THREE.PointCloudMaterial({
    size: 50,
    transparent: true,
    opacity: 0.06,
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


function lightUp(x, y, strength) {
    strength = strength || 0.005;
    var realX = Math.floor(x / gridStep);
    var realY = Math.floor(y / gridStep);
    var range = 5;
    var rangesq = range * range;
    for (var rx = realX - range; rx >= 0 && rx < gridW && rx <= realX + range; rx++) {
        for (var ry = realY - range; ry >= 0 && ry < gridH && ry <= realY + range; ry++) {
            var dist = ((ry - realY) * (ry - realY) + (rx - realX) * (rx - realX)) / rangesq;
            gridgeometry.colors[ry * gridW + rx].r += strength * dist;
            gridgeometry.colors[ry * gridW + rx].g += strength * dist;
            gridgeometry.colors[ry * gridW + rx].b += strength * dist;
        }
    }
}

var textCovers = ["[]", "<>", "**", "~~", "++", "{}", "::", "%%", "##"]
var prevTime = Date.now();

var prevBlink = prevTime;
var blink = 0;

function render() {

    // for (var i = 0; i < 45; i++) {
    //     var t = emit(0, 0, (0.5 - Math.random()) * 14, (0.5 - Math.random()) * 14, 1, 0.01);
    // }



    var curTime = Date.now();
    var t = (curTime - prevTime) / 100;

    updateSites(t);
    updateUsers(t);

    for (var i = 0; i < gridgeometry.colors.length; i++) {
        gridgeometry.colors[i].r = gridgeometry.colors[i].g = gridgeometry.colors[i].b = 0.00;
    }

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
                attract(i, j, t, -0.02);
            }
        }

        particles[i].x += particles[i].vx * (t + particles[i].glitch);
        particles[i].y += particles[i].vy * (t + particles[i].glitch);
        particles[i].glitch = 0;

        lightUp(particles[i].x + width / 2, particles[i].y + height / 2);

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

    gridgeometry.colorsNeedUpdate = true;
    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    lineGeometry.verticesNeedUpdate = true;
    lineGeometry.colorsNeedUpdate = true;
    renderer.render(scene, camera);

    prevTime = curTime;

    var activity = 0;
    var liveusers = 0;
    var liveconns = 0;
    var livesites = 0;


    var bufferctx = doublebuffer.getContext("2d");
    bufferctx.fillStyle = "rgba(0,0,0,0.3)";
    bufferctx.globalCompositeOperation = "source-over";
    bufferctx.fillRect(0, 0, width * 2, height * 2);
    bufferctx.globalCompositeOperation = "lighter";
    bufferctx.drawImage(renderer.domElement, 0, 0);


    var ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(doublebuffer, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 3;
    for (var u in users) {
        var upos = worldTo2d(users[u].x, users[u].y);
        for (var s in users[u].sites) {
            var lnk = users[u].sites[s];
            if (lnk.life > 0) {
                activity++;
                liveconns++;
                if (Math.random() < lnk.life) {
                    var st = sites[s];
                    ctx.globalCompositeOperation = "lighter";
                    var pos = worldTo2d(st.x, st.y);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                    //ctx.strokeStyle = "rgba(" + Math.floor(sites[s].color.r * 255) + ", " + Math.floor(sites[s].color.g * 255)  + ", " + Math.floor(sites[s].color.b* 255)  +", 1)";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(upos.x, upos.y);
                    ctx.closePath();
                    ctx.stroke();

                    ctx.strokeStyle = "rgba(255,255,255,0.7)";
                    //ctx.fillStyle = "rgba(" + Math.floor(sites[s].color.r * 255) + ", " + Math.floor(sites[s].color.g * 255)  + ", " + Math.floor(sites[s].color.b* 255)  +", 1)";
                    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, lnk.life * 5, 0, 2 * Math.PI, false);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.globalCompositeOperation = "source-over";
                    ctx.fill();
                }
            }
        }
    }

    ctx.font = "18px ft";
    ctx.textAlign = "center";
    for (var u in users) {
        ctx.fillStyle = "#fff";
        var user = users[u];
        if (user.life <= 0) continue;
        activity++;
        liveusers++;
        var upos = worldTo2d(users[u].x, users[u].y);
        if (Math.random() < user.life * 1.5) {
            if (user.life > 0.5 && Math.random() > 0.5) {
                if (Math.random() > 0.9 || !user.decor) {
                    user.decor = textCovers[Math.floor(Math.random() * textCovers.length)];
                }
                ctx.fillText(user.decor[0] + " " + u + " " + user.decor[1], upos.x, upos.y + 50);
            } else {
                ctx.fillText(u, upos.x, upos.y + 50);
            }
            ctx.strokeStyle = "rgba(255,255,255,1)";
            //ctx.fillStyle = "rgba(" + Math.floor(sites[s].color.r * 255) + ", " + Math.floor(sites[s].color.g * 255)  + ", " + Math.floor(sites[s].color.b* 255)  +", 1)";
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255," + ((1 - user.life) / 1.5 + 0.8) + ")";
            ctx.arc(upos.x, upos.y, user.life * user.life * 20, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        }
    }


    ctx.font = "13px ft";
    for (var u in sites) {
        ctx.lineWidth = 3;
        ctx.fillStyle = "rgba(255,255,255,1)";
        var site = sites[u];
        if (site.life <= 0) continue;
        activity++;
        livesites++;
        var upos = worldTo2d(site.x, site.y);
        if (Math.random() < site.life * 1.5) {
            if (site.life > 0.5 && Math.random() > 0.5) {
                if (Math.random() > 0.9 || !site.decor) {
                    site.decor = textCovers[Math.floor(Math.random() * textCovers.length)];
                }
                ctx.fillText(site.decor[0] + " " + (site.host ? site.host : u) + " " + site.decor[1], upos.x, upos.y + 40);

            } else {
                ctx.fillText((site.host ? site.host : u), upos.x, upos.y + 40);
            }
            ctx.strokeStyle = "rgba(255,255,255,1)";
            //ctx.fillStyle = "rgba(" + Math.floor(sites[s].color.r * 255) + ", " + Math.floor(sites[s].color.g * 255)  + ", " + Math.floor(sites[s].color.b* 255)  +", 1)";
            ctx.beginPath();
            // ctx.fillStyle = "rgba(255,255,255," + ((1 - site.life) / 1.5 + 0.8) + ")";
            ctx.arc(upos.x, upos.y, site.life * site.life * 20, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255," + ((1 - site.life) / 2 + 0.5) + ")";
            ctx.arc(upos.x, upos.y, site.life * site.life * site.life * (Math.random() * 30 + 110), 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.stroke();


        }
    }
    if (empty.length !== GPU_Particles) {
        activity += Math.ceil((GPU_Particles - empty.length) / 10);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(20, 30 + 30 + 5, Math.pow(activity, 0.98), 60);
    ctx.font = "21px ft";
    ctx.textAlign = 'left';
    if (Math.random() < Math.min(Math.pow(activity, 1 / 5), 0.9)) {
        ctx.globalCompositeOperation = "difference";
        ctx.fillText("ACTIVITY > " + activity, 25, 53 + 30 + 5);
        ctx.fillText(Math.ceil(GPU_Particles - empty.length) + ":" + liveusers + ":" + livesites + ":" + liveconns, 25, 53 + 60 + 5);
    }
    ctx.font = "26px ft";
    ctx.globalCompositeOperation = "lighter";
    ctx.fillText("<edge>", 25, 53);


    if (curTime - prevBlink > 1000) {
        blink++;
        blink %= 8;
        prevBlink = curTime;
    }

    if (activity / 10 <= 1) {
        if (blink <= 3) {
            ctx.font = "40px ft";
            ctx.globalCompositeOperation = "lighter";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255," + (blink % 2 + 0.3) + ")"
            ctx.fillText("Join [ Edge ] Wi-Fi to Start", realw / 2, realh / 2);
        }
        else if (blink <= 7) {
            ctx.font = "40px ft";
            ctx.globalCompositeOperation = "lighter";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255," + (blink % 2 + 0.3) + ")"
            ctx.fillText("Go for anything Online", realw / 2, realh / 2);
        }
    }
}

var projector = new THREE.Projector();
function worldTo2d(x, y) {
    var p3D = new THREE.Vector3(x, y, 0),
        p3D = projector.projectVector(p3D, camera);
    //need extra steps to convert p2D to window's coordinates
    p3D.x = (p3D.x + 1) / 2 * realw;
    p3D.y = - (p3D.y - 1) / 2 * realh;
    return p3D;
}

(function animate() { render(); requestAnimationFrame(animate); })();
