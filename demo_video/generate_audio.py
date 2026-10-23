import subprocess
import os
import json
from gtts import gTTS

SCENES = {
    "scene1_intro": (
        "Bagi jutaan penyandang disabilitas netra dan disleksia berat, kalender konvensional berbentuk kisi-kisi visual adalah labirin yang membingungkan. "
        "Mereka sering harus menelepon orang lain hanya untuk dibacakan jadwal kuliahnya. "
        "Inilah Read Aloud Planner: aplikasi perencana harian cerdas yang bisa didengar, diajak bicara, dan dijelajahi dengan sentuhan aman."
    ),
    "scene2_zerologin": (
        "Didesain tanpa hambatan, Read Aloud Planner menghapus total dinding login dan registrasi. "
        "Aplikasi langsung terbuka ke jadwal dan dapat digunakan secara luring seketika sejak detik pertama dibuka, lengkap dengan tema kontras tinggi dan indikator fokus ramah disabilitas."
    ),
    "scene3_doubletap": (
        "Fitur revolusioner untuk tunanetra: Mode Bantuan Ketuk Ganda. "
        "Satu ketukan akan membacakan fungsi tombol dengan suara tanpa risiko salah pencet. "
        "Ketukan kedua secara cepat akan langsung menjalankan fiturnya secara instan."
    ),
    "scene4_voiceinput": (
        "Menambah kegiatan kini semudah berbicara. "
        "Cukup tekan tombol suara dan ucapkan jadwal Anda secara alami. "
        "Sistem pengurai cerdas kami otomatis mengekstrak judul, jam, durasi, dan lokasi dalam sekejap tanpa perlu mengetik satu huruf pun."
    ),
    "scene5_linearfocus": (
        "Setiap jadwal disusun dalam struktur kalimat linear utuh yang ramah pembaca layar. "
        "Tersedia pula Mode Fokus yang menampilkan satu kegiatan per layar untuk kenyamanan maksimal penyandang disleksia dan ADHD."
    ),
    "scene6_outro": (
        "Read Aloud Planner telah lolos audit kepatuhan WCAG 2.2 Level AA dengan nol pelanggaran kritis, dan kini tersedia gratis sebagai Progressive Web App serta paket APK Android mandiri. "
        "Jadwal yang bisa didengar, bukan hanya dilihat."
    )
}

durations = {}

for scene_id, text in SCENES.items():
    raw_path = f"demo_video/audio/{scene_id}_raw.mp3"
    mastered_path = f"demo_video/audio/{scene_id}.mp3"

    print(f"Synthesizing {scene_id} via gTTS...")
    tts = gTTS(text=text, lang='id', slow=False)
    tts.save(raw_path)

    # Master via ffmpeg equalizer + compand + loudnorm for broadcast richness
    filter_chain = (
        "equalizer=f=120:width_type=h:width=80:g=2.0,"
        "equalizer=f=2800:width_type=h:width=1000:g=3.0,"
        "equalizer=f=6500:width_type=h:width=2000:g=3.5,"
        "treble=g=2.5:f=8000,"
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
    print(f"Mastered {scene_id}: {dur:.2f}s")

with open("demo_video/audio/durations.json", "w") as f:
    json.dump(durations, f, indent=2)

print("\nAll audio narrations mastered successfully!")
