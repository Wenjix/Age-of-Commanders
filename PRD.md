# 🧠 Empire of Minds – AI Commander Training Game

**Revised PRD for 24-Hour Hackathon Build**

> Absolutely! Here's your **revised 24-hour PRD**—leaner, punchier, and laser-focused on delivering a **funny, stable, and demo-ready** experience within your time limit.

## 1. Executive Summary

**Product Name**: Empire of Minds  
**Hackathon**: AI Games Hackathon 2025  
**Team**: 1 developer  
**Time**: 24 hours  
**Platform**: Web (Chrome/Firefox, desktop only)

### 🎯 Elevator Pitch  
> “What if your RTS units could actually learn… badly?”  
Empire of Minds is a comedic strategy game where you **teach**, not command. You give simple orders to three AI commanders—each with a wildly different personality—and watch them **misinterpret everything** in real time. Think *The Office* meets *Age of Empires*, powered by LLMs.

### ✨ Core Innovation  
This game only works because of modern AI. Commanders **interpret your instructions through personality-tinted lenses**, creating emergent, shareable chaos. The fun isn’t in winning—it’s in **why you lost**.

---

## 2. Game Design (24-Hour MVP)

### 🔁 Core Loop (10-minute session)
1. **DRAFT** (30 sec) → Pick 3 commanders  
2. **TEACH** (3 min) → Type verbal commands; see real-time LLM interpretations  
3. **EXECUTE** (6 min) → Watch pre-baked plans unfold (no live LLM)  
4. **DEBRIEF** (30 sec) → See hilarious after-action quotes + share button

### 🏆 Victory Conditions
- **Primary**: Survive 1 wave of enemies  
- **Real Win**: Generate **at least one laugh-worthy commander quote**  
- **Ultimate Goal**: Create a **shareable meme moment**

---

## 3. MVP Scope (24 Hours)

### ✅ IN SCOPE

#### 3.1 Game World
- **Grid**: 20×20 tiles (grass only)  
- **Buildings**: 3 types  
  - **Base** (spawn point, must survive)  
  - **Wall** (blocks enemies)  
  - **Tower** (auto-attacks nearby enemies)  
- **Resources**: **Wood only** (start with 50; walls = 5 wood, towers = 10)  
- **Enemies**: 1 wave of 10 slow-moving units from the **north edge**  
- **No pathfinding**: Enemies move straight toward base; stop if blocked

#### 3.2 Commanders (3 per game)
- **Personalities**: Only 3 (for maximum contrast & reliability)  
  - **Literalist**: Follows words exactly, ignores context  
  - **Paranoid**: Sees threats everywhere; over-defends  
  - **Optimist**: Assumes best intentions; tries to “befriend” enemies  
- **Memory**: Remembers **only the last verbal command**  
- **Output**: Thought bubble during teaching; pre-baked action plan during execution

#### 3.3 Teaching Mechanics
- **Input**: Text box only (no clicking/demonstration)  
  - Example: `"Build a wall on the north side"`  
- **Feedback**: Real-time LLM-generated thought bubble per commander  
- **No reinforcement buttons** (simplifies flow)

#### 3.4 AI Integration
- **LLM**: GPT-4o-mini (via user-provided API key)  
- **Used ONLY during TEACH phase** (max 3 calls: one per commander)  
- **During EXECUTE**: No LLM calls—actions are **precomputed** from LLM response  
- **Fallback**: If LLM fails, use pre-written funny response templates

---

### 🚫 OUT OF SCOPE (Deliberately Cut)
- Farms, barracks, food, or complex resources  
- Multiple waves or difficulty scaling  
- Demonstration-by-clicking  
- Pattern learning or memory beyond last command  
- Multi-commander coordination  
- Sound, music, animations (beyond thought bubbles)  
- Backend server or user accounts  
- Saving, loading, or mobile support

---

## 4. Technical Architecture

### 4.1 Tech Stack
```typescript
const techStack = {
  frontend: {
    framework: 'React 18 + Vite',
    canvas: 'PixiJS 8.x (for 2D grid & sprites)',
    state: 'Zustand',
    styling: 'Tailwind CSS',
  },
  ai: {
    model: 'GPT-4o-mini (user-provided key)',
    usage: 'Teaching phase only',
    fallback: 'Hardcoded personality quotes',
    caching: 'localStorage (per session)'
  },
  deployment: 'Vercel (static site)'
};
```

### 4.2 Key Data Models (Simplified)
```ts
interface Commander {
  id: string;
  name: string;
  personality: 'literalist' | 'paranoid' | 'optimist';
  lastCommand: string;
  interpretation: string;   // from LLM or fallback
  executionPlan: Action[];  // precomputed for EXECUTE phase
}

interface Action {
  type: 'build';
  building: 'wall' | 'tower';
  position: { x: number; y: number };
}

interface GameState {
  phase: 'draft' | 'teach' | 'execute' | 'debrief';
  wood: number;
  basePosition: Point;
  buildings: Building[];
  enemies: Enemy[];
  commanders: Commander[];
}
```

### 4.3 Personality System (Simplified Prompts)
Each commander gets a **system prompt + user command**:
```ts
const prompts = {
  literalist: `You interpret instructions WORD-FOR-WORD. Never assume intent. Be robotic.`,
  paranoid: `You believe everything is a trap. The enemy is always watching. Over-prepare.`,
  optimist: `You see friendship everywhere. Enemies are just misunderstood guests!`
};
```

After LLM response, parse into a simple **execution plan** (e.g., “build wall at (5,0)”).

---

## 5. User Experience

### 5.1 Game Flow
```mermaid
graph LR
  A[Main Menu] --> B[Draft 3 Commanders]
  B --> C[Teach: Type Command]
  C --> D[See Thought Bubbles]
  D --> E[Execute: Watch Chaos]
  E --> F[Debrief: Funny Quotes]
  F --> G[Share Button]
```

### 5.2 UI Layout

```
┌──────────────────────────────────────────────────┐
│ Wood: 45        Wave: 1/1        Time: 04:22     │
├──────────────────────────────────────────────────┤
│                                                  │
│                [20x20 GAME CANVAS]               │
│                                                  │
│      [Base]  [Walls]  [Enemies moving down]      │
│                                                  │
│  [Cmdr Avatars] 💬 "You said 'north'..."         │
│                                                  │
├──────────────────────────────────────────────────┤
│ Command: [_________________________] [Send]      │
└──────────────────────────────────────────────────┘
```

### 5.3 Controls
- **Text input + Enter**: Send command  
- **Space**: Pause/resume execution  
- **Mouse wheel**: Zoom  
- **Drag**: Pan

---

## 6. 24-Hour Implementation Plan

| Time       | Goal                          | Deliverables |
|------------|-------------------------------|--------------|
| **0–4h**   | Core World                    | PixiJS canvas, 20x20 grid, base, wood counter, camera |
| **4–8h**   | Commanders & UI               | Avatars, thought bubbles, text input, personality icons |
| **8–12h**  | LLM Teaching Phase            | API integration, prompt templates, interpretation display |
| **12–16h** | Execution Logic               | Pre-baked action plans, enemy wave, building placement |
| **16–20h** | Debrief & Share               | Quote display, “Tweet This” button, chaos highlights |
| **20–24h** | Polish & Demo Rehearsal       | Fix bugs, record backup video, practice 5-min pitch |

---

## 7. Success Metrics

### 🏅 Hackathon Judging Goals

| Criteria           | How We Win |
|--------------------|------------|
| **Innovation**     | First game where failure = comedy via AI personality |
| **AI Integration** | LLM used meaningfully—but safely (only in teach phase) |
| **Fun Factor**     | Judges laugh at least 3x during demo |
| **Stability**      | Zero crashes; works offline after LLM cache |
| **Memorability**   | Judges quote commander lines afterward |

### 📊 Demo Targets
- ✅ **“I want to try this!”** — 1+ judge asks to play  
- ✅ **Shareable quote** — e.g., *“They’re not invaders—they’re dinner guests!”*  
- ✅ **Runs in <2 min** from cold start (with API key)

---

## 8. Risk Mitigation

| Risk                     | Mitigation |
|--------------------------|------------|
| **LLM fails or slow**    | Fallback to hardcoded funny responses; cache all calls |
| **Not funny enough**     | Pre-script 3 guaranteed misbehaviors (e.g., Optimist builds “Welcome” sign) |
| **Too complex**          | Only 3 buildings, 1 resource, 1 enemy type |
| **Demo crashes**         | No LLM during execution → fully deterministic gameplay |
| **User has no API key**  | Clear modal: “Enter your OpenAI key to play (not stored)” |

---

## 9. Demo Script (5 Minutes)

| Time | Action | Narration |
|------|--------|----------|
| 0:00 | Empty map | “In Empire of Minds, you don’t command—you *teach*.” |
| 0:30 | Draft commanders | “Meet Larry (Literalist), Paul (Paranoid), and Olivia (Optimist).” |
| 1:00 | Type: *“Build defenses on the north”* | “I give one simple order…” |
| 1:30 | Show thought bubbles | “But each hears something different.” |
| 2:00 | Start execution | “Now… let chaos reign.” |
| 2:30 | Larry builds wall at exact coords | “Larry: ‘You said north. Done.’” |
| 3:00 | Paul builds walls around base | “Paul: ‘The real threat is betrayal!’” |
| 3:30 | Olivia builds “Welcome” sign | “Olivia: ‘They’re here for tea!’” |
| 4:00 | Enemies ignore sign, destroy base | “We lose… but gloriously.” |
| 4:30 | Debrief screen | “Their explanations? Priceless.” |
| 5:00 | Share button + tagline | “Empire of Minds: Teaching AI badly has never been more fun.” |

---

## 10. Post-Hackathon Vision (Optional)

- Add more personalities (Pacifist, Philosopher)  
- Multiplayer: Swap commanders with friends  
- Campaign: “Historical battles, hilariously misunderstood”  
- Streaming mode: Viewers vote on next command

---

## 11. Conclusion

**Empire of Minds** turns AI’s greatest weakness—misunderstanding—into its greatest strength: **comedy**. By focusing on **personality-driven interpretation**, **client-side safety**, and **guaranteed funny moments**, this 24-hour build delivers a **memorable, stable, and uniquely AI-native** experience.

> “You don’t lose the game. Your AI just had… other ideas.”

---

Good luck—you’ve got a killer concept. Now go build the chaos! 🚀