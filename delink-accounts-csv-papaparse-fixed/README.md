# De-Link Accounts (Bulk)

React + Vite + Tailwind CSS implementation of the supplied UI.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## CSV behavior

- Uses **Papa Parse** for CSV parsing and generation.
- Only `.csv` is accepted.
- Maximum 20 accounts.
- Account ID column is required.
- Account IDs must be numeric only.
- Duplicate Account IDs are rejected.
- Accounts are validated through a mock API.
- Mock API returns Login ID, Login Type, linked account and optional children.
- Selected validated accounts can be de-linked sequentially.
- Final results are downloadable as CSV.
- Template is downloadable as CSV.

## API

Replace `src/services/accountApi.js` with real API calls when the backend is ready.
