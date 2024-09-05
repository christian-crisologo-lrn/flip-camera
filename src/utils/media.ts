
export const CONSTRAINTS = {
    audio: {
        noiseSuppression: true,
        channelCount: 1
    },
    video: {
        facingMode: 'user',
        width: { min: 380, ideal: 380, max: 380 },
        height: { min: 285, ideal: 285, max: 285 }
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
    canToggleVideoFacingMode: boolean = false;

    constructor() {
        console.log('MediaDevices - MediaDevice instance created');
        // polyfillGetUserMedia();

        this.constraints = CONSTRAINTS;
        this.currentStream = null;
    }

    isSupported() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    onUserMediaError(err:any) {
        // Temporary logging the error
        console.error('User media error:' + JSON.stringify(err));
    }

    stopStream(stream: any) {
        console.log('MediaDevices - Stopping stream');
        // stop all tracks
        if (stream) {
            if (stream?.getVideoTracks && stream?.getAudioTracks) {
                stream.getVideoTracks().forEach((track:any) => {
                    stream.removeTrack(track);
                    track.stop();
                });
                stream.getAudioTracks().forEach((track:any) => {
                    stream.removeTrack(track);
                    track.stop()
                });
            } else if (stream?.getTracks) {
                stream.getTracks().forEach((track: any) => track.stop());
            } else {
                stream.stop();
            }
        }
    }

    getStreamFacingMode(stream: any) {
        if (stream) {
            const videoTrack = stream?.getVideoTracks()[0];
            const settings = videoTrack?.getSettings();

            return settings.facingMode || '';
        }

        return '';
    }

    stream(callback: Function | null = null, constraints = {}) {
        console.log('MediaDevices - Starting stream');

        const newConstraints = { ...this.constraints, ...constraints };
        // stop all streams before starting a new one
        this.stopStream(this.currentStream);
    
        return navigator.mediaDevices
            .getUserMedia(newConstraints)
            .then((stream) => {
                console.log('MediaDevices - Streaming success : ' + JSON.stringify(stream));
                this.currentStream = stream;
                this.constraints = newConstraints;
                
                if (callback) {
                    callback(stream);
                }
    
                return stream;
            })
            .catch(this.onUserMediaError);
    }


    toggleVideoFacingMode(callback: Function | null = null, stream: any = null) {
        console.log('MediaDevices - Toggling video facing mode : ' + this.videoDevices.length);
        const currentStream = stream || this.currentStream;

        if (currentStream) {
            const facingMode = this.getStreamFacingMode(currentStream);
        
            console.log('MediaDevices - Toggling facing mode: ' + facingMode);

            return this.stream(callback, { video: { facingMode: facingMode }});
        } else {
            return Promise.resolve();
        }
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
            .then((devices: any) => this.checkToggleVideoFacingModeSupport(devices))
            .then((result: boolean) => {
                this.canToggleVideoFacingMode = result;
            })
            .then(() => this.stream(callback, constraints));
    }

    checkToggleVideoFacingModeSupport(videoDevices: any[]) {
        if ( videoDevices.length > 1 ) {
            // if (!navigator.mediaDevices.getSupportedConstraints().facingMode) {
            //     console.log('MediaDevices - Device does not supports facingMode');

            //     return false;
            // }

            const constraints = { audio: false, video: { facingMode :  "environment"  } };

            console.log('MediaDevices - validating Environment facingMode');

            return navigator.mediaDevices.getUserMedia(constraints)
                .then(() => {
                    console.log('MediaDevices - Device supports Environment facingMode');
                    return true;
                })
                .catch((error: any) => {
                    console.log('MediaDevices - Device does not support Environment facingMode : ' + JSON.stringify(error));
                    return false;
                });
        } else {
            console.log('MediaDevices - Device only support single facingMode');

            return Promise.resolve(false);
        }
    }

    getCameraDevices() {
        console.log('MediaDevices - Getting camera devices');

        return navigator.mediaDevices.getUserMedia({ audio: false, video: true })
            .then(() => {
                console.log('MediaDevices - getUserMedia access granted');
                return navigator.mediaDevices.enumerateDevices()
                    .then(devices => {
                        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
                        console.log('MediaDevices - devices ' + JSON.stringify(videoInputDevices));
                        
                        return videoInputDevices.map(device => {
                            return {
                                deviceId: device.deviceId,
                                label: device.label
                            };
                        });
                    })
                    .catch(error => {
                        console.error('Error enumerating devices: ' + JSON.stringify(error));
                        return [];
                    });
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
