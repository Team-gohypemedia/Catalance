# shadcn, Tailwind CSS & TypeScript Setup Guide

This document provides setup instructions for shadcn, Tailwind, and TypeScript within a React environment, explains the component architecture of the current codebase, and highlights the importance of the `/components/ui` directory structure.

---

## 1. Project Default Paths (Current Codebase)

In this project, components and styles are configured as follows:
- **Default Styles Entry**: `src/index.css` (utilizes Tailwind v4 with the `@tailwindcss/vite` integration).
- **Default Components Path**: `src/components/` (mapped to the `@/components` alias).
- **Shadcn Component Path**: `src/components/ui/` (mapped to the `@/components/ui` alias).

---

## 2. Why `/components/ui` is Crucial

The `/components/ui` folder is reserved specifically for **atomic, reusable UI primitives** (such as Buttons, Dialogs, Inputs, Tooltips, Accordions). 

Creating and maintaining this folder is important because:
1. **Separation of Concerns**: It separates clean, generic, reusable UI controls (e.g., shadcn inputs, badges, or buttons) from domain-specific domain components (e.g., `Hero.jsx`, `Forms/`, `FreelancerWelcomeSlide.jsx`).
2. **CLI Autonomy**: When you run the shadcn CLI tool to add components (e.g., `npx shadcn@latest add button`), it downloads the components directly into the designated `ui` directory. By keeping this folder dedicated, you prevent standard project pages from being mixed with atomic primitives.
3. **Consistent Theme Mapping**: Components inside `components/ui` are configured to consume tailwind utility classes, global CSS variables, and utility functions (`cn` from `@/shared/lib/utils`), establishing a unified theme interface.

---

## 3. Step-by-Step Setup Instructions

If you were starting from scratch or converting this codebase to a strict TypeScript environment:

### A. Setting up TypeScript
Vite handles transpilation of `.ts` and `.tsx` files out of the box. To add type checking and full IDE support:

1. **Install TypeScript dev dependencies**:
   ```bash
   npm install -D typescript @types/react @types/react-dom
   ```

2. **Initialize a TypeScript configuration file (`tsconfig.json`)** at the root of the project:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "useDefineForClassFields": true,
       "lib": ["DOM", "DOM.Iterable", "ES2022"],
       "module": "ESNext",
       "skipLibCheck": true,
   
       /* Bundler mode */
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
   
       /* Linting */
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
   
       /* Paths */
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     },
     "include": ["src"]
   }
   ```

3. **Rename files**:
   Rename your component entry points (e.g., `main.jsx` to `main.tsx`, `App.jsx` to `App.tsx`) and add standard type declarations where necessary.

---

### B. Installing Tailwind CSS (v4)
In a Vite environment, Tailwind v4 is integrated as a native plugin:

1. **Install Tailwind CSS and the Vite plugin**:
   ```bash
   npm install tailwindcss @tailwindcss/vite
   ```

2. **Configure Vite** (`vite.config.ts` or `vite.config.js`):
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'
   import path from 'path'
   
   export default defineConfig({
     plugins: [react(), tailwindcss()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

3. **Import Tailwind** in your CSS entry point (`src/index.css`):
   ```css
   @import "tailwindcss";
   ```

---

### C. Setting up shadcn CLI
To initialize and manage shadcn components:

1. **Run the Initialization Command**:
   ```bash
   npx shadcn@latest init
   ```

2. **Configure options** during initialization:
   - **Style**: Choose `Default` or `New York` (New York is standard for refined UI).
   - **Base color**: e.g., `Slate`, `Gray`, `Neutral`.
   - **CSS variables**: `Yes` (essential for supporting dynamic theme switches).
   - **Aliases**: Configure `@/components` and `@/components/ui`.

3. **Adding components dynamically**:
   For example, to install a button or a dialog, run:
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   ```
   This will automatically write the component file to the `src/components/ui` directory, installing any required Radix UI dependencies under the hood.
