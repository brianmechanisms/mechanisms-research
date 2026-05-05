/**
 * Export a Chart.js chart as PNG or SVG with white background
 */
export function exportChart(chart, filename, format) {
    const canvas = chart.canvas;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the chart canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    } else if (format === 'svg') {
        // For SVG, embed the white-background PNG
        const dataURL = tempCanvas.toDataURL('image/png');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = svgUrl;
        link.click();
        setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
    }
}

/**
 * Export velocity chart
 */
export function exportVelocityChart(chart) {
    const format = document.getElementById('exportVelocityFormat').value;
    exportChart(chart, 'triangular-velocity', format);
}

/**
 * Export displacement chart
 */
export function exportDisplacementChart(chart) {
    const format = document.getElementById('exportDisplacementFormat').value;
    exportChart(chart, 'triangular-displacement', format);
}

/**
 * Export acceleration chart
 */
export function exportAccelerationChart(chart) {
    const format = document.getElementById('exportAccelerationFormat').value;
    exportChart(chart, 'triangular-acceleration', format);
}

/**
 * Export jerk chart
 */
export function exportJerkChart(chart) {
    const format = document.getElementById('exportJerkFormat').value;
    exportChart(chart, 'triangular-jerk', format);
}

/**
 * Export path visualization as PNG or SVG with white background
 */
export function exportPath() {
    const canvas = document.getElementById('pathCanvas');
    const format = document.getElementById('exportPathFormat').value;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the path canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    if (format === 'png') {
        const link = document.createElement('a');
        link.download = 'triangular-path.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    } else if (format === 'svg') {
        const dataURL = tempCanvas.toDataURL('image/png');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'triangular-path.svg';
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (format === 'gif') {
        exportPathGIF();
    }
}

/**
 * Export path visualization as animated GIF
 */
function exportPathGIF() {
    const canvas = document.getElementById('pathCanvas');
    const statusDiv = document.createElement('div');
    statusDiv.className = 'text-xs text-gray-600 mt-2 text-center';
    statusDiv.textContent = 'Generating GIF...';

    const exportBtn = document.getElementById('exportPath');
    exportBtn.parentElement.parentElement.appendChild(statusDiv);

    // Import animation state from main.js - we'll pass these as parameters
    // For now, create a simple implementation
    const totalFrames = 72;
    const degreesPerFrame = 360 / totalFrames;
    let currentFrame = 0;

    // Configure GIF encoder with shared worker script
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/lib/gif.worker.js'
    });

    // We need to get the drawPath function from main.js
    // This will be passed as a callback
    window.exportPathGIFCallback = function(drawPathFn, currentThetaGetter, setThetaFn) {
        const originalTheta = currentThetaGetter();

        function captureNextFrame() {
            if (currentFrame >= totalFrames) {
                statusDiv.textContent = 'Encoding GIF...';
                gif.render();
                return;
            }

            const theta = currentFrame * degreesPerFrame;
            setThetaFn(theta);
            drawPathFn();

            requestAnimationFrame(() => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);

                gif.addFrame(tempCanvas, { copy: true, delay: 50 });

                currentFrame++;
                statusDiv.textContent = `Capturing frame ${currentFrame}/${totalFrames}...`;

                setTimeout(captureNextFrame, 10);
            });
        }

        captureNextFrame();

        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'triangular-path.gif';
            link.href = url;

            document.body.appendChild(link);
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            link.dispatchEvent(clickEvent);

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                statusDiv.remove();
            }, 1000);

            setThetaFn(originalTheta);
            drawPathFn();
        });

        gif.on('progress', function(progress) {
            statusDiv.textContent = `Encoding GIF: ${Math.round(progress * 100)}%`;
        });

        gif.on('error', function(error) {
            console.error('GIF encoding error:', error);
            statusDiv.textContent = 'Error encoding GIF: ' + error.message;
            setThetaFn(originalTheta);
            drawPathFn();
        });
    };

    // Trigger the callback setup from main.js
    const event = new CustomEvent('requestGIFExport');
    window.dispatchEvent(event);
}
