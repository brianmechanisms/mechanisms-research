import { params } from './params.js';

/**
 * Quarter circle on gear mechanism:
 * - Fixed gear at origin (0,0) with radius r, rotates in positive (CCW) direction
 * - Quarter circle (3rd quadrant: pi to 1.5*pi) with radius R, only translates (no rotation)
 * - Initially tangent at angle 1.5*pi (bottom)
 * - No slip between surfaces
 *
 * As gear rotates by theta:
 * - Arc length (displacement) = r * theta
 * - This displacement on the quarter circle gives angle change: phi = (r/R) * theta
 * - Contact angle = 1.5*pi - phi (goes from 1.5*pi toward pi)
 * - Contact point = r * (cos(contact_angle), sin(contact_angle))
 * - QC center = (r - R) * (cos(contact_angle), sin(contact_angle))
 */

/**
 * Get the maximum gear rotation angle
 * Limited by upperArcAngle (the angular span of the upper arcs)
 * phi_max = upperArcAngle, theta_max = (R/r) * phi_max
 */
export function getMaxGearRotation() {
    const r = params.gearRadius;
    const R = params.revolvingGearRadius;
    // Arc span is the upperArcAngle parameter
    const arcSpan = params.upperArcAngle;
    // phi = (r/R) * theta => theta_max = (R/r) * arcSpan
    return (R / r) * arcSpan;
}

/**
 * Calculate the state at a given gear rotation angle theta
 * @param {number} theta - Gear rotation in radians (0 to theta_max)
 * @returns {Object} State including positions of contact point, revolving gear center, etc.
 */
export function getStateAtGearAngle(theta) {
    const r = params.gearRadius;
    const R = params.revolvingGearRadius;

    // Clamp theta to valid range
    const thetaMax = getMaxGearRotation();
    theta = Math.max(0, Math.min(theta, thetaMax));

    // Arc length (displacement) from gear rotation
    const arcLength = r * theta;

    // Angle change on quarter circle from the displacement
    const phi = (r / R) * theta;

    // Contact angle (same on both gear and QC) - starts at 1.5*pi, decreases toward pi
    const contactAngle = 1.5 * Math.PI - phi;

    // Contact point position (on gear surface, at the contact angle)
    const contactPoint = {
        x: r * Math.cos(contactAngle),
        y: r * Math.sin(contactAngle)
    };

    // Quarter circle center position
    // QC_center = (r - R) * (cos(contactAngle), sin(contactAngle))
    // This places the QC so that the contact point is at distance R from QC center
    // and at the correct angle on the QC
    const qcCenter = {
        x: (r - R) * Math.cos(contactAngle),
        y: (r - R) * Math.sin(contactAngle)
    };

    return {
        theta,
        phi,
        arcLength,
        contactAngle,
        contactPoint,
        qcCenter
    };
}

/**
 * Generate a racetrack locus for the revolving gear center
 * Racetrack = two straight sections + two semicircular ends
 * @param {number} straightLength - Length of straight sections
 * @param {number} trackRadius - Radius of the semicircular ends
 * @param {number} numPoints - Number of points in the path
 * @returns {Array} Array of {x, y, t} points where t is 0-1 progress
 */
export function generateRacetrackLocus(straightLength, trackRadius, numPoints = 200) {
    const locus = [];

    // Racetrack perimeter: 2 * straightLength + 2 * pi * trackRadius
    const straightPart = straightLength;
    const arcPart = Math.PI * trackRadius;
    const totalPerimeter = 2 * straightPart + 2 * arcPart;

    // Starting position: center of bottom straight, moving right
    // Layout: bottom straight (right), right arc, top straight (left), left arc

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const dist = t * totalPerimeter;

        let x, y;

        if (dist < straightPart) {
            // Bottom straight: moving right from (-L/2, -R) to (L/2, -R)
            x = -straightLength / 2 + dist;
            y = -trackRadius;
        } else if (dist < straightPart + arcPart) {
            // Right semicircle: from (L/2, -R) around to (L/2, R)
            const arcDist = dist - straightPart;
            const angle = -Math.PI / 2 + (arcDist / trackRadius);
            x = straightLength / 2 + trackRadius * Math.cos(angle);
            y = trackRadius * Math.sin(angle);
        } else if (dist < 2 * straightPart + arcPart) {
            // Top straight: moving left from (L/2, R) to (-L/2, R)
            const straightDist = dist - straightPart - arcPart;
            x = straightLength / 2 - straightDist;
            y = trackRadius;
        } else {
            // Left semicircle: from (-L/2, R) around to (-L/2, -R)
            const arcDist = dist - 2 * straightPart - arcPart;
            const angle = Math.PI / 2 + (arcDist / trackRadius);
            x = -straightLength / 2 + trackRadius * Math.cos(angle);
            y = trackRadius * Math.sin(angle);
        }

        locus.push({ x, y, t });
    }

    return locus;
}

/**
 * Get the position of a traced point on the revolving gear
 * @param {number} theta - Gear rotation angle
 * @param {number} pointAngle - Angle of the point on the arc (in arc's local frame, radians)
 * @returns {Object} Position {x, y} of the traced point
 */
export function getTracedPointPosition(theta, pointAngle) {
    const R = params.revolvingGearRadius;
    const state = getStateAtGearAngle(theta);

    // Point position = QC center + R * (cos(pointAngle), sin(pointAngle))
    // Note: pointAngle is fixed since QC doesn't rotate
    return {
        x: state.qcCenter.x + R * Math.cos(pointAngle),
        y: state.qcCenter.y + R * Math.sin(pointAngle)
    };
}

/**
 * Generate the locus (path) of a traced point as gear rotates
 * @param {number} pointAngle - Angle of the point to trace (radians)
 * @param {number} numPoints - Number of points in the path
 * @returns {Array} Array of {x, y, theta} points
 */
export function generateLocus(pointAngle, numPoints = 200) {
    const thetaMax = getMaxGearRotation();
    const locus = [];

    for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * thetaMax;
        const pos = getTracedPointPosition(theta, pointAngle);
        locus.push({
            x: pos.x,
            y: pos.y,
            theta
        });
    }

    return locus;
}

/**
 * Generate points for the quarter circle arc (3rd quadrant: pi to 1.5*pi)
 * with line extensions at both ends
 * @param {Object} center - Center position {x, y}
 * @param {number} radius - Radius of the circle
 * @param {number} numPoints - Number of points for the arc
 * @returns {Object} Object with arc points and extension lines
 */
export function generateQuarterCircleArc(center, radius, numPoints = 50) {
    const points = [];
    const startAngle = Math.PI;        // 180 degrees (left side)
    const endAngle = 1.5 * Math.PI;    // 270 degrees (bottom)

    // Generate arc points
    for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + (i / numPoints) * (endAngle - startAngle);
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }

    return points;
}

/**
 * Generate the revolving gear shape based on a bounding rectangle
 * The 4 corners of the rectangle are the centers of the 4 arcs
 *
 * @param {Object} shapeCenter - Center position {x, y} of the shape
 * @param {number} arcRadius - Radius of the corner arcs
 * @param {number} upperArcAngle - Angular span of upper arcs (radians)
 * @param {number} length - Horizontal distance between vertical lines
 * @param {number} height - Vertical distance between horizontal lines
 * @param {number} numArcPoints - Number of points for each arc
 * @returns {Object} Object with all shape segments and bounding rectangle
 */
export function generateRevolvingGearShape(shapeCenter, arcRadius, upperArcAngle, length, height, numArcPoints = 50) {
    const R = arcRadius;

    // Bounding rectangle corners (arc centers)
    const topLeft = { x: shapeCenter.x - length / 2, y: shapeCenter.y + height / 2 };
    const topRight = { x: shapeCenter.x + length / 2, y: shapeCenter.y + height / 2 };
    const bottomLeft = { x: shapeCenter.x - length / 2, y: shapeCenter.y - height / 2 };
    const bottomRight = { x: shapeCenter.x + length / 2, y: shapeCenter.y - height / 2 };

    // Upper arc angle span
    const upperSpan = upperArcAngle;
    // Lower arc angle span (complementary to make the shape work)
    const lowerSpan = Math.PI - upperSpan;

    // Top-right arc (main arc): from startAngle to 1.5*pi
    // startAngle = 1.5*pi - upperSpan (so it spans upperSpan radians ending at 1.5*pi)
    const topRightStartAngle = 1.5 * Math.PI - upperSpan;
    const topRightEndAngle = 1.5 * Math.PI;

    // Top-left arc (mirror arc): from 1.5*pi to 1.5*pi + upperSpan
    const topLeftStartAngle = 1.5 * Math.PI;
    const topLeftEndAngle = 1.5 * Math.PI + upperSpan;

    // Bottom-right arc: from pi/2 to pi/2 + lowerSpan
    const bottomRightStartAngle = Math.PI / 2;
    const bottomRightEndAngle = Math.PI / 2 + lowerSpan;

    // Bottom-left arc: from pi/2 - lowerSpan to pi/2
    const bottomLeftStartAngle = Math.PI / 2 - lowerSpan;
    const bottomLeftEndAngle = Math.PI / 2;

    // Generate arc points
    function generateArc(center, startAngle, endAngle) {
        const points = [];
        const span = endAngle - startAngle;
        for (let i = 0; i <= numArcPoints; i++) {
            const angle = startAngle + (i / numArcPoints) * span;
            points.push({
                x: center.x + R * Math.cos(angle),
                y: center.y + R * Math.sin(angle)
            });
        }
        return points;
    }

    const topRightArc = generateArc(topRight, topRightStartAngle, topRightEndAngle);
    const topLeftArc = generateArc(topLeft, topLeftStartAngle, topLeftEndAngle);
    const bottomRightArc = generateArc(bottomRight, bottomRightStartAngle, bottomRightEndAngle);
    const bottomLeftArc = generateArc(bottomLeft, bottomLeftStartAngle, bottomLeftEndAngle);

    // Key points for lines
    const upperLineLeft = topLeftArc[topLeftArc.length - 1];  // End of top-left arc
    const upperLineRight = topRightArc[0];  // Start of top-right arc
    const leftLineTop = topLeftArc[0];  // Start of top-left arc (at 1.5*pi)
    const leftLineBottom = bottomLeftArc[bottomLeftArc.length - 1];  // End of bottom-left arc (at pi/2)
    const rightLineTop = topRightArc[topRightArc.length - 1];  // End of top-right arc (at 1.5*pi)
    const rightLineBottom = bottomRightArc[0];  // Start of bottom-right arc (at pi/2)
    const bottomLineLeft = bottomLeftArc[0];  // Start of bottom-left arc
    const bottomLineRight = bottomRightArc[bottomRightArc.length - 1];  // End of bottom-right arc

    // Bounding rectangle for visualization
    const boundingRect = {
        topLeft,
        topRight,
        bottomLeft,
        bottomRight
    };

    // Combined path going clockwise from bottom-left arc
    const fullPath = [
        ...bottomLeftArc,      // Bottom-left arc (from lowest to pi/2)
        ...topLeftArc,         // Top-left arc (from 1.5*pi to upper line)
        upperLineRight,        // Upper line to top-right arc
        ...topRightArc,        // Top-right arc (from upper line to 1.5*pi)
        rightLineBottom,       // Right line to bottom-right arc
        ...bottomRightArc,     // Bottom-right arc (from pi/2 to lowest)
        bottomLineLeft         // Bottom line back to start
    ];

    return {
        boundingRect,
        arcCenters: { topLeft, topRight, bottomLeft, bottomRight },
        topLeftArc,
        topRightArc,
        bottomLeftArc,
        bottomRightArc,
        upperLine: { start: upperLineLeft, end: upperLineRight },
        leftLine: { start: leftLineTop, end: leftLineBottom },
        rightLine: { start: rightLineTop, end: rightLineBottom },
        bottomLine: { start: bottomLineLeft, end: bottomLineRight },
        fullPath,
        // For compatibility
        mainArc: topRightArc,
        mirrorArc: topLeftArc
    };
}

// Keep old function for backward compatibility but redirect to new one
export function generateFullShape(center, radius, hLineLength, vLineLength, startAngle, numArcPoints = 50) {
    // Calculate equivalent parameters
    const upperArcAngle = 1.5 * Math.PI - startAngle;
    const length = hLineLength;
    const height = vLineLength;
    return generateRevolvingGearShape(center, radius, upperArcAngle, length, height, numArcPoints);
}

/**
 * Get tangent direction at the contact point
 * @param {number} theta - Gear rotation angle
 * @returns {Object} Tangent direction {dx, dy} (unit vector)
 */
export function getTangentAtContact(theta) {
    const state = getStateAtGearAngle(theta);
    // Tangent is perpendicular to the radial direction at contact
    const angle = state.contactAngle + Math.PI / 2;
    return {
        dx: Math.cos(angle),
        dy: Math.sin(angle)
    };
}
