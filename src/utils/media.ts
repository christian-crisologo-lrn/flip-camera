
// @ts-ignore
import adapter from 'webrtc-adapter';

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
        const currentStream = stream || this.currentStream;

        // stop all tracks
        if (currentStream) {
            if (currentStream?.getVideoTracks && currentStream?.getAudioTracks) {
                currentStream.getVideoTracks().forEach((track:any) => {
                    currentStream.removeTrack(track);
                    track.stop();
                });
                currentStream.getAudioTracks().forEach((track:any) => {
                    currentStream.removeTrack(track);
                    track.stop()
                });
            } else if (currentStream?.getTracks) {
                currentStream.getTracks().forEach((track: any) => track.stop());
            } else {
                currentStream.stop();
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

    async stream(constraints = {}) {

        const newConstraints = { ...this.constraints, ...constraints };

        console.log('MediaDevices - stream with constraints : ' + JSON.stringify(newConstraints));

        // stop all streams before starting a new one
        this.stopStream(this.currentStream);
    
        try {
            const stream = await navigator.mediaDevices.getUserMedia(newConstraints);
            console.log('MediaDevices - Streaming success : ' + JSON.stringify(stream));
            this.currentStream = stream;
            this.constraints = newConstraints;

            return stream;
        } catch (err) {
            return this.onUserMediaError(err);
        }
    }


    toggleVideoFacingMode(constraints = {}, stream = null) {
        console.log('MediaDevices - Toggling video facing mode : ');
        console.log('MediaDevices - No of video devices : ' + this.videoDevices.length);
        const currentStream = stream || this.currentStream;
        const newConstraints = { ...this.constraints, ...constraints };

        if (currentStream) {
            const streamFacingMode = this.getStreamFacingMode(currentStream, this.constraints);
            const facingMode = streamFacingMode === 'user' ? 'environment' : 'user';
        
            newConstraints.video.facingMode = facingMode;
            console.log('MediaDevices - Toggling facing mode: ' + JSON.stringify(newConstraints));

            return this.stream(newConstraints);
        } else {
            return Promise.resolve();
        }
    }

    async initStream(constraints = {}) {
        console.log('MediaDevices - Initializing stream');

        if(!this.isSupported()) {
            console.error('getUserMedia is not supported in this browser.');
            return null;
        }
        try {
            const devices = await this.getCameraDevices();
            this.videoDevices = devices;
            this.canToggleVideoFacingMode = await this.checkToggleVideoFacingModeSupport(devices);

            const stream = await this.stream(constraints);

            return stream;
            
        } catch (error) {
            console.error('Error accessing media devices.', error);
            throw error;
            
            return null;
        }
    }

    async checkFacingModeSupport(facingMode: string) {
        const constraints = { audio: false, video: { facingMode: { exact: facingMode } } };

        try {
            console.log(`MediaDevices - validating facingMode ${facingMode} : ${JSON.stringify(constraints)}`);

            await navigator.mediaDevices.getUserMedia(constraints);
            console.log(`MediaDevices - device supports ${facingMode} `);

            return true;
        } catch (error) {
            console.log(`MediaDevices - Device not supported ${facingMode} :   ${JSON.stringify(constraints)}`);

            return false;
        }
    };

    async checkToggleVideoFacingModeSupport(videoDevices: any[]) {
        if ( videoDevices.length > 1 ) {
            const hasEnvironmentSupport = await this.checkFacingModeSupport('environment');
            
            if (!hasEnvironmentSupport) {
                const hasUserSupport = await this.checkFacingModeSupport('user');
                
                return hasUserSupport;
            }

            return true;

        } else {
            console.log('MediaDevices - Device only support single facingMode');

            return false;
        }
    }

    async getCameraDevices() {
        console.log('MediaDevices - Getting camera devices');

        try {
            await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
            console.log('MediaDevices - getUserMedia access granted');
        } catch (error) {
            console.error('MediaDevices - getUserMedia access denied : ' + JSON.stringify(error));
            return [];
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('MediaDevices - devices ' + JSON.stringify(videoInputDevices));

            return videoInputDevices.map(device => {
                return {
                    deviceId: device.deviceId,
                    label: device.label
                };
            });
        } catch (error) {
            console.error('Error enumerating devices: ' + JSON.stringify(error));
            return [];
        }
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
