import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Select each category filter one by one and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '전체' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '영상/모션그래픽' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '영상/모션그래픽' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '그래픽 디자인' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '그래픽 디자인' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '브랜딩/편집' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '브랜딩/편집' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter 'UI/UX' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the 'UI/UX' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '일러스트레이션' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '일러스트레이션' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '디지털 아트' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '디지털 아트' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[7]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter 'AI' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the 'AI' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[8]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '캐릭터 디자인' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '캐릭터 디자인' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[9]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '제품/패키지 디자인' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '제품/패키지 디자인' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[11]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the next category filter '포토그래피' and verify project cards update accordingly
        frame = context.pages[-1]
        # Select the '포토그래피' category filter
        elem = frame.locator('xpath=html/body/div[2]/div/main/section[2]/div[3]/div[11]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=발견').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=채용').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=NEW').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=워크숍/커뮤니티').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=포폴 피드백').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=에이전시').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=로그인').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=회원가입').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=레퍼런스로 시작하는 스몰 브랜드 브랜딩 워크숍').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=전체').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=영상/모션그래픽').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=그래픽 디자인').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=브랜딩/편집').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=UI/UX').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=일러스트레이션').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=디지털 아트').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=AI').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=캐릭터 디자인').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=제품/패키지 디자인').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=포토그래피').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=타이포그래피').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=공예').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=파인아트').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    