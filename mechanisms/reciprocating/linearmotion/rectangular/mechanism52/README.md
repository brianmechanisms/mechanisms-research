# Mechanism 52 - Rectangular Mechanism

An interactive mechanism that generates a rectangular path with customizable dimensions and smooth corner transitions. This mechanism uses adjustable side lengths, corner radius, and lift/drop parameters for versatile motion control.

## Features

- **Interactive visualization** with real-time parameter adjustment
- **Rectangular path generation** with customizable horizontal and vertical side lengths
- **Smooth corner transitions** using adjustable corner radius
- **Lift & Drop control** for all sections with configurable height and angles
- **Complete motion analysis** including velocity, displacement, acceleration, and jerk profiles
- **Multiple arms support** (1-20 arms) with perpendicular offset control
- **Export capabilities** for PNG, SVG, and animated GIF formats

## Motion Characteristics

The mechanism generates a rectangular path with four distinct sections:

1. **Horizontal sections** - Forward and return motion along horizontal sides
2. **Vertical sections** - Up and down motion along vertical sides
3. **Corner transitions** - Smooth radius-based transitions at corners
4. **Lift/Drop phases** - Controlled vertical motion for all sections

## Key Parameters

### Side Lengths
- `Horizontal Length` - Length of horizontal sides (default: 100)
- `Vertical Length` - Length of vertical sides (default: 80)
- `Corner Radius` - Radius for smooth corner transitions (default: 10.0)

### Lift & Drop (All Sections)
- `Lift Height` - Vertical lift height (default: 20)
- `Lift/Drop Angle` - Angular duration of lift/drop phases (default: 30°)

### Linkage Parameters
- `R1` - First arm length (default: 50)
- `R2a` - Outside part of second arm (default: 68.8)
- `R2b` - Inside part of second arm (default: 0.0)
- `Fixed Point Distance` - Distance from pivot point (default: 50)
- `Number of Arms` - Multiple synchronized arms (default: 1, range: 1-20)
- `Perpendicular Offset` - Offset between arms (default: 3.0)

### Computed Angles (Display Only)
- `Horizontal Angle` - Angular duration for horizontal sections
- `Vertical Angle` - Angular duration for vertical sections
- `Corner Transition Angle` - Angular duration for corner transitions

## Files

- `index.html` - Interactive web-based visualization
- `js/` - JavaScript modules for calculations, rendering, and export
  - `main.js` - Main application controller and mechanism drawing
  - `calculations.js` - Velocity profile and motion calculations
  - `params.js` - Parameter definitions and defaults
  - `export.js` - Export functionality for images and animations
- `mechanism52_preview.png` - Preview image showing the mechanism
- `mechanism52_thumbnail.png` - Thumbnail for listing pages

## Usage

Open `index.html` in a web browser to interact with the mechanism. The page features two main tabs:

### Mechanism Tab
- Real-time visualization of the rectangular path mechanism
- Interactive controls for all geometric and motion parameters
- Animation controls with play/pause, direction (forward/backward/ping-pong), and speed
- Support for multiple arms with adjustable offset
- Export to PNG, SVG, or animated GIF

### Design Tab
- Velocity profile curves for the rectangular path
- Displacement, acceleration, and jerk profiles
- Design parameters panel for customizing side lengths and transitions
- Individual export controls for each chart
- Real-time computed angles display

## Mathematical Foundation

The mechanism uses smooth transitions between path segments to ensure:
- Continuous velocity profiles without discontinuities
- Minimized acceleration and jerk for smooth mechanical operation
- Proper closure of the rectangular path cycle

The corner transitions use a radius-based approach to smooth the sharp corners of the rectangle, making it practical for physical implementation.

## Applications

- Pick and place operations with rectangular workspace coverage
- Automated assembly systems requiring rectangular motion paths
- Material handling with controlled lift and drop
- Conveyor systems with precise rectangular motion patterns
- Research and education in mechanism design
- Motion profile optimization for rectangular paths

## Type

**Interactive JS-based mechanism** - This is an interactive mechanism in the collection that uses JavaScript for real-time visualization and interaction, rather than static images generated from Python scripts.
