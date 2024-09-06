import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';

const BasicCamera: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [facingMode, setFacingMode] = useState<string>('user');
    const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
    const [videoPlayingStatus, setVideoPlayingStatus] = useState<string>('idle');
    const [cameraDevices, setCameraDevices] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (videoRef.current) {
            connectToStream('user');
        }

        return () => {
            stopUnloadStream();
        };
    }, []);

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
                setIsLoading(false);
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

    const connectToStream = async (facingMode: string = 'user') => {
        setIsLoading(true);
        setFacingMode(facingMode);
        stopUnloadStream();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            playStreamToVideo(stream);
        } catch (error: any) {
            handleStreamError(error);
        }
    };

    const handleStreamError = (error: any) => {
        console.error('Error accessing media devices.', error);
        setMessages((messages) => [...messages, 'getUserMedia is not supported in this browser.']);
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

    const playStreamToVideo = (stream: MediaStream) => {
        if (videoRef.current) {
            setCurrentStream(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    };

    const stopUnloadStream = (stream: MediaStream | null = null) => {
        console.log('Unloading and Stopping stream');
        const _currentStream = stream || currentStream;

        if (_currentStream && _currentStream.active) {
            _currentStream.getTracks().forEach((track) => track.stop());
        }

        if (videoRef.current) {
            pauseVideo();
            videoRef.current.srcObject = null;
        }
    };

    const toggleCamera = async () => {
        setIsLoading(true);
        pauseVideo();
        try {
            const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
            await connectToStream(newFacingMode);
            setMessages((messages) => [...messages, `Toggling camera facing mode changed: ${facingMode}`]);
        } catch (error) {
            console.error('Error toggling camera facing mode.', error);
            setMessages((messages) => [...messages, `Error toggling camera facing mode: ${error}`]);
        } finally {
            setIsLoading(false);
        }
    };

    const onGetCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
            setCameraDevices(videoInputDevices.map((device) => ({ deviceId: device.deviceId, label: device.label })));
        } catch (error) {
            console.error('Error enumerating camera devices:', error);
        }
    };

    const setVideoStatus = (status: string) => {
        setVideoPlayingStatus(status);
        console.log(`Video status: ${status}`);
    };

    const recordBtnCls = classname(
        { 'bg-red-500 hover:bg-red-600': isRecording },
        { 'bg-blue-500 hover:bg-blue-600': !isRecording },
        'mt-4 text-white font-bold py-2 px-4 rounded',
    );

    return (
        <div className="m-1">
            <div className="container p-5 align-center">
                <div className="mt-2 border align-center p-5">
                    <div className="flex justify-center items-center relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-10">
                                <span className="text-white text-xl">Loading...</span>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            id="camera-stream"
                            width={380}
                            height={285}
                            autoPlay
                            playsInline
                            crossOrigin="anonymous"
                        ></video>
                    </div>
                </div>
                <div className="flex mt-4 m-2 flex-col">
                    <div className="flex my-2 justify-between">
                        <button
                            onClick={isPlaying ? pauseVideo : playVideo}
                            className="mt-4 font-bold py-2 px-4 bg-green-500 text-white rounded-md min-w-[200px]"
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
                    <button
                        onClick={toggleCamera}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Flip Camera
                    </button>
                    <InfoDisplay
                        facingMode={facingMode}
                        videoPlayingStatus={videoPlayingStatus}
                        cameraDevices={cameraDevices}
                        messages={messages}
                    />
                    <button
                        onClick={onGetCameras}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Get Cameras
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoDisplay: React.FC<{
    facingMode: string;
    videoPlayingStatus: string;
    cameraDevices: any[];
    messages: any[];
}> = ({ facingMode, videoPlayingStatus, cameraDevices, messages }) => (
    <>
        <InfoItem label="Facing Camera" value={facingMode} />
        <InfoItem label="Video Status" value={videoPlayingStatus} />
        <InfoItem label="Camera Devices" value={cameraDevices.map((device) => `${device.label}`).join(', ')} />
        <InfoItem label="Messages" value={messages.join(', ')} />
    </>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
        {label}: [{value}]
    </div>
);

export default BasicCamera;