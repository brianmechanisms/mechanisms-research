import { params } from './params.js';
import { exportPNG, exportSVG, exportGIF } from './export.js';
import {
    calculatePhaseAngles,
    calculateVxAngles,
    calculateReturnVx,
    getVxAtAngle,
    getVyAtAngle,
    calculateDisplacement,
    calculateAcceleration,
    calculateJerk
} from './calculations.js';
import { GenericProfileDrawer } from './chartDrawer.js';
import { createExportHandler, exportCanvasAsPNG } from './exports.js';
import {
    mechanismParams,
    drawMechanism,
    startAnimation,
    stopAnimation,
    setTheta,
    calculateOffsets
} from './mechanism.js';

// Chart drawers
let velocityDrawer, displacementDrawer, accelerationDrawer, jerkDrawer;

/**
 * Draw velocity profile with custom implementation (has grid)
 */
function drawVelocityProfile() {
    const canvas = document.getElementById('velocityCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Calculate return VX
    const returnVx = calculateReturnVx();

    // Calculate combined min/max for both VX and VY
    let vyMin = 0, vyMax = 0;
    for (let i = 0; i <= 360; i++) {
        const vy = getVyAtAngle(i) * params.vyScale;
        vyMin = Math.min(vyMin, vy);
        vyMax = Math.max(vyMax, vy);
    }
    const vxMin = Math.min(params.forwardVx, returnVx, 0);
    const vxMax = Math.max(params.forwardVx, returnVx, 0);

    const vMin = Math.min(vxMin, vyMin);
    const vMax = Math.max(vxMax, vyMax);
    const vRange = vMax - vMin;
    const vPadding = vRange * 0.2;

    // Draw phase backgrounds
    const angles = calculatePhaseAngles();
    const phases = [
        { name: 'DROP', start: angles.dropStart, end: angles.dropEnd, color: 'rgba(239, 68, 68, 0.15)' },
        { name: 'STANCE', start: angles.stanceStart, end: angles.stanceEnd, color: 'rgba(34, 197, 94, 0.15)' },
        { name: 'LIFT', start: angles.liftStart, end: angles.liftEnd, color: 'rgba(59, 130, 246, 0.15)' },
        { name: 'SWING', start: angles.swingStart, end: angles.swingEnd, color: 'rgba(251, 146, 60, 0.15)' }
    ];

    phases.forEach(phase => {
        const x1 = 60 + (phase.start / 360) * (width - 90);
        const x2 = 60 + (phase.end / 360) * (width - 90);
        ctx.fillStyle = phase.color;
        ctx.fillRect(x1, 30, x2 - x1, height - 70);
    });

    // Draw transition lines
    const vxAngles = calculateVxAngles();
    const transitionAngles = [vxAngles.trans1Start, vxAngles.trans1End, vxAngles.trans2Start, 360];

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    transitionAngles.forEach(angle => {
        const x = 60 + (angle / 360) * (width - 90);
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, height - 40);
        ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 30);
    ctx.lineTo(60, height - 40);
    ctx.stroke();

    // Zero line
    const zeroY = 30 + (vMax + vPadding) / (vRange + 2 * vPadding) * (height - 70);
    ctx.beginPath();
    ctx.moveTo(60, zeroY);
    ctx.lineTo(width - 30, zeroY);
    ctx.stroke();

    // Grid and labels
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';

    const vStep = 0.5;
    for (let v = Math.ceil((vMin - vPadding) / vStep) * vStep; v <= vMax + vPadding; v += vStep) {
        const y = 30 + (vMax + vPadding - v) / (vRange + 2 * vPadding) * (height - 70);
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
        ctx.fillText(v.toFixed(1), 55, y + 4);
    }

    ctx.textAlign = 'center';
    for (let angle = 0; angle <= 360; angle += 30) {
        const x = 60 + (angle / 360) * (width - 90);
        ctx.fillText(angle + '°', x, height - 20);
    }

    // Phase labels
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#666';
    phases.forEach(phase => {
        const midAngle = (phase.start + phase.end) / 2;
        const x = 60 + (midAngle / 360) * (width - 90);
        ctx.fillText(phase.name, x, 20);
    });

    // Axis titles
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#000';
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Velocity', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillText('Angle (degrees)', width / 2, height - 5);

    const numPoints = 1000;

    // Draw VX curve (blue)
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 360;
        const vx = getVxAtAngle(angle);
        const x = 60 + (angle / 360) * (width - 90);
        const y = 30 + (vMax + vPadding - vx) / (vRange + 2 * vPadding) * (height - 70);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw VY curve (red)
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 360;
        const vy = getVyAtAngle(angle) * params.vyScale;
        const x = 60 + (angle / 360) * (width - 90);
        const y = 30 + (vMax + vPadding - vy) / (vRange + 2 * vPadding) * (height - 70);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw legend (bottom left)
    const legendX = 80;
    const legendY = height - 60;

    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 30, legendY);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('VX (Horizontal Velocity)', legendX + 35, legendY);

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 20);
    ctx.lineTo(legendX + 30, legendY + 20);
    ctx.stroke();

    ctx.fillText('VY (Vertical Velocity)', legendX + 35, legendY + 20);
}

/**
 * Draw displacement profile with custom grid
 */
function drawDisplacementProfile() {
    const displacements = calculateDisplacement();

    const canvas = document.getElementById('displacementCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Find min/max for scaling
    let sxMin = Infinity, sxMax = -Infinity;
    let syMin = Infinity, syMax = -Infinity;

    displacements.forEach(d => {
        sxMin = Math.min(sxMin, d.sx * params.sxScale);
        sxMax = Math.max(sxMax, d.sx * params.sxScale);
        syMin = Math.min(syMin, d.sy * params.syScale);
        syMax = Math.max(syMax, d.sy * params.syScale);
    });

    const sMin = Math.min(sxMin, syMin);
    const sMax = Math.max(sxMax, syMax);
    const sRange = sMax - sMin;
    const sPadding = sRange * 0.2;

    // Draw phase backgrounds
    const angles = calculatePhaseAngles();
    const phases = [
        { name: 'DROP', start: angles.dropStart, end: angles.dropEnd, color: 'rgba(239, 68, 68, 0.15)' },
        { name: 'STANCE', start: angles.stanceStart, end: angles.stanceEnd, color: 'rgba(34, 197, 94, 0.15)' },
        { name: 'LIFT', start: angles.liftStart, end: angles.liftEnd, color: 'rgba(59, 130, 246, 0.15)' },
        { name: 'SWING', start: angles.swingStart, end: angles.swingEnd, color: 'rgba(251, 146, 60, 0.15)' }
    ];

    phases.forEach(phase => {
        const x1 = 60 + (phase.start / 360) * (width - 90);
        const x2 = 60 + (phase.end / 360) * (width - 90);
        ctx.fillStyle = phase.color;
        ctx.fillRect(x1, 30, x2 - x1, height - 70);
    });

    // Draw transition lines
    const vxAngles = calculateVxAngles();
    const transitionAngles = [vxAngles.trans1Start, vxAngles.trans1End, vxAngles.trans2Start, 360];

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    transitionAngles.forEach(angle => {
        const x = 60 + (angle / 360) * (width - 90);
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, height - 40);
        ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 30);
    ctx.lineTo(60, height - 40);
    ctx.stroke();

    // Zero line
    const zeroY = 30 + (sMax + sPadding) / (sRange + 2 * sPadding) * (height - 70);
    ctx.beginPath();
    ctx.moveTo(60, zeroY);
    ctx.lineTo(width - 30, zeroY);
    ctx.stroke();

    // Grid and labels
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';

    const sStep = Math.max(10, Math.ceil(sRange / 10 / 10) * 10);
    for (let s = Math.ceil((sMin - sPadding) / sStep) * sStep; s <= sMax + sPadding; s += sStep) {
        const y = 30 + (sMax + sPadding - s) / (sRange + 2 * sPadding) * (height - 70);
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
        ctx.fillText(s.toFixed(0), 55, y + 4);
    }

    // Angle labels
    ctx.textAlign = 'center';
    for (let angle = 0; angle <= 360; angle += 30) {
        const x = 60 + (angle / 360) * (width - 90);
        ctx.fillText(angle + '°', x, height - 20);
    }

    // Phase labels
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#666';
    phases.forEach(phase => {
        const midAngle = (phase.start + phase.end) / 2;
        const x = 60 + (midAngle / 360) * (width - 90);
        ctx.fillText(phase.name, x, 20);
    });

    // Axis titles
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#000';
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Displacement', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillText('Angle (degrees)', width / 2, height - 5);

    // Draw SX curve (blue)
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 3;
    ctx.beginPath();

    displacements.forEach((d, i) => {
        const x = 60 + (d.angle / 360) * (width - 90);
        const y = 30 + (sMax + sPadding - d.sx * params.sxScale) / (sRange + 2 * sPadding) * (height - 70);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw SY curve (red)
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.beginPath();

    displacements.forEach((d, i) => {
        const x = 60 + (d.angle / 360) * (width - 90);
        const y = 30 + (sMax + sPadding - d.sy * params.syScale) / (sRange + 2 * sPadding) * (height - 70);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw legend (bottom left)
    const legendX = 80;
    const legendY = height - 60;

    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 30, legendY);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SX (Horizontal Displacement)', legendX + 35, legendY);

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 20);
    ctx.lineTo(legendX + 30, legendY + 20);
    ctx.stroke();

    ctx.fillText('SY (Vertical Displacement)', legendX + 35, legendY + 20);
}

/**
 * Draw position profile (2D path - Output Locus)
 */
function drawPositionProfile() {
    const canvas = document.getElementById('positionCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const displacements = calculateDisplacement();
    const angles = calculatePhaseAngles();

    // Find min/max for X and Y positions
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;

    displacements.forEach(d => {
        xMin = Math.min(xMin, d.sx);
        xMax = Math.max(xMax, d.sx);
        yMin = Math.min(yMin, d.sy);
        yMax = Math.max(yMax, d.sy);
    });

    // Calculate scale and center
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const maxRange = Math.max(xRange, yRange);
    const padding = 80;
    const scale = (Math.min(width, height) - 2 * padding) / maxRange * params.pathScale;

    // Center position
    const centerX = width / 2;
    const centerY = height / 2;

    // Transform position to canvas coordinates
    function toCanvasX(x) {
        return centerX + (x - (xMin + xMax) / 2) * scale;
    }

    function toCanvasY(y) {
        return centerY - (y - (yMin + yMax) / 2) * scale;  // Flip Y axis
    }

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let y = yMin; y <= yMax; y += Math.max(10, Math.ceil(yRange / 10 / 10) * 10)) {
        const canvasY = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(padding, canvasY);
        ctx.lineTo(width - padding, canvasY);
        ctx.stroke();
    }

    // Vertical grid lines
    for (let x = xMin; x <= xMax; x += Math.max(10, Math.ceil(xRange / 10 / 10) * 10)) {
        const canvasX = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(canvasX, padding);
        ctx.lineTo(canvasX, height - padding);
        ctx.stroke();
    }

    // Draw axes through origin (0,0)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, toCanvasY(0));
    ctx.lineTo(width - padding, toCanvasY(0));
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), padding);
    ctx.lineTo(toCanvasX(0), height - padding);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X Position', width / 2, height - 20);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y Position', 0, 0);
    ctx.restore();

    // Phase colors
    const phaseColors = {
        'DROP': '#EF4444',      // Red
        'STANCE': '#22C55E',    // Green
        'LIFT': '#3B82F6',      // Blue
        'SWING': '#FB923C'      // Orange
    };

    // Helper function to get phase at angle
    function getPhaseAtAngle(angle) {
        if (angle >= angles.dropStart && angle < angles.dropEnd) return 'DROP';
        if (angle >= angles.stanceStart && angle < angles.stanceEnd) return 'STANCE';
        if (angle >= angles.liftStart && angle < angles.liftEnd) return 'LIFT';
        if (angle >= angles.swingStart && angle <= angles.swingEnd) return 'SWING';
        return 'SWING';
    }

    // Draw the path
    if (params.showPhaseColors) {
        // Draw path with phase colors
        let currentPhase = getPhaseAtAngle(0);
        ctx.strokeStyle = phaseColors[currentPhase];
        ctx.lineWidth = 3;
        ctx.beginPath();

        displacements.forEach((d, i) => {
            const phase = getPhaseAtAngle(d.angle);
            const canvasX = toCanvasX(d.sx);
            const canvasY = toCanvasY(d.sy);

            if (i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                if (phase !== currentPhase) {
                    // Complete current segment
                    ctx.stroke();
                    // Start new segment with new color
                    currentPhase = phase;
                    ctx.strokeStyle = phaseColors[currentPhase];
                    ctx.beginPath();
                    const prevD = displacements[i - 1];
                    ctx.moveTo(toCanvasX(prevD.sx), toCanvasY(prevD.sy));
                }
                ctx.lineTo(canvasX, canvasY);
            }
        });
        ctx.stroke();
    } else {
        // Draw path with single color
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();

        displacements.forEach((d, i) => {
            const canvasX = toCanvasX(d.sx);
            const canvasY = toCanvasY(d.sy);

            if (i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        });
        ctx.stroke();
    }

    // Draw angle markers
    if (params.showAngleMarkers) {
        ctx.fillStyle = '#000';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        for (let i = 0; i < displacements.length; i++) {
            const d = displacements[i];
            if (d.angle % 30 === 0) {  // Mark every 30 degrees
                const canvasX = toCanvasX(d.sx);
                const canvasY = toCanvasY(d.sy);

                // Draw marker circle
                ctx.fillStyle = d.angle === 0 ? '#FF0000' : '#000';
                ctx.beginPath();
                ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
                ctx.fill();

                // Draw angle label
                ctx.fillStyle = '#000';
                ctx.fillText(d.angle + '°', canvasX, canvasY - 10);
            }
        }
    }

    // Draw start/end point
    const startD = displacements[0];
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(toCanvasX(startD.sx), toCanvasY(startD.sy), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw legend
    const legendX = 20;
    const legendY = 20;
    const legendWidth = 150;
    const legendHeight = params.showPhaseColors ? 120 : 40;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';

    // Start marker
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(legendX + 15, legendY + 20, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText('Start (0°)', legendX + 30, legendY + 24);

    if (params.showPhaseColors) {
        // Phase color legend
        const phases = ['DROP', 'STANCE', 'LIFT', 'SWING'];
        phases.forEach((phase, i) => {
            const y = legendY + 50 + i * 20;
            ctx.strokeStyle = phaseColors[phase];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(legendX + 10, y);
            ctx.lineTo(legendX + 30, y);
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = '11px sans-serif';
            ctx.fillText(phase, legendX + 40, y + 4);
        });
    }
}

/**
 * Initialize chart drawers
 */
function initializeDrawers() {
    accelerationDrawer = new GenericProfileDrawer('accelerationCanvas', {
        key1: 'ax',
        key2: 'ay',
        yLabel: 'Acceleration',
        legendItems: [
            { color: '#1E40AF', label: 'AX (Horizontal Acceleration)' },
            { color: '#DC2626', label: 'AY (Vertical Acceleration)' }
        ]
    });

    jerkDrawer = new GenericProfileDrawer('jerkCanvas', {
        key1: 'jx',
        key2: 'jy',
        yLabel: 'Jerk',
        legendItems: [
            { color: '#1E40AF', label: 'JX (Horizontal Jerk)' },
            { color: '#DC2626', label: 'JY (Vertical Jerk)' }
        ]
    });
}

/**
 * Update all displays
 */
function updateDisplay() {
    const angles = calculatePhaseAngles();
    const returnVx = calculateReturnVx();
    const vxAngles = calculateVxAngles();

    // Update display values
    document.getElementById('forwardVxValue').textContent = params.forwardVx.toFixed(1);
    document.getElementById('returnVxValue').textContent = returnVx.toFixed(2);
    document.getElementById('transitionAngleValue').textContent = params.transitionAngle.toFixed(0);
    document.getElementById('stanceAngleValue').textContent = params.stanceAngle.toFixed(0);
    document.getElementById('liftDropAngleValue').textContent = params.liftDropAngle.toFixed(0);
    document.getElementById('swingAngleValue').textContent = angles.swing.toFixed(0);
    document.getElementById('liftVyValue').textContent = params.liftVy.toFixed(1);
    document.getElementById('swingDisplacementValue').textContent = params.swingDisplacement.toFixed(1);
    document.getElementById('vyScaleValue').textContent = params.vyScale.toFixed(1);
    document.getElementById('sxScaleValue').textContent = params.sxScale.toFixed(1);
    document.getElementById('syScaleValue').textContent = params.syScale.toFixed(1);
    document.getElementById('pathScaleValue').textContent = params.pathScale.toFixed(1);
    document.getElementById('axScaleValue').textContent = params.axScale.toFixed(1);
    document.getElementById('ayScaleValue').textContent = params.ayScale.toFixed(1);
    document.getElementById('jxScaleValue').textContent = params.jxScale.toFixed(1);
    document.getElementById('jyScaleValue').textContent = params.jyScale.toFixed(1);

    // Update calculated values
    const forwardAngle = vxAngles.forward;
    const returnAngle = vxAngles.return;
    const quickReturnRatio = Math.abs(returnVx) / params.forwardVx;

    document.getElementById('calcForwardAngle').textContent = forwardAngle.toFixed(0) + '°';
    document.getElementById('calcReturnAngle').textContent = returnAngle.toFixed(0) + '°';
    document.getElementById('calcQuickReturnRatio').textContent = quickReturnRatio.toFixed(2);

    // Draw all profiles
    drawVelocityProfile();
    drawDisplacementProfile();
    accelerationDrawer.draw(calculateAcceleration());
    jerkDrawer.draw(calculateJerk());
    drawPositionProfile();

    // Recalculate mechanism offsets when design parameters change
    calculateOffsets();
}

/**
 * Setup slider handlers
 */
function setupSlider(sliderId, paramName) {
    const slider = document.getElementById(sliderId);
    slider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        params[paramName] = value;
        updateDisplay();
    });
}

/**
 * Initialize the application
 */
function init() {
    initializeDrawers();

    // Setup all sliders
    setupSlider('forwardVxSlider', 'forwardVx');
    setupSlider('transitionAngleSlider', 'transitionAngle');
    setupSlider('stanceAngleSlider', 'stanceAngle');
    setupSlider('liftDropAngleSlider', 'liftDropAngle');
    setupSlider('liftVySlider', 'liftVy');
    setupSlider('swingDisplacementSlider', 'swingDisplacement');
    setupSlider('vyScaleSlider', 'vyScale');
    setupSlider('sxScaleSlider', 'sxScale');
    setupSlider('syScaleSlider', 'syScale');
    setupSlider('pathScaleSlider', 'pathScale');
    setupSlider('axScaleSlider', 'axScale');
    setupSlider('ayScaleSlider', 'ayScale');
    setupSlider('jxScaleSlider', 'jxScale');
    setupSlider('jyScaleSlider', 'jyScale');

    // Setup checkboxes
    document.getElementById('showPhaseColors').addEventListener('change', function() {
        params.showPhaseColors = this.checked;
        updateDisplay();
    });

    document.getElementById('showAngleMarkers').addEventListener('change', function() {
        params.showAngleMarkers = this.checked;
        updateDisplay();
    });

    // Setup export handlers
    window.exportCurve = createExportHandler('velocityCanvas', 'velocity_profile');
    window.exportDisplacement = createExportHandler('displacementCanvas', 'displacement_profile');
    window.exportAcceleration = createExportHandler('accelerationCanvas', 'acceleration_profile');
    window.exportJerk = createExportHandler('jerkCanvas', 'jerk_profile');
    window.exportPosition = function() {
        alert('Position export not yet implemented in modular version');
    };

    // Main tab switching function (Mechanism vs Design)
    window.switchMainTab = function(tab) {
        if (tab === 'mechanism') {
            document.getElementById('mechanismContent').classList.remove('hidden');
            document.getElementById('designContent').classList.add('hidden');
            document.getElementById('mechanismMainTab').classList.add('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
            document.getElementById('mechanismMainTab').classList.remove('text-gray-500', 'hover:bg-gray-50');
            document.getElementById('designMainTab').classList.remove('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
            document.getElementById('designMainTab').classList.add('text-gray-500', 'hover:bg-gray-50');

            // Redraw mechanism when switching to mechanism tab
            drawMechanism();
        } else {
            document.getElementById('mechanismContent').classList.add('hidden');
            document.getElementById('designContent').classList.remove('hidden');
            document.getElementById('designMainTab').classList.add('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
            document.getElementById('designMainTab').classList.remove('text-gray-500', 'hover:bg-gray-50');
            document.getElementById('mechanismMainTab').classList.remove('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
            document.getElementById('mechanismMainTab').classList.add('text-gray-500', 'hover:bg-gray-50');

            // Redraw charts when switching to design tab (canvas might not render properly when hidden)
            updateDisplay();
        }
    };

    // Sub-tab switching function (Curve vs Calculation within Design)
    window.switchTab = function(tab) {
        if (tab === 'curve') {
            document.getElementById('curveContent').classList.remove('hidden');
            document.getElementById('calculationContent').classList.add('hidden');
            document.getElementById('curveTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            document.getElementById('curveTab').classList.remove('text-gray-500');
            document.getElementById('calculationTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            document.getElementById('calculationTab').classList.add('text-gray-500');
        } else {
            document.getElementById('curveContent').classList.add('hidden');
            document.getElementById('calculationContent').classList.remove('hidden');
            document.getElementById('calculationTab').classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            document.getElementById('calculationTab').classList.remove('text-gray-500');
            document.getElementById('curveTab').classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            document.getElementById('curveTab').classList.add('text-gray-500');
        }
    };

    // Setup mechanism controls
    setupMechanismControls();

    // Initial draw
    calculateOffsets(); // Calculate offsets before initial draw
    updateDisplay();
    drawMechanism();
}

/**
 * Setup mechanism control handlers
 */
function setupMechanismControls() {
    // Theta slider
    const thetaSlider = document.getElementById('thetaSlider');
    const thetaValue = document.getElementById('thetaValue');
    thetaSlider.addEventListener('input', function() {
        const theta = parseFloat(this.value);
        thetaValue.textContent = theta.toFixed(0);
        setTheta(theta);
    });

    // Play/Pause toggle button
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', function() {
        if (mechanismParams.animating) {
            stopAnimation();
            playPauseBtn.textContent = '▶ Play';
            playPauseBtn.className = 'w-full mb-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium';
        } else {
            startAnimation();
            playPauseBtn.textContent = '⏸ Pause';
            playPauseBtn.className = 'w-full mb-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium';
        }
    });

    // Direction buttons
    const dirForward = document.getElementById('dirForward');
    const dirBackward = document.getElementById('dirBackward');
    const dirPingPong = document.getElementById('dirPingPong');

    function updateDirectionButtons(activeBtn) {
        [dirForward, dirBackward, dirPingPong].forEach(btn => {
            if (btn === activeBtn) {
                btn.className = 'flex-1 px-3 py-2 bg-blue-500 text-white text-xl rounded hover:bg-blue-600';
            } else {
                btn.className = 'flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-xl rounded hover:bg-gray-400';
            }
        });
    }

    dirForward.addEventListener('click', function() {
        mechanismParams.animationDirection = 'forward';
        updateDirectionButtons(dirForward);
    });

    dirBackward.addEventListener('click', function() {
        mechanismParams.animationDirection = 'backward';
        updateDirectionButtons(dirBackward);
    });

    dirPingPong.addEventListener('click', function() {
        mechanismParams.animationDirection = 'pingpong';
        mechanismParams.pingPongReverse = false;
        updateDirectionButtons(dirPingPong);
    });

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    speedSlider.addEventListener('input', function() {
        const speed = parseFloat(this.value);
        speedValue.textContent = speed.toFixed(1);
        mechanismParams.animationSpeed = speed;
    });

    // R1 slider (controls both outer circle radius and first arm length)
    const r1Slider = document.getElementById('r1Slider');
    const r1Value = document.getElementById('r1Value');
    r1Slider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        r1Value.textContent = value.toFixed(0);
        mechanismParams.outerCircleRadius = value;
        mechanismParams.firstArmLength = value;
        drawMechanism();
    });

    // R2 slider (second arm length)
    const r2Slider = document.getElementById('r2Slider');
    const r2Value = document.getElementById('r2Value');
    r2Slider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        r2Value.textContent = value.toFixed(0);
        mechanismParams.secondArmLength = value;
        drawMechanism();
    });

    // Fixed pin slider
    const fixedPinSlider = document.getElementById('fixedPinSlider');
    const fixedPinValue = document.getElementById('fixedPinValue');
    fixedPinSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        fixedPinValue.textContent = value.toFixed(0);
        mechanismParams.fixedDotDistance = value;
        drawMechanism();
    });

    // Locus offset slider
    const locusOffsetSlider = document.getElementById('locusOffsetSlider');
    const locusOffsetValue = document.getElementById('locusOffsetValue');
    locusOffsetSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        locusOffsetValue.textContent = value.toFixed(1);
        mechanismParams.locusOffset = value;
        drawMechanism();
    });

    // Vertical offset slider
    const verticalOffsetSlider = document.getElementById('verticalOffsetSlider');
    const verticalOffsetValue = document.getElementById('verticalOffsetValue');
    verticalOffsetSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        verticalOffsetValue.textContent = value.toFixed(1);
        mechanismParams.verticalOffset = value;
        drawMechanism();
    });

    // Number of arms slider
    const numArmsSlider = document.getElementById('numArmsSlider');
    const numArmsValue = document.getElementById('numArmsValue');
    numArmsSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        numArmsValue.textContent = value;
        mechanismParams.numArms = value;
        drawMechanism();
    });

    // Export mechanism
    const exportMechanismBtn = document.getElementById('exportMechanism');
    const mechanismExportFormat = document.getElementById('mechanismExportFormat');

    exportMechanismBtn.addEventListener('click', function() {
        const format = mechanismExportFormat.value;
        if (format === 'png') {
            exportPNG();
        } else if (format === 'svg') {
            exportSVG();
        } else if (format === 'gif') {
            exportGIF();
        }
    });
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
