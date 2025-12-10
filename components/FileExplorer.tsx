import React, { useState } from 'react';
import { FileNode } from '../types';
import { FileCode, Plus, Trash2, FolderOpen, Edit2, Check, X } from 'lucide-react';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      let finalName = newFileName.trim();
      if (!finalName.endsWith('.py')) finalName += '.py';
      onCreateFile(finalName);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const startEditing = (file: FileNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditingName(file.name);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editingName.trim()) {
      onRenameFile(editingId, editingName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <FolderOpen size={18} className="text-blue-400" />
          Explorer
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title="New File"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded animate-in fade-in slide-in-from-left-2">
            <FileCode size={16} className="text-slate-400" />
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500"
              placeholder="script.py"
            />
          </form>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${
              activeFileId === file.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            {editingId === file.id ? (
              <form onSubmit={handleRenameSubmit} onClick={e => e.stopPropagation()} className="flex items-center gap-1 w-full">
                 <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="bg-slate-950 text-white text-sm px-1 py-0.5 rounded border border-blue-500 w-full outline-none"
                  />
                  <button type="submit" className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCode size={16} className={activeFileId === file.id ? 'text-blue-200' : 'text-blue-500'} />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEditing(file, e)}
                    className={`p-1 rounded hover:bg-white/10 ${activeFileId === file.id ? 'text-white' : 'text-slate-400'}`}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className={`p-1 rounded hover:bg-white/10 ${activeFileId === file.id ? 'text-white' : 'text-slate-400'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {files.length === 0 && !isCreating && (
          <div className="text-center py-8 text-slate-600 text-sm">
            No files. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
