import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import ActivityBar from './components/ActivityBar';
import SettingsPanel from './components/SettingsPanel';
import ChatPanel from './components/ChatPanel';
import ExtensionsPanel from './components/ExtensionsPanel';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import { FileNode, TerminalLog, SidebarView, Commit, KeyBinding, Extension } from './types';
import { INITIAL_FILES, INITIAL_COMMITS, DEFAULT_KEYBINDINGS, AVAILABLE_EXTENSIONS } from './constants';
import { runPythonCode, explainCode, fixCode, formatCode } from './services/geminiService';
import { Play, Bug, MessageSquare, Loader2, Sparkles, Terminal as TerminalIcon, XCircle, GitBranch, Upload, Download, AlignLeft, Radio } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>(INITIAL_FILES[0].id);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Extensions State
  const [extensions, setExtensions] = useState<Extension[]>(AVAILABLE_EXTENSIONS);
  const [isLiveServerRunning, setIsLiveServerRunning] = useState(false);
  const [liveServerContent, setLiveServerContent] = useState<string>('');

  // AI State
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // UI State
  const [activeSidebarView, setActiveSidebarView] = useState<SidebarView>('explorer');
  const [keyBindings, setKeyBindings] = useState<KeyBinding[]>(DEFAULT_KEYBINDINGS);

  // Git State
  const [commits, setCommits] = useState<Commit[]>(INITIAL_COMMITS);
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  const activeFile = files.find(f => f.id === activeFileId);
  const isPrettierInstalled = extensions.find(e => e.id === 'prettier-python')?.installed;
  const isLiveServerInstalled = extensions.find(e => e.id === 'live-server')?.installed;
  
  // Refs for current state access in event listeners
  const activeFileRef = useRef(activeFile);
  const isRunningRef = useRef(isRunning);
  const isAiProcessingRef = useRef(isAiProcessing);
  
  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isAiProcessingRef.current = isAiProcessing; }, [isAiProcessing]);

  // --- HELPERS ---
  const addLog = useCallback((content: string, type: TerminalLog['type'] = 'info') => {
    setTerminalLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        content,
        type,
        timestamp: Date.now()
      }
    ]);
  }, []);

  // --- ACTIONS ---
  const handleRun = useCallback(async () => {
    const file = activeFileRef.current;
    if (!file || isRunningRef.current) return;

    setIsRunning(true);
    addLog(`> python ${file.name}`, 'system');

    try {
      const output = await runPythonCode(file.content);
      if (output) {
         addLog(output, 'info');
         // Live Server Update
         if (isLiveServerRunning) {
             setLiveServerContent(output);
         }
      } else {
         addLog("", 'info');
      }
    } catch (e) {
      addLog("Failed to execute code.", 'error');
    } finally {
      setIsRunning(false);
    }
  }, [addLog, isLiveServerRunning]);

  const handleFormat = async () => {
      const file = activeFileRef.current;
      if (!file || isAiProcessingRef.current) return;

      setIsAiProcessing(true);
      try {
          const formatted = await formatCode(file.content);
          handleUpdateContent(formatted);
          addLog("Code formatted successfully.", 'success');
      } catch (e) {
          addLog("Formatting failed.", 'error');
      } finally {
          setIsAiProcessing(false);
      }
  };

  const handleAiAction = useCallback(async (action: 'explain' | 'fix') => {
    const file = activeFileRef.current;
    if (!file || isAiProcessingRef.current) return;
    
    setIsAiProcessing(true);
    setAiResponse(null);
    setShowAiModal(true);

    try {
      let result = "";
      if (action === 'explain') {
        result = await explainCode(file.content);
      } else if (action === 'fix') {
        result = await fixCode(file.content);
      }
      setAiResponse(result);
    } catch (e) {
      setAiResponse("Error connecting to AI Assistant.");
    } finally {
      setIsAiProcessing(false);
    }
  }, []);

  // --- SHORTCUTS LISTENER ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
      
      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Meta');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      let mainKey = e.key.toUpperCase();
      if (mainKey === 'ENTER') mainKey = 'Enter';
      if (mainKey === ' ') mainKey = 'Space';
      if (mainKey === '.') mainKey = '.'; 
      if (['CONTROL', 'SHIFT', 'ALT', 'META'].includes(mainKey)) return; 
      
      keys.push(mainKey);
      const keyString = keys.join('+');

      const binding = keyBindings.find(b => b.keys === keyString);

      if (binding) {
        e.preventDefault();
        
        switch (binding.actionId) {
            case 'run':
                handleRun();
                break;
            case 'explain':
                handleAiAction('explain');
                break;
            case 'fix':
                handleAiAction('fix');
                break;
            case 'toggle_sidebar':
                setActiveSidebarView(prev => {
                    if (prev === 'explorer') return 'git';
                    if (prev === 'git') return 'chat';
                    if (prev === 'chat') return 'extensions';
                    if (prev === 'extensions') return 'settings';
                    return 'explorer';
                });
                break;
            case 'focus_git':
                setActiveSidebarView('git');
                break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [keyBindings, handleRun, handleAiAction]);

  // --- GIT LOGIC ---
  const headCommit = commits[0]; 

  const { modifiedFiles, untrackedFiles } = useMemo(() => {
    const headFilesMap = new Map<string, FileNode>(headCommit.files.map(f => [f.id, f]));
    const modified: FileNode[] = [];
    const untracked: FileNode[] = [];

    files.forEach(file => {
      const headFile = headFilesMap.get(file.id);
      if (!headFile) {
        untracked.push(file); 
      } else if (headFile.content !== file.content) {
        modified.push(file); 
      }
    });

    return { modifiedFiles: [...modified, ...untracked], untrackedFiles: untracked };
  }, [files, headCommit]);

  const stagedFilesList = useMemo(() => {
    return files.filter(f => stagedFileIds.has(f.id));
  }, [files, stagedFileIds]);

  const allChangedFiles = modifiedFiles.filter(f => !stagedFileIds.has(f.id));

  const handleStage = (id: string) => {
    setStagedFileIds(prev => new Set(prev).add(id));
  };

  const handleUnstage = (id: string) => {
    setStagedFileIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCommit = (message: string) => {
    setIsCommitting(true);
    setTimeout(() => {
      const headFilesMap = new Map(headCommit.files.map(f => [f.id, f]));
      const stagedFilesSnapshot = files.filter(f => stagedFileIds.has(f.id));
      const newSnapshotFiles: FileNode[] = [];
      const processedIds = new Set<string>();

      stagedFilesSnapshot.forEach(f => {
        newSnapshotFiles.push({ ...f }); 
        processedIds.add(f.id);
      });

      headCommit.files.forEach(f => {
        if (!processedIds.has(f.id)) {
           newSnapshotFiles.push({ ...f });
        }
      });

      const newCommit: Commit = {
        hash: Math.random().toString(16).substr(2, 7),
        message,
        timestamp: Date.now(),
        files: newSnapshotFiles,
        author: 'User'
      };

      setCommits([newCommit, ...commits]);
      setStagedFileIds(new Set());
      setIsCommitting(false);
      addLog(`> git commit -m "${message}"`, 'success');
      addLog(`[master ${newCommit.hash}] ${message}`, 'info');
    }, 500);
  };

  const handlePush = () => {
    addLog("> git push origin main", 'system');
    setTimeout(() => {
        addLog("Enumerating objects: 5, done.", 'info');
        addLog("Writing objects: 100% (3/3), 283 bytes | 283.00 KiB/s, done.", 'info');
        addLog("To https://github.com/user/project.git", 'info');
        addLog("   34a2...5b1  main -> main", 'success');
    }, 1000);
  };

  const handlePull = () => {
    addLog("> git pull origin main", 'system');
     setTimeout(() => {
        addLog("Already up to date.", 'info');
    }, 800);
  };


  // --- FILE OPERATIONS ---
  const handleCreateFile = (name: string) => {
    const newFile: FileNode = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content: '# New Python Script\n\n',
      language: 'python'
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) {
        addLog("Cannot delete the last file.", "error");
        return;
    }
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const handleRenameFile = (id: string, newName: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleUpdateContent = (newContent: string) => {
    if (activeFileId) {
      setFiles(files.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
    }
  };

  // --- EXTENSIONS HANDLERS ---
  const toggleExtension = (id: string) => {
      setExtensions(prev => prev.map(e => e.id === id ? { ...e, installed: !e.installed } : e));
  };

  const handleApplyCode = (code: string) => {
      handleUpdateContent(code);
      addLog("Copilot code applied to editor.", 'success');
  };

  // --- OTHER HANDLERS ---
  const applyFix = () => {
      if (aiResponse && activeFileId) {
          handleUpdateContent(aiResponse);
          setShowAiModal(false);
          addLog("Code updated with AI fix.", 'success');
      }
  };

  const updateKeyBinding = (id: string, newKeys: string) => {
      setKeyBindings(prev => prev.map(b => b.id === id ? { ...b, keys: newKeys } : b));
      addLog(`Shortcut updated: ${newKeys}`, 'system');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar Area */}
      <div className="flex h-full border-r border-slate-800">
          <ActivityBar 
            activeView={activeSidebarView} 
            onViewChange={setActiveSidebarView} 
            changesCount={allChangedFiles.length}
          />
          
          {activeSidebarView === 'explorer' && (
            <FileExplorer 
              files={files}
              activeFileId={activeFileId}
              onSelectFile={setActiveFileId}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
            />
          )}

          {activeSidebarView === 'git' && (
            <GitPanel 
                modifiedFiles={allChangedFiles}
                stagedFiles={stagedFilesList}
                onStage={handleStage}
                onUnstage={handleUnstage}
                onCommit={handleCommit}
                isCommitting={isCommitting}
                logs={commits}
                commitMessage={commitMessage}
                onCommitMessageChange={setCommitMessage}
            />
          )}

          {activeSidebarView === 'chat' && (
            <ChatPanel activeFileContent={activeFile ? activeFile.content : ''} onApplyCode={handleApplyCode} />
          )}

          {activeSidebarView === 'extensions' && (
              <ExtensionsPanel extensions={extensions} onToggleInstall={toggleExtension} />
          )}

          {activeSidebarView === 'settings' && (
              <SettingsPanel 
                bindings={keyBindings}
                onUpdateBinding={updateKeyBinding}
                onResetDefaults={() => setKeyBindings(DEFAULT_KEYBINDINGS)}
              />
          )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
             {activeFile ? (
                 <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    {activeFile.name}
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <GitBranch size={10} /> main
                    </span>
                 </span>
             ) : <span className="text-sm text-slate-500">No file selected</span>}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePull} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Pull">
                <Download size={14} />
            </button>
            <button onClick={handlePush} className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Push">
                <Upload size={14} />
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            {/* Extensions Actions */}
            {isPrettierInstalled && (
                <button 
                    onClick={handleFormat}
                    disabled={!activeFile || isAiProcessing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                    title="Format Code (Prettier)"
                >
                    <AlignLeft size={14} />
                    Format
                </button>
            )}

            {isLiveServerInstalled && (
                 <button 
                    onClick={() => {
                        setIsLiveServerRunning(!isLiveServerRunning);
                        if (!isLiveServerRunning) handleRun(); // Auto run on start
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        isLiveServerRunning 
                        ? 'bg-orange-600 text-white animate-pulse' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Toggle Live Server"
                >
                    <Radio size={14} />
                    {isLiveServerRunning ? 'Go Live (On)' : 'Go Live'}
                </button>
            )}

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            <button 
              onClick={() => handleAiAction('explain')}
              disabled={!activeFile || isAiProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              title={keyBindings.find(b => b.actionId === 'explain')?.keys}
            >
              {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Explain
            </button>
            <button 
              onClick={() => handleAiAction('fix')}
              disabled={!activeFile || isAiProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              title={keyBindings.find(b => b.actionId === 'fix')?.keys}
            >
              {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Bug size={14} />}
              Fix
            </button>
            
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            <button 
              onClick={handleRun}
              disabled={!activeFile || isRunning}
              className="flex items-center gap-2 px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
              title={keyBindings.find(b => b.actionId === 'run')?.keys}
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              RUN
            </button>
          </div>
        </div>

        {/* Editor Area (with Split View for Live Server) */}
        <div className="flex-1 min-h-0 relative flex">
            {/* Main Editor */}
            <div className={`h-full ${isLiveServerRunning ? 'w-1/2 border-r border-slate-800' : 'w-full'} relative`}>
                {activeFile ? (
                    <CodeEditor 
                    content={activeFile.content}
                    onChange={handleUpdateContent}
                    fileName={activeFile.name}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <TerminalIcon size={48} className="mb-4 opacity-20" />
                        <p>Select a file to start coding</p>
                    </div>
                )}
            </div>

            {/* Live Server Preview Pane */}
            {isLiveServerRunning && (
                <div className="w-1/2 bg-slate-100 h-full flex flex-col">
                    <div className="h-8 bg-slate-200 border-b border-slate-300 flex items-center px-2 text-xs text-slate-600">
                        <span className="font-bold mr-2">Live Preview</span>
                        <span>http://127.0.0.1:5500/index.html</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-white text-black p-4 font-sans">
                         {/* We treat the stdout as potential HTML for the live server */}
                         {liveServerContent ? (
                             <div dangerouslySetInnerHTML={{ __html: liveServerContent }} />
                         ) : (
                             <div className="text-slate-400 italic text-center mt-10">Waiting for output...</div>
                         )}
                    </div>
                </div>
            )}
          
          {/* AI Modal Overlay */}
          {showAiModal && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                        <h3 className="flex items-center gap-2 text-slate-100 font-medium">
                            <Sparkles size={16} className="text-purple-400" />
                            AI Assistant
                        </h3>
                        <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white"><XCircle size={20}/></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-sm leading-6">
                        {isAiProcessing ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                                <p className="text-slate-500">Analyzing code...</p>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap font-mono bg-slate-950 p-4 rounded border border-slate-800">
                                {aiResponse}
                            </div>
                        )}
                    </div>
                    {!isAiProcessing && aiResponse && !aiResponse.startsWith("Error") && (
                        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900">
                           <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 text-sm">Close</button>
                           <button onClick={applyFix} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Apply Fix</button>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>

        {/* Terminal Area */}
        <Terminal 
          logs={terminalLogs}
          onClear={() => setTerminalLogs([])}
          isRunning={isRunning}
        />
        
      </div>
    </div>
  );
};

export default App;
