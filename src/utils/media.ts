

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

class MediaDevice {
    constraints: typeof CONSTRAINTS;
    currentStream: any;
    
    constructor() {
        this.constraints = CONSTRAINTS;
        this.currentStream = null;
    }

    onUserMediaError(err:any) {
        // Temporary logging the error
        console.error('User media error:', err);
    }

    deviceHasFaceMode(stream: any) {
        if (!stream) {
            return false;
        }

        const track = stream.getVideoTracks()[0];

        if (!track) {
            return false;
        }

        const capabilities = track.getCapabilities();

        if (!capabilities.facingMode) {
            return false;
        }

        // don't stream
        track.stop();

        return capabilities.facingMode.some((facingMode:string) => facingModes.includes(facingMode));
    }

    getVideoFacingModes() {
        return this.stream().then(stream => {
            const track = stream?.getVideoTracks()[0];
    
            if (!track) {
                return [];
            }

            // don't stream
            track.stop();

            const capabilities = track.getCapabilities();

            if (!capabilities.facingMode) {
                return [];
            }
    
            return capabilities.facingMode
        })
    }

    canToggleVideoFacingMode(callback: Function) {
        return navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

                if (videoInputDevices.length === 0) {
                    return [false];
                }

                return Promise.all(videoInputDevices.map(device => {
                    const videoConstraints = { video: { deviceId: device.deviceId } };

                    return navigator.mediaDevices.getUserMedia(videoConstraints)
                        .then(stream => this.deviceHasFaceMode(stream))
                        .catch(() => false);
                }));
            })
            .then(results => {
                const hasFaceMode = results.some(result => result);

                callback && callback(hasFaceMode);
            });
    }

    stopCurrentStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach((track: any) => track.stop());
            this.currentStream = null;
        }
    }

    stream(callback: Function | null = null, constraints = {}) {
        this.stopCurrentStream();
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

    toggleVideoFacingMode(callback: Function, facingModeArg = 'user') {
        const facingMode = facingModeArg || this.constraints.video.facingMode;

        this.constraints.video.facingMode = facingMode === 'user' ? 'environment' : 'user';

        return this.stream(callback, this.constraints);
    }

    isSupported() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    getFacingMode() {
        return this.constraints.video.facingMode;
    }
}

export default MediaDevice;
