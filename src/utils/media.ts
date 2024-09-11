// @ts-nocheck

export const defaultConstraints = {
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

class MediaDevices {
    stream = null;
    videoDevices = [];
    canToggleVideoFacingMode = false;
    constraints = defaultConstraints;

    constructor() {}

    isSupported() {
        return navigator.mediaDevices &&
            !!navigator.mediaDevices.getUserMedia &&
            !!navigator.mediaDevices.enumerateDevices;
    }

    onUserMediaError(error) {
        console.error('MediaDevices - User media error:', error);

        error.exception({
            code: 10012,
            detail: 'Could not access the device\'s camera and/or microphone.'
        });
    }

    updateConstraintFacingMode(constraints) {
        if (constraints && this.constraints.video.facingMode !== constraints.video?.facingMode) {
            this.constraints.video.facingMode = constraints.video.facingMode;
        }
    }

    updateConstraints(constraints) {
        return  {...constraints, ...this.constraints};
        // if (constraints && !_.isEqual(this.constraints, constraints)) {
        //     this.constraints.video = _.merge(this.constraints.video, constraints.video);
        // }
    }

    stopStream(stream = null) {
        const streamToStop = stream || this.stream;

        // stop all tracks
        if (streamToStop && streamToStop.active) {
            if (streamToStop.getTracks) {
                streamToStop.getTracks().forEach(track => track.stop());
            }
        }
    }

    getFacingMode() {
        if (this.stream) {
            const videoTrack = this.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();

            if (settings.facingMode) {
                return settings.facingMode;
            }
        }
        // get the facingMode reference from constraints
        if (this.constraints && this.constraints.video && this.constraints.video.facingMode) {
            return this.constraints.video.facingMode;
        }

        return '';
    }

    async createStream(constraints = null) {
        this.updateConstraints(constraints);

        // stop all streams before starting a new one
        this.stopStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);

            this.stream = stream;

            return stream;
        } catch (err) {
            this.onUserMediaError(err);

            return null;
        }
    }

    toggleVideoFacingMode(constraints = null) {
        this.updateConstraintFacingMode(constraints);

        if (this.stream) {
            this.constraints.video.facingMode = this.constraints.video.facingMode === 'user' ? 'environment' : 'user';

            return this.createStream(this.constraints);
        } else {
            return Promise.reject(null);
        }
    };

    async checkToggleFacingModeSupport() {
        if (!this.isSupported()) {
            return false;
        }

        try {
            // check if it supports the `environment` facingMode
            const facingMode = 'environment';
            const hasEnvironmentSupport = await this.hasFacingModeSupport(facingMode);
            const devices = await this.getCameraDevices();

            this.videoDevices = devices.map(device => {
                return {
                    ...device,
                    label: device.label,
                    deviceId: device.deviceId,
                    facingMode: ''
                };
            });

            // if video device supports `environment` and it's more than 1 device
            // then it supports the toggling of camera user to environment
            this.canToggleVideoFacingMode = hasEnvironmentSupport && this.videoDevices.length > 1;

            return this.canToggleVideoFacingMode;

        } catch (error) {
            this.canToggleVideoFacingMode = false;

            return false;
        }
    }

    async hasFacingModeSupport(facingMode) {
        const constraints = { video: { facingMode } };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.stopStream(stream);

            return true;
        } catch (error) {
            return false;
        }
    }

    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            return [];
        }
    }
}

export default MediaDevices;
