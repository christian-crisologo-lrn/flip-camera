import React from "react";
import { useLog } from "../hooks/LogContext";

export default function Logs() {
    const [showLog, setShowLog] = React.useState(false);
    const { logs, clearLogs } = useLog();

    const toggleLog = () => {
        setShowLog(!showLog);
    };

    return (
        <div className="container p-5 align-center">
            <button
                onClick={toggleLog}
                className="bg-gray-500 text-white px-4 py-2 rounded"
            >
                {showLog ? 'Hide logs' : 'Show logs'}
            </button>
            <button
                onClick={clearLogs}
                className="bg-red-500 text-white px-4 py-2 rounded ml-2"
            >
                Clear logs
            </button>
            <div
                id="log-container"
                className="mt-2 px-4 py-2 text-left bg-black text-gray-100 h-64 overflow-y-auto min-w-full max-w-full overflow-x-auto border border-gray-300 p-2"
                style={{
                    display: showLog ? 'block' : 'none',
                }}
            >
                {logs.map((log: string, index: number) => (
                    <p className="text-sm mb-1" key={index}>{log}</p>
                ))}
            </div>
        </div>
    );
}