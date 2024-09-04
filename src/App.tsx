import VideoContainer from './components/VideoContainer'
import './App.css'
import React from 'react';
import Logs from './components/Logs';

function App() {

  React.useEffect(() => {
    const logContainer = document.getElementById('log-container');

    window.console.log = console.log =
      window.console.error = console.error =
      window.console.warn = console.warn = function (message) {
        const logMessage = document.createElement('p');

        logMessage.textContent = message;
        logContainer?.appendChild(logMessage);
      };

    return () => {
    };
  }, []);

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center w-full">
      <div className='container max-w-[420px]'>
        <h1 className="text-2xl mt-2 text-center font-bold text-black dark:text-white">Flip Camera</h1>
        <VideoContainer />
        <Logs />
      </div>
    </div>
  )
}

export default App
