import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import MediaDevice from '../utils/media';

const MediaDevicesCam: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [showFlipCamera, setShowFlipCamera] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
    const [videoPlayingStatus, setVideoPlayingStatus] = useState<string>('idle');
    const [mediaDevice, setMediaDevice] = useState<MediaDevice | null>(null);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
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
                setMessages([errorMessage]);
                return;
            }

            setIsLoading(true);
            try {
                const stream = await mediaDevice.initStream();
                if (stream) {
                    setCameraDevices(mediaDevice.videoDevices);
                    playStreamToVideo(stream);
                    setShowFlipCamera(mediaDevice.canToggleVideoFacingMode);
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
            videoElement.onwaiting = () => setVideoStatus('buffering');
            videoElement.onplaying = () => setVideoStatus('playing');
            videoElement.onpause = () => setVideoStatus('paused');
            videoElement.onended = () => setVideoStatus('ended');
            videoElement.onerror = () => setVideoStatus('error');
            videoElement.onloadeddata = () => setVideoStatus('data loaded');
            videoElement.oncanplay = () => {
                // setIsLoading(false);
                setVideoStatus('can play');
            };
            videoElement.oncanplaythrough = () => {
                setIsLoading(false);
                setVideoStatus('can play through');
            };
            videoElement.onstalled = () => setVideoStatus('stalled');
            videoElement.onseeked = () => setVideoStatus('seeked');
            videoElement.onseeking = () => setVideoStatus('seeking');
        }
    }, []);

    const handleStreamError = (error: any) => {
        console.error('Error accessing media devices.', error);
        setMessages((prevMessages) => [...prevMessages, 'getUserMedia is not supported in this browser.']);
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

    const toggleCamera = async () => {
        setIsLoading(true);
        pauseVideo();
        try {
            const stream = await mediaDevice?.toggleVideoFacingMode();
            if (stream) {
                const streamFacingMode = mediaDevice?.getStreamFacingMode() || '';

                setMessages((prevMessages) => [...prevMessages, `Toggling camera facing mode changed: ${streamFacingMode}`]);
                playStreamToVideo(stream);
                setFacingMode(streamFacingMode);
            }
        } catch (error) {
            console.error('Error toggling camera facing mode.', error);
            setMessages((prevMessages) => [...prevMessages, `Error toggling camera facing mode: ${error}`]);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <video
                        ref={videoRef}
                        id="camera-stream"
                        className=""
                        width={380}
                        height={285}
                        autoPlay
                        playsInline
                        crossOrigin="anonymous"
                    ></video>
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
                {/* {showFlipCamera && ( */}
                <button
                    onClick={toggleCamera}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                    Flip Camera
                </button>
                {/* )} */}
                <InfoDisplay
                    currentStream={currentStream}
                    facingMode={facingMode}
                    videoPlayingStatus={videoPlayingStatus}
                    cameraDevices={cameraDevices}
                    messages={messages}
                />
            </div>
        </div>
    );
};

const InfoDisplay: React.FC<{
    currentStream: MediaStream | null;
    facingMode: string;
    videoPlayingStatus: string;
    cameraDevices: MediaDeviceInfo[];
    messages: string[];
}> = ({ currentStream, facingMode, videoPlayingStatus, cameraDevices, messages }) => (
    <>
        <InfoItem label="Current Stream" value={currentStream?.getVideoTracks()[0]?.label || 'No stream'} />
        <InfoItem label="Facing Camera" value={facingMode} />
        <InfoItem label="Video Status" value={videoPlayingStatus} />
        <InfoItem label="Camera Devices" value={cameraDevices.map((device) => `${device.label} - ()`).join(', ')} />
        <InfoItem label="Messages" value={messages.join(', ')} />
    </>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
        {label}: [{value}]
    </div>
);

export default MediaDevicesCam;