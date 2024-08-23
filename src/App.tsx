import VideoContainer from './components/VideoContainer'
import './App.css'

function App() {

  return (
    <div className="bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-black dark:text-white">Flip Camera</h1>
      <VideoContainer />
    </div>
  )
}

export default App
