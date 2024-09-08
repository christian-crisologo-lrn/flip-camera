const create = (canvasElement: HTMLCanvasElement, videoElement: HTMLVideoElement) => {
    if (canvasElement && videoElement) {
        const context = canvasElement.getContext('2d');
        if (context) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            canvasElement.style.display = 'block';
            canvasElement.style.opacity = '1';
        }
    }
};

const fadeOut = (canvasElement: HTMLCanvasElement, animationEndCallback: Function | null) => {
    let opacity = 1;

    const fade = () => {
        if (opacity > 0) {
            opacity -= 0.02; // Adjust the decrement value for desired speed
            canvasElement.style.opacity = opacity.toString();
            requestAnimationFrame(fade);
        } else {
            canvasElement.style.display = 'none';
            const context = canvasElement.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
            animationEndCallback && animationEndCallback();
        }
    };

    fade();
};

const remove = (canvasElement: HTMLCanvasElement, animationEndCallback: Function | null = null) => {
    if (canvasElement) {
        fadeOut(canvasElement, animationEndCallback);
    }
};

export default { create, remove };