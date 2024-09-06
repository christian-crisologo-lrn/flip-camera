import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';

const ReactWebCamVendor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [facingMode, setFacingMode] = useState<string>('user');
    const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
    const [videoPlayingStatus, setVideoPlayingStatus] = useState<string>('idle');
    const [cameraDevices, setCameraDevices] = useState<any>([]);
    const [messages, setMessages] = useState<any>([]);

    const connectToStream = async (facingMode: string = 'user') => {
        setIsLoading(true);
        setFacingMode(facingMode);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            playStreamToVideo(stream);

        } catch (error: any) {
            console.error('Error accessing media devices.', error);
            setMessages((messages: []) => [...messages, 'getUserMedia is not supported in this browser.']);
            setIsLoading(false);
            if (error.name === 'NotAllowedError') {
                setVideoPlayingStatus('Permissions to access camera were denied.');
                setVideoPlayingStatus('Permissions to access camera were denied.');
            } else if (error.name === 'NotFoundError') {
                setVideoPlayingStatus('No camera device found.');
            } else if (error.name === 'NotReadableError') {
                setVideoPlayingStatus('Camera is already in use.');
            } else {
                setVideoPlayingStatus('An error occurred while accessing the camera.');
            }
        };
    };

    useEffect(() => {

        if (videoRef.current) {
            connectToStream('environment');
        }

        return () => {
            // Cleanup media stream on component unmount
            currentStream && currentStream.getTracks().forEach(track => track.stop());
            // videoRef.current && videoRef.current.srcObject && (videoRef.current.srcObject = null);
        };
    }, []);

    const startRecording = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const newRecorder = new RecordRTC(stream, { type: 'video' });
            newRecorder.startRecording();
            setRecorder(newRecorder);
            setIsRecording(true);
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.onwaiting = () => setVideoStatus('buffering');
            videoRef.current.onplaying = () => setVideoStatus('playing');
            videoRef.current.onpause = () => setVideoStatus('paused');
            videoRef.current.onended = () => setVideoStatus('ended');
            videoRef.current.onerror = () => setVideoStatus('error');
            videoRef.current.onloadeddata = () => setVideoStatus('data loaded');
            videoRef.current.oncanplay = () => {
                setIsLoading(false);
                setVideoStatus('can play');
            };
            videoRef.current.oncanplaythrough = () => {
                setIsLoading(false);
                setVideoStatus('can play through');
            };
            videoRef.current.onstalled = () => setVideoStatus('stalled');
            videoRef.current.onseeked = () => setVideoStatus('seeked');
            videoRef.current.onseeking = () => setVideoStatus('seeking');
        }
    }, []);

    const setVideoStatus = (status: string) => {
        setVideoPlayingStatus(status);
        console.log(`Video status: ${status}`);
    };

    const playStreamToVideo = (stream: any) => {
        if (videoRef.current && stream) {
            setCurrentStream(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    }

    const toggleCamera = async () => {
        setIsLoading(true);
        pauseVideo();
        try {
            const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
            const stream = await connectToStream(newFacingMode);

            playStreamToVideo(stream);
            setMessages([...messages, `Toggling camera facing mode changed : ${facingMode}`]);
            setIsLoading(false);
            // setFacingMode(mediaDevice.getFacingMode());
        } catch (error) {
            console.error('Error toggling camera facing mode.', error);
            setMessages([...messages, `Error toggling camera facing mode : ${error}`]);
            setIsLoading(false);
        }
    };


    const onGetCameras = async () => {
        let _cameraDevices: { deviceId: string; label: string; }[] = [];

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

            console.log('MediaDevices - devices ' + JSON.stringify(videoInputDevices));

            _cameraDevices = videoInputDevices.map(device => {
                return {
                    deviceId: device.deviceId,
                    label: device.label
                };
            });
        } catch (error) {
            console.error('Error enumerating camera devices: ' + JSON.stringify(error));
        }

        setCameraDevices(_cameraDevices);
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
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const pauseVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // const onVideoRefChange = (ref: HTMLVideoElement) => {
    //     if (ref) {
    //         videoRef = ref;
    //     }
    // }

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
                            className=""
                            width={380}
                            height={285}
                            autoPlay={true}
                            playsInline={true}
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
                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        Facing Camera : [{facingMode}]
                    </div>
                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        Video status : [{videoPlayingStatus}]
                    </div>
                    <button
                        onClick={onGetCameras}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Get Cameras
                    </button>
                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        Camera Devices : {cameraDevices.map((device: any) => `${device.label} - (${device.facingMode})`)
                            .map((device: any, index: number) => (<p key={index}>{device}</p>))}
                    </div>
                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        Messages : {messages.map((message: any, index: number) => (<p key={index}>{message}</p>))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReactWebCamVendor;