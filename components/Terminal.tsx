import React, { useRef, useEffect } from 'react';
import { TerminalLog } from '../types';
import { Terminal as TerminalIcon, XCircle, Trash } from 'lucide-react';

interface TerminalProps {
  logs: TerminalLog[];
  onClear: () => void;
  isRunning: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onClear, isRunning }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-64 bg-black border-t border-slate-800 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Terminal</span>
          {isRunning && (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-800 text-[10px] text-blue-300 animate-pulse">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
               Executing...
             </span>
          )}
        </div>
        <button 
          onClick={onClear} 
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Clear Console"
        >
          <Trash size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
        {logs.length === 0 && (
           <div className="text-slate-600 italic">Ready to execute. Press Run to start.</div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="break-words whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="flex gap-2">
              <span className="text-slate-600 select-none opacity-50 text-xs mt-1">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <div className={`flex-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'system' ? 'text-blue-400 italic' :
                'text-slate-300'
              }`}>
                {log.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
