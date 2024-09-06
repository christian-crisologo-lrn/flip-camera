type Contraints = {
    audio: {
        noiseSuppression: boolean;
        channelCount: number;
    };
    video: {
        facingMode: string;
        width: { min: number; ideal: number; max: number };
        height: { min: number; ideal: number; max: number };
    };
} | null;

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

class MediaDevice {
    constraints: typeof CONSTRAINTS = CONSTRAINTS;
    stream: MediaStream | null = null;
    videoDevices: Array<MediaDeviceInfo & { facingMode?: string }> = [];
    canToggleVideoFacingMode: boolean = false;

    constructor() {
        console.log('MediaDevices - MediaDevice instance created');
    }

    isSupported() {
        return navigator.mediaDevices && 
            !!navigator.mediaDevices.getUserMedia && 
            !!navigator.mediaDevices.enumerateDevices;
    }

    onUserMediaError(error: any) {
        console.error('MediaDevices - User media error:', error);
        switch (error.name) {
            case 'NotAllowedError':
                console.log('MediaDevices - Permissions to access camera were denied.');
                break;
            case 'NotFoundError':
                console.log('MediaDevices - No camera device found.');
                break;
            case 'NotReadableError':
                console.log('MediaDevices - Camera is already in use.');
                break;
            default:
                console.log('MediaDevices - An error occurred while accessing the camera.');
        }
    }

    updateConstraints(constraints: Contraints) {
        if (constraints) {
            if (!!constraints.video?.facingMode) {
                this.constraints.video.facingMode = constraints.video.facingMode;
            } else if (constraints.video) {
                this.constraints.video = { ...this.constraints.video, ...JSON.parse(JSON.stringify(constraints.video)) };
            }
        }
    }

    stopStream(stream: MediaStream | null= null) {
        console.log('MediaDevices - Stopping stream');

        const streamToStop = stream || this.stream;

        // stop all tracks
        if (streamToStop && streamToStop.active) {
            if (streamToStop?.getTracks) {
                streamToStop.getTracks().forEach((track: any) => track.stop());
            }
        }
    }

    getStreamFacingMode() {
        if (this.stream) {
            const videoTrack = this.stream?.getVideoTracks()[0];
            const settings = videoTrack?.getSettings();

            if (settings.facingMode) {
                return settings.facingMode;
            }
        }
        // get the facingMode reference from constraints
        if (this.constraints && !!this.constraints.video?.facingMode) {
            return this.constraints.video.facingMode;
        }

        return '';
    }

    async loadStream(constraints: Contraints = null) {

        this.updateConstraints(constraints);

        console.log('MediaDevices - stream with constraints : ' + JSON.stringify(this.constraints));

        // stop all streams before starting a new one
        this.stopStream();
    
        try {
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            console.log('MediaDevices - Streaming success : ' + JSON.stringify(stream));
            this.stream = stream;

            return stream;
        } catch (err) {
            return this.onUserMediaError(err);
        }
    }


    toggleVideoFacingMode(constraints: Contraints = null) {
        console.log('MediaDevices - Toggling video facing mode : ');
        this.updateConstraints(constraints);

        if (this.stream) {
            this.constraints.video.facingMode = this.constraints.video.facingMode === 'user' ? 'environment' : 'user';

            console.log('MediaDevices - Toggling facing mode: ' + JSON.stringify(this.constraints));

            return this.loadStream(this.constraints);
        } else {
            return Promise.reject(null);
        }
    }



    async initStream(constraints: Contraints = null) {
        console.log('MediaDevices - Initializing stream');

        try {
            this.updateConstraints(constraints);

            await this.checkToggleFacingModeSupport();

            const stream = await this.loadStream(this.constraints);

            return stream;
            
        } catch (error) {
            console.error('MediaDevices - Error accessing media devices.', error);
            
            return null;
        }
    }

    async checkToggleFacingModeSupport() {

        if(!this.isSupported()) {
            console.error('MediaDevices - getUserMedia is not supported in this browser.');
            return false;
        }

        try {
            // check if it supports the `environment` facingMode

            const facingMode = 'environment';
            const hasEnvironmentSupport = await this.checkFacingModeSupport(facingMode);  
            const devices = await this.getCameraDevices();

            this.videoDevices = devices.map(device => {
                return {
                    ...device,
                    label: device.label,
                    deviceId: device.deviceId,
                    facingMode: ''
                };
            });

            // if video device supports `environment` and it's morethan the 1 device
            // then it supportrs the toggling of camera user to environment
            this.canToggleVideoFacingMode = hasEnvironmentSupport && this.videoDevices.length > 1;

            return this.canToggleVideoFacingMode;
            
        } catch (error) {
            console.error('MediaDevices - Error accessing media devices.', error);
            
            return false;
        }
    }

    async checkFacingModeSupport(facingMode: string) {
        const constraints = { video: { facingMode } };

        try {
            console.log(`MediaDevices - validating facingMode ${facingMode}:`, constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log(`MediaDevices - device supports ${facingMode}`);
            this.stopStream(stream);
            return true;
        } catch (error) {
            console.log(`MediaDevices - Device not supported ${facingMode}:`, constraints);
            return false;
        }
    }

    async getCameraDevices() {
        console.log('MediaDevices - Getting camera devices');

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('MediaDevices - devices ' + JSON.stringify(videoInputDevices));

            return videoInputDevices;
        } catch (error) {
            console.error('Error enumerating devices: ' + JSON.stringify(error));
            return [];
        }
    }

}

export default MediaDevice;
