# Football Live Duel

A 1v1 football fantasy duel. You and a friend each pick 2 players from one real match and score points from what they do.

- `index.html`: the whole app (the screens people see).
- `api/football.js`: a small server function that talks to API-Football. The API key stays here, on the server, and never reaches the phone.

## Setup (Vercel)

1. Import this GitHub repository in Vercel. No build settings are needed.
2. In Vercel, go to Project › Settings › Environment Variables and add `API_FOOTBALL_KEY` with your key from dashboard.api-football.com.
3. Redeploy. Open the site on your iPhone in Safari, tap Share › Add to Home Screen.

## Scoring

Goal +10 · Assist +7 · Shot on target +2 · Tackle +1 · Every 10 completed passes +1 · Goalkeeper save +1 · Foul −1 · Yellow −3 · Red −8 (second yellow −5 on top of the first).

## Data

Live events and player stats come from API-Football. They poll about once a minute and are cached for 55 seconds, so several phones watching the same match share one request. The free API plan allows 100 requests a day.

## Accounts

Players sign in with a 6-digit code sent by email (`api/account.js`). Codes are sent from a Gmail account with an app password, set in Vercel as `GMAIL_USER` and `GMAIL_APP_PASSWORD`. Google sign-in turns on when `GOOGLE_CLIENT_ID` is set. The privacy policy is at `/privacy.html`; "Delete my account" on the Profile tab erases the account for good.
