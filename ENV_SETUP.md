# Environment Setup

## API Key Configuration

The game uses Google's Gemini API for LLM-powered commander interpretations.

### Setup Steps

1. **Create a `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Get a Gemini API key**:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a free API key
   - Copy the key (starts with `AIza...`)

3. **Add the key to `.env`**:
   ```env
   VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

4. **Restart the dev server**:
   ```bash
   pnpm dev
   ```

### Alternative: Debug Menu

If you don't want to use a `.env` file, you can set the API key at runtime:

1. Start the game
2. Click the **Debug** button in the top bar
3. Enter your API key in the "API Key" field
4. The key will be stored in memory for the session

### Fallback Behavior

If no API key is provided:
- The game will still work
- Commanders will use **fallback responses** instead of LLM interpretations:
  - **Literalist**: "Processing command literally."
  - **Paranoid**: "Possible deception detected."
  - **Optimist**: "This sounds wonderful!"

### Security Notes

- ⚠️ **Never commit `.env` to git** (it's in `.gitignore`)
- ⚠️ **Never share your API key publicly**
- ✅ The API key is only used client-side for demo purposes
- ✅ For production, use a backend proxy to hide the key

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | No (fallback available) |

### Vite Environment Variables

Vite exposes environment variables prefixed with `VITE_` to the client:

```typescript
// Access in code
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### Troubleshooting

**Problem**: "API key not working"
- ✅ Check that the key starts with `AIza`
- ✅ Ensure `.env` is in the project root
- ✅ Restart the dev server after changing `.env`
- ✅ Check browser console for API errors

**Problem**: "Commanders using fallback responses"
- ✅ Verify API key is set in `.env` or Debug menu
- ✅ Check that you have internet connection
- ✅ Verify API key is valid at [Google AI Studio](https://aistudio.google.com/apikey)

**Problem**: ".env file not loading"
- ✅ Ensure file is named exactly `.env` (not `.env.txt`)
- ✅ File must be in project root (same level as `package.json`)
- ✅ Variables must start with `VITE_` prefix
- ✅ Restart dev server after creating/editing `.env`

