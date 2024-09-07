import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export const overrideConsoleLogs = (callback: Function) => {

  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console methods
  window.console.log = console.log = function (...args: any[]) {
    originalLog.apply(console, args); // Call original method
    callback('info', args[0]);
  };

  window.console.error = console.error = function (...args: any[]) {
    originalError.apply(console, args); // Call original method
    callback('error', args[0]);
  };

  window.console.warn = console.warn = function (...args: any[]) {
    originalWarn.apply(console, args);
    callback('warn', args[0]);
  };
};

interface LogContextProps {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextProps | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const callback = (type: string, message: string) => {
      addLog(`[${type.toUpperCase()}] ${message}`);
    };

    overrideConsoleLogs(callback);
  }, []);

  const addLog = (log: string) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = (): LogContextProps => {
  const context = useContext(LogContext);

  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};