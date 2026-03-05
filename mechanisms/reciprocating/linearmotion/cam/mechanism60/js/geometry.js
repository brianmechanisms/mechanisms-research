/**
 * Geometry calculations for the linear walker mechanism
 */

import { getPhases, getPosX, getPosY, getPhaseName } from './motion.js';
import * as state from './state.js';

/**
 * Calculate B's x position given A's position
 * L² = (Bx - Ax)² + (bHeight - Ay)²
 * Bx = Ax ± sqrt(L² - (Ay - bHeight)²)
 * mirror=false: B to the RIGHT of A (+), mirror=true: B to the LEFT of A (-)
 */
export function getBx(ax, ay, mirror = false) {
    const dy = ay - state.bHeight;
    const discriminant = state.linkLength * state.linkLength - dy * dy;
    if (discriminant < 0) {
        return NaN;
    }
    const offset = Math.sqrt(discriminant);
    return mirror ? ax - offset : ax + offset;
}

/**
 * Calculate actual link length for verification
 */
export function getLinkLength(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute locus points and geometry for reuse across tabs
 */
export function computeLocusGeometry() {
    const p = getPhases(state.stancePercent, state.liftDropPercent, state.overlapPercent);

    // Compute locus path for A and B (for one set, without offset)
    const points = [];
    const numPoints = 200;
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const ax = getPosX(t, p, state.vxAmp, state.transitionType);
        const ay = getPosY(t, p, state.vyAmp);
        const bx = getBx(ax, ay);
        const phase = getPhaseName(t, p);
        points.push({ t, ax, ay, bx, phase });
    }

    // Find bounds for a single set (include A, B, and C)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const pt of points) {
        const cx = pt.ax + state.cOffsetX;
        const cy = state.bHeight + state.cOffsetY;
        minX = Math.min(minX, pt.ax, pt.bx, cx);
        maxX = Math.max(maxX, pt.ax, pt.bx, cx);
        minY = Math.min(minY, pt.ay, state.bHeight, cy);
        maxY = Math.max(maxY, pt.ay, cy);

        if (state.mechanismMode === 'gripper') {
            const apY = 2 * state.bHeight - pt.ay;
            minY = Math.min(minY, apY);
            maxY = Math.max(maxY, apY);
        }
    }

    // Add extra padding for trammel board
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const paddingFrac = 0.25;
    minX -= rangeX * paddingFrac;
    maxX += rangeX * paddingFrac;
    minY -= rangeY * paddingFrac;
    maxY += rangeY * paddingFrac;

    // Calculate set spacing
    const singleSetWidth = maxX - minX;
    const setSpacing = singleSetWidth * 0.5;
    const set2Offset = state.numSets === 2 ? singleSetWidth + setSpacing : 0;

    // Cam center position - midpoint between set 1 and set 2
    const camCenterX = set2Offset / 2;
    const camCenterY = state.bHeight;

    return {
        p,
        points,
        minX, maxX, minY, maxY,
        singleSetWidth,
        setSpacing,
        set2Offset,
        camCenterX,
        camCenterY
    };
}
