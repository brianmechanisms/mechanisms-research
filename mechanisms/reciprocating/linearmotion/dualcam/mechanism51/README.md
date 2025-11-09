# Mechanism 51 - Walking Gait Mechanism

An interactive mechanism with offset velocity profiles for smooth walking motion. This mechanism uses mathematically derived velocity profiles with smooth transitions to achieve precise motion control.

## Features

- **Interactive visualization** with real-time parameter adjustment
- **Dual cam system** with independent left/right offset profiles
- **Smooth velocity transitions** using quintic polynomial interpolation
- **Complete motion analysis** including velocity, displacement, acceleration, and jerk profiles
- **Customizable parameters** for mechanism geometry and motion characteristics
- **Export capabilities** for PNG, SVG, and animated GIF formats

## Motion Phases

The mechanism operates through four distinct phases:

1. **STANCE** - Forward motion at constant horizontal velocity
2. **LIFT** - Vertical lift with smooth velocity transition
3. **SWING** - Return motion with quick return ratio
4. **DROP** - Vertical drop back to stance position

## Key Parameters

### Mechanism Geometry
- `R1` - First arm length and outer circle radius (default: 150)
- `R2` - Second arm length (default: 135)
- `Fixed Pin Distance` - Distance from pivot (default: 20)
- `Locus Offset` - Horizontal offset for left/right profiles (default: 3.8)
- `Vertical Offset` - Vertical adjustment (default: -9.2)

### Velocity Profile
- `Forward VX` - Horizontal velocity during stance (default: 1.0)
- `Return VX` - Calculated from forward velocity and angles
- `Lift/Drop VY` - Vertical velocity during lift/drop phases (default: 1.0)
- `Swing Displacement` - Vertical motion during swing (default: 2.1)

### Phase Angles
- `Stance Angle` - Duration of forward motion (default: 190°)
- `Lift/Drop Angle` - Duration of vertical transitions (default: 20°)
- `Swing Angle` - Auto-calculated return duration
- `Transition Angle` - Smooth transition duration (default: 30°)

## Files

- `index.html` - Interactive web-based visualization
- `js/` - JavaScript modules for calculations, rendering, and export
  - `main.js` - Main application controller
  - `mechanism.js` - Mechanism visualization logic
  - `calculations.js` - Velocity and displacement calculations
  - `chartDrawer.js` - Chart rendering utilities
  - `export.js` - Export functionality
- `mechanism51_preview.png` - Preview velocity profile image
- `mechanism51_thumbnail.png` - Thumbnail for listing pages

## Usage

Open `index.html` in a web browser to interact with the mechanism. The page features two main tabs:

### Mechanism Tab
- Real-time visualization of the dual cam mechanism
- Interactive controls for all geometric parameters
- Animation controls with play/pause, direction, and speed
- Export to PNG, SVG, or animated GIF

### Design Tab
- Velocity profile curves with smooth transitions
- Mathematical derivation of displacement equations
- Displacement, acceleration, and jerk profiles
- Output locus visualization
- Individual export controls for each chart

## Mathematical Foundation

The mechanism uses a **quintic polynomial** for smooth transitions:

```
smoothTransition(t) = 6t⁵ - 15t⁴ + 10t³, where t ∈ [0, 1]
```

This ensures:
- Zero velocity derivatives at boundaries
- Smooth connection between motion phases
- Minimal jerk for smooth mechanical operation

The return velocity is automatically calculated to ensure a complete cycle:

```
returnVx = -forwardVx × (forwardAngle + transitionAngle) / (returnAngle + transitionAngle)
```

## Applications

- Walking robots and legged locomotion
- Automated assembly systems requiring smooth pick-and-place
- Conveyor systems with precise motion control
- Research and education in mechanism design
- Motion profile optimization for cam-based systems

## Type

**Interactive JS-based mechanism** - This is a new type of mechanism in the collection that uses JavaScript for real-time visualization and interaction, rather than static images generated from Python scripts.
