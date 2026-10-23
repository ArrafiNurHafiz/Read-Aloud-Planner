import subprocess
import os
import json
from gtts import gTTS

SCENES = {
    "scene1_intro": (
        "For millions of blind and severely dyslexic individuals, conventional visual grid calendars are disorienting labyrinths. "
        "They often have to call friends every morning just to have their daily schedules read to them. "
        "Introducing Read Aloud Planner: an accessible daily planner you can hear, speak to, and explore with safe touch interactions."
    ),
    "scene2_zerologin": (
        "Designed without barriers, Read Aloud Planner completely eliminates login walls and registration forms. "
        "The application opens directly to your schedule and is immediately usable offline, featuring high contrast themes and disability-friendly focus indicators."
    ),
    "scene3_doubletap": (
        "A revolutionary feature for visually impaired users: Two-Tap Blind Assist Mode. "
        "A single tap reads out the button's name and purpose aloud without accidental clicks. "
        "A quick second tap executes the action instantly."
    ),
    "scene4_voiceinput": (
        "Adding tasks is now as effortless as speaking. "
        "Simply tap the voice button and speak your schedule naturally. "
        "Our smart natural language parser automatically extracts the title, time, duration, and room in seconds without typing a single character."
    ),
    "scene5_linearfocus": (
        "Every schedule entry is structured as a complete linear sentence optimized for screen readers. "
        "Focus Mode presents one task at a time on screen for maximum comfort for individuals with dyslexia and ADHD."
    ),
    "scene6_outro": (
        "Read Aloud Planner has passed automated WCAG 2.2 Level AA audits with zero critical violations, and is available for free as an installable Progressive Web App and standalone Android APK. "
        "A schedule you hear, not just see."
    )
}

durations = {}

for scene_id, text in SCENES.items():
    raw_path = f"demo_video/audio/{scene_id}_en_raw.mp3"
    mastered_path = f"demo_video/audio/{scene_id}_en.mp3"

    print(f"Synthesizing English {scene_id} via gTTS...")
    tts = gTTS(text=text, lang='en', tld='com', slow=False)
    tts.save(raw_path)

    # Master via ffmpeg equalizer + compand + loudnorm for broadcast richness
    filter_chain = (
        "equalizer=f=120:width_type=h:width=80:g=1.8,"
        "equalizer=f=2800:width_type=h:width=1000:g=2.8,"
        "equalizer=f=6500:width_type=h:width=2000:g=3.2,"
        "treble=g=2.2:f=8000,"
        "compand=attacks=0.03:decays=0.15:points=-80/-80|-36/-22|-16/-10|0/-1.5:soft-knee=6,"
        "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000"
    )
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_path,
        "-af", filter_chain,
        mastered_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        mastered_path
    ]
    out = subprocess.check_output(probe_cmd).decode().strip()
    dur = float(out)
    durations[scene_id] = dur
    print(f"Mastered English {scene_id}: {dur:.2f}s")

with open("demo_video/audio/durations_en.json", "w") as f:
    json.dump(durations, f, indent=2)

# Concatenate all 6 mastered English scene audios into full_narration_en.mp3
concat_cmd = [
    "ffmpeg", "-y",
    "-i", "demo_video/audio/scene1_intro_en.mp3",
    "-i", "demo_video/audio/scene2_zerologin_en.mp3",
    "-i", "demo_video/audio/scene3_doubletap_en.mp3",
    "-i", "demo_video/audio/scene4_voiceinput_en.mp3",
    "-i", "demo_video/audio/scene5_linearfocus_en.mp3",
    "-i", "demo_video/audio/scene6_outro_en.mp3",
    "-filter_complex", "[0:a][1:a][2:a][3:a][4:a][5:a]concat=n=6:v=0:a=1[outa]",
    "-map", "[outa]",
    "-c:a", "mp3",
    "-b:a", "192k",
    "demo_video/audio/full_narration_en.mp3"
]
subprocess.run(concat_cmd, check=True)
print("\nMastered full English narration produced at demo_video/audio/full_narration_en.mp3")
