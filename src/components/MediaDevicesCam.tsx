import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import MediaDevice from '../utils/media';
import InfoDisplay from './CameraInfo';
import canvasVideoScreenshot from '../utils/canvasVideoScreenshot';

const MediaDevicesCam: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [showFlipCamera, setShowFlipCamera] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
    const [videoPlayingStatus, setVideoPlayingStatus] = useState<string>('idle');
    const [mediaDevice, setMediaDevice] = useState<MediaDevice | null>(null);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [facingMode, setFacingMode] = useState<string>('environment');

    const setVideoStatus = (status: string) => {
        setVideoPlayingStatus(status);
        console.log(`Video status: ${status}`);
    };

    useEffect(() => {
        const initializeMediaDevice = () => {
            const _mediaDevice = new MediaDevice();
            setMediaDevice(_mediaDevice);
        };

        if (!mediaDevice) {
            initializeMediaDevice();
        }

        return () => {
            mediaDevice?.stopStream();
        };
    }, [mediaDevice]);

    useEffect(() => {
        const initStream = async () => {
            if (!mediaDevice || !mediaDevice.isSupported) {
                const errorMessage = 'getUserMedia is not supported in this browser.';
                console.error(errorMessage);
                return;
            }

            setIsLoading(true);
            try {
                const hasFacingModeSupport = await mediaDevice.checkToggleFacingModeSupport();

                console.log('MediaDevices - hasFacingModeSupport :' + JSON.stringify(hasFacingModeSupport));

                const stream = await mediaDevice.createStream();

                if (stream) {
                    setCameraDevices(mediaDevice.videoDevices);
                    playStreamToVideo(stream);
                    setShowFlipCamera(hasFacingModeSupport);
                }
            } catch (error: any) {
                handleStreamError(error);
            }
        };

        if (videoRef.current && mediaDevice) {
            initStream();
        }
    }, [mediaDevice]);

    useEffect(() => {
        if (videoRef.current) {
            const videoElement = videoRef.current;

            videoElement.onwaiting = () => {
                setVideoStatus('buffering');
            };
            videoElement.onplaying = () => setVideoStatus('playing');
            videoElement.onpause = () => setVideoStatus('paused');
            videoElement.onended = () => setVideoStatus('ended');
            videoElement.onerror = () => setVideoStatus('error');
            videoElement.onloadeddata = () => setVideoStatus('data loaded');
            videoElement.oncanplay = () => {
                setVideoStatus('can play');
            };
            videoElement.oncanplaythrough = () => {
                videoSwitchStreams('playing');
                setVideoStatus('can play through');
            };
            videoElement.onstalled = () => setVideoStatus('stalled');
            videoElement.onseeked = () => setVideoStatus('seeked');
            videoElement.onseeking = () => setVideoStatus('seeking');
        }
        return () => {
            if (videoRef.current) {
                videoRef.current.onwaiting = null;
                videoRef.current.onplaying = null;
                videoRef.current.onpause = null;
                videoRef.current.onended = null;
                videoRef.current.onerror = null;
                videoRef.current.onloadeddata = null;
                videoRef.current.oncanplay = null;
                videoRef.current.oncanplaythrough = null;
                videoRef.current.onstalled = null;
                videoRef.current.onseeked = null;
                videoRef.current.onseeking = null;
            }
        }
    }, []);

    const handleStreamError = (error: any) => {
        console.error('Error accessing media devices.' + JSON.stringify(error));
        setIsLoading(false);
        switch (error.name) {
            case 'NotAllowedError':
                setVideoPlayingStatus('Permissions to access camera were denied.');
                break;
            case 'NotFoundError':
                setVideoPlayingStatus('No camera device found.');
                break;
            case 'NotReadableError':
                setVideoPlayingStatus('Camera is already in use.');
                break;
            default:
                setVideoPlayingStatus('An error occurred while accessing the camera.');
        }
    };

    const startRecording = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const newRecorder = new RecordRTC(stream, { type: 'video' });
            newRecorder.startRecording();
            setRecorder(newRecorder);
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stopRecording(() => {
                invokeSaveAsDialog(recorder.getBlob());
                setIsRecording(false);
            });
        }
    };

    const playVideo = () => {
        videoRef.current?.play();
        setIsPlaying(true);
    };

    const pauseVideo = () => {
        videoRef.current?.pause();
        setIsPlaying(false);
    };

    const playStreamToVideo = (stream: MediaStream | null) => {
        if (videoRef.current && stream) {
            setCurrentStream(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    };

    const videoSwitchStreams = (flag: string) => {
        if (canvasRef.current && videoRef.current) {
            if (flag === 'loading') {
                setIsLoading(true);
                canvasVideoScreenshot.create(canvasRef.current, videoRef.current);
            }

            if (flag === 'playing') {
                canvasVideoScreenshot.remove(canvasRef.current, () => {
                    setIsLoading(false);
                });
            }
        }
    }

    const toggleCamera = async () => {
        videoSwitchStreams('loading');

        try {
            const stream = await mediaDevice?.toggleVideoFacingMode();
            if (stream) {
                const streamFacingMode = mediaDevice?.getFacingMode();
                playStreamToVideo(stream);
                setFacingMode(streamFacingMode);
            }
        } catch (error) {
            console.error('Error toggling camera facing mode.' + JSON.stringify(error));
            videoSwitchStreams('playing');
        }
    };

    const videoProps: any = {
        crossOrigin: 'true'
    }

    const recordBtnCls = classname(
        { 'bg-red-500 hover:bg-red-600': isRecording },
        { 'bg-blue-500 hover:bg-blue-600': !isRecording },
        'mt-4 text-white font-bold py-2 px-4 rounded bg-green-400',
    );

    return (
        <div className="container p-2 align-center">
            <div className="mt-2 border align-center">
                <div className="flex justify-center items-center relative p-2 min-h-[300px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-10">
                            <span className="text-white text-xl">Loading...</span>
                        </div>
                    )}
                    <div className="video-container">
                        <video ref={videoRef}
                            id="camera-stream"
                            className=""
                            width={380}
                            height={285}
                            autoPlay
                            playsInline
                            {...videoProps}
                        />
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <div className="flex justify-between my-2">
                    <button
                        onClick={isPlaying ? pauseVideo : playVideo}
                        className="mt-4 text-white font-bold py-2 bg-red-400 px-4 rounded min-w-[200px]"
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={recordBtnCls}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                </div>

                <InfoDisplay
                    currentStream={currentStream}
                    facingMode={facingMode}
                    videoPlayingStatus={videoPlayingStatus}
                    cameraDevices={cameraDevices}
                />
                {showFlipCamera && (
                    <button
                        onClick={toggleCamera}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Flip Camera
                    </button>
                )}
            </div>
        </div>
    );
};

export default MediaDevicesCam;