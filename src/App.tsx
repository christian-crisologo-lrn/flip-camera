import './App.css'
import React from 'react';
import Logs from './components/Logs';
import MediaDevicesCam from './components/MediaDevicesCam';
import ReactWebCam from './components/ReactWebCamVendor';
import BasicCamera from './components/BasicCamera';

const repoURL = "https://api.github.com/repos/christian-crisologo-lrn/flip-camera/commits";
const fetchLatestCommitHash = async () => {
  try {
    const response = await fetch(repoURL);
    const data = await response.json();
    return JSON.stringify((data[0].sha));
  } catch (error) {
    console.error('Error fetching commit hash:', error);
  }

  return '';
};

const initLog = () => {
  const logContainer = document.getElementById('log-container');
  window.console.log = console.log =
    window.console.error = console.error =
    window.console.warn = console.warn = function (message) {
      const logMessage = document.createElement('p');

      logMessage.textContent = message;
      logContainer?.appendChild(logMessage);
    };
}

const clearLog = () => {
  const logContainer = document.getElementById('log-container');

  if (logContainer) {
    logContainer.innerHTML = '';
  }
}


function App() {

  const [hash, setHash] = React.useState<string>('');
  const [cameraOption, setCameraOption] = React.useState('BasicCamera');

  React.useEffect(() => {

    const fetchAndSetHash = async () => {
      const newHash = await fetchLatestCommitHash();
      setHash(newHash.substring(1, 7));
    };

    initLog();
    fetchAndSetHash();

    return () => {
    };
  }, []);

  const options = ['BasicCamera', 'ReactWebCam', 'MediaDevicesCam'];
  const onOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearLog
    setCameraOption(e.target.value);
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center w-full">
      <div className='container max-w-[420px] items-center justify-center text-center '>
        <h1 className="text-2xl mt-2 text-center font-bold text-black dark:text-white">Flip Camera</h1>
        <div className="w-full">
          <label htmlFor="dropdown" className="block text-sm font-medium text-gray-700 mb-1">Select an option:</label>
          <select
            id="dropdown"
            onChange={onOptionChange}
            defaultValue={cameraOption}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="" disabled selected>Select a camera sample</option>
            {
              options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))
            }
          </select>
        </div>
        {
          cameraOption === 'BasicCamera' && <BasicCamera />
        }
        {
          cameraOption === 'ReactWebCam' && <ReactWebCam />
        }
        {
          cameraOption === 'MediaDevicesCam' && <MediaDevicesCam />
        }
        <Logs />
      </div>
      <p className='min-w-[400px] mb-2 text-center text-gray-500 bg-black border border-gray-400 rounded text-xs p-1 '>version : {hash}</p>
    </div>
  )
}

export default App
