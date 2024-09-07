const create = (canvasElement:any, videoElement:any) => {

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
}

const remove = (canvasElement: any) => {
    if (canvasElement) {
        canvasElement.style.transition = 'opacity 2s';
        canvasElement.style.opacity = '0';
        setTimeout(() => {
            canvasElement.style.display = 'none';
        }, 1000);
    }
}

export default {
    create,
    remove
}