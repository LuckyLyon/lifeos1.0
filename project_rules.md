# Project: Life Reboot OS (人生重启系统)

- **Type**: PWA (Progressive Web App)

- **Stack**: React + Vite + Tailwind CSS

- **User**: Founder (Chronic illness recovery, needs order & energy management)

## 1. Core Logic (MVP Scope)


### A. Compass (秩序中枢)

- **Concept**: "Blue/Green Day" is the Source of Truth.

- **Green Day (🟢)**: High Energy. Theme `green-50`/`green-600`. UI: Vibrant, Challenge Mode.

- **Blue Day (🔵)**: Low Energy/Healing. Theme `slate-900`/`blue-900`. UI: Minimalist, Maintenance Mode.

- **Philosophy**: Green = Growth; Blue = Flow (reduce friction).


### B. Learning Engine

- Input book name -> AI generates plan (via SiliconFlow API) -> Daily check-in.


### C. Habit Engine

- Dual Targets: GreenTarget vs. BlueTarget based on current energy mode.

## 2. Constitution (The 3 Iron Rules)


**Rule 1: Spec First (文档驱动)**

- Update `project_rules.md` BEFORE touching any code.

- No "freestyling" without a spec.


**Rule 2: Component Isolation**

- No giant `App.jsx`. Break down into `components/ModeToggle.jsx`, `components/TaskList.jsx`, etc.


**Rule 3: China Network Adaptation (CRITICAL)**

- **NO External Fonts**: strictly forbidden to use `fonts.googleapis.com` or `fonts.gstatic.com`.
    - MUST use system fonts: `font-family: system-ui, -apple-system, sans-serif;`.
- **NO External CDNs**: Do not use public CDNs (unpkg, cdnjs) for core libraries.
- **API**: Must allow Base URL configuration (for SiliconFlow).

## 3. AI & Data Specs

- **Provider**: SiliconFlow ( `https://api.siliconflow.cn/v1).` 

- **Security**: NEVER hardcode API Keys. Store in LocalStorage via a Settings UI.
