# Lexicon

Lexicon is a browser-first vocabulary trainer for English and German Bildungssprache and Fremdwörter. It works offline with a local cache and can sync one private account across devices.

It provides:

- Separate English and German queues.
- One new word per language per local calendar day.
- Due reviews scheduled with a deterministic SM-2-lite algorithm.
- Sentence-gap recall, answer reveal, optional written practice, and self-reported ratings.
- Priority, exclusion, restoration, and custom-word creation.
- Optional lookup for the small bundled lexicon, plus fully manual custom-word entry.
- Local export/import, optional cloud sync, and reset controls.

## Local development

Install Node.js 22 or newer, then run:

```text
npm install
npm run dev
```

The default password is `wordgarden`. Change the SHA-256 digest in `src/auth/passwordGate.ts` if you want a different one. The gate is only a casual barrier: a static website cannot keep a password secret from someone who can inspect its JavaScript.

## Cross-device sync

GitHub Pages cannot store private shared progress by itself. To sync your one account across devices, use Supabase:

1. Create a Supabase project and enable email/password authentication.
2. Run the SQL in [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and fill in the project URL and public anon key from Supabase.
4. Run `npm run dev`, open Settings, and choose **Create account** once. Sign in with that same account on other devices.
5. After the account is created, disable public sign-ups in Supabase Authentication settings so this remains a single-user workspace.

Only the authenticated user can read or write the `learning_states` row because of the Row Level Security policies. The browser still keeps a local cache and export backup. The sync password is separate from the casual workspace password.

For GitHub Pages, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository Actions secrets. The deployment workflow passes them into the build. If they are absent, the site remains local-only.

Useful commands:

```text
npm run typecheck
npm run test:unit
npm run build
npm run preview
```

## Dictionary data

The starter curriculum is hand-authored and includes 50 English and 50 German entries. Custom words can be entered manually. The optional **Look up** button checks the small bundled lexicon and fills matching fields; unknown terms stay blank for you to complete.

For a larger dataset, place a filtered, open-licensed JSON snapshot at `data/dictionary-source.json` and run `npm run lexicon:build`. Each source entry must use this shape:

```json
{
  "lemma": "equivocal",
  "language": "english",
  "partOfSpeech": "adjective",
  "definitions": ["Open to more than one interpretation."],
  "etymology": "...",
  "examples": ["The answer was equivocal."],
  "source": "Dataset name and version"
}
```

Record the dataset URL, version, license, attribution, retrieval date, and modifications before committing generated data. The build-time source is useful for a larger or more controlled offline lexicon.

## GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository settings, set Pages to **GitHub Actions** as the source.
3. The workflow in `.github/workflows/deploy.yml` builds `dist` and deploys it.
4. Open `https://OWNER.github.io/REPOSITORY/` after the workflow completes.

The Vite base is relative, so the project site path works without changing source imports. For a future `word.example.com`, configure the custom domain in GitHub Pages and add the DNS CNAME record required by your DNS provider.

Without sync, progress is stored in `localStorage` for the current browser origin. Localhost and the deployed Pages URL have different storage, and clearing browser data removes local progress. With sync enabled, sign in again on the other device and use **Sync now** if needed. Export a backup from Settings before making major changes.

The private GitHub repository does not automatically make the published Pages site private. Availability for private repositories depends on the GitHub plan, and the client-side password is not real access control.