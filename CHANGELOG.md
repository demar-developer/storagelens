# Changelog

What changed in each version of StorageLens, newest first. This file is the one place the changes are written down:
the website's "What's new" and the notes on each GitHub release are taken from it.

## 0.4.0 preview (24 November 2026)

The first public preview.

### Seven applications, one per layout

StorageLens comes as seven separate apps. They show the same facts about your drives, each in its own layout:

| App | What it is |
|---|---|
| StorageLens Standard | The original layout: a sidebar, an overview and plain lists. |
| StorageLens Telemetry | An instrument console: your drive on a dial, with readouts beside it. |
| StorageLens Atlas | A map of your drive on every page, with lenses for size, risk, growth and OneDrive. |
| StorageLens Strata | Your folders as columns to step through, made for the keyboard. |
| StorageLens Mosaic | A board of tiles, each one a view of your storage. |
| StorageLens Ledger | Your storage as a printed report: plain figures on paper. |
| StorageLens Skyline | Your folders as a city, the biggest standing tallest. |

- Install one or several: each keeps its own scans and notes, and none touches another's.
- Every app has a theme picker in its header and remembers the theme you choose.

### Installing, updating and removing

- Open the downloaded file. A Setup window in that layout's own look shows where the app and your scans will go,
  offers a desktop shortcut, shows the work as it runs and ends with a button that opens the app.
- It installs for your Windows account only and needs no administrator rights. The app goes in
  `%LOCALAPPDATA%\Programs\StorageLens <Layout>`, your scans and notes in `%LOCALAPPDATA%\StorageLens <Layout>\Library`.
- To update, download a newer file and open it. Your scans and notes stay where they are.
- To remove it, use Windows Settings > Apps > Installed apps. Your scans and notes are kept; delete that folder
  yourself if you no longer want them.

### What it reads, and what it never does

- A scan reads file and folder names, sizes, dates and OneDrive states. It does not read what is in your files.
- It has no delete, recycle, move or OneDrive "Free up space" function, and it never downloads a file that is
  online-only in OneDrive.

### Known limits

- The files are not code-signed yet. On a downloaded copy Windows shows "Windows protected your PC": choose
  More info, then Run anyway.
- The app does not check for updates by itself.
- A new install starts empty: press Start first scan.
- Built and tested on Windows 11, 64-bit.
