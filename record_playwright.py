import asyncio
from playwright.async_api import async_playwright
from io import BytesIO
from PIL import Image

async def main():
    print("Starting Playwright to record demo...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1200, 'height': 800}, device_scale_factor=1)
        page = await context.new_page()
        
        frames = []
        
        async def capture_frame():
            screenshot = await page.screenshot()
            img = Image.open(BytesIO(screenshot)).convert('RGB')
            img = img.resize((1200, 800), Image.Resampling.LANCZOS)
            frames.append(img)
            
        print("Navigating to dashboard...")
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        
        # Take a few frames of Dashboard
        for _ in range(5):
            await capture_frame()
            await asyncio.sleep(0.1)
            
        print("Clicking into MRI viewer...")
        # SCN-8821 link
        await page.click('a[href="/mri/SCN-8821"]')
        
        print("Waiting for viewer to load...")
        try:
            await page.wait_for_selector("text=Ready for Segmentation", timeout=15000)
            await page.wait_for_selector("canvas", state="visible", timeout=15000)
        except Exception as e:
            print("Timeout waiting for load", e)
        
        # Slight pause to let volumes load visually
        for _ in range(15):
            await capture_frame()
            await asyncio.sleep(0.1)
            
        print("Running AI analysis...")
        await page.click('button:has-text("Run AI Analysis")')
        
        # Capture frames during processing and fade in
        for _ in range(50):
            await capture_frame()
            await asyncio.sleep(0.1)
            
        # Switch to multiplanar config
        print("Clicking Multiplanar...")
        try:
            await page.click('button:has-text("Multiplanar")')
        except Exception:
            pass
            
        # Give it some final frames to show results
        for _ in range(20):
            await capture_frame()
            await asyncio.sleep(0.1)
            
        print(f"Captured {len(frames)} frames. Stopping browser...")
        await browser.close()
        
        # Save directly to GIF in workspace root (overwriting)
        output_file = "brain_mri_assist_demo.gif"
        print(f"Saving to {output_file}...")
        frames[0].save(
            output_file,
            save_all=True,
            append_images=frames[1:],
            loop=0,
            duration=100
        )
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
