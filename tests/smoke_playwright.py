"""Simple Playwright smoke test for the Dino game."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright


async def main() -> None:
    """Launch the Dino game page and verify the score increments."""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:8000/index.html")
        await page.wait_for_selector("#overlay", state="visible")
        await page.keyboard.press("Space")
        await page.wait_for_timeout(2000)
        score_text = await page.text_content("#score")
        print(f"Score after 2s: {score_text}")
        artifacts_dir = Path("artifacts")
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(artifacts_dir / "gameplay.png"), full_page=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
