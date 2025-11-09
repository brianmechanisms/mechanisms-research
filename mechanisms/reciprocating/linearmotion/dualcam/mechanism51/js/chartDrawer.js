import { params } from './params.js';
import { calculatePhaseAngles, calculateVxAngles } from './calculations.js';

// Common chart configuration
const CHART_CONFIG = {
    padding: { left: 60, right: 30, top: 30, bottom: 40 },
    colors: {
        primary: '#1E40AF',    // Blue
        secondary: '#DC2626',  // Red
        axis: '#000',
        grid: '#ddd',
        gridText: '#666',
        zero: '#999',
        transition: '#888'
    },
    phases: [
        { name: 'STANCE', color: 'rgba(34, 197, 94, 0.15)' },
        { name: 'LIFT', color: 'rgba(59, 130, 246, 0.15)' },
        { name: 'SWING', color: 'rgba(251, 146, 60, 0.15)' },
        { name: 'DROP', color: 'rgba(239, 68, 68, 0.15)' }
    ]
};

/**
 * Base chart drawer with common functionality
 */
export class ChartDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.config = CHART_CONFIG;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw phase backgrounds
     */
    drawPhaseBackgrounds() {
        const angles = calculatePhaseAngles();
        const phases = [
            { ...this.config.phases[0], start: angles.stanceStart, end: angles.stanceEnd },
            { ...this.config.phases[1], start: angles.liftStart, end: angles.liftEnd },
            { ...this.config.phases[2], start: angles.swingStart, end: angles.swingEnd },
            { ...this.config.phases[3], start: angles.dropStart, end: angles.dropEnd }
        ];

        phases.forEach(phase => {
            const x1 = this.config.padding.left + (phase.start / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            const x2 = this.config.padding.left + (phase.end / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            this.ctx.fillStyle = phase.color;
            this.ctx.fillRect(
                x1,
                this.config.padding.top,
                x2 - x1,
                this.height - this.config.padding.top - this.config.padding.bottom
            );
        });
    }

    /**
     * Draw transition boundary lines
     */
    drawTransitionLines() {
        const vxAngles = calculateVxAngles();
        const transitionAngles = [
            vxAngles.trans1Start,
            vxAngles.trans1End,
            vxAngles.trans2Start,
            360
        ];

        this.ctx.strokeStyle = this.config.colors.transition;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        transitionAngles.forEach(angle => {
            const x = this.config.padding.left + (angle / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.config.padding.top);
            this.ctx.lineTo(x, this.height - this.config.padding.bottom);
            this.ctx.stroke();
        });

        this.ctx.setLineDash([]);
    }

    /**
     * Draw Y-axis
     */
    drawYAxis() {
        this.ctx.strokeStyle = this.config.colors.axis;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.padding.left, this.config.padding.top);
        this.ctx.lineTo(this.config.padding.left, this.height - this.config.padding.bottom);
        this.ctx.stroke();
    }

    /**
     * Draw horizontal zero line
     */
    drawZeroLine(zeroY) {
        this.ctx.strokeStyle = this.config.colors.axis;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.padding.left, zeroY);
        this.ctx.lineTo(this.width - this.config.padding.right, zeroY);
        this.ctx.stroke();
    }

    /**
     * Draw Y-axis tick marks and labels
     */
    drawYAxisTicks(minValue, maxValue, numTicks = 8) {
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        const tickInterval = (maxValue - minValue) / numTicks;

        for (let i = 0; i <= numTicks; i++) {
            const value = minValue + i * tickInterval;
            const y = this.config.padding.top + (maxValue - value) / (maxValue - minValue) * (this.height - this.config.padding.top - this.config.padding.bottom);

            // Draw tick mark
            this.ctx.strokeStyle = this.config.colors.axis;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.config.padding.left - 5, y);
            this.ctx.lineTo(this.config.padding.left, y);
            this.ctx.stroke();

            // Draw label
            this.ctx.fillText(value.toFixed(2), this.config.padding.left - 10, y);
        }
    }

    /**
     * Draw a curve on the chart
     */
    drawCurve(data, valueKey, minValue, maxValue, color, lineWidth = 3) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();

        data.forEach((d, i) => {
            const x = this.config.padding.left + (d.angle / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            const y = this.config.padding.top + (maxValue - d[valueKey]) / (maxValue - minValue) * (this.height - this.config.padding.top - this.config.padding.bottom);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
    }

    /**
     * Draw axis labels
     */
    drawAxisLabels(yLabel) {
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Angle (degrees)', this.width / 2, this.height - 5);

        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText(yLabel, 0, 0);
        this.ctx.restore();
    }

    /**
     * Draw legend in bottom left
     */
    drawLegend(items) {
        const legendX = 80;
        const legendY = this.height - 60;

        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        items.forEach((item, index) => {
            const y = legendY + index * 20;

            // Draw line
            this.ctx.strokeStyle = item.color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(legendX, y);
            this.ctx.lineTo(legendX + 30, y);
            this.ctx.stroke();

            // Draw text
            this.ctx.fillText(item.label, legendX + 35, y);
        });
    }

    /**
     * Calculate min/max values with padding
     */
    calculateBounds(data, key1, key2, paddingPercent = 0.2) {
        let min1 = 0, max1 = 0, min2 = 0, max2 = 0;

        data.forEach(d => {
            min1 = Math.min(min1, d[key1]);
            max1 = Math.max(max1, d[key1]);
            min2 = Math.min(min2, d[key2]);
            max2 = Math.max(max2, d[key2]);
        });

        const min = Math.min(min1, min2);
        const max = Math.max(max1, max2);
        const range = max - min;
        const padding = range * paddingPercent;

        return { min: min - padding, max: max + padding };
    }
}

/**
 * Velocity profile drawer
 */
export class VelocityProfileDrawer extends ChartDrawer {
    draw() {
        this.clear();

        // Calculate data
        const data = [];
        const numPoints = 1000;
        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 360;
            const vx = this.getVxAtAngle(angle);
            const vy = this.getVyAtAngle(angle) * params.vyScale;
            data.push({ angle, vx, vy });
        }

        const bounds = this.calculateBounds(data, 'vx', 'vy');

        this.drawPhaseBackgrounds();
        this.drawTransitionLines();
        this.drawYAxis();
        this.drawZeroLine(this.config.padding.top + (bounds.max) / (bounds.max - bounds.min) * (this.height - this.config.padding.top - this.config.padding.bottom));

        this.drawCurve(data, 'vx', bounds.min, bounds.max, this.config.colors.primary);
        this.drawCurve(data, 'vy', bounds.min, bounds.max, this.config.colors.secondary);

        this.drawAxisLabels('Velocity');
        this.drawLegend([
            { color: this.config.colors.primary, label: 'VX (Horizontal Velocity)' },
            { color: this.config.colors.secondary, label: 'VY (Vertical Velocity)' }
        ]);

        // Add grid
        this.drawGrid(bounds.min, bounds.max);
    }

    drawGrid(minValue, maxValue) {
        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = this.config.colors.gridText;
        this.ctx.textAlign = 'right';

        const vStep = 0.5;
        for (let v = Math.ceil(minValue / vStep) * vStep; v <= maxValue; v += vStep) {
            const y = this.config.padding.top + (maxValue - v) / (maxValue - minValue) * (this.height - this.config.padding.top - this.config.padding.bottom);
            this.ctx.beginPath();
            this.ctx.moveTo(this.config.padding.left, y);
            this.ctx.lineTo(this.width - this.config.padding.right, y);
            this.ctx.stroke();
            this.ctx.fillText(v.toFixed(1), this.config.padding.left - 5, y + 4);
        }

        this.ctx.textAlign = 'center';
        for (let angle = 0; angle <= 360; angle += 30) {
            const x = this.config.padding.left + (angle / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            this.ctx.fillText(angle + '°', x, this.height - 20);
        }

        // Phase labels
        const angles = calculatePhaseAngles();
        const phases = [
            { name: 'DROP', start: angles.dropStart, end: angles.dropEnd },
            { name: 'STANCE', start: angles.stanceStart, end: angles.stanceEnd },
            { name: 'LIFT', start: angles.liftStart, end: angles.liftEnd },
            { name: 'SWING', start: angles.swingStart, end: angles.swingEnd }
        ];

        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillStyle = this.config.colors.gridText;
        phases.forEach(phase => {
            const midAngle = (phase.start + phase.end) / 2;
            const x = this.config.padding.left + (midAngle / 360) * (this.width - this.config.padding.left - this.config.padding.right);
            this.ctx.fillText(phase.name, x, 20);
        });
    }

    // Import calculation functions (these would be moved to a shared module)
    getVxAtAngle(angle) {
        // This is a placeholder - actual implementation would import from calculations.js
        // For now, we'll need to inject these functions
        return 0;
    }

    getVyAtAngle(angle) {
        return 0;
    }
}

/**
 * Generic profile drawer for displacement, acceleration, and jerk
 */
export class GenericProfileDrawer extends ChartDrawer {
    constructor(canvasId, config) {
        super(canvasId);
        this.profileConfig = config;
    }

    draw(data) {
        this.clear();

        const bounds = this.calculateBounds(data, this.profileConfig.key1, this.profileConfig.key2);

        this.drawPhaseBackgrounds();
        this.drawTransitionLines();
        this.drawYAxis();

        const zeroY = this.config.padding.top + (bounds.max) / (bounds.max - bounds.min) * (this.height - this.config.padding.top - this.config.padding.bottom);
        this.drawZeroLine(zeroY);
        this.drawYAxisTicks(bounds.min, bounds.max);

        this.drawCurve(data, this.profileConfig.key1, bounds.min, bounds.max, this.config.colors.primary);
        this.drawCurve(data, this.profileConfig.key2, bounds.min, bounds.max, this.config.colors.secondary);

        this.drawAxisLabels(this.profileConfig.yLabel);
        this.drawLegend(this.profileConfig.legendItems);
    }
}
