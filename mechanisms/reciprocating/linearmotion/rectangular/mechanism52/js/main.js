import { params } from './params.js';
import { calculateDisplacement, calculatePhaseAngles } from './calculations.js';
import { exportVelocityChart, exportDisplacementChart, exportAccelerationChart, exportJerkChart, exportPath } from './export.js';

// Animation state
let animating = false;
let currentTheta = 0;
let animationSpeed = 1;
let animationDirection = 'forward';
let pingPongReverse = false;
let animationFrameId = null;

// Charts
let velocityChart = null;
let displacementChart = null;
let accelerationChart = null;
let jerkChart = null;

/**
 * Initialize charts
 */
function initCharts() {
    const displacements = calculateDisplacement();
    const angles = displacements.map(d => d.angle);
    const vxData = displacements.map(d => d.vx);
    const vyData = displacements.map(d => d.vy);
    const sxData = displacements.map(d => d.sx);
    const syData = displacements.map(d => d.sy);

    const phaseAngles = calculatePhaseAngles();

    // Phase colors
    const phaseColors = {
        'TOP': '#3B82F6',      // Blue
        'RIGHT': '#22C55E',    // Green
        'BOTTOM': '#EF4444',   // Red
        'LEFT': '#F59E0B'      // Amber
    };

    // Create phase annotation boxes
    const phaseAnnotations = {
        top: {
            type: 'box',
            xMin: phaseAngles.topStart,
            xMax: phaseAngles.topEnd,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 0
        },
        tr: {
            type: 'box',
            xMin: phaseAngles.trStart,
            xMax: phaseAngles.trEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        right: {
            type: 'box',
            xMin: phaseAngles.rightStart,
            xMax: phaseAngles.rightEnd,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 0
        },
        br: {
            type: 'box',
            xMin: phaseAngles.brStart,
            xMax: phaseAngles.brEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        bottom: {
            type: 'box',
            xMin: phaseAngles.bottomStart,
            xMax: phaseAngles.bottomEnd,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 0
        },
        bl: {
            type: 'box',
            xMin: phaseAngles.blStart,
            xMax: phaseAngles.blEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        left: {
            type: 'box',
            xMin: phaseAngles.leftStart,
            xMax: phaseAngles.leftEnd,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 0
        },
        tl: {
            type: 'box',
            xMin: phaseAngles.tlStart,
            xMax: phaseAngles.tlEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        }
    };

    // Velocity Chart
    const velocityCtx = document.getElementById('velocityChart').getContext('2d');
    velocityChart = new Chart(velocityCtx, {
        type: 'line',
        data: {
            labels: angles,
            datasets: [
                {
                    label: 'Vx (Horizontal Velocity)',
                    data: vxData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'Vy (Vertical Velocity)',
                    data: vyData,
                    borderColor: '#22C55E',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                annotation: {
                    annotations: phaseAnnotations
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Angle (degrees)'
                    },
                    min: 0,
                    max: 360,
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            if (value % 30 === 0) {
                                return value;
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Velocity'
                    }
                }
            }
        }
    });

    // Displacement Chart
    const displacementCtx = document.getElementById('displacementChart').getContext('2d');
    displacementChart = new Chart(displacementCtx, {
        type: 'line',
        data: {
            labels: angles,
            datasets: [
                {
                    label: 'Sx (Horizontal Position)',
                    data: sxData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'Sy (Vertical Position)',
                    data: syData,
                    borderColor: '#22C55E',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                annotation: {
                    annotations: phaseAnnotations
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Angle (degrees)'
                    },
                    min: 0,
                    max: 360,
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            if (value % 30 === 0) {
                                return value;
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Position'
                    }
                }
            }
        }
    });

    // Acceleration Chart
    const axData = displacements.map(d => d.ax);
    const ayData = displacements.map(d => d.ay);
    const accelerationCtx = document.getElementById('accelerationChart').getContext('2d');
    accelerationChart = new Chart(accelerationCtx, {
        type: 'line',
        data: {
            labels: angles,
            datasets: [
                {
                    label: 'Ax (Horizontal Acceleration)',
                    data: axData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'Ay (Vertical Acceleration)',
                    data: ayData,
                    borderColor: '#22C55E',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                annotation: {
                    annotations: phaseAnnotations
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Angle (degrees)'
                    },
                    min: 0,
                    max: 360,
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            if (value % 30 === 0) {
                                return value;
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Acceleration'
                    }
                }
            }
        }
    });

    // Jerk Chart
    const jxData = displacements.map(d => d.jx);
    const jyData = displacements.map(d => d.jy);
    const jerkCtx = document.getElementById('jerkChart').getContext('2d');
    jerkChart = new Chart(jerkCtx, {
        type: 'line',
        data: {
            labels: angles,
            datasets: [
                {
                    label: 'Jx (Horizontal Jerk)',
                    data: jxData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'Jy (Vertical Jerk)',
                    data: jyData,
                    borderColor: '#22C55E',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                annotation: {
                    annotations: phaseAnnotations
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Angle (degrees)'
                    },
                    min: 0,
                    max: 360,
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            if (value % 30 === 0) {
                                return value;
                            }
                            return '';
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Jerk'
                    }
                }
            }
        }
    });
}

/**
 * Update charts
 */
function updateCharts() {
    const displacements = calculateDisplacement();
    const vxData = displacements.map(d => d.vx);
    const vyData = displacements.map(d => d.vy);
    const sxData = displacements.map(d => d.sx);
    const syData = displacements.map(d => d.sy);
    const axData = displacements.map(d => d.ax);
    const ayData = displacements.map(d => d.ay);
    const jxData = displacements.map(d => d.jx);
    const jyData = displacements.map(d => d.jy);

    // Update phase annotations
    const phaseAngles = calculatePhaseAngles();
    const phaseAnnotations = {
        top: {
            type: 'box',
            xMin: phaseAngles.topStart,
            xMax: phaseAngles.topEnd,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 0
        },
        tr: {
            type: 'box',
            xMin: phaseAngles.trStart,
            xMax: phaseAngles.trEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        right: {
            type: 'box',
            xMin: phaseAngles.rightStart,
            xMax: phaseAngles.rightEnd,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 0
        },
        br: {
            type: 'box',
            xMin: phaseAngles.brStart,
            xMax: phaseAngles.brEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        bottom: {
            type: 'box',
            xMin: phaseAngles.bottomStart,
            xMax: phaseAngles.bottomEnd,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 0
        },
        bl: {
            type: 'box',
            xMin: phaseAngles.blStart,
            xMax: phaseAngles.blEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        },
        left: {
            type: 'box',
            xMin: phaseAngles.leftStart,
            xMax: phaseAngles.leftEnd,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 0
        },
        tl: {
            type: 'box',
            xMin: phaseAngles.tlStart,
            xMax: phaseAngles.tlEnd,
            backgroundColor: 'rgba(209, 213, 219, 0.2)',
            borderWidth: 0
        }
    };

    velocityChart.data.datasets[0].data = vxData;
    velocityChart.data.datasets[1].data = vyData;
    velocityChart.options.plugins.annotation.annotations = phaseAnnotations;
    velocityChart.update('none');

    displacementChart.data.datasets[0].data = sxData;
    displacementChart.data.datasets[1].data = syData;
    displacementChart.options.plugins.annotation.annotations = phaseAnnotations;
    displacementChart.update('none');

    accelerationChart.data.datasets[0].data = axData;
    accelerationChart.data.datasets[1].data = ayData;
    accelerationChart.options.plugins.annotation.annotations = phaseAnnotations;
    accelerationChart.update('none');

    jerkChart.data.datasets[0].data = jxData;
    jerkChart.data.datasets[1].data = jyData;
    jerkChart.options.plugins.annotation.annotations = phaseAnnotations;
    jerkChart.update('none');
}

/**
 * Draw path visualization
 */
function drawPath() {
    const canvas = document.getElementById('pathCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw watermark
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-30 * Math.PI / 180);
    ctx.font = '60px sans-serif';
    ctx.fillStyle = '#D1D5DB';
    ctx.globalAlpha = 0.3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BrianMechanisms', 0, 0);
    ctx.restore();

    const displacements = calculateDisplacement();
    const phaseAngles = calculatePhaseAngles();

    // Find bounds for scaling - need to consider ALL elements:
    // 1. Main path (sx, sy)
    // 2. Offset paths (±perpendicularOffset)
    // 3. Fixed point locus (fixedX, fixedY)
    // 4. R2 pivot points (pivotX, pivotY)
    // 5. R1 circle radius

    const sxValues = displacements.map(d => d.sx);
    const syValues = displacements.map(d => d.sy);
    const fixedXValues = displacements.map(d => d.fixedX);
    const fixedYValues = displacements.map(d => d.fixedY);
    const pivotXValues = displacements.map(d => d.pivotX);
    const pivotYValues = displacements.map(d => d.pivotY);

    // Combine all X and Y values
    const allXValues = [...sxValues, ...fixedXValues, ...pivotXValues];
    const allYValues = [...syValues, ...fixedYValues, ...pivotYValues];

    let minX = Math.min(...allXValues);
    let maxX = Math.max(...allXValues);
    let minY = Math.min(...allYValues);
    let maxY = Math.max(...allYValues);

    // Add perpendicular offset to bounds
    if (params.perpendicularOffset > 0) {
        minX -= params.perpendicularOffset;
        maxX += params.perpendicularOffset;
        minY -= params.perpendicularOffset;
        maxY += params.perpendicularOffset;
    }

    // Add R1 circle radius to bounds (centered at offset position)
    const r1CenterOffsetX = params.horizontalLength / 2;
    const r1CenterOffsetY = -params.transitionRadius - params.verticalLength / 2;
    minX = Math.min(minX, r1CenterOffsetX - params.R1);
    maxX = Math.max(maxX, r1CenterOffsetX + params.R1);
    minY = Math.min(minY, r1CenterOffsetY - params.R1);
    maxY = Math.max(maxY, r1CenterOffsetY + params.R1);

    const padding = 50;
    const scaleX = (width - 2 * padding) / (maxX - minX);
    const scaleY = (height - 2 * padding) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY) * params.pathScale;

    // Center the path
    const centerX = width / 2;
    const centerY = height / 2;
    const pathCenterX = (minX + maxX) / 2;
    const pathCenterY = (minY + maxY) / 2;

    function toCanvasX(sx) {
        return centerX + (sx - pathCenterX) * scale;
    }

    function toCanvasY(sy) {
        return centerY - (sy - pathCenterY) * scale;
    }

    // Phase colors
    const phaseColors = {
        'TOP': '#3B82F6',
        'RIGHT': '#22C55E',
        'BOTTOM': '#EF4444',
        'LEFT': '#F59E0B',
        'TRANSITION': '#D1D5DB'
    };

    function getPhaseAtAngle(angle) {
        if (angle >= phaseAngles.topStart && angle < phaseAngles.topEnd) return 'TOP';
        if (angle >= phaseAngles.trStart && angle < phaseAngles.trEnd) return 'TRANSITION';
        if (angle >= phaseAngles.rightStart && angle < phaseAngles.rightEnd) return 'RIGHT';
        if (angle >= phaseAngles.brStart && angle < phaseAngles.brEnd) return 'TRANSITION';
        if (angle >= phaseAngles.bottomStart && angle < phaseAngles.bottomEnd) return 'BOTTOM';
        if (angle >= phaseAngles.blStart && angle < phaseAngles.blEnd) return 'TRANSITION';
        if (angle >= phaseAngles.leftStart && angle < phaseAngles.leftEnd) return 'LEFT';
        if (angle >= phaseAngles.tlStart) return 'TRANSITION';
        return 'TRANSITION';
    }

    // Draw path with phase colors
    let currentPhase = getPhaseAtAngle(0);
    ctx.strokeStyle = phaseColors[currentPhase];
    ctx.lineWidth = 3;
    ctx.beginPath();

    displacements.forEach((d, i) => {
        const phase = getPhaseAtAngle(d.angle);
        const x = toCanvasX(d.sx);
        const y = toCanvasY(d.sy);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            if (phase !== currentPhase) {
                ctx.stroke();
                currentPhase = phase;
                ctx.strokeStyle = phaseColors[currentPhase];
                ctx.beginPath();
                const prevD = displacements[i - 1];
                ctx.moveTo(toCanvasX(prevD.sx), toCanvasY(prevD.sy));
            }
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Helper function to get circle center for a corner transition
    function getCornerCenter(angle) {
        if (angle >= phaseAngles.trStart && angle < phaseAngles.trEnd) {
            const startIdx = Math.round(phaseAngles.trStart);
            const endIdx = Math.round(phaseAngles.trEnd);
            return { sx: displacements[startIdx].sx, sy: displacements[endIdx].sy };
        } else if (angle >= phaseAngles.brStart && angle < phaseAngles.brEnd) {
            const startIdx = Math.round(phaseAngles.brStart);
            const endIdx = Math.round(phaseAngles.brEnd);
            return { sx: displacements[endIdx].sx, sy: displacements[startIdx].sy };
        } else if (angle >= phaseAngles.blStart && angle < phaseAngles.blEnd) {
            const startIdx = Math.round(phaseAngles.blStart);
            const endIdx = Math.round(phaseAngles.blEnd);
            return { sx: displacements[startIdx].sx, sy: displacements[endIdx].sy };
        } else if (angle >= phaseAngles.tlStart && angle < phaseAngles.tlEnd) {
            const startIdx = Math.round(phaseAngles.tlStart);
            const endIdx = Math.round(phaseAngles.tlEnd);
            return { sx: displacements[endIdx].sx, sy: displacements[startIdx].sy };
        }
        return null;
    }

    // Helper function to calculate offset position for any point
    function getOffsetPosition(d, offsetSign) {
        const phase = getPhaseAtAngle(d.angle);
        let offsetX = 0, offsetY = 0;

        if (phase === 'TOP') {
            offsetY = -offsetSign * params.perpendicularOffset;
        } else if (phase === 'RIGHT') {
            offsetX = -offsetSign * params.perpendicularOffset;
        } else if (phase === 'BOTTOM') {
            offsetY = offsetSign * params.perpendicularOffset;
        } else if (phase === 'LEFT') {
            offsetX = offsetSign * params.perpendicularOffset;
        } else if (phase === 'TRANSITION') {
            // Get corner center
            const center = getCornerCenter(d.angle);
            if (center) {
                // Calculate radial offset
                const dx = d.sx - center.sx;
                const dy = d.sy - center.sy;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    offsetX = (dx / distance) * offsetSign * params.perpendicularOffset;
                    offsetY = (dy / distance) * offsetSign * params.perpendicularOffset;
                }
            }
        }

        return { x: d.sx + offsetX, y: d.sy + offsetY };
    }

    // Draw offset paths if offset is greater than 0
    if (params.perpendicularOffset > 0) {
        // Helper function to draw complete offset path in segments
        function drawOffsetPath(offsetSign) {
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            let currentPhase = null;
            let pathStarted = false;

            displacements.forEach((d, i) => {
                const phase = getPhaseAtAngle(d.angle);
                const pos = getOffsetPosition(d, offsetSign);
                const x = toCanvasX(pos.x);
                const y = toCanvasY(pos.y);

                // If phase changed, finish current path and start new one
                if (phase !== currentPhase) {
                    if (pathStarted) {
                        ctx.stroke();
                    }
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    pathStarted = true;
                    currentPhase = phase;
                } else {
                    ctx.lineTo(x, y);
                }
            });

            // Stroke the final segment
            if (pathStarted) {
                ctx.stroke();
            }

            ctx.setLineDash([]);
        }

        // Draw inner and outer offset paths
        drawOffsetPath(-1);
        drawOffsetPath(1);
    }

    // Calculate offset angle for output point
    // Total circumference of output locus
    const totalCircumference = 2 * (params.horizontalLength + params.verticalLength) +
                               4 * (Math.PI / 2 * params.transitionRadius);

    // Sum = horizontal + transition1 + half of vertical
    const sum = params.horizontalLength +
                (Math.PI / 2 * params.transitionRadius) +
                (params.verticalLength / 2);

    // Offset angle
    const offsetAngle = (sum / totalCircumference) * 360;

    // Output point is at theta + offset
    const outputTheta = currentTheta + offsetAngle;
    const outputThetaRounded = Math.round(outputTheta) % 360;

    // Current displacement for first arm (used for offset dots)
    const currentDisplacement = displacements[outputThetaRounded] || displacements[0];
    const currentX = toCanvasX(currentDisplacement.sx);
    const currentY = toCanvasY(currentDisplacement.sy);

    // Draw offset position dots and connecting line if offset > 0
    if (params.perpendicularOffset > 0) {
        // Use the same getOffsetPosition function to calculate offset dots
        const negPos = getOffsetPosition(currentDisplacement, -1);
        const posPos = getOffsetPosition(currentDisplacement, 1);

        // Negative offset position
        const negX = toCanvasX(negPos.x);
        const negY = toCanvasY(negPos.y);

        // Positive offset position
        const posX = toCanvasX(posPos.x);
        const posY = toCanvasY(posPos.y);

        // Draw connecting line (length = 2 * offset)
        ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(negX, negY);
        ctx.lineTo(posX, posY);
        ctx.stroke();

        // Draw negative offset dot
        ctx.fillStyle = '#8B5CF6';  // Purple
        ctx.beginPath();
        ctx.arc(negX, negY, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw positive offset dot
        ctx.fillStyle = '#10B981';  // Green
        ctx.beginPath();
        ctx.arc(posX, posY, 6, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw start point
    const startX = toCanvasX(displacements[0].sx);
    const startY = toCanvasY(displacements[0].sy);
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Use R1 circle center offset calculated earlier in bounds
    // (already declared as r1CenterOffsetX and r1CenterOffsetY)
    const r1CenterCanvasX = toCanvasX(r1CenterOffsetX);
    const r1CenterCanvasY = toCanvasY(r1CenterOffsetY);

    // Draw R1 circle (reference circle centered at offset origin)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // Light blue
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    const r1Radius = params.R1 * scale;
    ctx.arc(r1CenterCanvasX, r1CenterCanvasY, r1Radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw origin point (R1 circle center)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(r1CenterCanvasX, r1CenterCanvasY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Calculate and draw fixed point locus for all theta values
    ctx.strokeStyle = '#F59E0B'; // Amber
    ctx.lineWidth = 3;
    ctx.beginPath();
    let firstPoint = true;

    for (let theta = 0; theta <= 360; theta++) {
        // Calculate output theta with offset
        const outputTheta = theta + offsetAngle;
        const outputThetaRounded = Math.round(outputTheta) % 360;
        const outputDisp = displacements[outputThetaRounded] || displacements[0];

        // R1 arm at -theta
        const r1ArmTheta = -theta;
        const thetaRad = r1ArmTheta * Math.PI / 180;
        const r1CircX = r1CenterOffsetX + params.R1 * Math.cos(thetaRad);
        const r1CircY = r1CenterOffsetY + params.R1 * Math.sin(thetaRad);

        // Direction from end of R1 to output point
        const dirX = outputDisp.sx - r1CircX;
        const dirY = outputDisp.sy - r1CircY;
        const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);

        if (dirLen > 0) {
            const unitX = dirX / dirLen;
            const unitY = dirY / dirLen;

            // Fixed point position
            const fpX = r1CircX + unitX * params.fixedPointDistance;
            const fpY = r1CircY + unitY * params.fixedPointDistance;

            const canvasX = toCanvasX(fpX);
            const canvasY = toCanvasY(fpY);

            if (firstPoint) {
                ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }
    ctx.stroke();

    // Draw multiple arms
    const angleSpacing = 360 / params.numArms;

    for (let i = 0; i < params.numArms; i++) {
        const armTheta = currentTheta + i * angleSpacing;

        // Draw R1 arm at -armTheta (reversed)
        const r1ArmTheta = -armTheta;
        const thetaRad = r1ArmTheta * Math.PI / 180;
        const r1CircumferenceX = r1CenterOffsetX + params.R1 * Math.cos(thetaRad);
        const r1CircumferenceY = r1CenterOffsetY + params.R1 * Math.sin(thetaRad);

        const r1CircumferenceCanvasX = toCanvasX(r1CircumferenceX);
        const r1CircumferenceCanvasY = toCanvasY(r1CircumferenceY);

        ctx.strokeStyle = '#3B82F6'; // Solid blue
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(r1CenterCanvasX, r1CenterCanvasY);
        ctx.lineTo(r1CircumferenceCanvasX, r1CircumferenceCanvasY);
        ctx.stroke();

        // Draw point on R1 circumference (end of R1 arm) - draw AFTER other elements so it's on top
        // (will be drawn at end of loop)

        // Calculate output point for this arm
        const armOutputTheta = armTheta + offsetAngle;
        const armOutputThetaRounded = Math.round(armOutputTheta) % 360;
        const armOutputDisplacement = displacements[armOutputThetaRounded] || displacements[0];

        // Calculate canvas positions for output point (will be drawn at end)
        const armOutputX = toCanvasX(armOutputDisplacement.sx);
        const armOutputY = toCanvasY(armOutputDisplacement.sy);

        // Variables for fixed point position (to draw at end)
        let fixedPointCanvasX = null;
        let fixedPointCanvasY = null;

        // Draw R2 arm - must pass through the output point
        // R2 arm has its MIDDLE (center) at the end of R1 arm
        // R2 arm has fixed point at distance fixedPointDistance from R2 center (end of R1)
        // Calculate direction from end of R1 to output point
        const r2DirX = armOutputDisplacement.sx - r1CircumferenceX;
        const r2DirY = armOutputDisplacement.sy - r1CircumferenceY;
        const r2DirLength = Math.sqrt(r2DirX * r2DirX + r2DirY * r2DirY);

        if (r2DirLength > 0) {
            // Normalize direction
            const r2UnitX = r2DirX / r2DirLength;
            const r2UnitY = r2DirY / r2DirLength;

            // R2 center is at end of R1 arm
            const r2CenterX = r1CircumferenceX;
            const r2CenterY = r1CircumferenceY;

            // Fixed point is at fixedPointDistance from R2 center (can be positive or negative)
            const fixedPointX = r2CenterX + r2UnitX * params.fixedPointDistance;
            const fixedPointY = r2CenterY + r2UnitY * params.fixedPointDistance;

            // R2 arm extends from R2 center:
            // - R2a in the positive direction (outside, away from R1 center)
            // - R2b in the negative direction (inside, towards R1 center)
            const r2End1X = r2CenterX + r2UnitX * params.R2a;
            const r2End1Y = r2CenterY + r2UnitY * params.R2a;
            const r2End2X = r2CenterX - r2UnitX * params.R2b;
            const r2End2Y = r2CenterY - r2UnitY * params.R2b;

            const r2End1CanvasX = toCanvasX(r2End1X);
            const r2End1CanvasY = toCanvasY(r2End1Y);
            const r2End2CanvasX = toCanvasX(r2End2X);
            const r2End2CanvasY = toCanvasY(r2End2Y);

            // Store fixed point position to draw at end
            fixedPointCanvasX = toCanvasX(fixedPointX);
            fixedPointCanvasY = toCanvasY(fixedPointY);

            // Draw R2 arm
            ctx.strokeStyle = '#DC2626'; // Red
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(r2End1CanvasX, r2End1CanvasY);
            ctx.lineTo(r2End2CanvasX, r2End2CanvasY);
            ctx.stroke();

            // Draw endpoints of R2 arm (smaller red dots)
            ctx.fillStyle = '#DC2626'; // Red
            ctx.beginPath();
            ctx.arc(r2End1CanvasX, r2End1CanvasY, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(r2End2CanvasX, r2End2CanvasY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw dots on top of everything (at end of loop iteration)

        // Blue dot on R1 circumference
        ctx.fillStyle = '#3B82F6'; // Blue
        ctx.beginPath();
        ctx.arc(r1CircumferenceCanvasX, r1CircumferenceCanvasY, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Red dot on output point
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(armOutputX, armOutputY, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Amber dot on fixed point (if it was calculated)
        if (fixedPointCanvasX !== null && fixedPointCanvasY !== null) {
            ctx.fillStyle = '#F59E0B'; // Amber-500
            ctx.beginPath();
            ctx.arc(fixedPointCanvasX, fixedPointCanvasY, 8, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw offset position dots for this arm (perpendicular offset loci)
        if (params.perpendicularOffset > 0) {
            const negPos = getOffsetPosition(armOutputDisplacement, -1);
            const posPos = getOffsetPosition(armOutputDisplacement, 1);

            const negX = toCanvasX(negPos.x);
            const negY = toCanvasY(negPos.y);
            const posX = toCanvasX(posPos.x);
            const posY = toCanvasY(posPos.y);

            // Draw connecting line (length = 2 * offset)
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(negX, negY);
            ctx.lineTo(posX, posY);
            ctx.stroke();

            // Draw negative offset dot (purple - inner)
            ctx.fillStyle = '#8B5CF6';  // Purple
            ctx.beginPath();
            ctx.arc(negX, negY, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Draw positive offset dot (green - outer)
            ctx.fillStyle = '#10B981';  // Green
            ctx.beginPath();
            ctx.arc(posX, posY, 6, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

/**
 * Animation loop
 */
function animate() {
    if (animationDirection === 'forward') {
        currentTheta += animationSpeed;
        if (currentTheta >= 360) {
            currentTheta = 0;
        }
    } else if (animationDirection === 'backward') {
        currentTheta -= animationSpeed;
        if (currentTheta < 0) {
            currentTheta = 360 + currentTheta;
        }
    } else if (animationDirection === 'pingpong') {
        if (pingPongReverse) {
            currentTheta -= animationSpeed;
            if (currentTheta <= 0) {
                currentTheta = 0;
                pingPongReverse = false;
            }
        } else {
            currentTheta += animationSpeed;
            if (currentTheta >= 360) {
                currentTheta = 360;
                pingPongReverse = true;
            }
        }
    }

    drawPath();

    const slider = document.getElementById('thetaSlider');
    if (slider) {
        slider.value = currentTheta;
        document.getElementById('thetaValue').textContent = currentTheta.toFixed(0);
    }

    if (animating) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

function startAnimation() {
    if (animating) return;
    animating = true;
    animate();
}

function stopAnimation() {
    animating = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Update the computed angles display
 */
function updateComputedAnglesDisplay() {
    const angles = calculatePhaseAngles();
    document.getElementById('computedHorizontalAngle').textContent = angles.horizontal.toFixed(1);
    document.getElementById('computedVerticalAngle').textContent = angles.vertical.toFixed(1);
    document.getElementById('computedTransitionAngle').textContent = angles.transition.toFixed(1);
}

/**
 * Initialize UI controls
 */
function initControls() {
    // Initialize computed angles display
    updateComputedAnglesDisplay();

    // Theta slider
    const thetaSlider = document.getElementById('thetaSlider');
    thetaSlider.addEventListener('input', function() {
        currentTheta = parseFloat(this.value);
        document.getElementById('thetaValue').textContent = currentTheta.toFixed(0);
        drawPath();
    });

    // Play/Pause button
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', function() {
        if (animating) {
            stopAnimation();
            playPauseBtn.textContent = '▶ Play';
            playPauseBtn.className = 'w-full mb-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium';
        } else {
            startAnimation();
            playPauseBtn.textContent = '⏸ Pause';
            playPauseBtn.className = 'w-full mb-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium';
        }
    });

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    speedSlider.addEventListener('input', function() {
        animationSpeed = parseFloat(this.value);
        document.getElementById('speedValue').textContent = animationSpeed.toFixed(1);
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
        animationDirection = 'forward';
        updateDirectionButtons(dirForward);
    });

    dirBackward.addEventListener('click', function() {
        animationDirection = 'backward';
        updateDirectionButtons(dirBackward);
    });

    dirPingPong.addEventListener('click', function() {
        animationDirection = 'pingpong';
        updateDirectionButtons(dirPingPong);
    });

    // Phase length sliders
    const horizontalLengthSlider = document.getElementById('horizontalLengthSlider');
    horizontalLengthSlider.addEventListener('input', function() {
        params.horizontalLength = parseFloat(this.value);
        document.getElementById('horizontalLengthValue').textContent = params.horizontalLength.toFixed(0);
        updateComputedAnglesDisplay();
        updateCharts();
        drawPath();
    });

    const verticalLengthSlider = document.getElementById('verticalLengthSlider');
    verticalLengthSlider.addEventListener('input', function() {
        params.verticalLength = parseFloat(this.value);
        document.getElementById('verticalLengthValue').textContent = params.verticalLength.toFixed(0);
        updateComputedAnglesDisplay();
        updateCharts();
        drawPath();
    });

    const transitionRadiusSlider = document.getElementById('transitionRadiusSlider');
    transitionRadiusSlider.addEventListener('input', function() {
        params.transitionRadius = parseFloat(this.value);
        document.getElementById('transitionRadiusValue').textContent = params.transitionRadius.toFixed(1);
        updateComputedAnglesDisplay();
        updateCharts();
        drawPath();
    });

    // Lift and drop sliders (apply to all sections)
    const liftHeightSlider = document.getElementById('liftHeightSlider');
    liftHeightSlider.addEventListener('input', function() {
        params.liftHeight = parseFloat(this.value);
        document.getElementById('liftHeightValue').textContent = params.liftHeight.toFixed(0);
        updateCharts();
        drawPath();
    });

    const liftDropAngleSlider = document.getElementById('liftDropAngleSlider');
    liftDropAngleSlider.addEventListener('input', function() {
        params.liftDropAngle = parseFloat(this.value);
        document.getElementById('liftDropAngleValue').textContent = params.liftDropAngle.toFixed(0);
        updateCharts();
        drawPath();
    });

    // Perpendicular offset slider
    const perpendicularOffsetSlider = document.getElementById('perpendicularOffsetSlider');
    perpendicularOffsetSlider.addEventListener('input', function() {
        params.perpendicularOffset = parseFloat(this.value);
        document.getElementById('perpendicularOffsetValue').textContent = params.perpendicularOffset.toFixed(1);
        drawPath();
    });

    // Linkage parameter sliders
    const r1Slider = document.getElementById('r1Slider');
    r1Slider.addEventListener('input', function() {
        params.R1 = parseFloat(this.value);
        document.getElementById('r1Value').textContent = params.R1.toFixed(0);
        updateCharts();
        drawPath();
    });

    const r2aSlider = document.getElementById('r2aSlider');
    r2aSlider.addEventListener('input', function() {
        params.R2a = parseFloat(this.value);
        document.getElementById('r2aValue').textContent = params.R2a.toFixed(1);
        updateCharts();
        drawPath();
    });

    const r2bSlider = document.getElementById('r2bSlider');
    r2bSlider.addEventListener('input', function() {
        params.R2b = parseFloat(this.value);
        document.getElementById('r2bValue').textContent = params.R2b.toFixed(1);
        updateCharts();
        drawPath();
    });

    const fixedPointDistanceSlider = document.getElementById('fixedPointDistanceSlider');
    fixedPointDistanceSlider.addEventListener('input', function() {
        params.fixedPointDistance = parseFloat(this.value);
        document.getElementById('fixedPointDistanceValue').textContent = params.fixedPointDistance.toFixed(0);
        updateCharts();
        drawPath();
    });

    const numArmsSlider = document.getElementById('numArmsSlider');
    numArmsSlider.addEventListener('input', function() {
        params.numArms = parseInt(this.value);
        document.getElementById('numArmsValue').textContent = params.numArms;
        drawPath();
    });

    // Export buttons
    const exportVelocityBtn = document.getElementById('exportVelocity');
    const exportDisplacementBtn = document.getElementById('exportDisplacement');
    const exportAccelerationBtn = document.getElementById('exportAcceleration');
    const exportJerkBtn = document.getElementById('exportJerk');
    const exportPathBtn = document.getElementById('exportPath');

    exportVelocityBtn.addEventListener('click', function() {
        exportVelocityChart(velocityChart);
    });

    exportDisplacementBtn.addEventListener('click', function() {
        exportDisplacementChart(displacementChart);
    });

    exportAccelerationBtn.addEventListener('click', function() {
        exportAccelerationChart(accelerationChart);
    });

    exportJerkBtn.addEventListener('click', function() {
        exportJerkChart(jerkChart);
    });

    exportPathBtn.addEventListener('click', exportPath);

    // Handle GIF export request
    window.addEventListener('requestGIFExport', function() {
        if (window.exportPathGIFCallback) {
            window.exportPathGIFCallback(
                drawPath,
                () => currentTheta,
                (theta) => { currentTheta = theta; }
            );
        }
    });
}

/**
 * Switch between Mechanism and Design tabs
 */
window.switchMainTab = function(tab) {
    if (tab === 'mechanism') {
        document.getElementById('mechanismContent').classList.remove('hidden');
        document.getElementById('designContent').classList.add('hidden');
        document.getElementById('mechanismMainTab').classList.add('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
        document.getElementById('mechanismMainTab').classList.remove('text-gray-500', 'hover:bg-gray-50');
        document.getElementById('designMainTab').classList.remove('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
        document.getElementById('designMainTab').classList.add('text-gray-500', 'hover:bg-gray-50');

        // Redraw path when switching to mechanism tab
        drawPath();
    } else {
        document.getElementById('mechanismContent').classList.add('hidden');
        document.getElementById('designContent').classList.remove('hidden');
        document.getElementById('designMainTab').classList.add('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
        document.getElementById('designMainTab').classList.remove('text-gray-500', 'hover:bg-gray-50');
        document.getElementById('mechanismMainTab').classList.remove('text-blue-600', 'border-b-4', 'border-blue-600', 'bg-blue-50');
        document.getElementById('mechanismMainTab').classList.add('text-gray-500', 'hover:bg-gray-50');

        // Update charts when switching to design tab
        updateCharts();
    }
};

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    initControls();
    drawPath();
});
