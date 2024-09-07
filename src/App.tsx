import './App.css';
import React, { useEffect, useState } from 'react';
import Logs from './components/Logs';
import MediaDevicesCam from './components/MediaDevicesCam';
import ReactWebCam from './components/ReactWebCamVendor';
import BasicCamera from './components/BasicCamera';
import { fetchLatestCommitHash } from './services/github';
import CameraSelector from './components/CameraSelector';
import { useLog } from './hooks/LogContext';

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
  const [hash, setHash] = useState<string>('');
  const [cameraOption, setCameraOption] = useState('MediaDevicesCam');

  useEffect(() => {
    const fetchAndSetHash = async () => {
      const newHash = await fetchLatestCommitHash();
      setHash(newHash.substring(1, 7));
    };

    fetchAndSetHash();
  }, []);

  const onOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearLogs();
    setCameraOption(e.target.value);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center w-full">
      <div className='container max-w-[420px] items-center justify-center text-center'>
        <h1 className="text-2xl mt-2 text-center font-bold text-black dark:text-white">Flip Camera</h1>
        <CameraSelector selected={cameraOption} onOptionChange={onOptionChange} options={cameraOptions} />
        <CameraDisplay selected={cameraOption} />
        <Logs />
      </div>
      <p className='min-w-[400px] mb-2 text-center text-gray-500 bg-black border border-gray-400 rounded text-xs p-1'>version : {hash}</p>
    </div>
  );
};

export default App;