/**
 * Export canvas as PNG with white background
 */
export function exportCanvasAsPNG(canvasId, filename) {
    const canvas = document.getElementById(canvasId);

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    // Export the temporary canvas
    const link = document.createElement('a');
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

/**
 * Export handlers for different chart types
 */
export function createExportHandler(canvasId, baseFilename) {
    return function() {
        // Map canvas IDs to their corresponding format select IDs
        const selectIdMap = {
            'velocityCanvas': 'exportFormat',
            'displacementCanvas': 'exportDisplacementFormat',
            'accelerationCanvas': 'exportAccelerationFormat',
            'jerkCanvas': 'exportJerkFormat'
        };

        const formatSelect = document.getElementById(selectIdMap[canvasId]);
        const format = formatSelect ? formatSelect.value : 'png';

        if (format === 'png') {
            exportCanvasAsPNG(canvasId, `${baseFilename}.png`);
        } else if (format === 'svg') {
            alert('SVG export not yet implemented for this chart');
        }
    };
}
