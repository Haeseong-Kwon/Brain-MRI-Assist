import asyncio
from playwright.async_api import async_playwright
from io import BytesIO
from PIL import Image

async def main():
    print("Starting Playwright to record demo...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--ignore-gpu-blocklist'
        ])
        context = await browser.new_context(viewport={'width': 1200, 'height': 800}, device_scale_factor=1)
        page = await context.new_page()
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
        
        frames = []
        
        async def capture_frame():
            screenshot = await page.screenshot()
            img = Image.open(BytesIO(screenshot)).convert('RGB')
            img = img.resize((1200, 800), Image.Resampling.LANCZOS)
            frames.append(img)
            
        print("Navigating to dashboard...")
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        
        # Take a few frames of Dashboard (Slower)
        for _ in range(15):
            await capture_frame()
            await asyncio.sleep(0.2)
            
        print("Clicking into MRI viewer...")
        await page.click('a[href="/mri/SCN-8821"]')
        
        print("Waiting for viewer to load...")
        try:
            await page.wait_for_selector("text=Ready for Segmentation", timeout=15000)
            await page.wait_for_selector("canvas", state="visible", timeout=15000)
            print("Canvas is visible, waiting for spinner to disappear...")
            await page.wait_for_selector(".animate-spin", state="detached", timeout=30000)
        except Exception as e:
            print("Timeout waiting for load", e)
        
        # Give it a good 3-4 seconds after load to let the user see the loaded MRI
        print("Loaded! Showcasing initial MRI state...")
        for _ in range(25):
            await capture_frame()
            await asyncio.sleep(0.2)
            
        print("Running AI analysis...")
        await page.click('button:has-text("Run AI Analysis")')
        
        # Capture frames during processing and fade in, give it more time (slower)
        for _ in range(40):
            await capture_frame()
            await asyncio.sleep(0.2)
            
        # Switch to multiplanar config
        print("Clicking Multiplanar...")
        try:
            await page.click('button:has-text("Multiplanar")')
        except Exception:
            pass
            
        # Show results longer
        for _ in range(30):
            await capture_frame()
            await asyncio.sleep(0.2)
            
        print(f"Captured {len(frames)} frames. Stopping browser...")
        await browser.close()
        
        output_file = "brain_mri_assist_demo.gif"
        print(f"Saving to {output_file}...")
        frames[0].save(
            output_file,
            save_all=True,
            append_images=frames[1:],
            loop=0,
            duration=150  # 150ms per frame to slow down GIF overall
        )
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
