export const getVideoCameras = async (): Promise<MediaDeviceInfo[]> => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        return videoDevices;

    } catch (error) {
        console.error('Error accessing media devices.', error);
        return [];
    }
}

type CameraOption = { value: string; text: string; };

export const getCameraOptions = async () => {
    let cameras: CameraOption[] = [];

    const videoDevices:MediaDeviceInfo[] = await getVideoCameras();
    videoDevices.forEach((device: any) => {
        const option: CameraOption = {
            value: device.deviceId,
            text: device.label || `Camera ${cameras.length + 1}`
        };

        cameras.push(option);
    });
 
    return cameras;
}

export const hasMultipleCameras = (): Promise<boolean> => {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        return videoDevices.length > 1;
    }).catch(error => {
        console.error('Error accessing media devices.', error);
        return false;
    });
}

export const canFlipCamera = (): Promise<boolean> => {
    const faceModes = ['user', 'environment'];

    return navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoInputDevices.length === 0) {
                return [false];
            }
            
            return Promise.all(videoInputDevices.map(device => {
                return navigator.mediaDevices.getUserMedia({
                    video: { deviceId: device.deviceId }
                }).then(stream => {
                    const track = stream.getVideoTracks()[0];
                    const capabilities = track.getCapabilities();
                    track.stop();
                    return capabilities.facingMode && capabilities.facingMode.some(facingMode => faceModes.includes(facingMode));
                }).catch(() => false);
            }));
        })
        .then(results => results.some(result => result));
}