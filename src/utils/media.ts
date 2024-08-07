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
 
