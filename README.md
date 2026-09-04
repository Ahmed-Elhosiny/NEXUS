# NEXUS

**Personal Decision Intelligence Platform**

![NEXUS Banner](https://img.shields.io/badge/NEXUS-Decision%20Intelligence-0E7A5F?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-3178c6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff?style=flat&logo=vite)

---

## 🧭 Make Better Decisions, Confidently

NEXUS is a decision intelligence platform designed to help you model complex choices systematically. Whether you're deciding on a career move, evaluating financial options, or planning life changes, NEXUS provides the framework to think clearly and decide confidently.

### Why NEXUS?

- **Structure your thinking** — Break down complex decisions into manageable components
- **Weight what matters** — Define criteria that reflect your values and priorities
- **Evidence-based reasoning** — Track supporting and contradicting evidence
- **Stress-test outcomes** — Run scenarios to see how changes affect your decision
- **Learn from decisions** — Journal your reasoning and track outcomes over time

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Decision Canvas** | Visual workspace to model decisions with options, criteria, and scoring |
| **Weighted Criteria** | Define and prioritize what matters most in your decision |
| **Evidence Tracking** | Log supporting and contradicting evidence with reliability ratings |
| **Risk Assessment** | Identify, evaluate, and plan mitigations for potential risks |
| **Scenario Analysis** | Create alternative scenarios to stress-test your decision model |
| **What-If Modeling** | Adjust weights and scores dynamically to explore outcomes |
| **Decision Journal** | Document your reasoning, expectations, and outcomes |
| **Timeline View** | Track the evolution of your decision-making process |
| **Confidence Scoring** | Compare your gut confidence with analytical results |

### User Experience

- 🌓 **Dark/Light Theme** — Toggle between themes based on preference
- ⌨️ **Keyboard Shortcuts** — Command palette (Ctrl/Cmd+K) for quick navigation
- 📊 **Visual Analytics** — Charts and graphs to visualize trade-offs
- 🎨 **Modern UI** — Clean, distraction-free interface with smooth animations

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 18.2 with TypeScript |
| **Build Tool** | Vite 6.3 |
| **Styling** | TailwindCSS 4.1 |
| **State Management** | Zustand 5.0 |
| **Routing** | React Router DOM 6.8 |
| **Charts** | Recharts 2.10 |
| **Animations** | Framer Motion 11.16 |
| **Icons** | Lucide React |
| **Drag & Drop** | @dnd-kit |
| **Utilities** | date-fns, uuid, canvas-confetti |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nexus

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run typecheck` | Run TypeScript type checking |

---

## 📖 How to Use NEXUS

### 1. Create a Decision

Start by defining your decision:
- **Title**: A short name for your decision
- **Question**: The core question you're trying to answer
- **Category**: Career, Finance, Tech, Life, or Travel
- **Time Horizon**: When will this decision play out?

### 2. Add Options

List all viable alternatives you're considering. Each option can have:
- A name and description
- An associated color for visual identification
- Cost estimates (if applicable)

### 3. Define Criteria

Identify the factors that matter in your decision:
- Name each criterion (e.g., "Cost", "Impact", "Alignment with Values")
- Assign weights to reflect importance (0-100)
- Add notes for context

### 4. Score Options

Rate each option against your criteria:
- Scores range from 0-10 for each criterion
- The system calculates weighted totals automatically

### 5. Gather Evidence

Build your case with evidence:
- Mark evidence as supporting or contradicting
- Rate reliability (High/Medium/Low)
- Link evidence to specific options or criteria

### 6. Assess Risks

Identify potential downsides:
- Rate probability and impact (1-5 scale)
- Define mitigation strategies
- View aggregate risk scores

### 7. Run Scenarios

Explore "what if" situations:
- Create alternative weight configurations
- Adjust scores based on different assumptions
- Compare outcomes across scenarios

### 8. Journal Your Process

Document your thinking:
- **Why**: Your reasoning for the decision
- **Expectations**: What you expect to happen
- **Outcomes**: Actual results (add later)

---

## 📁 Project Structure

```
nexus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui.tsx          # Base UI components
│   │   ├── charts.tsx      # Chart components
│   │   ├── icons.tsx       # Icon components
│   │   ├── AppShell.tsx    # Main app layout
│   │   └── CommandPalette.tsx
│   ├── features/            # Feature modules
│   │   ├── landing/        # Landing page
│   │   ├── dashboard/      # Dashboard view
│   │   └── space/          # Decision canvas & analysis
│   ├── data/               # Static data & utilities
│   ├── lib/                # Utility functions
│   ├── types.ts            # TypeScript type definitions
│   ├── store.ts            # Zustand state management
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.js          # Vite configuration
```

---

## 🎨 Design Philosophy

NEXUS follows these design principles:

1. **Clarity Over Complexity** — Present information clearly without overwhelming
2. **Progressive Disclosure** — Show details when needed, hide when not
3. **Consistency** — Uniform patterns across the application
4. **Accessibility** — Support keyboard navigation and screen readers
5. **Performance** — Fast, responsive interactions

---

## 🔮 Roadmap

- [ ] Cloud sync and multi-device support
- [ ] Collaborative decision-making
- [ ] Export reports (PDF, Markdown)
- [ ] Integration with external data sources
- [ ] Mobile app (React Native)
- [ ] AI-assisted evidence gathering
- [ ] Decision templates library

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Passes TypeScript type checking (`npm run typecheck`)
- Follows existing code style
- Includes clear commit messages

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

NEXUS draws inspiration from:
- Multi-Criteria Decision Analysis (MCDA) methodologies
- Behavioral economics research on decision-making
- Design thinking and systems thinking frameworks

---

<div align="center">

**Made with ❤️ for better decision-making**

[⬆ Back to Top](#nexus)

</div>
