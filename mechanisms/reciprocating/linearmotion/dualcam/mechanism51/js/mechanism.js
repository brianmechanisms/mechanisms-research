import { params } from './params.js';
import { calculateDisplacement, calculatePhaseAngles, smoothSymmetricCurveIntegral } from './calculations.js';

/**
 * Mechanism parameters
 */
export const mechanismParams = {
    outerCircleRadius: 150,      // Radius of the big outer circle
    firstArmLength: 150,          // Length from center to outer circle
    secondArmLength: 135,         // Length of second arm
    fixedDotDistance: 20,         // Distance of fixed dot from pivot on second arm
    currentTheta: 0,              // Current angle (0-360) - visual display angle
    animating: false,
    animationSpeed: 1,            // Degrees per frame
    animationDirection: 'forward', // 'forward', 'backward', 'pingpong'
    pingPongReverse: false,       // For ping-pong mode: true when going backward
    useOffset: true,              // Apply offset based on middle of stance
    xOffset: 0,                   // Calculated X offset
    yOffset: 0,                   // Calculated Y offset
    thetaOffset: 0,               // Theta offset to center stance at 270°
    useThetaOffset: true,         // Apply theta offset
    locusOffset: 3.8,             // Horizontal offset for left/right loci
    verticalOffset: -9.2,         // Additional vertical offset (controllable)
    numArms: 1                    // Number of arms (equally spaced)
};

/**
 * Calculate offsets based on middle of STANCE phase
 */
export function calculateOffsets() {
    const angles = calculatePhaseAngles();
    const displacements = calculateDisplacement();

    // Calculate theta offset to center stance at 270°
    // Stance should be centered at 270° (bottom of circle)
    // stanceMidAngle is where stance is currently centered (in the 0-360 profile)
    const stanceMidAngle = (angles.stanceStart + angles.stanceEnd) / 2;

    // We want stanceMidAngle to appear at 270° visually
    // So: displayTheta + thetaOffset = profileTheta
    // At displayTheta = 270°, we want profileTheta = stanceMidAngle
    // Therefore: thetaOffset = stanceMidAngle - 270
    mechanismParams.thetaOffset = stanceMidAngle - 270;

    // Find middle of STANCE phase for X position offset
    const midStanceDisplacement = displacements[Math.round(stanceMidAngle)] || displacements[0];

    // Apply negative X offset (to center the cam horizontally)
    mechanismParams.xOffset = -midStanceDisplacement.sx;

    // Calculate Y offset: subtract half of the max lift height
    // This moves the output locus down so it's centered vertically
    const maxLiftHeight = params.liftVy * angles.lift * smoothSymmetricCurveIntegral(1);
    mechanismParams.yOffset = -maxLiftHeight / 2;


    return {
        xOffset: mechanismParams.xOffset,
        yOffset: mechanismParams.yOffset,
        thetaOffset: mechanismParams.thetaOffset,
        stanceMidAngle
    };
}

/**
 * Calculate the fixed point position for a given theta
 * @param {number} theta - Display angle (0-360), the angle of the first arm visually
 */
export function calculateFixedPoint(theta) {
    // Apply theta offset to get profile angle
    // displayTheta is what we see (first arm angle)
    // profileTheta is the angle in the displacement data
    let profileTheta = theta;
    if (mechanismParams.useThetaOffset) {
        profileTheta = theta + mechanismParams.thetaOffset;
        // Normalize to 0-360
        while (profileTheta < 0) profileTheta += 360;
        while (profileTheta >= 360) profileTheta -= 360;
    }

    // Get output position from displacement at this angle
    const displacements = calculateDisplacement();
    const outputPoint = displacements[Math.round(profileTheta)] || displacements[0];

    if (!outputPoint) {
        return { x: 0, y: 0, profileTheta };
    }

    // Apply position offset if enabled
    let outputX = outputPoint.sx;
    let outputY = outputPoint.sy;

    if (mechanismParams.useOffset) {
        outputX += mechanismParams.xOffset;
        outputY += mechanismParams.yOffset;
    }

    // Apply additional vertical offset
    outputY += mechanismParams.verticalOffset;

    // First arm endpoint (pivot point) - rotates with theta (DISPLAY angle, not profile angle)
    const thetaRad = (theta * Math.PI) / 180;
    const pivotX = mechanismParams.firstArmLength * Math.cos(thetaRad);
    const pivotY = mechanismParams.firstArmLength * Math.sin(thetaRad);

    // Vector from pivot to output
    const dx = outputX - pivotX;
    const dy = outputY - pivotY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Unit vector from pivot to output (direction of second arm)
    const ux = dx / distance;
    const uy = dy / distance;

    // Second arm endpoint - FIXED LENGTH R2 from pivot, pointing toward output
    const secondArmEndX = pivotX + ux * mechanismParams.secondArmLength;
    const secondArmEndY = pivotY + uy * mechanismParams.secondArmLength;

    // Fixed pin is at a FIXED DISTANCE from pivot (traces its own locus)
    const fixedX = pivotX + ux * mechanismParams.fixedDotDistance;
    const fixedY = pivotY + uy * mechanismParams.fixedDotDistance;

    // Calculate left and right output points (with locus offset)
    const leftOutputX = outputX - mechanismParams.locusOffset;
    const rightOutputX = outputX + mechanismParams.locusOffset;

    return {
        x: fixedX,
        y: fixedY,
        pivotX,
        pivotY,
        secondArmEndX,
        secondArmEndY,
        outputX,
        outputY,
        leftOutputX,
        leftOutputY: outputY,
        rightOutputX,
        rightOutputY: outputY,
        profileTheta  // For debugging
    };
}

/**
 * Calculate fixed point locus for all angles
 */
export function calculateFixedPointLocus() {
    const locus = [];
    for (let theta = 0; theta <= 360; theta++) {
        const point = calculateFixedPoint(theta);
        locus.push({ angle: theta, x: point.x, y: point.y });
    }
    return locus;
}

/**
 * Draw the mechanism
 */
export function drawMechanism() {
    const canvas = document.getElementById('mechanismCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Set up coordinate system (center of canvas is origin)
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 2; // Scale factor for visualization

    // Draw watermark (BrianMechanisms)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-30 * Math.PI / 180); // -30 degrees for bottom-left to top-right
    ctx.font = '60px sans-serif';
    ctx.fillStyle = '#D1D5DB';
    ctx.globalAlpha = 0.3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BrianMechanisms', 0, 0);
    ctx.restore();

    // Transform functions
    function toCanvasX(x) {
        return centerX + x * scale;
    }

    function toCanvasY(y) {
        return centerY - y * scale; // Flip Y axis
    }

    // Get current mechanism state
    const theta = mechanismParams.currentTheta;
    const state = calculateFixedPoint(theta);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = -200; i <= 200; i += 50) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(toCanvasX(i), 0);
        ctx.lineTo(toCanvasX(i), height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(i));
        ctx.lineTo(width, toCanvasY(i));
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw big outer circle
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, mechanismParams.outerCircleRadius * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw output locus
    const displacements = calculateDisplacement();
    const angles = calculatePhaseAngles();

    // Phase colors
    const phaseColors = {
        'DROP': '#EF4444',
        'STANCE': '#22C55E',
        'LIFT': '#3B82F6',
        'SWING': '#FB923C'
    };

    function getPhaseAtAngle(angle) {
        if (angle >= angles.dropStart && angle < angles.dropEnd) return 'DROP';
        if (angle >= angles.stanceStart && angle < angles.stanceEnd) return 'STANCE';
        if (angle >= angles.liftStart && angle < angles.liftEnd) return 'LIFT';
        if (angle >= angles.swingStart && angle <= angles.swingEnd) return 'SWING';
        return 'SWING';
    }

    // Helper function to draw one output locus
    function drawOutputLocus(xOffset, dashed = false) {
        let currentPhase = getPhaseAtAngle(0);
        ctx.strokeStyle = phaseColors[currentPhase];
        ctx.lineWidth = 3;
        if (dashed) {
            ctx.setLineDash([5, 5]);
        }
        ctx.beginPath();

        displacements.forEach((d, i) => {
            const phase = getPhaseAtAngle(d.angle);

            // Apply offset to output locus
            let sx = d.sx + xOffset;
            let sy = d.sy;
            if (mechanismParams.useOffset) {
                sx += mechanismParams.xOffset;
                sy += mechanismParams.yOffset;
            }
            // Apply additional vertical offset
            sy += mechanismParams.verticalOffset;

            const x = toCanvasX(sx);
            const y = toCanvasY(sy);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                if (phase !== currentPhase) {
                    ctx.stroke();
                    currentPhase = phase;
                    ctx.strokeStyle = phaseColors[currentPhase];
                    ctx.beginPath();
                    const prevD = displacements[i - 1];
                    let prevSx = prevD.sx + xOffset;
                    let prevSy = prevD.sy;
                    if (mechanismParams.useOffset) {
                        prevSx += mechanismParams.xOffset;
                        prevSy += mechanismParams.yOffset;
                    }
                    // Apply additional vertical offset
                    prevSy += mechanismParams.verticalOffset;
                    ctx.moveTo(toCanvasX(prevSx), toCanvasY(prevSy));
                }
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw three output loci
    drawOutputLocus(-mechanismParams.locusOffset, false); // Left locus (solid)
    drawOutputLocus(0, true);                              // Center locus (dashed)
    drawOutputLocus(mechanismParams.locusOffset, false);   // Right locus (solid)

    // Draw fixed point locus
    const fixedLocus = calculateFixedPointLocus();
    ctx.strokeStyle = '#9333EA'; // Purple
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    fixedLocus.forEach((point, i) => {
        const x = toCanvasX(point.x);
        const y = toCanvasY(point.y);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current mechanism state

    // Center point
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw all arms (equally spaced)
    const numArms = mechanismParams.numArms;
    const angleSpacing = 360 / numArms;

    for (let i = 0; i < numArms; i++) {
        const armTheta = theta + i * angleSpacing;
        const armState = calculateFixedPoint(armTheta);

        // First arm (from center to pivot)
        ctx.strokeStyle = '#1E40AF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(toCanvasX(armState.pivotX), toCanvasY(armState.pivotY));
        ctx.stroke();

        // Pivot point
        ctx.fillStyle = '#1E40AF';
        ctx.beginPath();
        ctx.arc(toCanvasX(armState.pivotX), toCanvasY(armState.pivotY), 6, 0, 2 * Math.PI);
        ctx.fill();

        // Second arm (FIXED LENGTH R2 from pivot)
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(armState.pivotX), toCanvasY(armState.pivotY));
        ctx.lineTo(toCanvasX(armState.secondArmEndX), toCanvasY(armState.secondArmEndY));
        ctx.stroke();

        // Fixed pin on second arm
        ctx.fillStyle = '#9333EA';
        ctx.beginPath();
        ctx.arc(toCanvasX(armState.x), toCanvasY(armState.y), 8, 0, 2 * Math.PI);
        ctx.fill();

        // Output dots (center, left, right)
        ctx.fillStyle = '#EF4444';

        // Center output dot
        ctx.beginPath();
        ctx.arc(toCanvasX(armState.outputX), toCanvasY(armState.outputY), 6, 0, 2 * Math.PI);
        ctx.fill();

        // Left output dot
        ctx.beginPath();
        ctx.arc(toCanvasX(armState.leftOutputX), toCanvasY(armState.leftOutputY), 6, 0, 2 * Math.PI);
        ctx.fill();

        // Right output dot
        ctx.beginPath();
        ctx.arc(toCanvasX(armState.rightOutputX), toCanvasY(armState.rightOutputY), 6, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';

    // Theta label
    ctx.fillText(`θ = ${theta.toFixed(0)}°`, 80, 30);
}

/**
 * Animation loop
 */
let animationFrameId = null;

export function startAnimation() {
    if (mechanismParams.animating) return;

    mechanismParams.animating = true;

    function animate() {
        const direction = mechanismParams.animationDirection;

        if (direction === 'forward') {
            mechanismParams.currentTheta += mechanismParams.animationSpeed;
            if (mechanismParams.currentTheta >= 360) {
                mechanismParams.currentTheta = 0;
            }
        } else if (direction === 'backward') {
            mechanismParams.currentTheta -= mechanismParams.animationSpeed;
            if (mechanismParams.currentTheta < 0) {
                mechanismParams.currentTheta = 360 + mechanismParams.currentTheta;
            }
        } else if (direction === 'pingpong') {
            if (mechanismParams.pingPongReverse) {
                mechanismParams.currentTheta -= mechanismParams.animationSpeed;
                if (mechanismParams.currentTheta <= 0) {
                    mechanismParams.currentTheta = 0;
                    mechanismParams.pingPongReverse = false;
                }
            } else {
                mechanismParams.currentTheta += mechanismParams.animationSpeed;
                if (mechanismParams.currentTheta >= 360) {
                    mechanismParams.currentTheta = 360;
                    mechanismParams.pingPongReverse = true;
                }
            }
        }

        drawMechanism();

        // Update slider if it exists
        const slider = document.getElementById('thetaSlider');
        if (slider) {
            slider.value = mechanismParams.currentTheta;
        }

        if (mechanismParams.animating) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    animate();
}

export function stopAnimation() {
    mechanismParams.animating = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

export function setTheta(theta) {
    mechanismParams.currentTheta = theta;
    drawMechanism();
}
