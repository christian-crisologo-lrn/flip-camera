import './App.css';
import React, { useState } from 'react';
import Logs from './components/Logs';
import MediaDevicesCam from './components/MediaDevicesCam';
import ReactWebCam from './components/ReactWebCamVendor';
import BasicCamera from './components/BasicCamera';
import CameraSelector from './components/CameraSelector';
import { useLog } from './hooks/LogContext';
import VersionBox from './components/VersionBox';

const cameraOptions = ['BasicCamera', 'ReactWebCam', 'MediaDevicesCam'];

const CameraDisplay: React.FC<{ selected: string }> = ({ selected }) => {
  switch (selected) {
    case 'BasicCamera':
      return <BasicCamera />;
    case 'ReactWebCam':
      return <ReactWebCam />;
    case 'MediaDevicesCam':
      return <MediaDevicesCam />;
    default:
      return null;
  }
};

const App: React.FC = () => {
  const { clearLogs } = useLog();
  const [cameraOption, setCameraOption] = useState('MediaDevicesCam');

  const onOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearLogs();
    setCameraOption(e.target.value);
    console.log('Camera option changed to:', e.target.value);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center w-full">
      <div className='container max-w-[420px] items-center justify-center text-center'>
        <h1 className="text-2xl mt-2 text-center font-bold text-black dark:text-white">Flip Camera</h1>
        <CameraSelector selected={cameraOption} onOptionChange={onOptionChange} options={cameraOptions} />
        <CameraDisplay selected={cameraOption} />
        <Logs />
        <VersionBox />
      </div>

    </div>
  );
};

export default App;