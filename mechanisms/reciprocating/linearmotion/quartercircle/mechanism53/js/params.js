// Parameters for revolving gear mechanism
// A shaped gear that translates on a rotating fixed gear
export const params = {
    // Fixed gear at origin
    gearRadius: 40,           // Radius of the fixed gear (smaller)

    // Revolving gear shape parameters
    // Constraints: shapeLength >= 2*R_rg, shapeHeight >= 2*R_rg
    revolvingGearRadius: 40,  // R_rg - Radius of the revolving gear's corner arcs
    upperArcAngle: Math.PI / 2,  // Fixed at 90 degrees for now
    shapeLength: 80,          // Horizontal distance between vertical lines (>= 2*R_rg)
    shapeHeight: 80,          // Vertical distance between horizontal lines (>= 2*R_rg)

    // Point to trace on the revolving gear
    tracePointAngle: Math.PI, // Angle on the arc to trace

    // Racetrack locus parameters
    trackStraightLength: 200, // Length of horizontal straight sections
    trackHeight: 90,          // Height of vertical straight sections (centered at y=0)
    trackOffset: 10,          // X offset for displaced racetracks
    numRevolvingGears: 7,     // Number of revolving gears equally spaced on track
    // trackRadius = revolvingGearRadius - endGearRadius

    // End gear parameters
    endGearRadius: 10,        // Radius of the corner/end gears

    // Visualization
    showGearTeeth: true,
    numTeeth: 12,
    showContactPoint: true,
    showLocus: true,
    showBoundingRect: true,   // Show the bounding rectangle with dashed lines
    locusResolution: 200,     // Number of points to trace
};
