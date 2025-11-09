import { params } from './params.js';

// Smooth transition function (quintic polynomial)
export function smoothTransition(t) {
    return 6 * t * t * t * t * t - 15 * t * t * t * t + 10 * t * t * t;
}

// Integral of smooth transition function from 0 to t
// ∫[0 to t] smoothTransition(τ) dτ = t⁶ - 3t⁵ + 2.5t⁴
export function smoothTransitionIntegral(t) {
    return t * t * t * t * t * t - 3 * t * t * t * t * t + 2.5 * t * t * t * t;
}

// Smooth symmetric curve function (peaks at t=0.5)
export function smoothSymmetricCurve(t) {
    return 16 * t * t * (1 - t) * (1 - t);
}

// Integral of smooth symmetric curve function from 0 to t
// ∫[0 to t] 16τ²(1-τ)² dτ = 8t³/3 - 4t⁴ + 8t⁵/5
export function smoothSymmetricCurveIntegral(t) {
    return (8 * t * t * t) / 3 - 4 * t * t * t * t + (8 * t * t * t * t * t) / 5;
}

// Calculate phase angles
export function calculatePhaseAngles() {
    // Enforce constraint: liftDropAngle must be larger than transitionAngle
    const liftDropAngle = Math.max(params.liftDropAngle, params.transitionAngle + 1);
    const dropAngle = liftDropAngle;
    const stanceAngle = params.stanceAngle;
    const liftAngle = liftDropAngle;
    const transAngle = params.transitionAngle;

    // Layout: STANCE → LIFT → SWING → DROP → STANCE
    // STANCE starts at 0°
    const stanceStart = 0;
    const stanceEnd = stanceAngle;

    // LIFT comes after STANCE
    const liftStart = stanceEnd;
    const liftEnd = liftStart + liftAngle;

    // VX transition should be centered within LIFT
    const trans1Center = liftStart + liftAngle / 2;
    const trans1Start = trans1Center - transAngle / 2;
    const trans1End = trans1Center + transAngle / 2;

    // Calculate SWING angle: what's left after STANCE, LIFT, and DROP
    const swingAngle = 360 - stanceAngle - liftAngle - dropAngle;

    // SWING comes after LIFT
    const swingStart = liftEnd;
    const swingEnd = swingStart + swingAngle;

    // DROP comes after SWING
    const dropStart = swingEnd;
    const dropEnd = dropStart + dropAngle;

    // VX transition 2 should be centered within DROP
    const trans2Center = dropStart + dropAngle / 2;
    const trans2Start = trans2Center - transAngle / 2;
    const trans2End = trans2Center + transAngle / 2;

    return {
        drop: dropAngle, stance: stanceAngle, lift: liftAngle, swing: swingAngle,
        dropStart, dropEnd, stanceStart, stanceEnd,
        liftStart, liftEnd, swingStart, swingEnd
    };
}

// Calculate VX angles
export function calculateVxAngles() {
    const angles = calculatePhaseAngles();
    const transAngle = params.transitionAngle;

    // VX transitions are centered at the midpoints of LIFT and DROP (where VY peaks)
    const liftMidpoint = angles.liftStart + angles.lift / 2;
    const dropMidpoint = angles.dropStart + angles.drop / 2;

    // Transition 1: centered at LIFT midpoint (where VY peaks)
    const trans1Start = liftMidpoint - transAngle / 2;
    const trans1End = liftMidpoint + transAngle / 2;

    // Transition 2: centered at DROP midpoint (where VY peaks)
    const trans2Start = dropMidpoint - transAngle / 2;
    const trans2End = dropMidpoint + transAngle / 2;

    // Forward section: from trans2End (wrapping) to trans1Start
    const forwardStart = 0;
    const forwardEnd = trans1Start;
    const forwardAngle = (360 - trans2End) + trans1Start;

    // Return section: from trans1End to trans2Start
    const returnStart = trans1End;
    const returnEnd = trans2Start;
    const returnAngle = returnEnd - returnStart;

    return {
        forward: forwardAngle, transition1: transAngle,
        return: returnAngle, transition2: transAngle,
        forwardStart, forwardEnd, trans1Start, trans1End,
        returnStart, returnEnd, trans2Start, trans2End
    };
}

// Calculate return VX
export function calculateReturnVx() {
    const vxAngles = calculateVxAngles();
    const totalDisplacement =
        params.forwardVx * vxAngles.forward +
        (params.forwardVx) * params.transitionAngle +
        0 * vxAngles.return;

    const returnVx = -totalDisplacement / (vxAngles.return + params.transitionAngle);
    return returnVx;
}

// Get VX at angle
export function getVxAtAngle(angle) {
    const vxAngles = calculateVxAngles();
    const returnVx = calculateReturnVx();

    // Forward section: from 0° to trans1Start, and from trans2End to 360°
    if ((angle >= 0 && angle < vxAngles.trans1Start) || (angle >= vxAngles.trans2End && angle <= 360)) {
        return params.forwardVx;
    }
    // Transition 1: forward → return (centered at LIFT midpoint)
    else if (angle >= vxAngles.trans1Start && angle < vxAngles.trans1End) {
        const progress = (angle - vxAngles.trans1Start) / vxAngles.transition1;
        const t = smoothTransition(progress);
        return params.forwardVx + t * (returnVx - params.forwardVx);
    }
    // Return section: from trans1End to trans2Start
    else if (angle >= vxAngles.trans1End && angle < vxAngles.trans2Start) {
        return returnVx;
    }
    // Transition 2: return → forward (centered at DROP midpoint)
    else if (angle >= vxAngles.trans2Start && angle < vxAngles.trans2End) {
        const progress = (angle - vxAngles.trans2Start) / vxAngles.transition2;
        const t = smoothTransition(progress);
        return returnVx + t * (params.forwardVx - returnVx);
    }

    return 0;
}

// Get VY at angle
export function getVyAtAngle(angle) {
    const angles = calculatePhaseAngles();
    const vxAngles = calculateVxAngles();

    // LIFT phase - VY curve centered at VX transition center (where VX = 0)
    if (angle >= angles.liftStart && angle < angles.liftEnd) {
        const trans1Center = vxAngles.trans1Start + vxAngles.transition1 / 2;

        // Center the symmetric curve at trans1Center
        const halfLiftAngle = angles.lift / 2;
        const angleFromCenter = angle - trans1Center;
        const normalizedProgress = (angleFromCenter + halfLiftAngle) / angles.lift;

        const symmetricValue = smoothSymmetricCurve(normalizedProgress);
        return params.liftVy * symmetricValue;
    }

    // DROP phase - VY curve centered at VX transition center (where VX = 0)
    if (angle >= angles.dropStart && angle < angles.dropEnd) {
        const trans2Center = vxAngles.trans2Start + vxAngles.transition2 / 2;

        // Center the symmetric curve at trans2Center
        const halfDropAngle = angles.drop / 2;
        const angleFromCenter = angle - trans2Center;
        const normalizedProgress = (angleFromCenter + halfDropAngle) / angles.drop;

        const symmetricValue = smoothSymmetricCurve(normalizedProgress);
        return -params.liftVy * symmetricValue;
    }

    // STANCE phase - VY is 0
    if (angle >= angles.stanceStart && angle < angles.stanceEnd) {
        return 0;
    }

    // SWING phase - symmetric up and down motion
    if (angle >= angles.swingStart && angle < angles.swingEnd) {
        const swingProgress = (angle - angles.swingStart) / angles.swing;

        // First half: 0 → max → 0 (using symmetric curve)
        // Second half: 0 → -max → 0 (using negative symmetric curve)
        if (swingProgress < 0.5) {
            // First half: normalize to 0-1
            const t = swingProgress / 0.5;
            const symmetricValue = smoothSymmetricCurve(t);
            return params.swingDisplacement * symmetricValue;
        } else {
            // Second half: normalize to 0-1
            const t = (swingProgress - 0.5) / 0.5;
            const symmetricValue = smoothSymmetricCurve(t);
            return -params.swingDisplacement * symmetricValue;
        }
    }

    return 0;
}

// Calculate SX (horizontal displacement) at angle
export function getSxAtAngle(angle) {
    const vxAngles = calculateVxAngles();
    const returnVx = calculateReturnVx();
    const forwardVx = params.forwardVx;
    const transAngle = params.transitionAngle;

    let sx = 0;

    // Forward section at start (0° to trans1Start)
    if (angle >= 0 && angle < vxAngles.trans1Start) {
        return forwardVx * angle;
    }

    // Transition 1 (forward → return, centered at LIFT midpoint)
    if (angle >= vxAngles.trans1Start && angle < vxAngles.trans1End) {
        sx = forwardVx * vxAngles.trans1Start;
        const angleInTrans = angle - vxAngles.trans1Start;
        const t = angleInTrans / transAngle;
        sx += transAngle * (forwardVx * t + smoothTransitionIntegral(t) * (returnVx - forwardVx));
        return sx;
    }

    // SX at end of transition 1
    sx = forwardVx * vxAngles.trans1Start;
    sx += transAngle * (forwardVx + smoothTransitionIntegral(1) * (returnVx - forwardVx));

    // Return section (trans1End to trans2Start)
    if (angle >= vxAngles.trans1End && angle < vxAngles.trans2Start) {
        const angleInReturn = angle - vxAngles.trans1End;
        sx += returnVx * angleInReturn;
        return sx;
    }

    // SX at end of return section
    sx += returnVx * vxAngles.return;

    // Transition 2 (return → forward, centered at DROP midpoint)
    if (angle >= vxAngles.trans2Start && angle < vxAngles.trans2End) {
        const angleInTrans = angle - vxAngles.trans2Start;
        const t = angleInTrans / transAngle;
        sx += transAngle * (returnVx * t + smoothTransitionIntegral(t) * (forwardVx - returnVx));
        return sx;
    }

    // SX at end of transition 2
    sx += transAngle * (returnVx + smoothTransitionIntegral(1) * (forwardVx - returnVx));

    // Forward section at end (trans2End to 360°)
    if (angle >= vxAngles.trans2End && angle <= 360) {
        const angleInForward = angle - vxAngles.trans2End;
        sx += forwardVx * angleInForward;
        return sx;
    }

    return sx;
}

// Calculate SY (vertical displacement) at angle
export function getSyAtAngle(angle) {
    const angles = calculatePhaseAngles();
    const vxAngles = calculateVxAngles();

    let sy = 0;

    // STANCE phase - no vertical displacement
    if (angle >= angles.stanceStart && angle < angles.stanceEnd) {
        return 0;
    }

    // LIFT phase - integrate the VY curve
    if (angle >= angles.liftStart && angle < angles.liftEnd) {
        const trans1Center = vxAngles.trans1Start + vxAngles.transition1 / 2;
        const halfLiftAngle = angles.lift / 2;
        const angleFromCenter = angle - trans1Center;
        const normalizedProgress = (angleFromCenter + halfLiftAngle) / angles.lift;

        const integralValue = smoothSymmetricCurveIntegral(normalizedProgress);
        return params.liftVy * angles.lift * integralValue;
    }

    // SY at end of LIFT
    sy = params.liftVy * angles.lift * smoothSymmetricCurveIntegral(1);

    // SWING phase - symmetric up and down displacement
    if (angle >= angles.swingStart && angle < angles.swingEnd) {
        const swingProgress = (angle - angles.swingStart) / angles.swing;

        if (swingProgress < 0.5) {
            // First half: integrate symmetric curve from 0 to t
            const t = swingProgress / 0.5;
            const integralValue = smoothSymmetricCurveIntegral(t);
            const swingSy = params.swingDisplacement * (angles.swing / 2) * integralValue;
            return sy + swingSy;
        } else {
            // Second half: max displacement minus integral of negative curve
            const maxSwingSy = params.swingDisplacement * (angles.swing / 2) * smoothSymmetricCurveIntegral(1);
            const t = (swingProgress - 0.5) / 0.5;
            const integralValue = smoothSymmetricCurveIntegral(t);
            const swingSy = maxSwingSy - params.swingDisplacement * (angles.swing / 2) * integralValue;
            return sy + swingSy;
        }
    }

    // SY at end of SWING - should return to starting height
    // (no net displacement change after complete swing cycle)

    // DROP phase - integrate negative VY curve
    if (angle >= angles.dropStart && angle < angles.dropEnd) {
        const trans2Center = vxAngles.trans2Start + vxAngles.transition2 / 2;
        const halfDropAngle = angles.drop / 2;
        const angleFromCenter = angle - trans2Center;
        const normalizedProgress = (angleFromCenter + halfDropAngle) / angles.drop;

        const integralValue = smoothSymmetricCurveIntegral(normalizedProgress);
        return sy - params.liftVy * angles.drop * integralValue;
    }

    return 0;
}

// Calculate displacement for all angles
export function calculateDisplacement() {
    const displacements = [];
    for (let angle = 0; angle <= 360; angle++) {
        const sx = getSxAtAngle(angle);
        const sy = getSyAtAngle(angle);
        displacements.push({ angle, sx, sy });
    }
    return displacements;
}

// Calculate acceleration numerically (derivative of velocity)
export function calculateAcceleration() {
    const dt = 0.1;
    const accelerations = [];

    for (let angle = 0; angle <= 360; angle++) {
        const vx1 = getVxAtAngle(Math.max(0, angle - dt));
        const vx2 = getVxAtAngle(Math.min(360, angle + dt));
        const ax = (vx2 - vx1) / (2 * dt) * params.axScale;

        const vy1 = getVyAtAngle(Math.max(0, angle - dt));
        const vy2 = getVyAtAngle(Math.min(360, angle + dt));
        const ay = (vy2 - vy1) / (2 * dt) * params.ayScale;

        accelerations.push({ angle, ax, ay });
    }
    return accelerations;
}

// Calculate jerk numerically (derivative of acceleration)
export function calculateJerk() {
    const dt = 0.1;
    const jerks = [];

    for (let angle = 0; angle <= 360; angle++) {
        // Calculate ax at angle - dt and angle + dt
        const vx1a = getVxAtAngle(Math.max(0, angle - dt - dt));
        const vx1b = getVxAtAngle(Math.max(0, angle - dt + dt));
        const ax1 = (vx1b - vx1a) / (2 * dt);

        const vx2a = getVxAtAngle(Math.min(360, angle + dt - dt));
        const vx2b = getVxAtAngle(Math.min(360, angle + dt + dt));
        const ax2 = (vx2b - vx2a) / (2 * dt);

        const jx = (ax2 - ax1) / (2 * dt) * params.jxScale;

        // Same for jy
        const vy1a = getVyAtAngle(Math.max(0, angle - dt - dt));
        const vy1b = getVyAtAngle(Math.max(0, angle - dt + dt));
        const ay1 = (vy1b - vy1a) / (2 * dt);

        const vy2a = getVyAtAngle(Math.min(360, angle + dt - dt));
        const vy2b = getVyAtAngle(Math.min(360, angle + dt + dt));
        const ay2 = (vy2b - vy2a) / (2 * dt);

        const jy = (ay2 - ay1) / (2 * dt) * params.jyScale;

        jerks.push({ angle, jx, jy });
    }
    return jerks;
}
