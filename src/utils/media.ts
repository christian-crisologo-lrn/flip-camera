

export const CONSTRAINTS = {
    audio: {
        noiseSuppression: true,
        channelCount: 1
    },
    video: {
        device: undefined,
        facingMode: 'user',
        width: { min: 480, ideal: 640, max: 960 },
        height: { min: 480, ideal: 480, max: 480 }
    }
};

export const facingModes = ['user', 'environment'];

class MediaDevice {
    constraints: typeof CONSTRAINTS;
    currentStream: any;
    devices: [] | any;

    constructor() {
        this.constraints = CONSTRAINTS;
        this.currentStream = null;
    }

    onUserMediaError(err:any) {
        // Temporary logging the error
        console.error('User media error:', err);
    }

    stopStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach((track: any) => track.stop());
            this.currentStream = null;
        }
    }

    stream(callback: Function | null = null, constraints = {}) {
        this.stopStream();
        this.constraints = { ...this.constraints, ...constraints };
    
        return navigator.mediaDevices
            .getUserMedia(this.constraints)
            .then((stream) => {
                this.currentStream = stream;
                if (callback) {
                    callback(stream);
                }
    
                return stream;
            })
            .catch(this.onUserMediaError);
    }


    
    findDeviceIdWithFacingMode(facingMode: string) {
        return navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            const promises = videoInputDevices.map(device => {
                return navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: device.deviceId }, facingMode: { ideal: facingMode } }
                }).then(stream => {
                    const track = stream.getVideoTracks()[0];
                    const capabilities = track.getCapabilities();
                    stream.getTracks().forEach(track => track.stop());

                    if (capabilities.facingMode && capabilities.facingMode.includes(facingMode)) {
                        return device.deviceId;
                    }
                    return null;
                }).catch(() => null);
            });

            return Promise.all(promises).then(results => results.find(deviceId => deviceId !== null));
        });
    }

    updateFacingMode(facingMode: string) {
        if (!this.currentStream) {
            console.error('No active stream to update.');
            return Promise.reject('No active stream to update.');
        }

        const videoTrack = this.currentStream.getVideoTracks()[0];
        const constraints = { ...this.constraints, video: { ...this.constraints.video, facingMode: { ideal: facingMode } } };

        return videoTrack.applyConstraints(constraints.video).then(() => {
            return this.currentStream;
        }).catch((err: any ) => {
            console.warn('Device does not support the specified facing mode. Keeping the current stream. Error:', err);
            return this.currentStream;
        });
    }

    toggleVideoFacingMode(callback: Function) {
        const { facingMode } = this.getCurrentStreamDevice();

        return this.updateFacingMode(facingMode === 'user' ? 'environment' : 'user')
            .then((stream: any) => callback && callback(stream));  
    }

    isSupported() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    getFacingMode() {
        return this.constraints.video.facingMode;
    }


    getCameraDevices() {
        return navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

                return Promise.all(videoInputDevices.map(device => {
                    return navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } })
                        .then(stream => {
                            const track = stream.getVideoTracks()[0];
                            const capabilities = track?.getCapabilities();

                            // Stop the track to release the camera
                            track?.stop();

                            return {
                                deviceId: device.deviceId,
                                label: device.label,
                                facingMode: capabilities?.facingMode || ''
                            };
                        })
                        .catch(error => {
                            console.error('Error accessing media devices:', error);
                            return {
                                deviceId: device.deviceId,
                                label: device.label,
                                facingMode: ''
                            };
                        });
                }));
            })
            .then(devices => {
                this.devices = devices;

                return devices;
            })
            .catch(error => {
                console.error('Error enumerating devices:', error);
                return [];
            });
    }

    getCurrentStreamDevice() {
        if (this.currentStream) {
            const videoTrack = this.currentStream.getVideoTracks()[0];
            const deviceId = videoTrack.getSettings().deviceId;

            return this.devices.find((device: any) => device.deviceId === deviceId);
        }
        return null;
    }

}

export default MediaDevice;
