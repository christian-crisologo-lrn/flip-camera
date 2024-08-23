import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import { canFlipCamera } from '../utils/media';

const VideoContainer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [shouldFaceUser, setShouldFaceUser] = useState<boolean>(true);
    const [showFlipCamera, setShowFlipCamera] = useState<boolean>(false);
    const [activeStream, setActiveStream] = useState<any>(null);
    const [streamStatus, setStreamStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);

    useEffect(() => {
        const getMediaStream = () => {
            setStreamStatus('Getting media stream...');

            let constraints: any = {
                audio: false,
                video: {
                    width: { min: 480, ideal: 640, max: 960 },
                    height: { min: 480, ideal: 480, max: 480 },
                    facingMode: 'user'
                }
            };

            if (videoRef.current) {
                // If camera is flipped, change the facing mode
                constraints.video.facingMode = shouldFaceUser ? 'user' : 'environment';
                constraints.video.width.min = videoRef.current.clientWidth || 480;
                constraints.video.height.min = videoRef.current.clientHeight || 480;

                navigator.mediaDevices.getUserMedia(constraints)
                    .then(stream => {
                        videoRef.current!.srcObject = stream;
                        videoRef.current!.play();
                        setActiveStream(stream);
                        setStreamStatus('streaming...');
                        setIsLoading(false);
                    })
                    .catch(error => {
                        console.error('Error accessing media devices.', error);
                        setStreamStatus('Error accessing media devices.');
                        setIsLoading(false);
                    });
            }
        };

        if (videoRef.current) {
            getMediaStream();
        }
    }, [shouldFaceUser]);

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

    useEffect(() => {
        canFlipCamera().then((canFlip) => {
            setShowFlipCamera(canFlip);
        });
    }, []);

    const toggleCamera = () => {
        setShouldFaceUser(prevState => !prevState);
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

    const recordBtnCls = classname(
        { 'bg-red-500 hover:bg-red-600': isRecording },
        { 'bg-blue-500 hover:bg-blue-600': !isRecording },
        'mt-2 text-white font-bold py-2 px-4 rounded min-w-[250px]',
    );

    return (
        <div className="container">
            <div className="p-4 align-center">
                <div className="mt-2 border align-center p-2">
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
                            width={480}
                            height={480}
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
                            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md min-w-[150px]"
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
                    {
                        showFlipCamera && <button
                            onClick={toggleCamera}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                        >
                            Flip Camera {shouldFaceUser ? 'User' : 'Environment'}
                        </button>
                    }

                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        Stream status : {streamStatus}
                    </div>

                    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                        ActiveStream :{activeStream && activeStream.getVideoTracks()[0].label}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoContainer;