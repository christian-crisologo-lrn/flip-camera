
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
    constraints: typeof CONSTRAINTS = CONSTRAINTS;
    currentStream: any = false;
    currentDevice: MediaDeviceInfo | null | undefined;
    videoDevices: [] | any;
    canToggleVideoFacingMode: boolean = false;

    constructor() {
        console.log('MediaDevices - MediaDevice instance created');
  
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

    getStreamFacingMode(stream: any, contraints: any = {}) {
        if (stream) {
            const videoTrack = stream?.getVideoTracks()[0];
            const settings = videoTrack?.getSettings();

            if (settings.facingMode) {
                return settings.facingMode;
            }
        }
        if (contraints && !!contraints.video?.facingMode) {
            return contraints.video.facingMode;
        }

        return '';
    }

    stream(callback: Function | null = null, constraints = {}) {

        const newConstraints = { ...this.constraints, ...constraints };

        console.log('MediaDevices - stream with constraints : ' + JSON.stringify(newConstraints));

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


    toggleVideoFacingMode(callback: Function | null = null, constraints = {}, stream = null) {
        console.log('MediaDevices - Toggling video facing mode : ');
        console.log('MediaDevices - No of video devices : ' + this.videoDevices.length);
        const currentStream = stream || this.currentStream;
        const newConstraints = { ...this.constraints, ...constraints };

        if (currentStream) {
            const streamFacingMode = this.getStreamFacingMode(currentStream, this.constraints);
            const facingMode = streamFacingMode === 'user' ? 'environment' : 'user';
        
            newConstraints.video.facingMode = facingMode;
            console.log('MediaDevices - Toggling facing mode: ' + JSON.stringify(newConstraints));

            return this.stream(callback, newConstraints);
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

                console.log('MediaDevices - canToggleVideoFacingMode : ' + this.canToggleVideoFacingMode);

                return this.stream(callback, constraints);
            })
    }

    checkToggleVideoFacingModeSupport(videoDevices: any[]) {
        if ( videoDevices.length > 1 ) {

            const constraints = { audio: false, video: { facingMode: { exact: 'environment' } } };

            console.log('MediaDevices - validating Environment facingMode : ' + JSON.stringify(constraints));

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
