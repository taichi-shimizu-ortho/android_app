# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-app Progressive Web App (PWA) project hosting three independent apps deployed via GitHub Pages:

- **Timer**: IHC double staining protocol timer with section-based countdown and automatic progression
- **Prompter**: Presentation timer for managing section durations with progress tracking
- **Protocol**: Cell culture protocol guide with cell counting/density features, Supabase integration, and Google Forms data submission

All apps are fully offline-capable via Service Workers and installable as PWA home screen apps on iOS/Android.

## Repository Structure

```
docs/                          # GitHub Pages deployment root (public_html)
├── index.html                 # App portal/menu
├── timer/
│   ├── index.html             # Timer app UI
│   ├── sw.js                  # Service Worker
│   ├── manifest.json          # PWA metadata
│   └── icons/
├── prompter/
│   ├── index.html             # Prompter app UI
│   ├── sw.js                  # Service Worker
│   ├── manifest.json          # PWA metadata
│   └── icons/
└── protocol/
    ├── index.html             # Protocol app UI
    ├── main.js                # Protocol-specific JavaScript (cell counting, API integration)
    ├── sw.js                  # Service Worker
    ├── manifest.json          # PWA metadata
    └── icons/
shared/
├── icons/                     # Shared PWA icons (icon-192.png, icon-512.png)
gen_icons_prompter.py          # Script to generate prompter app icons
gen_icons_protocol.py          # Script to generate protocol app icons
```

## Development Commands

### Generating App Icons
Both Timer and Protocol apps use Python scripts to generate their PWA icons (must have PIL installed):

```bash
python gen_icons_prompter.py    # Generates prompter icons (icon-192.png, icon-512.png)
python gen_icons_protocol.py    # Generates protocol icons
```

Icons are generated with branded text overlays and saved to `shared/icons/` and app-specific `icons/` directories. The scripts use Arial font and specific color schemes per app.

### Running Locally
Each app in `docs/` is a self-contained HTML/CSS/JavaScript PWA. To test locally:

1. Serve the `docs/` directory via HTTP (required for Service Worker support):
   ```bash
   # Using Python (cross-platform)
   python -m http.server 8000 --directory docs
   
   # Then visit: http://localhost:8000/
   ```

2. Use browser DevTools to test offline mode (Application → Service Workers → Offline)

## Architecture & Key Technologies

### Frontend (Vanilla JavaScript)
All apps use HTML5/CSS3 and Vanilla JavaScript with no build step or frameworks:
- **Timer & Prompter**: Self-contained timer logic with section management
- **Protocol**: More complex with cell counting calculations, data persistence, and external API integration

### Service Workers
Each app includes a `sw.js` Service Worker for:
- Complete offline functionality
- Asset caching strategy (cache-first for assets, network-first for HTML)
- Background sync capability

### Protocol App: Advanced Features

The Protocol app (`docs/protocol/`) is the most complex and includes:

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
- Changes in `docs/` are directly served as live app code—no build step
- Service Workers must be updated when asset paths change
- PWA manifest paths must match actual file locations
- Test offline functionality after any asset changes

### Cell Counting & Calculations (Protocol App)
- **Default dish size**: 60mm (area ≈ 2827 mm²)
- **Cell count input**: Hemocytometer reading × 10^4 (average of 4 squares)
- **Density formula**: (counted_value_mean / dish_area_mm²) × 10^5
- Significant figures: 3 figures for all displays (e.g., 1.23e+05)

### Icon Generation
- Prompter icons: Orange background (#F77E58) with "2026ORS presentation" text
- Protocol icons: Generated dynamically per app needs
- Both stored in `shared/icons/` and copied/linked in app folders

### GitHub Pages Deployment
- Repository is public: `taichi-shimizu-ortho/android_app`
- Deploy: Push changes to `main`, apps live immediately at:
  - `https://taichi-shimizu-ortho.github.io/android_app/timer/`
  - `https://taichi-shimizu-ortho.github.io/android_app/prompter/`
  - `https://taichi-shimizu-ortho.github.io/android_app/protocol/`

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

### Timer/Prompter
- [ ] Section timers count down correctly
- [ ] Auto-advance to next section at zero
- [ ] Progress bar updates
- [ ] Manual NEXT/PREV navigation works
