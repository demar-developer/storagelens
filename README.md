# StorageLens

A Windows app that shows what is using your drives. It reads file and folder details on your PC (names, sizes, dates
and OneDrive states), never what is in your files, and it changes nothing: it has no delete, recycle, move or
OneDrive "Free up space" function.

## Download (0.4.0 preview)

StorageLens comes as seven apps that show the same facts in seven layouts. Pick one, or several: they install side
by side and each keeps its own scans.

| Download | What it is | Size |
|---|---|---|
| [StorageLens Standard](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Standard-Setup.exe) | The original layout: a sidebar, an overview and plain lists. | 38 MB |
| [StorageLens Telemetry](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Telemetry-Setup.exe) | An instrument console: your drive on a dial, with readouts beside it. | 60 MB |
| [StorageLens Atlas](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Atlas-Setup.exe) | A map of your drive on every page, with lenses for size, risk, growth and OneDrive. | 63 MB |
| [StorageLens Strata](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Strata-Setup.exe) | Your folders as columns to step through, made for the keyboard. | 58 MB |
| [StorageLens Mosaic](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Mosaic-Setup.exe) | A board of tiles, each one a view of your storage. | 60 MB |
| [StorageLens Ledger](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Ledger-Setup.exe) | Your storage as a printed report: plain figures on paper. | 59 MB |
| [StorageLens Skyline](https://github.com/demar-developer/storagelens/releases/latest/download/StorageLens-Skyline-Setup.exe) | Your folders as a city, the biggest standing tallest. | 61 MB |

These links always give the newest version. Every version, with its notes, is under [Releases](https://github.com/demar-developer/storagelens/releases).

### Windows will ask you to confirm

The files are not code-signed yet, so on a downloaded copy Windows shows "Windows protected your PC". Choose
**More info**, then **Run anyway**. Your browser may also say the file is not commonly downloaded: choose to keep it.

### Installing, updating and removing

- Open the downloaded file. Setup shows where the app and your scans will go, and needs no administrator rights:
  it installs for your Windows account only.
- To update, download the newer file and open it. Your scans and notes stay where they are.
- To remove it, use Windows Settings > Apps > Installed apps. Your scans and notes are kept; delete that folder
  yourself if you no longer want them.
- A new install starts empty: press **Start first scan**.

### Check a download

[SHA256SUMS.txt](https://github.com/demar-developer/storagelens/releases/latest/download/SHA256SUMS.txt) lists the SHA-256 of every file. In PowerShell:
`Get-FileHash .\StorageLens-Atlas-Setup.exe`.

## What's new

See [CHANGELOG.md](CHANGELOG.md).

## Licences

StorageLens is built in Rust with [Slint](https://slint.dev). The licences of the software inside the apps are in
[THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt), which each app's About page can save too. Ledger's figures are
set in Doto, under the SIL Open Font License, with one glyph changed: the licence and the change are in
[licenses/](licenses/).

This repository holds the downloads and their notes. The source code is not published here.
