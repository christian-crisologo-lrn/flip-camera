

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

interface MediaDeviceInfo {
    deviceId: string;
    label: string;
    facingMode: string;
};

class MediaDevice {
    constraints: typeof CONSTRAINTS;
    currentStream: any;
    currentDevice: MediaDeviceInfo | null | undefined;
    videoDevices: [] | any;
    isSupported: boolean = false;

    constructor() {
        this.constraints = CONSTRAINTS;
        this.currentStream = null;
        this.isSupported = !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
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
        if (this.currentDevice && this.videoDevices.length) {
            const currentFacingMode = this.currentDevice.facingMode;

            const device = this.videoDevices
                .find((device: any) => {
                    if (device.deviceId !== this.currentDevice?.deviceId) {

                        if (!device.facingMode.includes(currentFacingMode)) {
                            return true;
                        }
                    }
                });

            if (device) {
                return this.stream(callback, { video: { deviceId: device.deviceId } });
            }
        };

        return Promise.resolve();
    }

    initStream(callback: Function | null = null, constraints = {}) {
        
        if(!this.isSupported) {
            console.error('getUserMedia is not supported in this browser.');
            return null;
        }

        return this.getCameraDevices()
            .then((devices: any) => {
                this.videoDevices = devices;

                return devices;
            })
            .then(() => {
                return this.stream(callback, constraints)
                    .then((stream: any) => {
                        this.currentDevice = this.getStreamDevice(stream);

                        return stream;
                    });
            });
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
            .catch(error => {
                console.error('Error enumerating devices:', error);
                return [];
            });
    }

    getStreamDevice(stream: any) {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            const deviceId = videoTrack.getSettings().deviceId;

            return this.videoDevices.find((device: any) => device.deviceId === deviceId);
        }
        return null;
    }

}

export default MediaDevice;
