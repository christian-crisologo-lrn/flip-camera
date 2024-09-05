import React from "react";

export default function Logs() {
    const [showLog, setShowLog] = React.useState(false);

    const toggleLog = () => {
        setShowLog(!showLog);
    }

    return (
        <div className="container p-5 align-center ">
            <button
                onClick={toggleLog}
                className="bg-gray-500 text-white px-4 py-2 rounded"
            >
                Show logs
            </button>
            <div id="log-container" className="mt-2 px-4  py-2 text-left bg-black text-gray-100 h-64 overflow-y-auto min-w-full max-w-full overflow-x-auto border border-gray-300 p-2"
                style={{
                    display: showLog ? 'block' : 'none'
                }}></div>
        </div>
    );
};