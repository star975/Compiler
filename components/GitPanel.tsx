import React from 'react';
import { FileNode } from '../types';
import { Plus, Minus, Check, RotateCw, GitBranch, GitCommit } from 'lucide-react';

interface GitPanelProps {
  modifiedFiles: FileNode[];
  stagedFiles: FileNode[];
  onStage: (id: string) => void;
  onUnstage: (id: string) => void;
  onCommit: (message: string) => void;
  isCommitting: boolean;
  logs: { hash: string; message: string; author: string }[];
  commitMessage: string;
  onCommitMessageChange: (msg: string) => void;
}

const GitPanel: React.FC<GitPanelProps> = ({
  modifiedFiles,
  stagedFiles,
  onStage,
  onUnstage,
  onCommit,
  isCommitting,
  logs,
  commitMessage,
  onCommitMessageChange
}) => {
  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commitMessage.trim()) {
      onCommit(commitMessage);
      onCommitMessageChange('');
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <GitBranch size={18} className="text-blue-400" />
          Source Control
        </h2>
        <div className="flex gap-1">
             <button title="Sync Changes" className="text-slate-400 hover:text-white"><RotateCw size={14}/></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        
        {/* Staged Changes */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex justify-between">
            <span>Staged Changes</span>
            {stagedFiles.length > 0 && <span className="bg-slate-800 px-1.5 rounded text-slate-300">{stagedFiles.length}</span>}
          </h3>
          <div className="space-y-0.5">
            {stagedFiles.length === 0 && (
                <div className="text-xs text-slate-600 px-2 italic">No staged changes</div>
            )}
            {stagedFiles.map(file => (
              <div key={file.id} className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-mono">{file.name}</span>
                    <span className="text-[10px] text-green-500 font-bold">M</span>
                </div>
                <button onClick={() => onUnstage(file.id)} className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Unstage Changes">
                  <Minus size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Changes */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex justify-between">
             <span>Changes</span>
             {modifiedFiles.length > 0 && <span className="bg-slate-800 px-1.5 rounded text-slate-300">{modifiedFiles.length}</span>}
          </h3>
          <div className="space-y-0.5">
            {modifiedFiles.length === 0 && (
                <div className="text-xs text-slate-600 px-2 italic">No changes</div>
            )}
            {modifiedFiles.map(file => (
              <div key={file.id} className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-mono">{file.name}</span>
                    <span className="text-[10px] text-yellow-500 font-bold">M</span>
                </div>
                <button onClick={() => onStage(file.id)} className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Stage Changes">
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Commit Input */}
        <div className="mt-4 px-2">
            <form onSubmit={handleCommitSubmit} className="flex flex-col gap-2">
                <textarea 
                    value={commitMessage}
                    onChange={(e) => onCommitMessageChange(e.target.value)}
                    placeholder="Message (Ctrl+Enter to commit)"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none h-20"
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            handleCommitSubmit(e);
                        }
                    }}
                />
                <button 
                    type="submit" 
                    disabled={stagedFiles.length === 0 || !commitMessage.trim() || isCommitting}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-blue-800 text-white text-xs font-bold py-2 rounded transition-all"
                >
                    {isCommitting ? (
                        <span>Committing...</span>
                    ) : (
                        <>
                            <Check size={14} />
                            Commit
                        </>
                    )}
                </button>
            </form>
        </div>

        {/* History Snippet */}
        <div className="mt-6 pt-4 border-t border-slate-800">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Recent Commits</h3>
             <div className="space-y-2 px-2">
                 {logs.slice(0, 5).map(commit => (
                     <div key={commit.hash} className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-2">
                             <GitCommit size={12} className="text-slate-500" />
                             <span className="text-xs font-medium text-slate-300 truncate">{commit.message}</span>
                         </div>
                         <div className="flex justify-between items-center pl-5">
                             <span className="text-[10px] text-slate-500">{commit.hash.substring(0, 7)}</span>
                             <span className="text-[10px] text-slate-600">{commit.author}</span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
};

export default GitPanel;