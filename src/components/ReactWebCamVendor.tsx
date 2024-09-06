import React, { useRef, useState } from 'react';
import classname from 'classnames';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import WebCam from 'react-webcam';

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const ReactWebCamVendor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [recorder, setRecorder] = useState<RecordRTC | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [facingMode, setFacingMode] = useState<string>(FACING_MODE_ENVIRONMENT);
    const [messages, setMessages] = useState<string[]>([]);

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

    const toggleCamera = () => {
        const newFacingMode = facingMode === FACING_MODE_USER ? FACING_MODE_ENVIRONMENT : FACING_MODE_USER;
        setFacingMode(newFacingMode);
        setMessages([...messages, `Toggling camera facing mode: ${newFacingMode}`]);
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
                        <WebCam
                            height={380}
                            width={285}
                            audio={false}
                            videoConstraints={{ facingMode }}
                        />
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
                    <InfoDisplay facingMode={facingMode} messages={messages} />
                </div>
            </div>
        </div>
    );
};

const InfoDisplay: React.FC<{ facingMode: string; messages: string[] }> = ({ facingMode, messages }) => (
    <>
        <InfoItem label="Facing Camera" value={facingMode} />
        <InfoItem label="Messages" value={messages.join(', ')} />
    </>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
        {label}: [{value}]
    </div>
);

export default ReactWebCamVendor;