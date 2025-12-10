import React from 'react';
import { Extension } from '../types';
import { Blocks, AlignLeft, Radio, Folder, Download, Trash2, CheckCircle2 } from 'lucide-react';

interface ExtensionsPanelProps {
  extensions: Extension[];
  onToggleInstall: (id: string) => void;
}

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ extensions, onToggleInstall }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'AlignLeft': return <AlignLeft size={24} className="text-blue-400" />;
      case 'Radio': return <Radio size={24} className="text-orange-400" />;
      case 'Folder': return <Folder size={24} className="text-yellow-400" />;
      default: return <Blocks size={24} className="text-slate-400" />;
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <Blocks size={18} className="text-blue-400" />
          Extensions
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {extensions.map(ext => (
            <div key={ext.id} className="bg-slate-950/50 p-3 rounded border border-slate-800 flex gap-3 hover:bg-slate-800/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                    {getIcon(ext.icon)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-200 truncate">{ext.name}</h3>
                        {ext.installed && <CheckCircle2 size={14} className="text-green-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ext.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">v{ext.version}</span>
                        <button 
                            onClick={() => onToggleInstall(ext.id)}
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                                ext.installed 
                                ? 'bg-slate-800 text-slate-400 hover:bg-red-900/20 hover:text-red-400' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                            }`}
                        >
                            {ext.installed ? 'Uninstall' : 'Install'}
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ExtensionsPanel;
