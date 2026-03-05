/**
 * Self-Powered Long Range Linear Motion Mechanism
 * Motion equations for Point A (foot locus)
 *
 * Phases:
 *   - Stance: Foot grips, body advances (Vx = k constant, Vy = 0)
 *   - Lift: Foot ascends (Vy positive), Vx transitions from forward to return
 *   - Swing: Foot returns forward (Vx negative/return velocity, Vy = 0)
 *   - Drop: Foot descends (Vy negative), Vx transitions from return to forward
 *
 * Transition options:
 *   - 'quintic': Quintic polynomial h(s) = 10s³ - 15s⁴ + 6s⁵
 *   - 'sine': Sine wave transition
 *
 * Key constraint: Net horizontal displacement = 0 over full cycle
 */

// =============================================
// TRANSITION FUNCTIONS
// =============================================

/**
 * Quintic smooth step: h(s) = 10s³ - 15s⁴ + 6s⁵
 * h(0) = 0, h(1) = 1, h'(0) = h'(1) = 0, h''(0) = h''(1) = 0
 */
export function quintic(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 1;
    const s3 = s * s * s;
    const s4 = s3 * s;
    const s5 = s4 * s;
    return 10 * s3 - 15 * s4 + 6 * s5;
}

/**
 * Quintic derivative: h'(s) = 30s² - 60s³ + 30s⁴ = 30s²(1-s)²
 * Peak at s = 0.5 with value 1.875
 */
export function quinticDeriv(s) {
    if (s <= 0 || s >= 1) return 0;
    const s2 = s * s;
    const s3 = s2 * s;
    const s4 = s3 * s;
    return 30 * s2 - 60 * s3 + 30 * s4;
}

/**
 * Quintic second derivative: h''(s) = 60s - 180s² + 120s³
 */
export function quinticDeriv2(s) {
    if (s <= 0 || s >= 1) return 0;
    const s2 = s * s;
    const s3 = s2 * s;
    return 60 * s - 180 * s2 + 120 * s3;
}

/**
 * Quintic third derivative: h'''(s) = 60 - 360s + 360s²
 */
export function quinticDeriv3(s) {
    if (s <= 0 || s >= 1) return 0;
    return 60 - 360 * s + 360 * s * s;
}

/**
 * Quintic integral: ∫h(s)ds = 2.5s⁴ - 3s⁵ + s⁶
 * H(0) = 0, H(1) = 0.5
 */
export function quinticIntegral(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 0.5;
    const s4 = s * s * s * s;
    const s5 = s4 * s;
    const s6 = s5 * s;
    return 2.5 * s4 - 3 * s5 + s6;
}

/**
 * Sine smooth step: using sin from -π/2 to π/2, normalized to [0,1]
 * sine(0) = 0, sine(1) = 1
 */
export function sineTransition(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 1;
    // Map s from [0,1] to angle from -π/2 to π/2
    const angle = -Math.PI / 2 + Math.PI * s;
    // sin goes from -1 to 1, map to 0 to 1
    return (Math.sin(angle) + 1) / 2;
}

/**
 * Sine transition derivative
 */
export function sineDeriv(s) {
    if (s <= 0 || s >= 1) return 0;
    const angle = -Math.PI / 2 + Math.PI * s;
    // d/ds of (sin(angle) + 1)/2 = cos(angle) * π / 2
    return Math.cos(angle) * Math.PI / 2;
}

/**
 * Sine transition second derivative
 */
export function sineDeriv2(s) {
    if (s <= 0 || s >= 1) return 0;
    const angle = -Math.PI / 2 + Math.PI * s;
    return -Math.sin(angle) * Math.PI * Math.PI / 2;
}

/**
 * Sine transition third derivative
 */
export function sineDeriv3(s) {
    if (s <= 0 || s >= 1) return 0;
    const angle = -Math.PI / 2 + Math.PI * s;
    return -Math.cos(angle) * Math.PI * Math.PI * Math.PI / 2;
}

/**
 * Sine transition integral
 * ∫[(sin(πs - π/2) + 1)/2]ds from 0 to s
 */
export function sineIntegral(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 0.5;
    const angle = -Math.PI / 2 + Math.PI * s;
    // Integral: [-cos(angle)/(π) + s]/2 + C, where C makes it 0 at s=0
    // At s=0: angle=-π/2, cos(-π/2)=0, so integral = [0 + 0]/2 = 0 ✓
    return (-Math.cos(angle) / Math.PI + s) / 2 + 0.5 / Math.PI;
}

/**
 * Smooth symmetric curve: 16s²(1-s)² - peaks at s=0.5 with value 1
 * Used for Vy profile during lift/drop
 * f(0) = 0, f(0.5) = 1, f(1) = 0
 */
export function symmetricCurve(s) {
    if (s < 0) return 0;
    if (s > 1) return 0;
    return 16 * s * s * (1 - s) * (1 - s);
}

/**
 * Symmetric curve derivative
 * f'(s) = 32s(1-s)(1-2s)
 * f'(0) = 0, f'(0.5) = 0, f'(1) = 0
 */
export function symmetricCurveDeriv(s) {
    if (s < 0 || s > 1) return 0;
    return 32 * s * (1 - s) * (1 - 2 * s);
}

/**
 * Symmetric curve second derivative
 * f''(s) = 32(1 - 6s + 6s²)
 */
export function symmetricCurveDeriv2(s) {
    if (s < 0 || s > 1) return 0;
    return 32 * (1 - 6 * s + 6 * s * s);
}

/**
 * Symmetric curve integral: ∫16s²(1-s)²ds
 * Expand: 16s²(1-s)² = 16s² - 32s³ + 16s⁴
 * Integrate: 16s³/3 - 8s⁴ + 16s⁵/5
 * Full integral from 0 to 1 = 16/3 - 8 + 16/5 = 80/15 - 120/15 + 48/15 = 8/15
 */
export function symmetricCurveIntegral(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 8 / 15;
    const s3 = s * s * s;
    const s4 = s3 * s;
    const s5 = s4 * s;
    return 16 * s3 / 3 - 8 * s4 + 16 * s5 / 5;
}

// =============================================
// TRANSITION SELECTOR
// =============================================

/**
 * Get transition functions based on type
 */
export function getTransitionFuncs(type = 'quintic') {
    if (type === 'sine') {
        return {
            blend: sineTransition,
            deriv: sineDeriv,
            deriv2: sineDeriv2,
            deriv3: sineDeriv3,
            integral: sineIntegral,
            fullIntegral: 0.5  // integral from 0 to 1
        };
    }
    // Default: quintic
    return {
        blend: quintic,
        deriv: quinticDeriv,
        deriv2: quinticDeriv2,
        deriv3: quinticDeriv3,
        integral: quinticIntegral,
        fullIntegral: 0.5  // integral from 0 to 1
    };
}

// =============================================
// PHASE CALCULATIONS
// =============================================

/**
 * Calculate phase boundaries
 * Layout: STANCE → LIFT → SWING → DROP → (back to STANCE)
 *
 * Vx = forward (constant) spans: late DROP → STANCE → early LIFT
 * The "overlap" parameter controls how much of Lift/Drop has Vx=forward:
 *   - Vx=forward ENDS at (overlap * liftDrop) into LIFT
 *   - Vx=forward BEGINS at (1 - overlap) * liftDrop into DROP
 *
 * @param {number} stancePercent - Stance phase percentage
 * @param {number} liftDropPercent - Lift = Drop phase percentage each
 * @param {number} overlapPercent - Overlap percentage (how much of lift/drop has Vx=forward)
 * @returns {object} Phase boundaries as fractions of cycle [0, 1]
 */
export function getPhases(stancePercent, liftDropPercent, overlapPercent) {
    const stance = stancePercent / 100;
    const liftDrop = liftDropPercent / 100;
    const overlap = Math.min(overlapPercent / 100, 1);  // Clamp to max 100%

    const swing = 1 - stance - 2 * liftDrop;

    // Phase boundaries
    const stanceEnd = stance;
    const liftEnd = stance + liftDrop;
    const swingEnd = stance + liftDrop + swing;
    const dropEnd = 1; // = stance + liftDrop + swing + liftDrop

    // Vx=forward region:
    //   - ENDS at: stanceEnd + overlap * liftDrop (early in LIFT)
    //   - BEGINS at: swingEnd + (1 - overlap) * liftDrop (late in DROP)
    //
    // Trans1: forward → return, happens in LIFT after the overlap region
    //   - Starts where Vx=forward ends
    //   - Ends at end of LIFT
    //
    // Trans2: return → forward, happens in DROP before the overlap region
    //   - Starts at start of DROP
    //   - Ends where Vx=forward begins

    const vxForwardEnd = stanceEnd + overlap * liftDrop;      // In LIFT
    const vxForwardStart = swingEnd + (1 - overlap) * liftDrop;  // In DROP

    // Transition durations
    const trans1Duration = liftEnd - vxForwardEnd;     // Rest of LIFT after overlap
    const trans2Duration = vxForwardStart - swingEnd;  // Start of DROP until overlap

    return {
        stance,
        liftDrop,
        swing,
        overlap,
        stanceEnd,
        liftEnd,
        swingEnd,
        dropEnd,
        // Vx=forward region boundaries
        vxForwardEnd,      // Where Vx=forward ends (in LIFT)
        vxForwardStart,    // Where Vx=forward begins (in DROP)
        // Transition regions (for compatibility, rename to trans1/trans2)
        trans1Start: vxForwardEnd,
        trans1End: liftEnd,
        trans2Start: swingEnd,
        trans2End: vxForwardStart,
        trans1Duration,
        trans2Duration
    };
}

/**
 * Calculate return velocity for zero net displacement
 *
 * Vx regions:
 *   - Vx=forward: from 0 to vxForwardEnd, and from vxForwardStart to 1
 *   - Trans1: from vxForwardEnd to liftEnd (forward → return)
 *   - Vx=return: from liftEnd to swingEnd
 *   - Trans2: from swingEnd to vxForwardStart (return → forward)
 *
 * For zero net displacement, integral of Vx over cycle = 0
 */
export function calculateReturnVx(phases, vxForward, transitionType = 'quintic') {
    const { vxForwardEnd, vxForwardStart, liftEnd, swingEnd, trans1Duration, trans2Duration } = phases;

    // Forward region time: 0 to vxForwardEnd, and vxForwardStart to 1
    const forwardTime = vxForwardEnd + (1 - vxForwardStart);

    // Return region time: liftEnd to swingEnd
    const returnTime = swingEnd - liftEnd;

    // Transition times
    const T1 = trans1Duration;  // forward → return
    const T2 = trans2Duration;  // return → forward

    // Integral of Vx over cycle = 0
    // = vxForward * forwardTime
    // + integral over trans1 (forward → return)
    // + vxReturn * returnTime
    // + integral over trans2 (return → forward)
    //
    // For a transition from A to B using quintic/sine with integral = 0.5:
    // ∫(A + (B-A)*h(s)) * T * ds = A*T + (B-A)*T*0.5 = T*(A+B)/2
    //
    // Trans1 integral: T1 * (vxForward + vxReturn) / 2
    // Trans2 integral: T2 * (vxReturn + vxForward) / 2
    //
    // Total: vxForward * forwardTime + T1*(vxForward+vxReturn)/2 + vxReturn*returnTime + T2*(vxReturn+vxForward)/2 = 0
    // vxForward * (forwardTime + (T1+T2)/2) + vxReturn * (returnTime + (T1+T2)/2) = 0
    // vxReturn = -vxForward * (forwardTime + (T1+T2)/2) / (returnTime + (T1+T2)/2)

    const transAvg = (T1 + T2) / 2;
    const vxReturn = -vxForward * (forwardTime + transAvg) / (returnTime + transAvg);
    return vxReturn;
}

// =============================================
// VELOCITY FUNCTIONS
// =============================================

/**
 * Get horizontal velocity Vx at time t
 *
 * Timeline:
 *   [0, vxForwardEnd]: Vx = forward
 *   [vxForwardEnd, liftEnd]: Trans1 (forward → return)
 *   [liftEnd, swingEnd]: Vx = return
 *   [swingEnd, vxForwardStart]: Trans2 (return → forward)
 *   [vxForwardStart, 1]: Vx = forward
 */
export function getVx(t, phases, vxForward, transitionType = 'quintic') {
    const { vxForwardEnd, vxForwardStart, liftEnd, swingEnd, trans1Duration, trans2Duration } = phases;
    const funcs = getTransitionFuncs(transitionType);
    const vxReturn = calculateReturnVx(phases, vxForward, transitionType);

    // Normalize t to [0, 1)
    t = ((t % 1) + 1) % 1;

    if (t < vxForwardEnd) {
        // Forward velocity (STANCE + early LIFT)
        return vxForward;
    } else if (t < liftEnd) {
        // Transition 1: forward → return (in LIFT)
        const s = (t - vxForwardEnd) / trans1Duration;
        return vxForward + (vxReturn - vxForward) * funcs.blend(s);
    } else if (t < swingEnd) {
        // Return velocity (SWING)
        return vxReturn;
    } else if (t < vxForwardStart) {
        // Transition 2: return → forward (in DROP)
        const s = (t - swingEnd) / trans2Duration;
        return vxReturn + (vxForward - vxReturn) * funcs.blend(s);
    } else {
        // Forward velocity (late DROP)
        return vxForward;
    }
}

/**
 * Get vertical velocity Vy at time t
 * Vy is active only during Lift and Drop phases
 * Uses symmetric curve: 16s²(1-s)²
 *
 * vyAmp is the peak velocity (at s=0.5 where symmetricCurve = 1)
 */
export function getVy(t, phases, vyAmp) {
    const { stanceEnd, liftEnd, swingEnd, liftDrop } = phases;

    // Normalize t to [0, 1)
    t = ((t % 1) + 1) % 1;

    if (t < stanceEnd) {
        // Stance: Vy = 0
        return 0;
    } else if (t < liftEnd) {
        // Lift: Vy positive (ascending)
        const s = (t - stanceEnd) / liftDrop;
        return vyAmp * symmetricCurve(s);
    } else if (t < swingEnd) {
        // Swing: Vy = 0
        return 0;
    } else {
        // Drop: Vy negative (descending)
        const s = (t - swingEnd) / liftDrop;
        return -vyAmp * symmetricCurve(s);
    }
}

// =============================================
// ACCELERATION FUNCTIONS
// =============================================

/**
 * Get horizontal acceleration Ax at time t
 */
export function getAx(t, phases, vxForward, transitionType = 'quintic') {
    const { vxForwardEnd, vxForwardStart, liftEnd, swingEnd, trans1Duration, trans2Duration } = phases;
    const funcs = getTransitionFuncs(transitionType);
    const vxReturn = calculateReturnVx(phases, vxForward, transitionType);

    t = ((t % 1) + 1) % 1;

    if (t < vxForwardEnd) {
        // Forward region - no acceleration
        return 0;
    } else if (t < liftEnd) {
        // Trans1: forward → return
        const s = (t - vxForwardEnd) / trans1Duration;
        return (vxReturn - vxForward) * funcs.deriv(s) / trans1Duration;
    } else if (t < swingEnd) {
        // Return region - no acceleration
        return 0;
    } else if (t < vxForwardStart) {
        // Trans2: return → forward
        const s = (t - swingEnd) / trans2Duration;
        return (vxForward - vxReturn) * funcs.deriv(s) / trans2Duration;
    } else {
        // Forward region - no acceleration
        return 0;
    }
}

/**
 * Get vertical acceleration Ay at time t
 * Ay = dVy/dt = vyAmp * symmetricCurveDeriv(s) * ds/dt
 *             = vyAmp * symmetricCurveDeriv(s) / liftDrop
 */
export function getAy(t, phases, vyAmp) {
    const { stanceEnd, liftEnd, swingEnd, liftDrop } = phases;

    t = ((t % 1) + 1) % 1;

    if (t < stanceEnd) {
        return 0;
    } else if (t < liftEnd) {
        const s = (t - stanceEnd) / liftDrop;
        return vyAmp * symmetricCurveDeriv(s) / liftDrop;
    } else if (t < swingEnd) {
        return 0;
    } else {
        const s = (t - swingEnd) / liftDrop;
        return -vyAmp * symmetricCurveDeriv(s) / liftDrop;
    }
}

// =============================================
// JERK FUNCTIONS
// =============================================

/**
 * Get horizontal jerk Jx at time t
 */
export function getJx(t, phases, vxForward, transitionType = 'quintic') {
    const { vxForwardEnd, vxForwardStart, liftEnd, swingEnd, trans1Duration, trans2Duration } = phases;
    const funcs = getTransitionFuncs(transitionType);
    const vxReturn = calculateReturnVx(phases, vxForward, transitionType);

    t = ((t % 1) + 1) % 1;

    if (t < vxForwardEnd) {
        return 0;
    } else if (t < liftEnd) {
        const s = (t - vxForwardEnd) / trans1Duration;
        return (vxReturn - vxForward) * funcs.deriv2(s) / (trans1Duration * trans1Duration);
    } else if (t < swingEnd) {
        return 0;
    } else if (t < vxForwardStart) {
        const s = (t - swingEnd) / trans2Duration;
        return (vxForward - vxReturn) * funcs.deriv2(s) / (trans2Duration * trans2Duration);
    } else {
        return 0;
    }
}

/**
 * Get vertical jerk Jy at time t
 * Jy = dAy/dt = vyAmp * symmetricCurveDeriv2(s) / liftDrop²
 */
export function getJy(t, phases, vyAmp) {
    const { stanceEnd, liftEnd, swingEnd, liftDrop } = phases;

    t = ((t % 1) + 1) % 1;

    if (t < stanceEnd) {
        return 0;
    } else if (t < liftEnd) {
        const s = (t - stanceEnd) / liftDrop;
        return vyAmp * symmetricCurveDeriv2(s) / (liftDrop * liftDrop);
    } else if (t < swingEnd) {
        return 0;
    } else {
        const s = (t - swingEnd) / liftDrop;
        return -vyAmp * symmetricCurveDeriv2(s) / (liftDrop * liftDrop);
    }
}

// =============================================
// POSITION FUNCTIONS
// =============================================

/**
 * Get horizontal position X at time t
 *
 * Timeline:
 *   [0, vxForwardEnd]: Vx = forward
 *   [vxForwardEnd, liftEnd]: Trans1 (forward → return)
 *   [liftEnd, swingEnd]: Vx = return
 *   [swingEnd, vxForwardStart]: Trans2 (return → forward)
 *   [vxForwardStart, 1]: Vx = forward
 */
export function getPosX(t, phases, vxForward, transitionType = 'quintic') {
    const { vxForwardEnd, vxForwardStart, liftEnd, swingEnd, trans1Duration, trans2Duration } = phases;
    const funcs = getTransitionFuncs(transitionType);
    const vxReturn = calculateReturnVx(phases, vxForward, transitionType);

    t = ((t % 1) + 1) % 1;

    let x = 0;

    if (t < vxForwardEnd) {
        // Forward section (STANCE + early LIFT)
        return vxForward * t;
    }

    // X at vxForwardEnd
    x = vxForward * vxForwardEnd;

    if (t < liftEnd) {
        // During transition 1 (in LIFT)
        const s = (t - vxForwardEnd) / trans1Duration;
        const dv = vxReturn - vxForward;
        x += vxForward * (t - vxForwardEnd) + dv * trans1Duration * funcs.integral(s);
        return x;
    }

    // X at liftEnd (end of trans1)
    x += vxForward * trans1Duration + (vxReturn - vxForward) * trans1Duration * funcs.fullIntegral;

    if (t < swingEnd) {
        // Return section (SWING)
        x += vxReturn * (t - liftEnd);
        return x;
    }

    // X at swingEnd
    x += vxReturn * (swingEnd - liftEnd);

    if (t < vxForwardStart) {
        // During transition 2 (in DROP)
        const s = (t - swingEnd) / trans2Duration;
        const dv = vxForward - vxReturn;
        x += vxReturn * (t - swingEnd) + dv * trans2Duration * funcs.integral(s);
        return x;
    }

    // X at vxForwardStart (end of trans2)
    x += vxReturn * trans2Duration + (vxForward - vxReturn) * trans2Duration * funcs.fullIntegral;

    // Forward section (late DROP)
    x += vxForward * (t - vxForwardStart);
    return x;
}

/**
 * Get vertical position Y at time t
 * Integrate Vy = vyAmp * symmetricCurve(s) over the phase
 *
 * ∫Vy dt = ∫ vyAmp * symmetricCurve(s) * liftDrop * ds
 *        = vyAmp * liftDrop * symmetricCurveIntegral(s)
 */
export function getPosY(t, phases, vyAmp) {
    const { stanceEnd, liftEnd, swingEnd, liftDrop } = phases;

    t = ((t % 1) + 1) % 1;

    if (t < stanceEnd) {
        // Stance: Y = 0
        return 0;
    }

    if (t < liftEnd) {
        // Lift: Y increases from 0
        const s = (t - stanceEnd) / liftDrop;
        return vyAmp * liftDrop * symmetricCurveIntegral(s);
    }

    // Y at liftEnd = vyAmp * liftDrop * (8/15)
    const yLiftEnd = vyAmp * liftDrop * (8 / 15);

    if (t < swingEnd) {
        // Swing: Y constant at max height
        return yLiftEnd;
    }

    // Drop: Y decreases back to 0
    const s = (t - swingEnd) / liftDrop;
    return yLiftEnd - vyAmp * liftDrop * symmetricCurveIntegral(s);
}

/**
 * Get current phase name
 */
export function getPhaseName(t, phases) {
    const { stanceEnd, liftEnd, swingEnd } = phases;
    t = ((t % 1) + 1) % 1;

    if (t < stanceEnd) return 'stance';
    if (t < liftEnd) return 'lift';
    if (t < swingEnd) return 'swing';
    return 'drop';
}
