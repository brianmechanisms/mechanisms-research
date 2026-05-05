import { mechanismParams, drawMechanism, setTheta } from './mechanism.js';

/**
 * Export mechanism as PNG
 */
export function exportPNG() {
    const canvas = document.getElementById('mechanismCanvas');
    const link = document.createElement('a');
    link.download = 'dual-cam-mechanism.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Export mechanism as SVG
 * Note: Canvas doesn't natively support SVG export, so we convert to data URL
 */
export function exportSVG() {
    const canvas = document.getElementById('mechanismCanvas');

    // Create SVG with embedded PNG (simple approach)
    const dataURL = canvas.toDataURL('image/png');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataURL}"/>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'dual-cam-mechanism.svg';
    link.href = url;
    link.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Export mechanism as animated GIF (full 360 degree rotation)
 */
export function exportGIF() {
    const canvas = document.getElementById('mechanismCanvas');
    const statusDiv = document.getElementById('exportStatus');

    statusDiv.textContent = 'Generating GIF...';
    statusDiv.classList.remove('hidden');

    // Save current state
    const originalTheta = mechanismParams.currentTheta;
    const wasAnimating = mechanismParams.animating;

    // Stop animation if running
    if (wasAnimating) {
        mechanismParams.animating = false;
    }

    // Calculate delay based on animation speed
    // animationSpeed is in degrees per frame at ~60fps
    // We want the GIF to match the visual speed
    const degreesPerGifFrame = 5; // 5 degrees per GIF frame
    const framesPerGifFrame = degreesPerGifFrame / mechanismParams.animationSpeed;
    const delayMs = Math.round((framesPerGifFrame / 60) * 1000); // Convert to milliseconds

    // Configure GIF encoder with shared worker script
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/lib/gif.worker.js'
    });

    // Capture frames for full rotation
    const totalFrames = 72; // 72 frames = 5 degrees per frame
    const degreesPerFrame = 360 / totalFrames;
    let currentFrame = 0;

    // Capture frames asynchronously to allow canvas to render
    function captureNextFrame() {
        if (currentFrame >= totalFrames) {
            // All frames captured, start encoding
            statusDiv.textContent = 'Encoding GIF...';
            gif.render();
            return;
        }

        const theta = currentFrame * degreesPerFrame;
        setTheta(theta);

        // Wait for next animation frame to ensure canvas is rendered
        requestAnimationFrame(() => {
            // Create a temporary canvas with white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Fill with white background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Draw the mechanism canvas on top
            tempCtx.drawImage(canvas, 0, 0);

            // Add frame to GIF with speed-based delay
            gif.addFrame(tempCanvas, { copy: true, delay: delayMs });

            // Update status
            currentFrame++;
            statusDiv.textContent = `Capturing frame ${currentFrame}/${totalFrames}...`;

            // Capture next frame
            setTimeout(captureNextFrame, 10); // Small delay to ensure rendering
        });
    }

    // Start capturing frames
    captureNextFrame();

    // Render GIF
    gif.on('finished', function(blob) {
        console.log('GIF finished, blob:', blob);
        console.log('Blob size:', blob.size);
        console.log('Blob type:', blob.type);

        try {
            // Create download using window.open approach (more reliable for some browsers)
            const url = URL.createObjectURL(blob);
            console.log('Created URL:', url);

            // Method 1: Try direct download link
            const link = document.createElement('a');
            link.download = 'dual-cam-mechanism.gif';
            link.href = url;

            // Force download by dispatching mouse event
            document.body.appendChild(link);
            console.log('Link added to body, clicking...');

            // Trigger click with mouse event
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            link.dispatchEvent(clickEvent);

            // Cleanup after download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Cleanup complete');
            }, 1000);

            statusDiv.textContent = 'GIF exported successfully!';
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 2000);
        } catch (error) {
            console.error('Error during download:', error);
            statusDiv.textContent = 'Error exporting GIF: ' + error.message;
        }

        // Restore original state
        setTheta(originalTheta);
        if (wasAnimating) {
            mechanismParams.animating = true;
        }
    });

    gif.on('progress', function(progress) {
        console.log('Encoding progress:', progress);
        statusDiv.textContent = `Encoding GIF: ${Math.round(progress * 100)}%`;
    });

    gif.on('error', function(error) {
        console.error('GIF encoding error:', error);
        statusDiv.textContent = 'Error encoding GIF: ' + error.message;

        // Restore original state
        setTheta(originalTheta);
        if (wasAnimating) {
            mechanismParams.animating = true;
        }
    });
}
