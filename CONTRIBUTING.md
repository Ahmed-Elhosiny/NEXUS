# Contributing to NEXUS

Thank you for your interest in contributing to NEXUS! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Report bugs** — Open an issue with a clear description and reproduction steps
- **Suggest features** — Share ideas for new features or improvements
- **Submit code** — Fix bugs, add features, or improve documentation
- **Improve docs** — Clarify existing documentation or add examples
- **Share feedback** — Tell us how you're using NEXUS

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/nexus.git
   cd nexus
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```
5. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style

- Follow the existing TypeScript and React patterns
- Use meaningful variable and function names
- Keep components focused and single-purpose
- Add comments for complex logic

### Type Safety

- Always use TypeScript types (avoid `any`)
- Export types from `src/types.ts` when creating new interfaces
- Ensure type safety across component boundaries

### Component Structure

```tsx
// Imports first (React, then libraries, then local files)
import { useState } from 'react';
import { SomeUtil } from '@/lib/utils';
import { MyComponentProps } from '@/types';

// Component with typed props
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Implementation
}
```

### State Management

- Use Zustand store for global state
- Keep local state in components when appropriate
- Avoid unnecessary state updates

## ✅ Before Submitting

1. **Run type checking**:
   ```bash
   npm run typecheck
   ```
2. **Build the project**:
   ```bash
   npm run build
   ```
3. **Test your changes** in the browser
4. **Review your code** for any issues

## 📤 Submitting a Pull Request

1. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add new feature description"
   ```
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request** on GitHub
4. **Describe your changes** in the PR description

### Commit Message Format

We follow conventional commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `chore:` — Maintenance tasks

Example:
```
feat: add scenario comparison view
fix: resolve criterion weight calculation bug
docs: update README with installation steps
```

## 🧩 Feature Areas

Consider contributing in these areas:

- **UI Components** — Improve existing components or add new ones
- **Features** — Enhance decision modeling capabilities
- **Performance** — Optimize rendering and state updates
- **Accessibility** — Improve keyboard navigation and screen reader support
- **Documentation** — Add guides, examples, or API docs

## 💬 Questions?

Feel free to open an issue for questions or discussions about contributing.

---

Thank you for helping make NEXUS better! 🙏
