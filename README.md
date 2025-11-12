# Dino Game
This project recreates the classic “no internet” Chrome dinosaur runner using plain HTML, CSS, and JavaScript.

## Getting started
Open `index.html` in a modern browser. Use the **Space** bar or **Arrow Up** to jump over obstacles. The game tracks your score
and stores your best run locally.

## Testing
A simple Playwright smoke script is available at `tests/smoke_playwright.py`. Run it while serving the project locally:

1. Start a static server, for example `python -m http.server 8000` from the project root.
2. Install the Python Playwright package (`pip install playwright`) and the browser binaries (`playwright install`).
3. Execute the script with `python tests/smoke_playwright.py` to open the game, trigger a jump, and capture a screenshot in `artifacts/gameplay.png`.
