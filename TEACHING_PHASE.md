# Teaching Phase - LLM-Powered Commander Interpretations

## Overview

The teaching phase allows players to give commands to their commanders, who interpret them based on their unique personalities using Google's Gemini 2.5 Flash Lite API.

## Features Implemented

### 1. Game Phase Management
- **Phases**: `'draft' | 'teach' | 'execute' | 'debrief'`
- **Starting Phase**: `'teach'`
- **Phase Flow**: teach → execute (after command processing)

### 2. API Key Management
- **Modal on First Load**: Prompts user for Gemini API key
- **Storage**: In-memory only (never persisted)
- **Skip Option**: Users can skip and use fallback responses
- **Get Key**: Link to Google AI Studio provided

### 3. Command Input System
- **Visibility**: Only shown during 'teach' phase
- **Input Field**: Text input for user commands
- **Send Button**: Triggers interpretation process
- **Loading State**: Shows "Processing..." during API calls

### 4. LLM Integration (Gemini 2.5 Flash Lite)

#### Personality-Based System Prompts:
```typescript
literalist: "You interpret instructions WORD-FOR-WORD. Never assume intent. Be robotic."
paranoid: "You believe everything is a trap. The enemy is always watching. Over-prepare."
optimist: "You see friendship everywhere. Enemies are just misunderstood guests!"
```

#### User Message Format:
```
Interpret this command for your role: "[USER_COMMAND]"
```

#### API Configuration:
- **Model**: `gemini-2.0-flash-lite`
- **Temperature**: 0.7
- **Max Tokens**: 200
- **Concurrency**: Max 3 simultaneous calls (via p-limit)

### 5. Response Caching
- **Storage**: localStorage
- **Key Format**: `commander_interpretation_{personality}_{command}`
- **Benefits**: 
  - Faster responses for repeated commands
  - Reduced API calls
  - Consistent interpretations

### 6. Fallback System

If LLM fails or no API key provided:
```typescript
literalist: "Processing command literally."
paranoid: "Possible deception detected."
optimist: "This sounds wonderful!"
```

### 7. Error Handling
- **Toast Notifications**: Using react-hot-toast
- **Loading States**: Visual feedback during processing
- **Graceful Degradation**: Falls back to default responses on error
- **Console Logging**: Errors logged for debugging

## Component Architecture

```
/src
  /components
    ApiKeyModal.tsx       # API key input modal
    CommandInput.tsx      # Command input form (teach phase only)
    CommanderPanel.tsx    # Commander avatars & interpretations
    TopBar.tsx
    GameCanvas.tsx
  /services
    llmService.ts         # Gemini API integration & caching
  /store
    useGameStore.ts       # Phase, commanders, API key state
  App.tsx                 # Main app with toast provider
```

## User Flow

1. **First Load**: API key modal appears
2. **Enter Key or Skip**: User provides Gemini key or skips
3. **Teach Phase**: Command input field appears
4. **Enter Command**: User types command (e.g., "Build more defenses")
5. **Send**: Click send button
6. **Processing**: 
   - Toast shows "Commanders are interpreting..."
   - 3 concurrent API calls (one per commander)
   - Responses cached in localStorage
7. **Results**: Commander interpretations update in speech bubbles
8. **Phase Change**: Game moves to 'execute' phase
9. **Command Input Hidden**: Input disappears in execute phase

## Example Interpretations

**Command**: "Build more defenses"

**Larry (Literalist)**:
> "I will construct additional defensive structures. No assumptions made about type or location."

**Paul (Paranoid)**:
> "This is clearly a trap. The enemy knows we're weak. I'll fortify everything and prepare for imminent attack!"

**Olivia (Optimist)**:
> "Oh wonderful! We're building cozy homes for our future friends to feel safe when they visit!"

## Technical Details

### Concurrency Control
```typescript
import pLimit from 'p-limit';
const limit = pLimit(3); // Max 3 concurrent calls
```

### Cache Implementation
```typescript
// Check cache first
const cached = getCachedInterpretation(command, personality);
if (cached) return cached;

// Call API and cache result
const interpretation = await callGeminiAPI(...);
setCachedInterpretation(command, personality, interpretation);
```

### Error Handling
```typescript
try {
  const interpretation = await callGeminiAPI(...);
  return interpretation;
} catch (error) {
  console.error(`Failed for ${personality}:`, error);
  return FALLBACK_RESPONSES[personality];
}
```

## Dependencies Added

- **p-limit**: `^7.2.0` - Concurrency control
- **react-hot-toast**: `^2.6.0` - Toast notifications

## Environment Requirements

- **API Key**: Gemini API key from Google AI Studio
- **Network**: Internet connection for API calls
- **Browser**: Modern browser with localStorage support

## Future Enhancements

- [ ] Add retry logic for failed API calls
- [ ] Implement rate limiting
- [ ] Add command history
- [ ] Support for multi-turn conversations
- [ ] Commander personality customization
- [ ] Export/import interpretation cache

