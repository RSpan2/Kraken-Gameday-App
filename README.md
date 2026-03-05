# NHL Gameday App

React Native + Expo app for browsing NHL games with team-specific and league-wide views.

## Features

- Team schedule view with Upcoming and Previous tabs
- All Teams view for the remaining regular season
- Live score freshness by overlaying `score/now` data on schedule data
- Team selector modal
- Full Jest test coverage (100%)

## Tech Stack

- React Native
- Expo
- TypeScript
- Jest + React Native Testing Library

## Prerequisites

See `requirements.txt` for environment/tooling requirements.

## Installation

```bash
npm install
```

## Run the App

```bash
npm run start
```

Platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Testing

Run tests:

```bash
npm test
```

Run coverage:

```bash
npm run test:coverage
```

## API Data Strategy

The app uses NHL public endpoints:

- Team view: `https://api-web.nhle.com/v1/club-schedule-season/{TEAM}/{SEASON}`
- League schedule pages: `https://api-web.nhle.com/v1/schedule/now` and `https://api-web.nhle.com/v1/schedule/{startDate}`
- Live overlay: `https://api-web.nhle.com/v1/score/now`

For the All Teams view, schedule data provides season breadth and `score/now` overlays fresher live/final updates when available.

## Project Structure

```text
App.tsx
components/
  GameCard.tsx
  GameList.tsx
  TeamSelector.tsx
services/
  nhlApi.ts
data/
  nhlTeams.ts
types/
  Game.ts
__tests__/
```

## Notes

- If web is used, requests may route through a CORS proxy depending on environment.
- APK builds can be done with EAS (`eas build --platform android --profile preview`).
