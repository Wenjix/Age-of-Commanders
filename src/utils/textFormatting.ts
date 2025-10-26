/**
 * Strip markdown formatting from text to make it more readable
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove bold/italic markers
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // ***bold italic***
    .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold**
    .replace(/\*(.+?)\*/g, '$1')          // *italic*
    .replace(/__(.+?)__/g, '$1')          // __bold__
    .replace(/_(.+?)_/g, '$1')            // _italic_
    
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')          // # headers
    
    // Remove links but keep text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // [text](url)
    
    // Remove inline code
    .replace(/`(.+?)`/g, '$1')            // `code`
    
    // Remove blockquotes
    .replace(/^>\s+/gm, '')               // > quote
    
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')         // ---, ***, ___
    
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')        // - item, * item, + item
    .replace(/^\s*\d+\.\s+/gm, '')        // 1. item
    
    // Remove extra whitespace
    .replace(/\n{3,}/g, '\n\n')           // Multiple newlines
    .trim();
}

/**
 * Clean text for display in UI (removes markdown and excessive whitespace)
 */
export function cleanTextForDisplay(text: string): string {
  return stripMarkdown(text)
    .replace(/\s+/g, ' ')                 // Collapse multiple spaces
    .trim();
}

