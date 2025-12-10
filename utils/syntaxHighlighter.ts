export type TokenType = 
  | 'text' 
  | 'string' 
  | 'comment' 
  | 'keyword' 
  | 'builtin' 
  | 'function' 
  | 'decorator' 
  | 'number' 
  | 'operator' 
  | 'punctuation';

export interface Token {
  type: TokenType;
  content: string;
}

export const highlightPython = (code: string): Token[] => {
  const tokens: Token[] = [];
  
  // Regex patterns for Python syntax
  // Order matters: Strings and comments must be caught first to avoid matching keywords inside them
  const regex = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#.*$)|(\b(?:def|class|import|from|return|if|else|elif|while|for|in|try|except|finally|with|as|pass|break|continue|lambda|yield|raise|assert|global|nonlocal|True|False|None|and|or|not|is)\b)|(\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|map|filter|super|isinstance|open|type|abs|all|any|sum|min|max)\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*(?=\())|(@[a-zA-Z_][a-zA-Z0-9_]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([+\-*/%=<>!&|^~]+)|([(){}\[\],:;.])/gm;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
      // Add text before match (whitespace or uncaptured identifiers)
      if (match.index > lastIndex) {
          tokens.push({ type: 'text', content: code.substring(lastIndex, match.index) });
      }

      const content = match[0];
      let type: TokenType = 'text';

      if (match[1]) type = 'string';
      else if (match[2]) type = 'comment';
      else if (match[3]) type = 'keyword';
      else if (match[4]) type = 'builtin';
      else if (match[5]) type = 'function';
      else if (match[6]) type = 'decorator';
      else if (match[7]) type = 'number';
      else if (match[8]) type = 'operator';
      else if (match[9]) type = 'punctuation';

      tokens.push({ type, content });
      lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < code.length) {
      tokens.push({ type: 'text', content: code.substring(lastIndex) });
  }

  return tokens;
};
