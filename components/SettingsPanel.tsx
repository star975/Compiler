import React, { useState, useEffect } from 'react';
import { KeyBinding } from '../types';
import { Keyboard, RotateCcw } from 'lucide-react';
import { DEFAULT_KEYBINDINGS } from '../constants';

interface SettingsPanelProps {
  bindings: KeyBinding[];
  onUpdateBinding: (id: string, newKeys: string) => void;
  onResetDefaults: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ bindings, onUpdateBinding, onResetDefaults }) => {
  const [recordingId, setRecordingId] = useState<string | null>(null);

  useEffect(() => {
    if (!recordingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore single modifier key presses
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Meta');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      // Determine main key
      let mainKey = e.key.toUpperCase();
      if (mainKey === ' ') mainKey = 'Space';
      if (mainKey === '.') mainKey = '.'; // Keep dot simple
      
      // Filter out modifier names from mainKey if any weirdness happens
      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(mainKey)) {
          keys.push(mainKey);
      }

      const keyString = keys.join('+');
      onUpdateBinding(recordingId, keyString);
      setRecordingId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingId, onUpdateBinding]);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <Keyboard size={18} className="text-blue-400" />
          Keybindings
        </h2>
        <button 
            onClick={onResetDefaults}
            className="text-slate-500 hover:text-white" 
            title="Reset Defaults"
        >
            <RotateCcw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs text-slate-500 px-2 mb-4">
            Click on a shortcut to record a new key combination.
        </p>

        <div className="space-y-2">
            {bindings.map(binding => (
                <div key={binding.id} className="bg-slate-950/50 rounded p-3 border border-slate-800 flex flex-col gap-2">
                    <span className="text-sm text-slate-300 font-medium">{binding.label}</span>
                    <button 
                        onClick={() => setRecordingId(binding.id)}
                        className={`flex items-center justify-center px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                            recordingId === binding.id 
                            ? 'bg-blue-900/50 border-blue-500 text-blue-200 animate-pulse' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                    >
                        {recordingId === binding.id ? 'Listening...' : binding.keys}
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
