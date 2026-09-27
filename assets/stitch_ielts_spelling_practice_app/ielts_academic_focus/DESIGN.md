---
name: IELTS Academic Focus
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#474651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777682'
  outline-variant: '#c8c5d3'
  surface-tint: '#5654a8'
  primary: '#1a146b'
  on-primary: '#ffffff'
  primary-container: '#312e81'
  on-primary-container: '#9c9af4'
  inverse-primary: '#c3c0ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#500013'
  on-tertiary: '#ffffff'
  tertiary-container: '#790021'
  on-tertiary-container: '#ff7a86'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100563'
  on-primary-fixed-variant: '#3e3c8f'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#920029'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  spelling-input:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.08em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for an intensive, high-stakes IELTS Listening & Spelling preparation mobile app. The atmosphere balances academic rigor with mental clarity, reducing cognitive strain during rapid audio dictation and spelling drill loops.

- **Design Philosophy:** Utilitarian Academic Minimalism. Strip away gamified ornamentation, unnecessary illustrations, and dramatic gradients to promote sustained focus and lower test-related anxiety.
- **Personality:** Methodical, reliable, sharp, and encouraging.
- **Visual Tone:** Crisp white paper surfaces layered over pale slate foundations, anchored by deep slate typography, precise hairline dividers, and deliberate indigo focal points.
- **Interaction Ethos:** Direct tactile feedback, oversized touch targets for rapid keyboard-driven input, and instant visual validation designed specifically for hand-held mobile workflows.

## Colors

The palette delivers maximum legibility and emotional calmness across light mode surfaces.

- **Canvas & Backgrounds:**
  - Base App Canvas: `#F8FAFC` (Slate 50)
  - Card & Surface Elevated: `#FFFFFF` (Pure Chalk White)
  - Interactive/Nested Surface: `#F1F5F9` (Slate 100)
- **Brand & Accents:**
  - Primary (`#312E81` / Academic Indigo): Anchors primary CTA buttons, active spelling focus frames, and audio playback indicators.
  - Primary Hover/Active: `#1E1B4B`
  - Subtle Indigo Tint (`#EEF2FF`): Selected state fills and audio wave wrappers.
- **Validation & Progress Status:**
  - Success / Correct Spelling: `#0D9488` (Muted Teal/Emerald) paired with `#F0FDFA` background.
  - Error / Correction State: `#BE123C` (Refined Crimson) paired with `#FFF1F2` background.
  - Audio Progress / Neutral Highlights: `#0284C7` (Sky 600).
- **Text & Stroke Contrast:**
  - Ink Primary: `#0F172A` (Slate 900) for prompts, dictated letters, and primary headers.
  - Ink Secondary: `#475569` (Slate 600) for instructions, phonetic clues, and meta tags.
  - Ink Muted: `#94A3B8` (Slate 400) for disabled actions, counters, and structural icons.
  - Structural Border: `#E2E8F0` (Slate 200) for crisp, low-contrast component outlines.

## Typography

The type system prioritizes micro-legibility under rapid audio replay conditions.

- **Font Family:** `Inter` across all structural tiers to deliver an authentic native Expo/React Native feel that aligns with system UI conventions.
- **Letter Spacing:** Extended tracking (`0.08em`) on `spelling-input` fields ensures distinct visual separation between confusing character pairs (such as "rn" vs "m" or "cl" vs "d").
- **Hierarchy:** High weight contrasts (`700` and `600`) paired with restrained sizing keep headers punchy without crowding vertical space on compact handheld devices.
- **Numbers & Metrics:** Tabular figures (`tnum`) should be enabled across timers, audio playback markers, and accuracy scores to avoid layout jitter during active listening drills.

## Layout & Spacing

A disciplined 4pt/8pt spatial increment governs screen balance, prioritizing single-column vertical flow adapted for touch-screen mobile devices.

- **Screen Padding:** Standard horizontal screen inset is `1.25rem` (20px), ensuring safe margins away from device bezels while maximizing card content width.
- **Touch Ergonomics:** All actionable control surfaces maintain a minimum height and width of 48px to prevent miss-clicks while listening to fast audio tracks.
- **Vertical Rhythm:** 
  - `space-sm` (8px) separates closely paired micro-copy and tags.
  - `space-md` (16px) defines internal card padding and intra-module gaps.
  - `space-lg` (24px) spaces primary interactive clusters (audio player, input card, validation sheet).
  - `space-xl` (32px) isolates discrete practice sections or stages.
- **Keyboard Handling:** The layout pins primary actions above the mobile software keyboard without jumping or compressing listening controls.

## Elevation & Depth

Depth is established through crisp surface layering and razor-thin borders rather than exaggerated drop shadows.

- **Hairline Borders:** The primary container boundary uses a 1px solid border (`#E2E8F0`). This creates clear content containment while retaining a lightweight feel.
- **Ambient Shadow (Cards & Modals):**
  - Offset: `0px 2px`
  - Blur Radius: `8px`
  - Color: `rgba(15, 23, 42, 0.04)`
- **Interactive Depressed State:** Active buttons drop elevation entirely, using a 1px shift downward with a matching outline state for tangible feedback.
- **Layer Stacking Hierarchy:**
  - Base: Slate 50 (`#F8FAFC`)
  - Elevated Container: White (`#FFFFFF`) with 1px Slate 200 border
  - Overlay Sheets / Audio HUD: Pure White with subtle ambient shadow (`rgba(15, 23, 42, 0.08)`) and 1px border.

## Shapes

The design uses soft, friendly, modern corners that balance academic formality with approachable mobile ergonomics.

- **Inputs & Controls:** `rounded-lg` (16px) for spelling input containers, action buttons, and individual audio replay buttons.
- **Content Cards:** `rounded-2xl` (20px) to `rounded-3xl` (24px) for primary dictation cards, test summary containers, and spelling correction breakdowns.
- **Tags & Status Badges:** `rounded-full` (9999px) for pill tags, band score markers, and audio speed toggles (0.75x, 1.0x, 1.25x).
- **Segmented Progress Bars:** Fully rounded ends with minimal height (6px to 8px) to provide progress visibility without dominating visual weight.

## Components

### Buttons
- **Primary Action (Check Spelling / Next Word):** Background `#312E81`, label `#FFFFFF` in `label-lg`, height 52px, border-radius 16px. Pressed state dims to `#1E1B4B`.
- **Secondary (Audio Replay / Clue):** Background `#F1F5F9`, border 1px solid `#E2E8F0`, label `#0F172A`, height 48px.
- **Ghost/Tertiary (Skip Word):** Transparent background, label `#64748B`, height 44px.

### Spelling Input Field
- **Default State:** Chalk white container, height 60px, border 1.5px solid `#E2E8F0`, typography `spelling-input`. Center-aligned text with auto-capitalization disabled.
- **Focus State:** Border 2px solid `#312E81`, faint indigo glow (`rgba(49, 46, 129, 0.08)`).
- **Correct State:** Border 2px solid `#0D9488`, background `#F0FDFA`, ink `#0D9488`.
- **Incorrect State:** Border 2px solid `#BE123C`, background `#FFF1F2`, ink `#BE123C`. Character diff visually highlights missing or misplaced letters with a strike-through pattern.

### Audio Dictation Controller
- **Card Wrapper:** Pure white surface, 1px border `#E2E8F0`, border-radius 24px, padding 20px.
- **Waveform / Scrubber:** Muted track `#E2E8F0`, played track `#312E81`. Minimal scrubber head.
- **Speed Selector Pill:** Background `#F8FAFC`, active state `#EEF2FF` with `#312E81` text.

### Verification & Feedback Sheet
- Appears immediately upon submission below the spelling input.
- Displays phonetics, definition context from official IELTS vocabulary lists, and character-by-character correction without full-page navigation.

### Practice Lists & Session Metrics
- Clean rows separated by hairline dividers (`#F1F5F9`).
- Status icons (check mark or error flag) set inside circular pill indicators with 28px diameters.