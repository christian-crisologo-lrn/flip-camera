import './App.css'
import React from 'react';
import Logs from './components/Logs';
import VideoContainer from './components/VideoContainer';
import ReactWebCam from './components/ReactWebCamVendor';

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


function App() {

  const [hash, setHash] = React.useState<string>('');
  const [showVideoContainer, setShowVideoContainer] = React.useState<boolean>(true);

  React.useEffect(() => {

    const fetchAndSetHash = async () => {
      const newHash = await fetchLatestCommitHash();
      setHash(newHash);
    };

    const logContainer = document.getElementById('log-container');

    window.console.log = console.log =
      window.console.error = console.error =
      window.console.warn = console.warn = function (message) {
        const logMessage = document.createElement('p');

        logMessage.textContent = message;
        logContainer?.appendChild(logMessage);
      };

    fetchAndSetHash();

    return () => {
    };
  }, []);

  const toggleComponent = () => {
    setShowVideoContainer((prevState: any) => !prevState);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center w-full">
      <div className='container max-w-[420px] items-center justify-center text-center '>
        <h1 className="text-2xl mt-2 text-center font-bold text-black dark:text-white">Flip Camera</h1>
        <button
          onClick={toggleComponent}
          className="bg-gray-500 text-white text-sm px-4 py-2 rounded mt-4 self-center"
        >
          Toggle component: {showVideoContainer ? 'ReactWebCam' : 'VideoContainer'}
        </button>

        {showVideoContainer ? <VideoContainer /> : <ReactWebCam />}
        <Logs />
      </div>
      <p className='min-w-[400px] mb-2 text-center text-gray-500 bg-black border border-gray-400 rounded text-xs p-1 '>version : {hash}</p>
    </div>
  )
}

export default App
