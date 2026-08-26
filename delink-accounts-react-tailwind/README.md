# De-Link Accounts (Bulk)

React + Tailwind implementation of the provided Jammu Power Distribution Corporation Limited UI.

## Stack

- React
- Vite
- Tailwind CSS
- lucide-react
- xlsx

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Excel workflow

The app supports:

1. Downloading an Excel template.
2. Uploading `.xlsx` / `.xls`.
3. Validating the required Account ID column.
4. Detecting invalid and duplicate rows.
5. Rendering actual uploaded Account IDs.
6. Sequential bulk processing with live statuses.
7. Generating and downloading a result Excel file.

The de-link API is currently simulated in `mockDelinkRequest()` and can be replaced with a real API call later.

## Excel format

The first worksheet must contain an Account ID column. These headers are accepted:

- Account ID
- account id
- AccountID
- account_id
- account-id
