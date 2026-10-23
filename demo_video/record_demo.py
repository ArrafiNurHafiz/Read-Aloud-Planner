import asyncio
import os
import sys
import time
import subprocess
from playwright.async_api import async_playwright

DURATION = 114  # Total duration in seconds matching English narration (111.7s + 2.3s buffer)

async def record():
    os.makedirs('demo_video/recordings', exist_ok=True)
    os.makedirs('demo_video/frames', exist_ok=True)
    
    print(f"Starting Playwright 1080p recording for {DURATION}s...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--autoplay-policy=no-user-gesture-required'
            ]
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir='demo_video/recordings',
            record_video_size={'width': 1920, 'height': 1080},
            device_scale_factor=1
        )
        page = await context.new_page()
        
        # Navigate to demo studio
        print("Navigating to http://localhost:3000/demo.html?autoplay=1 ...")
        await page.goto('http://localhost:3000/demo.html?autoplay=1')
        await page.wait_for_load_state('networkidle')
        
        await page.wait_for_timeout(1000)
        is_paused = await page.evaluate("() => document.querySelector('audio')?.paused")
        if is_paused:
            print("Audio was paused, starting playback...")
            await page.evaluate("() => document.querySelector('audio')?.play()")
        else:
            print("Audio is playing smoothly.")
            
        start_time = time.time()
        while time.time() - start_time < DURATION:
            elapsed = int(time.time() - start_time)
            curr = await page.evaluate("() => document.querySelector('audio')?.currentTime")
            print(f"Recording progress: {elapsed}/{DURATION}s (audio: {curr:.1f}s)...", end='\r')
            await asyncio.sleep(2)
            
        print(f"\nRecording completed ({DURATION}s). Finalizing video stream...")
        video_path = await page.video.path()
        await page.close()
        await context.close()
        await browser.close()
        
        print(f"Raw video saved at: {video_path}")
        return video_path

def mux_and_master(raw_video_path):
    output_mp4 = "demo_video/ReadAloudPlanner_Demo_Video.mp4"
    audio_path = "demo_video/audio/full_narration_en.mp3"
    
    print("Muxing video with mastered English audio narration via FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", raw_video_path,
        "-i", audio_path,
        "-vf", "scale=1920:1080:flags=lanczos,setsar=1/1,setdar=16/9",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_mp4
    ]
    subprocess.run(cmd, check=True)
    print(f"Mastered demo video produced at: {output_mp4}")
    
    # Extract frames for visual QA
    print("Extracting representative keyframes for visual inspection...")
    # Clean old frames
    for f in os.listdir("demo_video/frames"):
        if f.endswith(".png"):
            os.remove(os.path.join("demo_video/frames", f))
            
    frame_cmd = [
        "ffmpeg", "-y",
        "-i", output_mp4,
        "-vf", "fps=1/10",
        "demo_video/frames/frame_%03d.png"
    ]
    subprocess.run(frame_cmd, check=True)
    print("Frames extracted to demo_video/frames/")

if __name__ == '__main__':
    raw = asyncio.run(record())
    mux_and_master(raw)
