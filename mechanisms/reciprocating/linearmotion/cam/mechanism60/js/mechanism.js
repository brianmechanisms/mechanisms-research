/**
 * 3D Mechanism Viewer - Interactive visualization of the complete mechanism
 * Shows cam disc(s), roller followers, trammel boards, and animation
 */

// Three.js variables
let mechScene, mechCamera, mechRenderer, mechControls;
let mechInitialized = false;

// Mesh groups
let camDiscGroup = null;
let followersGroup = null;
let trammelsGroup = null;

// Callbacks to get state from main app
let getAppState = null;
let getComputeLocusGeometry = null;
let getMotionFunctions = null;
let getGeometryFunctions = null;

// Animation state
let mechPlaying = false;
let mechAnimationId = null;
let mechSpeed = 0.5;
let mechCamAngle = 0;

// View options
let showCamDisc = true;
let showFollowers = true;
let showTrammels = true;
let showRails = true;

// Module constants (matching scad.js)
let camThickness = 10;
let scadScale = 50;

/**
 * Initialize the mechanism module with callbacks to access app state
 */
export function initMechanismModule(callbacks) {
    getAppState = callbacks.getAppState;
    getComputeLocusGeometry = callbacks.getComputeLocusGeometry;
    getMotionFunctions = callbacks.getMotionFunctions;
    getGeometryFunctions = callbacks.getGeometryFunctions;
}

/**
 * Initialize Three.js scene for mechanism viewer
 */
export function initMechanismThreeJS() {
    if (mechInitialized) return;

    const container = document.getElementById('mechanismThreeContainer');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    mechScene = new THREE.Scene();
    mechScene.background = new THREE.Color(0x1a1a2e);

    // Camera - positioned to see the mechanism from a good angle
    mechCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    mechCamera.position.set(300, -400, 400);
    mechCamera.lookAt(0, 0, 0);

    // Renderer
    mechRenderer = new THREE.WebGLRenderer({ antialias: true });
    mechRenderer.setSize(width, height);
    mechRenderer.shadowMap.enabled = true;
    mechRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(mechRenderer.domElement);

    // Controls
    mechControls = new THREE.OrbitControls(mechCamera, mechRenderer.domElement);
    mechControls.enableDamping = true;
    mechControls.dampingFactor = 0.05;
    mechControls.target.set(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    mechScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 200, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    mechScene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-200, -200, 200);
    mechScene.add(directionalLight2);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d2d44,
        transparent: true,
        opacity: 0.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;
    mechScene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(600, 30, 0x444466, 0x333355);
    gridHelper.position.y = -49;
    mechScene.add(gridHelper);

    // Create groups for different parts
    camDiscGroup = new THREE.Group();
    followersGroup = new THREE.Group();
    trammelsGroup = new THREE.Group();
    mechScene.add(camDiscGroup);
    mechScene.add(followersGroup);
    mechScene.add(trammelsGroup);

    mechInitialized = true;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        mechControls.update();
        mechRenderer.render(mechScene, mechCamera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', handleMechanismResize);
}

function handleMechanismResize() {
    if (!mechInitialized) return;
    const container = document.getElementById('mechanismThreeContainer');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    mechCamera.aspect = width / height;
    mechCamera.updateProjectionMatrix();
    mechRenderer.setSize(width, height);
}

/**
 * Get cam profile data (similar to scad.js)
 */
function getCamProfileData() {
    if (!getAppState || !getComputeLocusGeometry || !getMotionFunctions || !getGeometryFunctions) {
        return null;
    }

    const state = getAppState();
    const geo = getComputeLocusGeometry()();
    const { p } = geo;
    const { getPosX, getPosY } = getMotionFunctions();
    const { getBx } = getGeometryFunctions();

    const { vxAmp, vyAmp, transitionType, cOffsetX, phaseOffset, mirrorSet2,
            discConfig, camMinRadiusB1, camMinRadiusC1, camMinRadiusB2, camMinRadiusC2,
            oneDiscMinR, profileGap, rollerRadius, bHeight } = state;

    // Helper functions
    function getRawC1(t) {
        const ax = getPosX(t, p, vxAmp, transitionType);
        return ax + cOffsetX;
    }
    function getRawB1(t) {
        const ax = getPosX(t, p, vxAmp, transitionType);
        const ay = getPosY(t, p, vyAmp);
        return getBx(ax, ay, false);
    }
    function getRawC2(t) {
        let t2 = (t + (phaseOffset - 50) / 100) % 1;
        if (t2 < 0) t2 += 1;
        const ax = getPosX(t2, p, vxAmp, transitionType);
        return ax + (mirrorSet2 ? -cOffsetX : cOffsetX);
    }
    function getRawB2(t) {
        let t2 = (t + (phaseOffset - 50) / 100) % 1;
        if (t2 < 0) t2 += 1;
        const ax = getPosX(t2, p, vxAmp, transitionType);
        const ay = getPosY(t2, p, vyAmp);
        return getBx(ax, ay, mirrorSet2);
    }

    // Find min/max for each profile
    let b1MinX = Infinity, b1MaxX = -Infinity;
    let c1MinX = Infinity, c1MaxX = -Infinity;
    let b2MinX = Infinity, b2MaxX = -Infinity;
    let c2MinX = Infinity, c2MaxX = -Infinity;
    for (let i = 0; i <= 360; i++) {
        const t = i / 360;
        b1MinX = Math.min(b1MinX, getRawB1(t)); b1MaxX = Math.max(b1MaxX, getRawB1(t));
        c1MinX = Math.min(c1MinX, getRawC1(t)); c1MaxX = Math.max(c1MaxX, getRawC1(t));
        b2MinX = Math.min(b2MinX, getRawB2(t)); b2MaxX = Math.max(b2MaxX, getRawB2(t));
        c2MinX = Math.min(c2MinX, getRawC2(t)); c2MaxX = Math.max(c2MaxX, getRawC2(t));
    }

    const b1Range = b1MaxX - b1MinX;
    const c1Range = c1MaxX - c1MinX;
    const b2Range = b2MaxX - b2MinX;
    const c2Range = c2MaxX - c2MinX;
    const camCenterX = 0;

    // Calculate effective min radii
    let effectiveMinB1, effectiveMinC1, effectiveMinB2, effectiveMinC2;
    const pitchGap = profileGap + 2 * rollerRadius;

    if (discConfig === 'two') {
        effectiveMinB1 = camMinRadiusB1;
        effectiveMinC1 = camMinRadiusC1;
        effectiveMinB2 = camMinRadiusB2;
        effectiveMinC2 = camMinRadiusC2;
    } else {
        effectiveMinB1 = oneDiscMinR;
        const maxB1 = effectiveMinB1 + b1Range;
        effectiveMinC1 = maxB1 + pitchGap;
        const maxC1 = effectiveMinC1 + c1Range;
        effectiveMinB2 = maxC1 + pitchGap;
        const maxB2 = effectiveMinB2 + b2Range;
        effectiveMinC2 = maxB2 + pitchGap;
    }

    // Build cam profiles with getRadius functions
    const offsetB1 = effectiveMinB1 - (camCenterX - b1MaxX);
    const offsetC1 = effectiveMinC1 - (camCenterX - c1MaxX);
    const offsetB2 = effectiveMinB2 - (camCenterX - b2MaxX);
    const offsetC2 = effectiveMinC2 - (camCenterX - c2MaxX);

    let profiles;
    if (discConfig === 'two') {
        // Two discs: disc1 has B1, C1 (left side), disc2 has B2, C2 (right side)
        profiles = [
            { name: 'B1', side: 'left', disc: 1, minRadius: effectiveMinB1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawB1(t) - offsetB1) },
            { name: 'C1', side: 'left', disc: 1, minRadius: effectiveMinC1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawC1(t) - offsetC1) },
            { name: 'B2', side: 'right', disc: 2, minRadius: effectiveMinB2, followerY: bHeight,
              getRadius: (t) => {
                const rawMinX = b2MinX;
                const offsetR = effectiveMinB2 - (rawMinX - camCenterX);
                return getRawB2(t) + offsetR - camCenterX;
              }
            },
            { name: 'C2', side: 'right', disc: 2, minRadius: effectiveMinC2, followerY: bHeight,
              getRadius: (t) => {
                const rawMinX = c2MinX;
                const offsetR = effectiveMinC2 - (rawMinX - camCenterX);
                return getRawC2(t) + offsetR - camCenterX;
              }
            }
        ];
    } else if (discConfig === 'twoSplit') {
        // One disc, left/right split
        profiles = [
            { name: 'B1', side: 'left', disc: 1, minRadius: effectiveMinB1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawB1(t) - offsetB1) },
            { name: 'C1', side: 'left', disc: 1, minRadius: effectiveMinC1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawC1(t) - offsetC1) },
            { name: 'B2', side: 'right', disc: 1, minRadius: effectiveMinB2, followerY: bHeight,
              getRadius: (t) => {
                const rawMinX = b2MinX;
                const offsetR = effectiveMinB2 - (rawMinX - camCenterX);
                return getRawB2(t) + offsetR - camCenterX;
              }
            },
            { name: 'C2', side: 'right', disc: 1, minRadius: effectiveMinC2, followerY: bHeight,
              getRadius: (t) => {
                const rawMinX = c2MinX;
                const offsetR = effectiveMinC2 - (rawMinX - camCenterX);
                return getRawC2(t) + offsetR - camCenterX;
              }
            }
        ];
    } else {
        // One disc, all on left side
        profiles = [
            { name: 'B1', side: 'left', disc: 1, minRadius: effectiveMinB1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawB1(t) - offsetB1) },
            { name: 'C1', side: 'left', disc: 1, minRadius: effectiveMinC1, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawC1(t) - offsetC1) },
            { name: 'B2', side: 'left', disc: 1, minRadius: effectiveMinB2, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawB2(t) - offsetB2) },
            { name: 'C2', side: 'left', disc: 1, minRadius: effectiveMinC2, followerY: bHeight,
              getRadius: (t) => camCenterX - (getRawC2(t) - offsetC2) }
        ];
    }

    // Calculate max radii
    let disc1MaxR = 0, disc2MaxR = 0;
    for (const profile of profiles) {
        let maxR = profile.minRadius;
        for (let i = 0; i <= 360; i++) {
            const t = i / 360;
            maxR = Math.max(maxR, profile.getRadius(t));
        }
        if (profile.disc === 1) {
            disc1MaxR = Math.max(disc1MaxR, maxR);
        } else {
            disc2MaxR = Math.max(disc2MaxR, maxR);
        }
    }

    return {
        profiles,
        discConfig,
        disc1MaxR,
        disc2MaxR,
        rollerRadius,
        bHeight,
        cOffsetY: state.cOffsetY || 0
    };
}

/**
 * Create cam disc mesh with grooves
 */
function createCamDiscMesh(profiles, maxR, zOffset, camAngle) {
    const group = new THREE.Group();

    const discRadius = (maxR + 0.3) * scadScale;
    const thickness = camThickness;

    // Base disc
    const discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, thickness, 64);
    const discMaterial = new THREE.MeshPhongMaterial({
        color: 0x666680,
        specular: 0x333344,
        shininess: 30
    });
    const discMesh = new THREE.Mesh(discGeometry, discMaterial);
    discMesh.rotation.x = Math.PI / 2;
    discMesh.castShadow = true;
    discMesh.receiveShadow = true;
    group.add(discMesh);

    // Center hole
    const holeGeometry = new THREE.CylinderGeometry(4, 4, thickness + 2, 32);
    const holeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
    holeMesh.rotation.x = Math.PI / 2;
    group.add(holeMesh);

    // Create grooves for each profile
    const profileColors = {
        'B1': 0x06b6d4,
        'C1': 0x8b5cf6,
        'B2': 0xfb923c,
        'C2': 0xf472b6
    };

    for (const profile of profiles) {
        const grooveMesh = createGrooveMesh(profile, profileColors[profile.name], camAngle);
        group.add(grooveMesh);
    }

    group.position.z = zOffset;
    group.rotation.z = camAngle * Math.PI / 180;

    return group;
}

/**
 * Create groove mesh for a profile
 */
function createGrooveMesh(profile, color, camAngle) {
    const group = new THREE.Group();

    // Generate pitch curve points
    const pitchPoints = [];
    const rollerRadius = getAppState().rollerRadius;
    const rr = rollerRadius * scadScale;

    for (let deg = 0; deg <= 360; deg += 2) {
        const t = ((deg + 180) % 360) / 360;
        const r = profile.getRadius(t) * scadScale;
        const angle = deg * Math.PI / 180;
        pitchPoints.push({
            x: r * Math.cos(angle),
            y: r * Math.sin(angle),
            r, angle
        });
    }

    // Calculate inner and outer walls
    const innerPoints = [];
    const outerPoints = [];

    for (let i = 0; i < pitchPoints.length; i++) {
        const curr = pitchPoints[i];
        const prev = pitchPoints[(i - 1 + pitchPoints.length) % pitchPoints.length];
        const next = pitchPoints[(i + 1) % pitchPoints.length];

        const tx = next.x - prev.x;
        const ty = next.y - prev.y;
        const tLen = Math.sqrt(tx * tx + ty * ty);
        let nx = ty / tLen;
        let ny = -tx / tLen;

        // Ensure normal points outward
        if (nx * curr.x + ny * curr.y < 0) {
            nx = -nx;
            ny = -ny;
        }

        innerPoints.push({ x: curr.x - nx * rr, y: curr.y - ny * rr });
        outerPoints.push({ x: curr.x + nx * rr, y: curr.y + ny * rr });
    }

    // Create groove shape
    const outerShape = new THREE.Shape();
    for (let i = 0; i < outerPoints.length; i++) {
        const pt = outerPoints[i];
        if (i === 0) outerShape.moveTo(pt.x, pt.y);
        else outerShape.lineTo(pt.x, pt.y);
    }
    outerShape.closePath();

    const innerPath = new THREE.Path();
    for (let i = 0; i < innerPoints.length; i++) {
        const pt = innerPoints[i];
        if (i === 0) innerPath.moveTo(pt.x, pt.y);
        else innerPath.lineTo(pt.x, pt.y);
    }
    innerPath.closePath();
    outerShape.holes.push(innerPath);

    const extrudeSettings = {
        depth: camThickness + 1,
        bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.85,
        specular: 0x222222,
        shininess: 20
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -camThickness / 2 - 0.5;
    mesh.castShadow = true;

    group.add(mesh);
    return group;
}

/**
 * Create follower mesh (roller with arm)
 */
function createFollowerMesh(x, y, z, color, rollerRadius) {
    const group = new THREE.Group();

    const rr = rollerRadius * scadScale;

    // Roller (cylinder)
    const rollerGeometry = new THREE.CylinderGeometry(rr, rr, camThickness * 0.8, 32);
    const rollerMaterial = new THREE.MeshPhongMaterial({
        color: color,
        specular: 0x444444,
        shininess: 40
    });
    const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
    roller.rotation.x = Math.PI / 2;
    roller.castShadow = true;
    group.add(roller);

    // Center axle
    const axleGeometry = new THREE.CylinderGeometry(rr * 0.2, rr * 0.2, camThickness * 1.2, 16);
    const axleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const axle = new THREE.Mesh(axleGeometry, axleMaterial);
    axle.rotation.x = Math.PI / 2;
    group.add(axle);

    group.position.set(x, y, z);

    return group;
}

/**
 * Create follower arm mesh
 */
function createFollowerArmMesh(startX, endX, y, z, color) {
    const length = Math.abs(endX - startX);
    const armGeometry = new THREE.BoxGeometry(length, 4, 6);
    const armMaterial = new THREE.MeshPhongMaterial({
        color: 0x555555,
        specular: 0x222222,
        shininess: 20
    });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set((startX + endX) / 2, y, z);
    arm.castShadow = true;
    return arm;
}

/**
 * Create trammel board mesh connecting B and C followers
 */
function createTrammelBoardMesh(bX, cX, y, z, setNumber) {
    const group = new THREE.Group();

    const length = Math.abs(cX - bX) + 20;
    const boardGeometry = new THREE.BoxGeometry(length, 8, 15);
    const boardMaterial = new THREE.MeshPhongMaterial({
        color: setNumber === 1 ? 0x3b82f6 : 0xf97316,
        specular: 0x222222,
        shininess: 15
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set((bX + cX) / 2, y, z);
    board.castShadow = true;
    group.add(board);

    return group;
}

/**
 * Create rail mesh
 */
function createRailMesh(y, z, length) {
    const railGeometry = new THREE.BoxGeometry(length, 3, 8);
    const railMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        specular: 0x111111,
        shininess: 10
    });
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, y, z);
    rail.receiveShadow = true;
    return rail;
}

/**
 * Update mechanism visualization
 */
export function updateMechanism() {
    if (!mechInitialized) {
        initMechanismThreeJS();
    }
    if (!mechScene) return;

    const camData = getCamProfileData();
    if (!camData) return;

    const { profiles, discConfig, disc1MaxR, disc2MaxR, rollerRadius, bHeight, cOffsetY } = camData;

    // Clear existing meshes
    while (camDiscGroup.children.length > 0) {
        camDiscGroup.remove(camDiscGroup.children[0]);
    }
    while (followersGroup.children.length > 0) {
        followersGroup.remove(followersGroup.children[0]);
    }
    while (trammelsGroup.children.length > 0) {
        trammelsGroup.remove(trammelsGroup.children[0]);
    }

    // Create cam disc(s)
    if (showCamDisc) {
        if (discConfig === 'two') {
            // Two separate discs
            const disc1Profiles = profiles.filter(p => p.disc === 1);
            const disc2Profiles = profiles.filter(p => p.disc === 2);
            const separation = (disc1MaxR + disc2MaxR + 1) * scadScale;

            const disc1 = createCamDiscMesh(disc1Profiles, disc1MaxR, -separation / 2, mechCamAngle);
            const disc2 = createCamDiscMesh(disc2Profiles, disc2MaxR, separation / 2, mechCamAngle);
            camDiscGroup.add(disc1);
            camDiscGroup.add(disc2);
        } else {
            // Single disc
            const disc = createCamDiscMesh(profiles, disc1MaxR, 0, mechCamAngle);
            camDiscGroup.add(disc);
        }
    }

    // Calculate follower positions based on cam angle
    const tContactLeft = (mechCamAngle / 360) % 1;
    const tContactRight = ((mechCamAngle / 360) + 0.5) % 1;

    const followerPositions = {};
    const profileColors = {
        'B1': 0x06b6d4,
        'C1': 0x8b5cf6,
        'B2': 0xfb923c,
        'C2': 0xf472b6
    };

    for (const profile of profiles) {
        const isRightSide = profile.side === 'right';
        const tContact = isRightSide ? tContactRight : tContactLeft;
        const radius = profile.getRadius(tContact) * scadScale;
        const x = isRightSide ? radius : -radius;

        // Z position based on disc config and which disc this profile is on
        let z = 0;
        if (discConfig === 'two') {
            const separation = (disc1MaxR + disc2MaxR + 1) * scadScale;
            z = profile.disc === 1 ? -separation / 2 : separation / 2;
        }

        followerPositions[profile.name] = { x, y: 0, z };
    }

    // Create followers and arms
    if (showFollowers) {
        for (const profile of profiles) {
            const pos = followerPositions[profile.name];
            const color = profileColors[profile.name];

            // Follower roller
            const follower = createFollowerMesh(pos.x, pos.y, pos.z, color, rollerRadius);
            followersGroup.add(follower);

            // Arm extending outward from follower
            const armEndX = pos.x + (pos.x > 0 ? 80 : -80);
            const arm = createFollowerArmMesh(pos.x, armEndX, pos.y, pos.z, color);
            followersGroup.add(arm);
        }
    }

    // Create trammel boards
    if (showTrammels) {
        // Trammel 1 connects B1 and C1
        if (followerPositions['B1'] && followerPositions['C1']) {
            const b1 = followerPositions['B1'];
            const c1 = followerPositions['C1'];
            const trammel1 = createTrammelBoardMesh(b1.x, c1.x, b1.y - 20, b1.z, 1);
            trammelsGroup.add(trammel1);
        }

        // Trammel 2 connects B2 and C2
        if (followerPositions['B2'] && followerPositions['C2']) {
            const b2 = followerPositions['B2'];
            const c2 = followerPositions['C2'];
            const trammel2 = createTrammelBoardMesh(b2.x, c2.x, b2.y - 20, b2.z, 2);
            trammelsGroup.add(trammel2);
        }
    }

    // Create rails
    if (showRails) {
        const maxZ = discConfig === 'two' ? (disc1MaxR + disc2MaxR + 1) * scadScale / 2 + 20 : 20;
        const rail1 = createRailMesh(-25, -maxZ - 30, 400);
        const rail2 = createRailMesh(-25, maxZ + 30, 400);
        trammelsGroup.add(rail1);
        trammelsGroup.add(rail2);
    }
}

/**
 * Animate mechanism based on cam angle
 */
export function animateMechanism() {
    if (!mechPlaying) return;

    mechCamAngle = (mechCamAngle + mechSpeed) % 360;
    if (mechCamAngle < 0) mechCamAngle += 360;

    // Update slider
    const slider = document.getElementById('mechCamAngleSlider');
    if (slider) {
        slider.value = mechCamAngle;
    }
    const valueDisplay = document.getElementById('mechCamAngleValue');
    if (valueDisplay) {
        valueDisplay.textContent = Math.round(mechCamAngle) + '\u00B0';
    }

    updateMechanism();

    mechAnimationId = requestAnimationFrame(animateMechanism);
}

/**
 * Set cam angle externally
 */
export function setMechCamAngle(angle) {
    mechCamAngle = angle;
    updateMechanism();
}

/**
 * Get current cam angle
 */
export function getMechCamAngle() {
    return mechCamAngle;
}

/**
 * Toggle play/pause
 */
export function toggleMechPlay() {
    mechPlaying = !mechPlaying;
    if (mechPlaying) {
        animateMechanism();
    } else if (mechAnimationId) {
        cancelAnimationFrame(mechAnimationId);
        mechAnimationId = null;
    }
    return mechPlaying;
}

/**
 * Set animation speed
 */
export function setMechSpeed(speed) {
    mechSpeed = speed;
}

/**
 * Set view options
 */
export function setViewOptions(options) {
    if (options.showCamDisc !== undefined) showCamDisc = options.showCamDisc;
    if (options.showFollowers !== undefined) showFollowers = options.showFollowers;
    if (options.showTrammels !== undefined) showTrammels = options.showTrammels;
    if (options.showRails !== undefined) showRails = options.showRails;
    updateMechanism();
}

/**
 * Setup event listeners for mechanism controls
 */
export function setupMechanismEventListeners() {
    const playBtn = document.getElementById('mechPlayBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const playing = toggleMechPlay();
            playBtn.innerHTML = playing ? '&#x23F8;' : '&#x25B6;';
            playBtn.title = playing ? 'Pause' : 'Play';
            playBtn.classList.toggle('bg-green-500', !playing);
            playBtn.classList.toggle('bg-red-500', playing);
        });
    }

    const angleSlider = document.getElementById('mechCamAngleSlider');
    if (angleSlider) {
        angleSlider.addEventListener('input', (e) => {
            mechCamAngle = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('mechCamAngleValue');
            if (valueDisplay) {
                valueDisplay.textContent = Math.round(mechCamAngle) + '\u00B0';
            }
            updateMechanism();
        });
    }

    const speedSlider = document.getElementById('mechSpeedSlider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            mechSpeed = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('mechSpeedValue');
            if (valueDisplay) {
                valueDisplay.textContent = mechSpeed.toFixed(1);
            }
        });
    }

    // View option checkboxes
    const showCamDiscCheck = document.getElementById('showCamDiscCheck');
    if (showCamDiscCheck) {
        showCamDiscCheck.addEventListener('change', (e) => {
            showCamDisc = e.target.checked;
            updateMechanism();
        });
    }

    const showFollowersCheck = document.getElementById('showFollowersCheck');
    if (showFollowersCheck) {
        showFollowersCheck.addEventListener('change', (e) => {
            showFollowers = e.target.checked;
            updateMechanism();
        });
    }

    const showTrammelsCheck = document.getElementById('showTrammelsCheck');
    if (showTrammelsCheck) {
        showTrammelsCheck.addEventListener('change', (e) => {
            showTrammels = e.target.checked;
            updateMechanism();
        });
    }

    const showRailsCheck = document.getElementById('showRailsCheck');
    if (showRailsCheck) {
        showRailsCheck.addEventListener('change', (e) => {
            showRails = e.target.checked;
            updateMechanism();
        });
    }

    // Reset camera button
    const resetCameraBtn = document.getElementById('resetMechCameraBtn');
    if (resetCameraBtn) {
        resetCameraBtn.addEventListener('click', () => {
            if (mechCamera && mechControls) {
                mechCamera.position.set(300, -400, 400);
                mechControls.target.set(0, 0, 0);
                mechControls.update();
            }
        });
    }
}
