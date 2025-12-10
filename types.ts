export interface FileNode {
  id: string;
  name: string;
  content: string;
  language: 'python';
}

export interface TerminalLog {
  id: string;
  type: 'info' | 'error' | 'success' | 'system';
  content: string;
  timestamp: number;
}

export enum EditorMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW' // Could be used for markdown later, mostly EDIT for now
}

export enum AIActionType {
  RUN = 'RUN',
  EXPLAIN = 'EXPLAIN',
  FIX = 'FIX'
}

export interface Commit {
  hash: string;
  message: string;
  timestamp: number;
  files: FileNode[];
  author: string;
}

export type SidebarView = 'explorer' | 'git' | 'settings' | 'chat' | 'extensions';

export interface KeyBinding {
  id: string;
  actionId: 'run' | 'explain' | 'fix' | 'toggle_sidebar' | 'focus_git';
  label: string;
  keys: string;
}

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  version: string;
  installed: boolean;
}
