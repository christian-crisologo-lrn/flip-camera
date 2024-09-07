const InfoDisplay: React.FC<{
    currentStream: MediaStream | null;
    facingMode: string;
    videoPlayingStatus: string;
    cameraDevices: MediaDeviceInfo[];
}> = ({ currentStream, facingMode, videoPlayingStatus, cameraDevices }) => (
    <>
        <InfoItem label="Current Stream" value={currentStream?.getVideoTracks()[0]?.label || 'No stream'} />
        <InfoItem label="Facing Camera" value={facingMode} />
        <InfoItem label="Video Status" value={videoPlayingStatus} />
        <InfoItem label="Camera Devices" value={cameraDevices.map((device) => `${device.label} - ()`).join(', ')} />
    </>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
        {label}: [{value}]
    </div>
);

export default InfoDisplay;