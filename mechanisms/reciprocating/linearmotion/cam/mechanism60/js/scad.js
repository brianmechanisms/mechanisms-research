/**
 * OpenSCAD generation and Three.js 3D preview
 */

// Module state
let camThickness = 10;
let scadScale = 50;
let centerHole = 8;

// Three.js variables
let threeScene, threeCamera, threeRenderer, threeControls;
let threeMeshes = [];
let threeInitialized = false;

// Callbacks to get state from main app
let getAppState = null;
let getComputeLocusGeometry = null;
let getMotionFunctions = null;
let getGeometryFunctions = null;

/**
 * Initialize the SCAD module with callbacks to access app state
 */
export function initScadModule(callbacks) {
    getAppState = callbacks.getAppState;
    getComputeLocusGeometry = callbacks.getComputeLocusGeometry;
    getMotionFunctions = callbacks.getMotionFunctions;
    getGeometryFunctions = callbacks.getGeometryFunctions;
}

/**
 * Get current SCAD parameters
 */
export function getScadParams() {
    return { camThickness, scadScale, centerHole };
}

/**
 * Set SCAD parameters
 */
export function setCamThickness(v) { camThickness = v; }
export function setScadScale(v) { scadScale = v; }
export function setCenterHole(v) { centerHole = v; }

/**
 * Initialize Three.js scene
 */
export function initThreeJS() {
    if (threeInitialized) return;

    const container = document.getElementById('threejsContainer');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x1f2937);

    // Camera
    threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    threeCamera.position.set(0, -200, 300);
    threeCamera.lookAt(0, 0, 0);

    // Renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setSize(width, height);
    container.appendChild(threeRenderer.domElement);

    // Controls
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    threeScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 200);
    threeScene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-100, -100, 100);
    threeScene.add(directionalLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(400, 20, 0x444444, 0x333333);
    gridHelper.rotation.x = Math.PI / 2;
    threeScene.add(gridHelper);

    threeInitialized = true;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        threeControls.update();
        threeRenderer.render(threeScene, threeCamera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        if (!threeInitialized) return;
        const container = document.getElementById('threejsContainer');
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        threeCamera.aspect = width / height;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(width, height);
    });
}

/**
 * Update Three.js 3D preview
 */
export function updateThreeJS() {
    if (!threeInitialized) {
        initThreeJS();
    }
    if (!threeScene) return;

    // Clear existing meshes
    for (const mesh of threeMeshes) {
        threeScene.remove(mesh);
    }
    threeMeshes = [];

    // Get cam profile data
    const camData = generateCamProfileData();
    if (!camData) return;

    const { profiles, config, discSeparation } = camData;

    // Create groove geometry for each profile
    const profileColors = {
        'B1': 0x06b6d4,  // cyan
        'C1': 0x8b5cf6,  // purple
        'B2': 0xfb923c,  // orange
        'C2': 0xf472b6   // pink
    };

    // Group profiles by disc
    let disc1Profiles, disc2Profiles;
    if (config === 'two') {
        disc1Profiles = profiles.filter(p => p.name === 'B1' || p.name === 'C1');
        disc2Profiles = profiles.filter(p => p.name === 'B2' || p.name === 'C2');
    } else {
        disc1Profiles = profiles;
        disc2Profiles = [];
    }

    // Create disc 1
    if (disc1Profiles.length > 0) {
        const disc1 = createDiscMesh(disc1Profiles, profileColors, 0);
        threeScene.add(disc1);
        threeMeshes.push(disc1);
    }

    // Create disc 2 (if 2-disc mode)
    if (disc2Profiles.length > 0) {
        const disc2 = createDiscMesh(disc2Profiles, profileColors, discSeparation);
        threeScene.add(disc2);
        threeMeshes.push(disc2);
    }
}

function createDiscMesh(profiles, colors, xOffset) {
    const group = new THREE.Group();

    // Find max radius for disc
    let maxR = 0;
    for (const profile of profiles) {
        for (const pt of profile.outerPoints) {
            const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
            maxR = Math.max(maxR, r);
        }
    }
    maxR += 5; // margin

    // Create base disc
    const discGeometry = new THREE.CylinderGeometry(maxR, maxR, camThickness, 64);
    const discMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.9
    });
    const discMesh = new THREE.Mesh(discGeometry, discMaterial);
    discMesh.rotation.x = Math.PI / 2;
    group.add(discMesh);

    // Create center hole
    if (centerHole > 0) {
        const holeGeometry = new THREE.CylinderGeometry(centerHole / 2, centerHole / 2, camThickness + 2, 32);
        const holeMaterial = new THREE.MeshPhongMaterial({ color: 0x1f2937 });
        const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
        holeMesh.rotation.x = Math.PI / 2;
        group.add(holeMesh);
    }

    // Create grooves for each profile
    for (const profile of profiles) {
        const grooveMesh = createGrooveMesh(profile, colors[profile.name]);
        group.add(grooveMesh);
    }

    group.position.x = xOffset;
    return group;
}

function createGrooveMesh(profile, color) {
    const group = new THREE.Group();

    // Create groove as a shape between inner and outer walls
    const outerShape = new THREE.Shape();
    const innerPath = new THREE.Path();

    // Outer wall
    for (let i = 0; i < profile.outerPoints.length; i++) {
        const pt = profile.outerPoints[i];
        if (i === 0) outerShape.moveTo(pt.x, pt.y);
        else outerShape.lineTo(pt.x, pt.y);
    }
    outerShape.closePath();

    // Inner wall (as hole)
    for (let i = 0; i < profile.innerPoints.length; i++) {
        const pt = profile.innerPoints[i];
        if (i === 0) innerPath.moveTo(pt.x, pt.y);
        else innerPath.lineTo(pt.x, pt.y);
    }
    innerPath.closePath();
    outerShape.holes.push(innerPath);

    // Extrude
    const extrudeSettings = {
        depth: camThickness + 1,
        bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -camThickness / 2 - 0.5;

    group.add(mesh);
    return group;
}

function generateCamProfileData() {
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
            oneDiscMinR, profileGap, rollerRadius } = state;

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

    // Generate profile points with groove walls
    function generateProfileWithGrooves(name, getRawFn, effectiveMin, rawMax, isRightSide) {
        const offset = effectiveMin - (camCenterX - rawMax);
        const pitchPoints = [];
        const innerPoints = [];
        const outerPoints = [];

        // Generate pitch curve points
        for (let deg = 0; deg <= 360; deg += 2) {
            const t = ((deg + 180) % 360) / 360;
            let r;
            if (discConfig === 'twoSplit' && isRightSide) {
                const rawMinX = name === 'B2' ? b2MinX : c2MinX;
                const offsetR = effectiveMin - (rawMinX - camCenterX);
                r = getRawFn(t) + offsetR - camCenterX;
            } else {
                r = camCenterX - (getRawFn(t) - offset);
            }
            const angle = deg * Math.PI / 180;
            pitchPoints.push({
                x: r * scadScale * Math.cos(angle),
                y: r * scadScale * Math.sin(angle)
            });
        }

        // Calculate normals and offset for groove walls
        const rr = rollerRadius * scadScale;
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
                nx = -nx; ny = -ny;
            }

            innerPoints.push({ x: curr.x - nx * rr, y: curr.y - ny * rr });
            outerPoints.push({ x: curr.x + nx * rr, y: curr.y + ny * rr });
        }

        return { name, pitchPoints, innerPoints, outerPoints };
    }

    const profiles = [
        generateProfileWithGrooves('B1', getRawB1, effectiveMinB1, b1MaxX, false),
        generateProfileWithGrooves('C1', getRawC1, effectiveMinC1, c1MaxX, false),
        generateProfileWithGrooves('B2', getRawB2, effectiveMinB2, b2MaxX, discConfig === 'twoSplit'),
        generateProfileWithGrooves('C2', getRawC2, effectiveMinC2, c2MaxX, discConfig === 'twoSplit')
    ];

    // Calculate disc separation for 2-disc mode
    let discSeparation = 0;
    if (discConfig === 'two') {
        const maxR1 = Math.max(effectiveMinC1 + c1Range, effectiveMinB1 + b1Range) * scadScale + rollerRadius * scadScale + 10;
        const maxR2 = Math.max(effectiveMinC2 + c2Range, effectiveMinB2 + b2Range) * scadScale + rollerRadius * scadScale + 10;
        discSeparation = maxR1 + maxR2 + 30;
    }

    return { profiles, config: discConfig, discSeparation,
             effectiveMinB1, effectiveMinC1, effectiveMinB2, effectiveMinC2,
             b1Range, c1Range, b2Range, c2Range, rollerRadius };
}

/**
 * Update SCAD tab display
 */
export function updateScadTab() {
    if (!getAppState) return;

    const state = getAppState();
    const configNames = {
        'two': '2 Discs',
        'one': '1 Disc',
        'twoSplit': '1 Disc (L/R)'
    };
    const configDisplay = document.getElementById('scadConfigDisplay');
    if (configDisplay) {
        configDisplay.textContent = configNames[state.discConfig] || state.discConfig;
    }
    generateScadCode();
    updateThreeJS();
}

/**
 * Generate OpenSCAD code
 */
export function generateScadCode() {
    if (!getAppState || !getComputeLocusGeometry || !getMotionFunctions || !getGeometryFunctions) {
        return '';
    }

    const state = getAppState();
    const geo = getComputeLocusGeometry()();
    const { p } = geo;
    const { getPosX, getPosY } = getMotionFunctions();
    const { getBx } = getGeometryFunctions();

    const { vxAmp, vyAmp, transitionType, cOffsetX, phaseOffset, mirrorSet2,
            discConfig, camMinRadiusB1, camMinRadiusC1, camMinRadiusB2, camMinRadiusC2,
            oneDiscMinR, profileGap, rollerRadius } = state;

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

    // Calculate effective min radii based on config
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

    // Generate profile data for each cam
    function generateProfilePoints(name, getRawFn, effectiveMin, rawMax, isRightSide) {
        const offset = effectiveMin - (camCenterX - rawMax);
        const points = [];
        for (let deg = 0; deg <= 360; deg += 2) {
            const t = ((deg + 180) % 360) / 360;
            let r;
            if (discConfig === 'twoSplit' && isRightSide) {
                const rawMinX = name === 'B2' ? b2MinX : c2MinX;
                const offsetR = effectiveMin - (rawMinX - camCenterX);
                r = getRawFn(t) + offsetR - camCenterX;
            } else {
                r = camCenterX - (getRawFn(t) - offset);
            }
            const angle = deg * Math.PI / 180;
            points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
        }
        return points;
    }

    // Generate points for each profile
    const b1Points = generateProfilePoints('B1', getRawB1, effectiveMinB1, b1MaxX, false);
    const c1Points = generateProfilePoints('C1', getRawC1, effectiveMinC1, c1MaxX, false);
    const b2Points = generateProfilePoints('B2', getRawB2, effectiveMinB2, b2MaxX, discConfig === 'twoSplit');
    const c2Points = generateProfilePoints('C2', getRawC2, effectiveMinC2, c2MaxX, discConfig === 'twoSplit');

    // Generate OpenSCAD code
    let code = `// OpenSCAD Cam Design - Generated by BrianMechanisms\n`;
    code += `// Configuration: ${discConfig === 'two' ? '2 Discs' : discConfig === 'one' ? '1 Disc' : '1 Disc (L/R)'}\n`;
    code += `// Generated: ${new Date().toISOString()}\n\n`;

    code += `// Parameters\n`;
    code += `cam_thickness = ${camThickness};\n`;
    code += `scale_factor = ${scadScale};\n`;
    code += `center_hole_d = ${centerHole};\n`;
    code += `roller_radius = ${(rollerRadius * scadScale).toFixed(2)};\n`;
    code += `$fn = 120;\n\n`;

    // Helper function to format points array
    function pointsToScad(points, name) {
        let str = `${name}_points = [\n`;
        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            str += `    [${(pt.x * scadScale).toFixed(3)}, ${(pt.y * scadScale).toFixed(3)}]`;
            if (i < points.length - 1) str += ',';
            str += '\n';
        }
        str += '];\n\n';
        return str;
    }

    // Add profile points
    code += `// Profile Points (pitch curves)\n`;
    code += pointsToScad(b1Points, 'B1');
    code += pointsToScad(c1Points, 'C1');
    code += pointsToScad(b2Points, 'B2');
    code += pointsToScad(c2Points, 'C2');

    // Groove module
    code += `// Groove module - creates groove from pitch curve\n`;
    code += `module groove(points, thickness, roller_r) {\n`;
    code += `    linear_extrude(height = thickness) {\n`;
    code += `        difference() {\n`;
    code += `            offset(r = roller_r) polygon(points);\n`;
    code += `            offset(r = -roller_r) polygon(points);\n`;
    code += `        }\n`;
    code += `    }\n`;
    code += `}\n\n`;

    // Cam disc module
    code += `// Cam disc with center hole\n`;
    code += `module cam_disc(outer_r, thickness) {\n`;
    code += `    difference() {\n`;
    code += `        cylinder(h = thickness, r = outer_r, center = false);\n`;
    code += `        translate([0, 0, -1])\n`;
    code += `            cylinder(h = thickness + 2, d = center_hole_d, center = false);\n`;
    code += `    }\n`;
    code += `}\n\n`;

    if (discConfig === 'two') {
        // Two separate discs
        const maxR1 = Math.max(effectiveMinC1 + c1Range, effectiveMinB1 + b1Range) * scadScale + rollerRadius * scadScale + 5;
        const maxR2 = Math.max(effectiveMinC2 + c2Range, effectiveMinB2 + b2Range) * scadScale + rollerRadius * scadScale + 5;

        code += `// Disc 1 (B1 and C1 profiles)\n`;
        code += `module disc1() {\n`;
        code += `    difference() {\n`;
        code += `        cam_disc(${maxR1.toFixed(1)}, cam_thickness);\n`;
        code += `        groove(B1_points, cam_thickness + 1, roller_radius);\n`;
        code += `        groove(C1_points, cam_thickness + 1, roller_radius);\n`;
        code += `    }\n`;
        code += `}\n\n`;

        code += `// Disc 2 (B2 and C2 profiles)\n`;
        code += `module disc2() {\n`;
        code += `    difference() {\n`;
        code += `        cam_disc(${maxR2.toFixed(1)}, cam_thickness);\n`;
        code += `        groove(B2_points, cam_thickness + 1, roller_radius);\n`;
        code += `        groove(C2_points, cam_thickness + 1, roller_radius);\n`;
        code += `    }\n`;
        code += `}\n\n`;

        code += `// Render both discs\n`;
        code += `disc1();\n`;
        code += `translate([${(maxR1 + maxR2 + 20).toFixed(0)}, 0, 0]) disc2();\n`;
    } else {
        // Single disc with all profiles
        const maxR = (effectiveMinC2 + c2Range) * scadScale + rollerRadius * scadScale + 5;

        code += `// Single disc with all profiles\n`;
        code += `module single_disc() {\n`;
        code += `    difference() {\n`;
        code += `        cam_disc(${maxR.toFixed(1)}, cam_thickness);\n`;
        code += `        groove(B1_points, cam_thickness + 1, roller_radius);\n`;
        code += `        groove(C1_points, cam_thickness + 1, roller_radius);\n`;
        code += `        groove(B2_points, cam_thickness + 1, roller_radius);\n`;
        code += `        groove(C2_points, cam_thickness + 1, roller_radius);\n`;
        code += `    }\n`;
        code += `}\n\n`;

        code += `// Render disc\n`;
        code += `single_disc();\n`;
    }

    const codeArea = document.getElementById('scadCodeArea');
    if (codeArea) {
        codeArea.value = code;
    }

    return code;
}

/**
 * Copy code to clipboard
 */
export function copyToClipboard() {
    const code = document.getElementById('scadCodeArea')?.value || '';
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyScadBtn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
        }
    });
}

/**
 * Download .scad file
 */
export function downloadScadFile() {
    if (!getAppState) return;

    const state = getAppState();
    const code = document.getElementById('scadCodeArea')?.value || '';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cam_${state.discConfig}_${Date.now()}.scad`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Setup event listeners for SCAD tab controls
 */
export function setupScadEventListeners() {
    const thicknessSlider = document.getElementById('camThicknessSlider');
    if (thicknessSlider) {
        thicknessSlider.addEventListener('input', (e) => {
            camThickness = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('camThicknessValue');
            if (valueDisplay) valueDisplay.textContent = camThickness;
            generateScadCode();
            updateThreeJS();
        });
    }

    const scaleSlider = document.getElementById('scadScaleSlider');
    if (scaleSlider) {
        scaleSlider.addEventListener('input', (e) => {
            scadScale = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('scadScaleValue');
            if (valueDisplay) valueDisplay.textContent = scadScale;
            generateScadCode();
            updateThreeJS();
        });
    }

    const holeSlider = document.getElementById('centerHoleSlider');
    if (holeSlider) {
        holeSlider.addEventListener('input', (e) => {
            centerHole = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('centerHoleValue');
            if (valueDisplay) valueDisplay.textContent = centerHole;
            generateScadCode();
            updateThreeJS();
        });
    }

    const copyBtn = document.getElementById('copyScadBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }

    const downloadBtn = document.getElementById('downloadScadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadScadFile);
    }
}
