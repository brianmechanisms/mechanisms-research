import { params } from './params.js';

/**
 * Calculate actual velocities needed to achieve desired lengths
 * For a rectangular path with quarter circles at corners
 */
function calculateActualVelocities() {
    const angles = calculatePhaseAnglesOnly();

    // Horizontal velocity: must traverse horizontalLength in the allocated angle
    const horizontalVx = params.horizontalLength / angles.horizontal;

    // Vertical velocity: must traverse verticalLength in the allocated angle
    const verticalVy = params.verticalLength / angles.vertical;

    return { horizontalVx, verticalVy };
}

/**
 * Calculate phase angles only (without velocities)
 * For a rectangular path: top, right, bottom, left with quarter circles at each corner
 */
function calculatePhaseAnglesOnly() {
    // Calculate transition angle from arc length
    // For a quarter circle: arc length = (π/2) * R
    const transitionArcLength = (Math.PI / 2) * params.transitionRadius;

    // Total straight displacement = 2 * (horizontal + vertical)
    const totalStraightDisplacement = 2 * (params.horizontalLength + params.verticalLength);

    // Total arc length from all 4 corners
    const totalArcLength = 4 * transitionArcLength;

    // Total displacement
    const totalDisplacement = totalStraightDisplacement + totalArcLength;

    // Distribute 360 degrees based on displacement fractions
    const transitionAngle = (transitionArcLength / totalDisplacement) * 360;
    const horizontalAngle = (params.horizontalLength / totalDisplacement) * 360;
    const verticalAngle = (params.verticalLength / totalDisplacement) * 360;

    return {
        horizontal: horizontalAngle,
        vertical: verticalAngle,
        transition: transitionAngle
    };
}

/**
 * Calculate phase angles and transitions
 * The total of all phases and transitions must equal 360°
 */
export function calculatePhaseAngles() {
    // Get the basic angle calculations
    const basicAngles = calculatePhaseAnglesOnly();

    const horizontalAngle = basicAngles.horizontal;
    const verticalAngle = basicAngles.vertical;
    const transitionAngle = basicAngles.transition;

    // Calculate actual velocities needed to achieve desired lengths
    const { horizontalVx, verticalVy } = calculateActualVelocities();

    // TOP HORIZONTAL phase (moving right, contains lift, middle, and drop sub-sections)
    const topStart = 0;
    const topEnd = horizontalAngle;

    // Within top horizontal phase:
    // - Lift happens at the beginning (first liftDropAngle degrees)
    // - Drop happens at the end (last liftDropAngle degrees)
    // - Pure horizontal in the middle
    const topLiftStart = topStart;
    const topLiftEnd = topLiftStart + params.liftDropAngle;
    const topDropEnd = topEnd;
    const topDropStart = topDropEnd - params.liftDropAngle;
    const pureTopStart = topLiftEnd;
    const pureTopEnd = topDropStart;

    // TOP-RIGHT transition (quarter circle: right → down)
    const trStart = topEnd;
    const trEnd = trStart + transitionAngle;

    // RIGHT VERTICAL phase (moving down, contains lift, middle, and drop sub-sections)
    const rightStart = trEnd;
    const rightEnd = rightStart + verticalAngle;

    // Within right vertical phase:
    // - Lift happens at the beginning (first liftDropAngle degrees)
    // - Drop happens at the end (last liftDropAngle degrees)
    // - Pure vertical in the middle
    const rightLiftStart = rightStart;
    const rightLiftEnd = rightLiftStart + params.liftDropAngle;
    const rightDropEnd = rightEnd;
    const rightDropStart = rightDropEnd - params.liftDropAngle;
    const pureRightStart = rightLiftEnd;
    const pureRightEnd = rightDropStart;

    // BOTTOM-RIGHT transition (quarter circle: down → left)
    const brStart = rightEnd;
    const brEnd = brStart + transitionAngle;

    // BOTTOM HORIZONTAL phase (moving left, contains lift, middle, and drop sub-sections)
    const bottomStart = brEnd;
    const bottomEnd = bottomStart + horizontalAngle;

    // Within bottom horizontal phase:
    // - Lift happens at the beginning (first liftDropAngle degrees)
    // - Drop happens at the end (last liftDropAngle degrees)
    // - Pure horizontal in the middle
    const bottomLiftStart = bottomStart;
    const bottomLiftEnd = bottomLiftStart + params.liftDropAngle;
    const bottomDropEnd = bottomEnd;
    const bottomDropStart = bottomDropEnd - params.liftDropAngle;
    const pureBottomStart = bottomLiftEnd;
    const pureBottomEnd = bottomDropStart;

    // BOTTOM-LEFT transition (quarter circle: left → up)
    const blStart = bottomEnd;
    const blEnd = blStart + transitionAngle;

    // LEFT VERTICAL phase (moving up, contains lift, middle, and drop sub-sections)
    const leftStart = blEnd;
    const leftEnd = leftStart + verticalAngle;

    // Within left vertical phase:
    // - Lift happens at the beginning (first liftDropAngle degrees)
    // - Drop happens at the end (last liftDropAngle degrees)
    // - Pure vertical in the middle
    const leftLiftStart = leftStart;
    const leftLiftEnd = leftLiftStart + params.liftDropAngle;
    const leftDropEnd = leftEnd;
    const leftDropStart = leftDropEnd - params.liftDropAngle;
    const pureLeftStart = leftLiftEnd;
    const pureLeftEnd = leftDropStart;

    // TOP-LEFT transition (quarter circle: up → right)
    const tlStart = leftEnd;
    const tlEnd = tlStart + transitionAngle;

    return {
        horizontal: horizontalAngle,
        vertical: verticalAngle,
        transition: transitionAngle,
        horizontalVx,
        verticalVy,

        topStart,
        topEnd,
        topLiftStart,
        topLiftEnd,
        topDropStart,
        topDropEnd,
        pureTopStart,
        pureTopEnd,
        trStart,
        trEnd,
        rightStart,
        rightEnd,
        rightLiftStart,
        rightLiftEnd,
        rightDropStart,
        rightDropEnd,
        pureRightStart,
        pureRightEnd,
        brStart,
        brEnd,
        bottomStart,
        bottomEnd,
        bottomLiftStart,
        bottomLiftEnd,
        bottomDropStart,
        bottomDropEnd,
        pureBottomStart,
        pureBottomEnd,
        blStart,
        blEnd,
        leftStart,
        leftEnd,
        leftLiftStart,
        leftLiftEnd,
        leftDropStart,
        leftDropEnd,
        pureLeftStart,
        pureLeftEnd,
        tlStart,
        tlEnd
    };
}

/**
 * Get Vx at a specific angle
 */
export function getVxAtAngle(angle) {
    const angles = calculatePhaseAngles();

    // Normalize angle to 0-360
    angle = ((angle % 360) + 360) % 360;

    // TOP HORIZONTAL phase - constant positive Vx (moving right)
    if (angle >= angles.topStart && angle < angles.topEnd) {
        return angles.horizontalVx;
    }

    // TOP-RIGHT transition - Quarter circle: Vx goes from horizontalVx to 0
    // Following cos(θ) where θ: 0° → 90°
    if (angle >= angles.trStart && angle < angles.trEnd) {
        const progress = (angle - angles.trStart) / angles.transition;
        const theta = progress * Math.PI / 2; // 0 to π/2
        return angles.horizontalVx * Math.cos(theta);
    }

    // RIGHT VERTICAL phase - contains lift, pure vertical, and drop sub-sections
    if (angle >= angles.rightStart && angle < angles.rightEnd) {
        // LIFT sub-section - Vx goes 0→+max→0 (ONLY positive, smooth right movement)
        if (angle >= angles.rightLiftStart && angle < angles.rightLiftEnd) {
            const progress = (angle - angles.rightLiftStart) / params.liftDropAngle;
            // Use half sine wave: sin(π*progress) for 0→1→0
            const vxFactor = Math.sin(Math.PI * progress);
            // Calculate max Vx so that displacement is liftHeight
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVx * vxFactor;
        }

        // DROP sub-section - Vx goes 0→-max→0 (ONLY negative, smooth left movement)
        if (angle >= angles.rightDropStart && angle < angles.rightDropEnd) {
            const progress = (angle - angles.rightDropStart) / params.liftDropAngle;
            // Use negative half sine wave: -sin(π*progress) for 0→-1→0
            const vxFactor = -Math.sin(Math.PI * progress);
            // Calculate max Vx (same formula as lift)
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVx * vxFactor;
        }

        // Pure RIGHT VERTICAL sub-section - Vx = 0
        return 0;
    }

    // BOTTOM-RIGHT transition - Quarter circle: Vx goes from 0 to -horizontalVx
    // Following -sin(θ) where θ: 0° → 90°
    if (angle >= angles.brStart && angle < angles.brEnd) {
        const progress = (angle - angles.brStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return -angles.horizontalVx * Math.sin(theta);
    }

    // BOTTOM HORIZONTAL phase - constant negative Vx (moving left)
    if (angle >= angles.bottomStart && angle < angles.bottomEnd) {
        return -angles.horizontalVx;
    }

    // BOTTOM-LEFT transition - Quarter circle: Vx goes from -horizontalVx to 0
    // Following -cos(θ) where θ: 0° → 90°
    if (angle >= angles.blStart && angle < angles.blEnd) {
        const progress = (angle - angles.blStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return -angles.horizontalVx * Math.cos(theta);
    }

    // LEFT VERTICAL phase - contains lift, pure vertical, and drop sub-sections
    if (angle >= angles.leftStart && angle < angles.leftEnd) {
        // LIFT sub-section - Vx goes 0→-max→0 (ONLY negative, smooth left movement)
        if (angle >= angles.leftLiftStart && angle < angles.leftLiftEnd) {
            const progress = (angle - angles.leftLiftStart) / params.liftDropAngle;
            // Use negative half sine wave: -sin(π*progress) for 0→-1→0
            const vxFactor = -Math.sin(Math.PI * progress);
            // Calculate max Vx so that displacement is liftHeight
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVx * vxFactor;
        }

        // DROP sub-section - Vx goes 0→+max→0 (ONLY positive, smooth right movement)
        if (angle >= angles.leftDropStart && angle < angles.leftDropEnd) {
            const progress = (angle - angles.leftDropStart) / params.liftDropAngle;
            // Use positive half sine wave: sin(π*progress) for 0→+1→0
            const vxFactor = Math.sin(Math.PI * progress);
            // Calculate max Vx (same formula as lift)
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVx * vxFactor;
        }

        // Pure LEFT VERTICAL sub-section - Vx = 0
        return 0;
    }

    // TOP-LEFT transition - Quarter circle: Vx goes from 0 to horizontalVx
    // Following sin(θ) where θ: 0° → 90°
    if (angle >= angles.tlStart && angle < angles.tlEnd) {
        const progress = (angle - angles.tlStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return angles.horizontalVx * Math.sin(theta);
    }

    return angles.horizontalVx;
}

/**
 * Get Vy at a specific angle
 */
export function getVyAtAngle(angle) {
    const angles = calculatePhaseAngles();

    // Normalize angle to 0-360
    angle = ((angle % 360) + 360) % 360;

    // TOP HORIZONTAL phase - contains lift, pure horizontal, and drop sub-sections
    if (angle >= angles.topStart && angle < angles.topEnd) {
        // LIFT sub-section - Vy goes 0→+max→0 (ONLY positive, smooth rise)
        if (angle >= angles.topLiftStart && angle < angles.topLiftEnd) {
            const progress = (angle - angles.topLiftStart) / params.liftDropAngle;
            // Use half sine wave: sin(π*progress) for 0→1→0
            const vyFactor = Math.sin(Math.PI * progress);
            // Calculate max Vy so that displacement is liftHeight
            // Integral of sin(πt) from 0 to 1 is 2/π
            // So displacement = maxVy * liftAngle * (2/π)
            // Therefore: maxVy = liftHeight * π / (2 * liftAngle)
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVy * vyFactor;
        }

        // DROP sub-section - Vy goes 0→-max→0 (ONLY negative, smooth drop)
        if (angle >= angles.topDropStart && angle < angles.topDropEnd) {
            const progress = (angle - angles.topDropStart) / params.liftDropAngle;
            // Use negative half sine wave: -sin(π*progress) for 0→-1→0
            const vyFactor = -Math.sin(Math.PI * progress);
            // Calculate max Vy (same formula as lift)
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVy * vyFactor;
        }

        // Pure TOP HORIZONTAL sub-section - Vy = 0
        return 0;
    }

    // TOP-RIGHT transition - Quarter circle: Vy goes from 0 to -verticalVy
    // Following -sin(θ) where θ: 0° → 90°
    if (angle >= angles.trStart && angle < angles.trEnd) {
        const progress = (angle - angles.trStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return -angles.verticalVy * Math.sin(theta);
    }

    // RIGHT VERTICAL phase - constant negative Vy (moving down)
    if (angle >= angles.rightStart && angle < angles.rightEnd) {
        return -angles.verticalVy;
    }

    // BOTTOM-RIGHT transition - Quarter circle: Vy goes from -verticalVy to 0
    // Following -cos(θ) where θ: 0° → 90°
    if (angle >= angles.brStart && angle < angles.brEnd) {
        const progress = (angle - angles.brStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return -angles.verticalVy * Math.cos(theta);
    }

    // BOTTOM HORIZONTAL phase - contains lift, pure horizontal, and drop sub-sections
    if (angle >= angles.bottomStart && angle < angles.bottomEnd) {
        // LIFT sub-section - Vy goes 0→-max→0 (ONLY negative, smooth down movement)
        if (angle >= angles.bottomLiftStart && angle < angles.bottomLiftEnd) {
            const progress = (angle - angles.bottomLiftStart) / params.liftDropAngle;
            // Use negative half sine wave: -sin(π*progress) for 0→-1→0
            const vyFactor = -Math.sin(Math.PI * progress);
            // Calculate max Vy so that displacement is liftHeight
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVy * vyFactor;
        }

        // DROP sub-section - Vy goes 0→+max→0 (ONLY positive, smooth up movement)
        if (angle >= angles.bottomDropStart && angle < angles.bottomDropEnd) {
            const progress = (angle - angles.bottomDropStart) / params.liftDropAngle;
            // Use positive half sine wave: sin(π*progress) for 0→+1→0
            const vyFactor = Math.sin(Math.PI * progress);
            // Calculate max Vy (same formula as lift)
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            return maxVy * vyFactor;
        }

        // Pure BOTTOM HORIZONTAL sub-section - Vy = 0
        return 0;
    }

    // BOTTOM-LEFT transition - Quarter circle: Vy goes from 0 to verticalVy
    // Following sin(θ) where θ: 0° → 90°
    if (angle >= angles.blStart && angle < angles.blEnd) {
        const progress = (angle - angles.blStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return angles.verticalVy * Math.sin(theta);
    }

    // LEFT VERTICAL phase - constant positive Vy (moving up)
    if (angle >= angles.leftStart && angle < angles.leftEnd) {
        return angles.verticalVy;
    }

    // TOP-LEFT transition - Quarter circle: Vy goes from verticalVy to 0
    // Following cos(θ) where θ: 0° → 90°
    if (angle >= angles.tlStart && angle < angles.tlEnd) {
        const progress = (angle - angles.tlStart) / angles.transition;
        const theta = progress * Math.PI / 2;
        return angles.verticalVy * Math.cos(theta);
    }

    return 0;
}

/**
 * Get Sx (horizontal displacement) at a specific angle
 */
export function getSxAtAngle(angle) {
    const angles = calculatePhaseAngles();

    // Normalize angle to 0-360
    angle = ((angle % 360) + 360) % 360;

    let sx = 0;

    // TOP HORIZONTAL phase
    if (angle >= angles.topStart && angle < angles.topEnd) {
        return angles.horizontalVx * angle;
    }
    if (angle >= angles.topEnd) {
        sx = angles.horizontalVx * angles.horizontal;
    }

    // TOP-RIGHT transition
    if (angle >= angles.trStart && angle < angles.trEnd) {
        const angleInPhase = angle - angles.trStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vx = horizontalVx * cos(θ)
        const transitionSx = angles.horizontalVx * (angles.transition / (Math.PI / 2)) * Math.sin(theta);
        return sx + transitionSx;
    }
    if (angle >= angles.trEnd) {
        const transitionSx = angles.horizontalVx * (angles.transition / (Math.PI / 2));
        sx += transitionSx;
    }

    // RIGHT VERTICAL phase - contains lift, pure vertical, and drop sub-sections
    if (angle >= angles.rightStart && angle < angles.rightEnd) {
        let rightSx = 0;

        // LIFT sub-section - object moves right to liftHeight
        if (angle >= angles.rightLiftStart && angle < angles.rightLiftEnd) {
            const angleInPhase = angle - angles.rightLiftStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Integrate Vx = maxVx * sin(π*t)
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            rightSx = maxVx * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            return sx + rightSx;
        }
        if (angle >= angles.rightLiftEnd) {
            // At end of lift, displacement = liftHeight (moved right)
            rightSx = params.liftHeight;
        }

        // DROP sub-section - object moves left back from liftHeight to 0
        if (angle >= angles.rightDropStart && angle < angles.rightDropEnd) {
            const angleInPhase = angle - angles.rightDropStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Start at liftHeight, move left back
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            const dropDisplacement = maxVx * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            rightSx = params.liftHeight - dropDisplacement;
            return sx + rightSx;
        }

        return sx + rightSx;
    }

    // BOTTOM-RIGHT transition
    if (angle >= angles.brStart && angle < angles.brEnd) {
        const angleInPhase = angle - angles.brStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vx = -horizontalVx * sin(θ)
        const transitionSx = -angles.horizontalVx * (angles.transition / (Math.PI / 2)) * (1 - Math.cos(theta));
        return sx + transitionSx;
    }
    if (angle >= angles.brEnd) {
        const transitionSx = -angles.horizontalVx * (angles.transition / (Math.PI / 2));
        sx += transitionSx;
    }

    // BOTTOM HORIZONTAL phase
    if (angle >= angles.bottomStart && angle < angles.bottomEnd) {
        const angleInPhase = angle - angles.bottomStart;
        return sx + (-angles.horizontalVx) * angleInPhase;
    }
    if (angle >= angles.bottomEnd) {
        sx += (-angles.horizontalVx) * angles.horizontal;
    }

    // BOTTOM-LEFT transition
    if (angle >= angles.blStart && angle < angles.blEnd) {
        const angleInPhase = angle - angles.blStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vx = -horizontalVx * cos(θ)
        const transitionSx = -angles.horizontalVx * (angles.transition / (Math.PI / 2)) * Math.sin(theta);
        return sx + transitionSx;
    }
    if (angle >= angles.blEnd) {
        const transitionSx = -angles.horizontalVx * (angles.transition / (Math.PI / 2));
        sx += transitionSx;
    }

    // LEFT VERTICAL phase - contains lift, pure vertical, and drop sub-sections
    if (angle >= angles.leftStart && angle < angles.leftEnd) {
        let leftSx = 0;

        // LIFT sub-section - object moves left to -liftHeight
        if (angle >= angles.leftLiftStart && angle < angles.leftLiftEnd) {
            const angleInPhase = angle - angles.leftLiftStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Integrate Vx = -maxVx * sin(π*t)
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            leftSx = -maxVx * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            return sx + leftSx;
        }
        if (angle >= angles.leftLiftEnd) {
            // At end of lift, displacement = -liftHeight (moved left)
            leftSx = -params.liftHeight;
        }

        // DROP sub-section - object moves right back from -liftHeight to 0
        if (angle >= angles.leftDropStart && angle < angles.leftDropEnd) {
            const angleInPhase = angle - angles.leftDropStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Start at -liftHeight, move right back
            const maxVx = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            const dropDisplacement = maxVx * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            leftSx = -params.liftHeight + dropDisplacement;
            return sx + leftSx;
        }

        return sx + leftSx;
    }

    // TOP-LEFT transition
    if (angle >= angles.tlStart && angle < angles.tlEnd) {
        const angleInPhase = angle - angles.tlStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vx = horizontalVx * sin(θ)
        const transitionSx = angles.horizontalVx * (angles.transition / (Math.PI / 2)) * (1 - Math.cos(theta));
        return sx + transitionSx;
    }

    return sx;
}

/**
 * Get Sy (vertical displacement) at a specific angle
 */
export function getSyAtAngle(angle) {
    const angles = calculatePhaseAngles();

    // Normalize angle to 0-360
    angle = ((angle % 360) + 360) % 360;

    let sy = 0;

    // TOP HORIZONTAL phase - contains lift, pure horizontal, and drop sub-sections
    if (angle >= angles.topStart && angle < angles.topEnd) {
        let topSy = 0;

        // LIFT sub-section - object rises to liftHeight
        if (angle >= angles.topLiftStart && angle < angles.topLiftEnd) {
            const angleInPhase = angle - angles.topLiftStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Integrate Vy = maxVy * sin(π*t)
            // Integral of sin(π*t) dt = -cos(π*t)/π
            // From 0 to progress: [-cos(π*progress)/π] - [-cos(0)/π] = [1 - cos(π*progress)]/π
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            topSy = maxVy * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            return topSy;
        }
        if (angle >= angles.topLiftEnd) {
            // At end of lift, displacement = liftHeight
            // Integral from 0 to 1: (1 - cos(π))/π = (1 - (-1))/π = 2/π
            // Net displacement: maxVy * liftAngle * 2/π = liftHeight
            topSy = params.liftHeight;
        }

        // DROP sub-section - object drops back down from liftHeight to 0
        if (angle >= angles.topDropStart && angle < angles.topDropEnd) {
            const angleInPhase = angle - angles.topDropStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Start at liftHeight, drop down
            // Integrate Vy = -maxVy * sin(π*t)
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            const dropDisplacement = maxVy * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            topSy = params.liftHeight - dropDisplacement;
            return topSy;
        }

        return topSy;
    }

    // TOP-RIGHT transition
    if (angle >= angles.trStart && angle < angles.trEnd) {
        const angleInPhase = angle - angles.trStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vy = -verticalVy * sin(θ)
        const transitionSy = -angles.verticalVy * (angles.transition / (Math.PI / 2)) * (1 - Math.cos(theta));
        return transitionSy;
    }
    if (angle >= angles.trEnd) {
        const transitionSy = -angles.verticalVy * (angles.transition / (Math.PI / 2));
        sy += transitionSy;
    }

    // RIGHT VERTICAL phase
    if (angle >= angles.rightStart && angle < angles.rightEnd) {
        const angleInPhase = angle - angles.rightStart;
        return sy + (-angles.verticalVy) * angleInPhase;
    }
    if (angle >= angles.rightEnd) {
        sy += (-angles.verticalVy) * angles.vertical;
    }

    // BOTTOM-RIGHT transition
    if (angle >= angles.brStart && angle < angles.brEnd) {
        const angleInPhase = angle - angles.brStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vy = -verticalVy * cos(θ)
        const transitionSy = -angles.verticalVy * (angles.transition / (Math.PI / 2)) * Math.sin(theta);
        return sy + transitionSy;
    }
    if (angle >= angles.brEnd) {
        const transitionSy = -angles.verticalVy * (angles.transition / (Math.PI / 2));
        sy += transitionSy;
    }

    // BOTTOM HORIZONTAL phase - contains lift, pure horizontal, and drop sub-sections
    if (angle >= angles.bottomStart && angle < angles.bottomEnd) {
        let bottomSy = 0;

        // LIFT sub-section - object moves down to -liftHeight
        if (angle >= angles.bottomLiftStart && angle < angles.bottomLiftEnd) {
            const angleInPhase = angle - angles.bottomLiftStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Integrate Vy = -maxVy * sin(π*t)
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            bottomSy = -maxVy * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            return sy + bottomSy;
        }
        if (angle >= angles.bottomLiftEnd) {
            // At end of lift, displacement = -liftHeight (moved down)
            bottomSy = -params.liftHeight;
        }

        // DROP sub-section - object moves up back from -liftHeight to 0
        if (angle >= angles.bottomDropStart && angle < angles.bottomDropEnd) {
            const angleInPhase = angle - angles.bottomDropStart;
            const progress = angleInPhase / params.liftDropAngle;
            // Start at -liftHeight, move up back
            const maxVy = (Math.PI * params.liftHeight) / (2 * params.liftDropAngle);
            const dropDisplacement = maxVy * params.liftDropAngle * (1 - Math.cos(Math.PI * progress)) / Math.PI;
            bottomSy = -params.liftHeight + dropDisplacement;
            return sy + bottomSy;
        }

        return sy + bottomSy;
    }

    // BOTTOM-LEFT transition
    if (angle >= angles.blStart && angle < angles.blEnd) {
        const angleInPhase = angle - angles.blStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vy = verticalVy * sin(θ)
        const transitionSy = angles.verticalVy * (angles.transition / (Math.PI / 2)) * (1 - Math.cos(theta));
        return sy + transitionSy;
    }
    if (angle >= angles.blEnd) {
        const transitionSy = angles.verticalVy * (angles.transition / (Math.PI / 2));
        sy += transitionSy;
    }

    // LEFT VERTICAL phase
    if (angle >= angles.leftStart && angle < angles.leftEnd) {
        const angleInPhase = angle - angles.leftStart;
        return sy + angles.verticalVy * angleInPhase;
    }
    if (angle >= angles.leftEnd) {
        sy += angles.verticalVy * angles.vertical;
    }

    // TOP-LEFT transition
    if (angle >= angles.tlStart && angle < angles.tlEnd) {
        const angleInPhase = angle - angles.tlStart;
        const progress = angleInPhase / angles.transition;
        const theta = progress * Math.PI / 2;
        // Integrate Vy = verticalVy * cos(θ)
        const transitionSy = angles.verticalVy * (angles.transition / (Math.PI / 2)) * Math.sin(theta);
        return sy + transitionSy;
    }

    return sy;
}

/**
 * Get Ax (horizontal acceleration) at a specific angle using numerical derivative
 */
export function getAxAtAngle(angle) {
    const delta = 0.1;
    const vx1 = getVxAtAngle(angle - delta);
    const vx2 = getVxAtAngle(angle + delta);
    return (vx2 - vx1) / (2 * delta);
}

/**
 * Get Ay (vertical acceleration) at a specific angle using numerical derivative
 */
export function getAyAtAngle(angle) {
    const delta = 0.1;
    const vy1 = getVyAtAngle(angle - delta);
    const vy2 = getVyAtAngle(angle + delta);
    return (vy2 - vy1) / (2 * delta);
}

/**
 * Get Jx (horizontal jerk) at a specific angle using numerical derivative
 */
export function getJxAtAngle(angle) {
    const delta = 0.1;
    const ax1 = getAxAtAngle(angle - delta);
    const ax2 = getAxAtAngle(angle + delta);
    return (ax2 - ax1) / (2 * delta);
}

/**
 * Get Jy (vertical jerk) at a specific angle using numerical derivative
 */
export function getJyAtAngle(angle) {
    const delta = 0.1;
    const ay1 = getAyAtAngle(angle - delta);
    const ay2 = getAyAtAngle(angle + delta);
    return (ay2 - ay1) / (2 * delta);
}

/**
 * Calculate fixed point position based on output point, R1, R2, and fixedPointDistance
 *
 * Linkage geometry:
 * - R1 arm: From origin (0,0) to output point
 * - R2 arm: From output point to a fixed pivot (length R2)
 * - Fixed point: On R2 arm at distance fixedPointDistance from output point
 *
 * For a 2-bar linkage, we place the fixed pivot along the radial direction
 */
export function calculateFixedPoint(sx, sy) {
    // Output point position (from origin)
    const outputX = sx;
    const outputY = sy;

    // Distance from origin to output point
    const r1Distance = Math.sqrt(outputX * outputX + outputY * outputY);

    // If output point is at origin, can't calculate fixed point
    if (r1Distance === 0) {
        return { fixedX: 0, fixedY: 0, pivotX: 0, pivotY: 0 };
    }

    // Unit vector from origin to output point (along R1 arm direction)
    const r1UnitX = outputX / r1Distance;
    const r1UnitY = outputY / r1Distance;

    // Fixed pivot is at distance R2b from output point, along R1 direction
    // (This creates a radial 2-bar linkage)
    const fixedPivotX = outputX + r1UnitX * params.R2b;
    const fixedPivotY = outputY + r1UnitY * params.R2b;

    // Fixed point is at fixedPointDistance from output point, along R2 arm (same direction)
    const fixedX = outputX + r1UnitX * params.fixedPointDistance;
    const fixedY = outputY + r1UnitY * params.fixedPointDistance;

    return {
        fixedX,
        fixedY,
        pivotX: fixedPivotX,
        pivotY: fixedPivotY
    };
}

/**
 * Calculate displacement for all angles (0-360)
 */
export function calculateDisplacement() {
    const displacements = [];

    for (let angle = 0; angle <= 360; angle++) {
        const sx = getSxAtAngle(angle) * params.sxScale;
        const sy = getSyAtAngle(angle) * params.syScale;
        const vx = getVxAtAngle(angle) * params.vxScale;
        const vy = getVyAtAngle(angle) * params.vyScale;
        const ax = getAxAtAngle(angle) * params.axScale;
        const ay = getAyAtAngle(angle) * params.ayScale;
        const jx = getJxAtAngle(angle) * params.jxScale;
        const jy = getJyAtAngle(angle) * params.jyScale;

        // Calculate fixed point position
        const { fixedX, fixedY, pivotX, pivotY } = calculateFixedPoint(sx, sy);

        displacements.push({
            angle,
            sx,
            sy,
            vx,
            vy,
            ax,
            ay,
            jx,
            jy,
            fixedX,
            fixedY,
            pivotX,
            pivotY
        });
    }

    return displacements;
}
