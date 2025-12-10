import React, { useRef, useState, useEffect, useMemo } from 'react';
import { getCodeCompletion } from '../services/geminiService';
import { Sparkles, Palette } from 'lucide-react';
import { highlightPython, Token } from '../utils/syntaxHighlighter';

interface CodeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  fileName?: string;
}

type Theme = 'twilight' | 'dracula' | 'monokai';

const THEMES: Record<Theme, { bg: string; text: string; colors: any }> = {
  twilight: {
    bg: 'bg-slate-900',
    text: 'text-slate-200',
    colors: {
      text: 'text-slate-200',
      string: 'text-green-400',
      comment: 'text-slate-500 italic',
      keyword: 'text-purple-400 font-bold',
      builtin: 'text-blue-400',
      function: 'text-yellow-300',
      decorator: 'text-yellow-500',
      number: 'text-orange-400',
      operator: 'text-pink-400',
      punctuation: 'text-slate-400',
    }
  },
  dracula: {
    bg: 'bg-[#282a36]',
    text: 'text-[#f8f8f2]',
    colors: {
      text: 'text-[#f8f8f2]',
      string: 'text-[#f1fa8c]',
      comment: 'text-[#6272a4] italic',
      keyword: 'text-[#ff79c6] font-bold',
      builtin: 'text-[#8be9fd]',
      function: 'text-[#50fa7b]',
      decorator: 'text-[#50fa7b]',
      number: 'text-[#bd93f9]',
      operator: 'text-[#ff79c6]',
      punctuation: 'text-[#f8f8f2]',
    }
  },
  monokai: {
    bg: 'bg-[#272822]',
    text: 'text-[#f8f8f2]',
    colors: {
      text: 'text-[#f8f8f2]',
      string: 'text-[#e6db74]',
      comment: 'text-[#75715e] italic',
      keyword: 'text-[#f92672] font-bold',
      builtin: 'text-[#66d9ef]',
      function: 'text-[#a6e22e]',
      decorator: 'text-[#a6e22e]',
      number: 'text-[#ae81ff]',
      operator: 'text-[#f92672]',
      punctuation: 'text-[#f8f8f2]',
    }
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, fileName }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('twilight');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  const lastCursorPos = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Memoize tokens to avoid re-parsing on every render if content hasn't changed
  const tokens = useMemo(() => highlightPython(content), [content]);

  // AI Completion Logic
  useEffect(() => {
    setSuggestion(null);
    if (!content.trim()) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (!textareaRef.current) return;
      const cursorPos = textareaRef.current.selectionEnd;
      lastCursorPos.current = cursorPos;
      const context = content.substring(0, cursorPos);
      if (!context.trim()) return;

      setLoadingCompletion(true);
      try {
        const completion = await getCodeCompletion(context);
        if (completion && completion.trim() !== "") {
          setSuggestion(completion);
        }
      } finally {
        setLoadingCompletion(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content]);

  const handleSelect = () => {
    if (textareaRef.current && textareaRef.current.selectionEnd !== lastCursorPos.current) {
      setSuggestion(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (suggestion) {
        const start = textareaRef.current?.selectionStart || 0;
        const end = textareaRef.current?.selectionEnd || 0;
        const newValue = content.substring(0, start) + suggestion + content.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + suggestion.length;
                textareaRef.current.focus();
            }
        }, 0);
        setSuggestion(null);
      } else {
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newValue = content.substring(0, start) + "    " + content.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
        }, 0);
      }
    } else if (e.key === 'Escape') {
      setSuggestion(null);
    }
  };

  const lineCount = content.split('\n').length;
  const theme = THEMES[currentTheme];

  return (
    <div className={`flex flex-col h-full ${theme.bg} relative group transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800">
        <div className="px-4 py-2 bg-slate-900 text-blue-400 text-sm border-t-2 border-blue-500 font-medium flex items-center gap-2">
           {fileName || 'Untitled'}
        </div>
        <div className="flex-1"></div>
        
        {/* Theme Selector */}
        <div className="relative mr-2">
           <button 
             onClick={() => setShowThemeMenu(!showThemeMenu)}
             className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors"
             title="Change Theme"
           >
             <Palette size={14} />
           </button>
           
           {showThemeMenu && (
             <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl z-30 py-1">
                {(Object.keys(THEMES) as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setCurrentTheme(t); setShowThemeMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs capitalize ${
                      currentTheme === t ? 'text-blue-400 bg-slate-700' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
             </div>
           )}
        </div>

        {loadingCompletion && (
            <div className="px-3 text-xs text-slate-500 flex items-center gap-1 animate-pulse">
                <Sparkles size={10} />
                Thinking...
            </div>
        )}
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-slate-950 text-slate-600 text-right pr-3 pl-2 py-4 select-none font-mono text-sm leading-6 border-r border-slate-800 h-full overflow-hidden w-12 flex-shrink-0">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i} style={{ height: '24px' }}>{i + 1}</div>
          ))}
        </div>

        {/* Editor Area Wrapper */}
        <div className="flex-1 relative font-mono text-sm leading-6">
            
            {/* Syntax Highlight Layer (Background) */}
            <pre 
              ref={preRef}
              className={`absolute inset-0 p-4 m-0 overflow-hidden whitespace-pre pointer-events-none z-0 ${theme.text}`}
              style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '24px' }}
            >
              {tokens.map((token, index) => (
                <span key={index} className={theme.colors[token.type] || theme.colors.text}>
                  {token.content}
                </span>
              ))}
              {/* Add an extra new line at end to match textarea behaviour if ending in newline */}
              {content.endsWith('\n') && <br />}
            </pre>

            {/* Input Layer (Foreground) */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              onScroll={handleScroll}
              spellCheck={false}
              className="absolute inset-0 w-full h-full p-4 m-0 resize-none outline-none border-none bg-transparent text-transparent caret-white z-10 overflow-auto whitespace-pre"
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '14px', 
                lineHeight: '24px', 
                tabSize: 4 
              }}
            />

        </div>

        {/* Suggestion Overlay */}
        {suggestion && (
          <div className="absolute bottom-4 left-16 right-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
            <div className="bg-slate-800 border border-slate-700 rounded-md shadow-xl overflow-hidden flex flex-col w-fit max-w-full">
              <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between text-xs text-slate-400 gap-4">
                <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-400" />
                    <span>AI Suggestion</span>
                </div>
                <div className="flex gap-2">
                    <span className="bg-slate-700 px-1.5 rounded text-slate-300 font-mono text-[10px] border border-slate-600">TAB</span> to accept
                    <span className="bg-slate-700 px-1.5 rounded text-slate-300 font-mono text-[10px] border border-slate-600">ESC</span> to dismiss
                </div>
              </div>
              <div className="p-3 font-mono text-sm text-slate-300 bg-slate-800/90 backdrop-blur">
                <pre className="whitespace-pre-wrap break-all opacity-80 border-l-2 border-purple-500 pl-2">
                    {suggestion}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
