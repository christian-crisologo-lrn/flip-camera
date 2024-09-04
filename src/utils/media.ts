
function polyfillGetUserMedia() {
    console.log('MediaDevices - Polyfilling getUserMedia');

    if (typeof window === 'undefined') {
        return;
    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        (navigator as any).mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
            // First get ahold of the legacy getUserMedia, if present
            // @ts-ignore
            const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                // @ts-ignore
                navigator.mozGetUserMedia || navigator.msGetUserMedia;

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
                console.error('getUserMedia is not implemented in this browser');
                return Promise.reject(
                    new Error("getUserMedia is not implemented in this browser")
                );
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        };
    }
};

export const CONSTRAINTS = {
    audio: {
        noiseSuppression: true,
        channelCount: 1
    },
    video: {
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

    constructor() {
        console.log('MediaDevices - MediaDevice instance created');
        polyfillGetUserMedia();

        this.constraints = CONSTRAINTS;
        this.currentStream = null;
    }

    isSupported() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    onUserMediaError(err:any) {
        // Temporary logging the error
        console.error('User media error:', err);
    }

    stopStream(streamInput: any = null) {
        console.log('MediaDevices - Stopping stream');

        const stream = streamInput || this.currentStream;
        // stop all tracks
        if (stream) {
            if (stream) {
                if (stream.getVideoTracks && stream.getAudioTracks) {
                    stream.getVideoTracks().forEach((track:any) => {
                        stream.removeTrack(track);
                        track.stop();
                    });
                    stream.getAudioTracks().forEach((track:any) => {
                        stream.removeTrack(track);
                        track.stop()
                    });
                } else if (stream.getTracks) {
                    stream.getTracks().forEach((track: any) => track.stop());
                } else {
                    stream.stop();
                }
            }
        }
        this.currentStream = null;
    }

    stream(callback: Function | null = null, constraints = {}) {
        console.log('MediaDevices - Starting stream');

        const newConstraints = { ...this.constraints, ...constraints };
        // stop all streams before starting a new one
        this.stopStream();
    
        return navigator.mediaDevices
            .getUserMedia(newConstraints)
            .then((stream) => {
                console.log('MediaDevices - Streaming success:', stream);
                this.currentStream = stream;
                this.currentDevice = this.getStreamDevice(stream);
                this.constraints = newConstraints;
                
                if (callback) {
                    callback(stream);
                }
    
                return stream;
            })
            .catch(this.onUserMediaError);
    }

    updateFacingMode(facingMode: string) {
        console.log('MediaDevices - Updating facing mode:', facingMode);
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
        console.log('MediaDevices - Toggling video facing mode');

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
            console.log('MediaDevices - Toggling device:', device);
            if (device) {
                return this.stream(callback, { video: { deviceId: device.deviceId } });
            }
        };

        return Promise.resolve();
    }

    initStream(callback: Function | null = null, constraints = {}) {
        console.log('MediaDevices - Initializing stream');

        if(!this.isSupported()) {
            console.error('getUserMedia is not supported in this browser.');
            return null;
        }

        return this.getCameraDevices()
            .then((devices: any) => {
                this.videoDevices = devices;

                return devices;
            })
            .then(() => this.stream(callback, constraints));
    }

    getCameraDevices() {
        console.log('MediaDevices - Getting camera devices');

        return navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

                return Promise.all(videoInputDevices.map(device => {
                    return navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } })
                        .then(stream => {
                            const track = stream.getVideoTracks()[0];
                            const capabilities = track?.getCapabilities();

                            // Stop the track to release the camera
                            this.stopStream(stream);

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
