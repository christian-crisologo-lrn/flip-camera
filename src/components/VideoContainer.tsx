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
                        setStreamStatus('Media stream ready!');
                    })
                    .catch(error => {
                        console.error('Error accessing media devices.', error);
                        setStreamStatus('Error accessing media devices.');
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

    const recordBtnCls = classname(
        { 'bg-red-500 hover:bg-red-600': isRecording },
        { 'bg-blue-500 hover:bg-blue-600': !isRecording },
        'mt-4 text-white font-bold py-2 px-4 rounded',
    );

    return (
        <div className="m-1">
            <h1 className="text-2xl font-bold mb-4 text-black">Flip Camera</h1>

            <div className="container p-5 align-center">
                <div className="mt-2 border align-center p-5">
                    <div className="flex justify-center items-center">
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
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={recordBtnCls}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>

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
                        Current Camera: {shouldFaceUser ? 'User (Front)' : 'Environment (Back)'}
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