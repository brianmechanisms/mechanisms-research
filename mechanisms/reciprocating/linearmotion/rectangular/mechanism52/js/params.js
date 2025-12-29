// Global parameters for rectangular mechanism
export const params = {
    // Phase lengths (displacement distances)
    horizontalLength: 100,    // Horizontal displacement distance (top and bottom)
    verticalLength: 80,       // Vertical displacement distance (left and right)

    // Quarter circle transition radius at all 4 corners
    transitionRadius: 10,     // Radius of the quarter circle at each corner

    // Lift and drop (applies to all 4 sections)
    liftHeight: 20,           // Maximum height of lift (perpendicular displacement)
    liftDropAngle: 30,        // Angle duration for both lift and drop phases (degrees)

    // Velocities
    horizontalVx: 1.0,        // Horizontal velocity (top and bottom phases)
    verticalVy: 1.0,          // Vertical velocity (left and right phases)

    // Scaling factors
    sxScale: 1.0,
    syScale: 1.0,
    vxScale: 1.0,
    vyScale: 1.0,
    axScale: 1.0,
    ayScale: 1.0,
    jxScale: 1.0,
    jyScale: 1.0,
    pathScale: 1.0,

    // Perpendicular offset for additional output profiles
    perpendicularOffset: 3,       // Perpendicular offset for additional paths (perpendicular to motion direction)
    showOffsetPaths: true,        // Show offset paths

    // Display options
    showPhaseColors: true,
    showAngleMarkers: true
};
