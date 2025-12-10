import React from 'react';
import { Files, GitBranch, Settings, MessageSquareText, Blocks } from 'lucide-react';
import { SidebarView } from '../types';

interface ActivityBarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  changesCount?: number;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange, changesCount = 0 }) => {
  return (
    <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10">
      <button
        onClick={() => onViewChange('explorer')}
        className={`p-2 rounded transition-colors relative ${
          activeView === 'explorer' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="File Explorer"
      >
        <Files size={24} />
        {activeView === 'explorer' && (
           <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r"></div>
        )}
      </button>

      <button
        onClick={() => onViewChange('git')}
        className={`p-2 rounded transition-colors relative ${
          activeView === 'git' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Source Control"
      >
        <GitBranch size={24} />
        {changesCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white border border-slate-950">
            {changesCount}
          </span>
        )}
        {activeView === 'git' && (
           <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r"></div>
        )}
      </button>

      <button
        onClick={() => onViewChange('chat')}
        className={`p-2 rounded transition-colors relative ${
          activeView === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Copilot Chat"
      >
        <MessageSquareText size={24} />
        {activeView === 'chat' && (
           <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r"></div>
        )}
      </button>

      <button
        onClick={() => onViewChange('extensions')}
        className={`p-2 rounded transition-colors relative ${
          activeView === 'extensions' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Extensions"
      >
        <Blocks size={24} />
        {activeView === 'extensions' && (
           <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r"></div>
        )}
      </button>

      <div className="flex-1"></div>

      <button
        onClick={() => onViewChange('settings')}
        className={`p-2 rounded transition-colors relative ${
          activeView === 'settings' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Settings & Keybindings"
      >
        <Settings size={24} />
        {activeView === 'settings' && (
           <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white rounded-r"></div>
        )}
      </button>
    </div>
  );
};

export default ActivityBar;
