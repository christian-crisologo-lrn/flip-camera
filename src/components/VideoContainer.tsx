import React, { useEffect, useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import { getCameraOptions } from '../utils/media';

interface CameraOption {
    value: string;
    text: string;
}

const VideoContainer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [cameraSelected, setCameraSelected] = useState<CameraOption>();
    const [shouldFaceUser, setShouldFaceUser] = useState<boolean>(true);
    const [cameraOptions, setCameraOptions] = useState<CameraOption[]>([]);

    useEffect(() => {
        const getMediaStream = async () => {
            let constraints: MediaStreamConstraints = {
                audio: false,
                video: true,
            };

            if (videoRef.current) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia(
                        constraints,
                    );
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();

                    const videoWidth =
                        settings.width || videoRef.current.clientWidth || 192;
                    const videoHeight =
                        settings.height || videoRef.current.clientHeight || 192;

                    constraints.video = {
                        deviceId: { exact: cameraSelected?.value! },
                        facingMode: shouldFaceUser ? 'user' : 'environment',
                        width: {
                            min: videoWidth,
                        },
                        height: {
                            min: videoHeight,
                        },
                    };

                    // Apply the updated constraints
                    const updatedStream =
                        await navigator.mediaDevices.getUserMedia(constraints);
                    videoRef.current.srcObject = updatedStream;
                    videoRef.current.play();
                } catch (error) {
                    console.error('Error accessing media devices.', error);
                }
            }
        };

        if (cameraSelected && videoRef.current) {
            getMediaStream();
        }
    }, [cameraSelected]);

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
        const fetchCameraOptions = async () => {
            const options = await getCameraOptions();
            setCameraOptions(options);
        };

        fetchCameraOptions();
    }, []);

    useEffect(() => {
        if (cameraOptions.length > 0) {
            setCameraSelected(cameraOptions[0]);
        }
    }, [cameraOptions]);

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
                        ></video>
                    </div>
                </div>
                <div className="inline-flex mt-4 m-2 justify-between">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={recordBtnCls}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    {cameraOptions.length === 2 && (
                        <button
                            onClick={() => {
                                setShouldFaceUser(!shouldFaceUser);
                            }}
                            className="'mt-4 text-white font-bold py-2 px-4 rounded',"
                        >
                            Flip Camera
                        </button>
                    )}

                    {cameraOptions.length > 2 && (
                        <select
                            id="camera-select"
                            onChange={(e) => {
                                const selectedCamera = cameraOptions.find(
                                    (camera) => camera.value === e.target.value,
                                );
                                setCameraSelected(selectedCamera);
                            }}
                            className="mt-1 block w-1/2 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg rounded-md"
                        >
                            {cameraOptions.map((camera: CameraOption) => (
                                <option key={camera.value} value={camera.value}>
                                    {camera.text}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoContainer;
