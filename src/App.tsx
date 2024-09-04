import VideoContainer from './components/VideoContainer'
import './App.css'
import React from 'react';





function App() {

  React.useEffect(() => {
    const logContainer = document.getElementById('log-container');

    window.console.log = console.log =
      window.console.error = console.error =
      window.console.warn = console.warn = function (message) {
        const logMessage = document.createElement('div');

        logMessage.textContent = message;
        logContainer?.appendChild(logMessage);
      };

    return () => {
    };
  }, []);

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-black dark:text-white">Flip Camera</h1>
      <VideoContainer />
      LOGS:
      <div id="log-container" className="mt-2 px-4 py-2 bg-black text-gray-100 "></div>
    </div>
  )
}

export default App
