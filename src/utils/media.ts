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
        console.error('MediaDevices - User media error:' + JSON.stringify(error));

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
        console.log('MediaDevices - stopStream :');
        const streamToStop = stream || this.stream;

        // stop all tracks
        if (streamToStop && streamToStop.active) {
            if (streamToStop.getTracks) {
                streamToStop.getTracks().forEach(track => track.stop());
            }
        }
    }

    getFacingMode() {
        console.log('MediaDevices - getFacingMode :');
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
        console.log('MediaDevices - createStream:' + JSON.stringify(constraints));
        this.updateConstraints(constraints);

        // stop all streams before starting a new one
        this.stopStream();

        try {
            console.log('MediaDevices - start to stream:' + JSON.stringify(this.constraints));
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);

            this.stream = stream;

            return stream;
        } catch (error) {

            console.log('MediaDevices - stream : ' + JSON.stringify(error));

            this.onUserMediaError(error);

            return null;
        }
    }

    toggleVideoFacingMode(constraints = null) {
        console.log('MediaDevices - toggleVideoFacingMode :');
        this.updateConstraintFacingMode(constraints);

        if (this.stream) {
            this.constraints.video.facingMode = this.constraints.video.facingMode === 'user' ? 'environment' : 'user';

            console.log('MediaDevices - new facingMode : ' + JSON.stringify(this.constraints.video));

            return this.createStream(this.constraints);
        } else {

            console.log('MediaDevices - Error no active stream!');

            return Promise.reject(null);
        }
    };

    async checkToggleFacingModeSupport() {
        console.log('MediaDevices - checkToggleFacingModeSupport :');

        if (!this.isSupported()) {
            return false;
        }

        try {
            // check if it supports the `environment` facingMode
            const facingMode = 'environment';
            const hasEnvironmentSupport = await this.hasFacingModeSupport(facingMode);
            // #TODO : we can remove the enumeration of devices if we don't need to show the list of devices

            this.videoDevices = await this.getCameras();

            console.log('MediaDevices - hasEnvironmentSupport  :' + facingMode + ' ' + hasEnvironmentSupport);
            console.log('MediaDevices - devices found : ' + JSON.stringify(this.videoDevices));

            this.canToggleVideoFacingMode = hasEnvironmentSupport && this.videoDevices.length > 1;

            console.log('MediaDevices - canToggleVideoFacingMode :' + JSON.stringify(this.canToggleVideoFacingMode));

            return this.canToggleVideoFacingMode;

        } catch (error) {

            console.log('MediaDevices - canToggleVideoFacingMode ERROR :' + JSON.stringify(error));

            this.canToggleVideoFacingMode = false;

            return false;
        }
    }

    async hasFacingModeSupport(facingMode) {
        const constraints = { video: { facingMode }, audio: false };

        console.log('MediaDevices - hasFacingModeSupport : ' + JSON.stringify(constraints));

        // make sure to stop any existing stream before starting a new one
        this.stopStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('MediaDevices - hasFacingModeSupport stream ' + JSON.stringify(stream));

            this.stopStream(stream);

            console.log('MediaDevices - hasFacingModeSupport success');

            return true;
        } catch (error) {

            console.log('MediaDevices - hasFacingModeSupport failed : ' + JSON.stringify(error));

            return false;
        }
    }

    async getCameras() {
        console.log('MediaDevices - getCameras');

        try {
            const enumerateDevices = await navigator.mediaDevices.enumerateDevices();

            console.log('MediaDevices - video devices :' + JSON.stringify(enumerateDevices));

            const filteredVideoInputs =  enumerateDevices.filter(device => device.kind === 'videoinput');

            return filteredVideoInputs.map((device, index) => {
                return {
                    ...device,
                    label: device.label || 'Camera - ' + index
                };
            });

        } catch (error) {

            console.log('MediaDevices - getCameras error :' + JSON.stringify(error));

            return [];
        }
    }
}

export default MediaDevices;
