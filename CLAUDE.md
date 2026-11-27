# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-app Progressive Web App (PWA) project hosting the lab apps deployed via GitHub Pages:

- **Timer**: IHC double staining protocol timer with section-based countdown and automatic progression
- **ISHpalette Timer**: Timer for ISHpalette
- **Protocol**: Cell culture protocol guide with cell counting/density features, Supabase integration, and Google Forms data submission

All apps are fully offline-capable via Service Workers and installable as PWA home screen apps on iOS/Android.

## Repository Structure

```
frontend/                      # React source and Vite config
├── src/pages/                 # Home, timers, protocol, and data logs
└── public/                    # Shared service worker, manifests, and icons
docs/                          # Generated GitHub Pages deployment root
├── index.html
├── home/
├── ihc/
├── ish/
└── msc/
```

## Development Commands

Run `npm ci`, then `npm run build` in `frontend/` to regenerate `docs/`. Use `npm run preview` to serve the build locally. Open `/android_app/` on the preview server and verify offline mode in the browser after the service worker takes control.

## Architecture & Key Technologies

The apps share a React bundle and a service worker. Each app has its own directory and PWA manifest.

### Protocol App: Advanced Features

The Protocol app (`docs/msc/`) is the most complex and includes:

**Cell Counting & Density**:
- User inputs cell count in hemocytometer format
- Calculates cell density (cells/mL) and converts to dish area basis
- Stores `counted_value_mean` (average from 4 squares × 10^4) and cell count with 3 significant figure display
- Supabase table: `experiment_logs` (experiment_id, step, counted_value_mean, cell_count, density, volume, dish_size)

**External Integrations**:
- **Supabase**: Stores cell counting results, protocol metadata, and experiment tracking
- **Google Sheets API**: Records experiment logs with cell counts and calculated density
- **Google Forms**: Alternative submission mechanism for experiment data

**Data Flow**:
1. User enters measurement data in Protocol UI (step 6: cell counting)
2. Data is validated and stored locally (unsaved data protection)
3. Submitted to both Supabase and Google Sheets/Forms
4. Density calculated server-side based on dish size (60mm default, user-selectable)

### Manifest.json Structure
Each app has PWA manifest specifying:
- `name` / `short_name`: App display names
- `start_url`: Entry point for installed app
- `display`: "fullscreen" or "standalone"
- `icons`: Paths to 192px and 512px PNG icons
- `theme_color`: Brand color for UI chrome

## Recent Development Focus

Based on recent commits, the Protocol app is actively developed with:
- Cell counting features (hemocytometer integration)
- Dish size selection (variable culture dish areas)
- Supabase backup for experiment logs
- Google Forms / Sheets integration for data recording
- Volume tracking and calculations

## Important Notes for Editing

### Before Modifying HTML/JS
- Edit `frontend/` and regenerate `docs/` before publishing
- Service Workers must be updated when asset paths change
- PWA manifest paths must match actual file locations
- Test offline functionality after any asset changes

### Cell Counting & Calculations (Protocol App)
- **Default dish size**: 60mm (area ≈ 2827 mm²)
- **Cell count input**: Hemocytometer reading × 10^4 (average of 4 squares)
- **Density formula**: (counted_value_mean / dish_area_mm²) × 10^5
- Significant figures: 3 figures for all displays (e.g., 1.23e+05)

### GitHub Pages Deployment
- Repository is public: `taichi-shimizu-ortho/android_app`
- Deploy: Push changes to `main`, apps live immediately at:
  - `https://taichi-shimizu-ortho.github.io/android_app/ihc/`
  - `https://taichi-shimizu-ortho.github.io/android_app/ish/`
  - `https://taichi-shimizu-ortho.github.io/android_app/msc/`

## Testing Checklist for Key Features

### PWA Installation
- [ ] Add to home screen works on iOS Safari and Android Chrome
- [ ] Service Worker registers without errors (DevTools → Application)
- [ ] App works offline after installation

### Protocol App (Cell Counting)
- [ ] User can enter hemocytometer readings
- [ ] Dish size selection works and affects density calculation
- [ ] Cell count and density display with correct significant figures
- [ ] Supabase sync succeeds (check logs in DevTools console)
- [ ] Google Sheets/Forms submission completes without errors
- [ ] Unsaved data protection alerts on navigation

### Timers
- [ ] Section timers count down correctly
- [ ] Auto-advance to next section at zero
- [ ] Progress bar updates
- [ ] Manual NEXT/PREV navigation works
