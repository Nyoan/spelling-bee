# Spelling Bee 2026 — GitHub Pages edition

A static, no-account spelling bee practice and 25-word automatic exam app. Open `index.html` on GitHub Pages for the exam, or `practice.html` for the preserved original practice experience.

## Deploy to GitHub Pages

1. Create a public GitHub repository (e.g. `spelling-bee-2026`).
2. Upload **all files and folders inside this project** to the repository root. Do not upload only `index.html`.
3. Open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then save.
4. Visit `https://YOUR-USERNAME.github.io/spelling-bee-2026/` once GitHub finishes deploying.

To test locally, use `python -m http.server 8000` from the project directory and visit `http://localhost:8000`. Opening `index.html` directly as a `file://` URL will not load the JSON word banks in many browsers.

## Exam features

- Group B (Grades 3–4) or Group C (Grades 5–6)
- Combined bank (2026 PDF + original Group B/C + group-specific thesaurus lists), or PDF-only bank
- 25 random, nonrepeating words, chosen at the start of each exam
- Word announcement, spoken word, source sentence, spoken word again
- Countdown **begins only after the spoken sequence finishes**; choose 10, 15, 20 or 30 seconds
- Automatically advances through all 25 words without pressing Next
- Paper exam: listen and write on paper; review the answer key at the end
- Typing exam: enter an answer during the countdown; it auto-saves and scores on expiry
- Pause/resume, replay current word, early finish, printable answer sheet, CSV results
- Saves recent exam history in browser localStorage (no cloud sync)
- Existing practice mode and mistake review retained at `practice.html`, including new 2026 PDF and combined-group choices

## Word-bank provenance

- `data/group-b-2026.json`: 60 exact word/sentence pairs extracted from the uploaded 2026 Group B PDF.
- `data/group-c-2026.json`: 60 exact word/sentence pairs extracted from the uploaded 2026 Group C PDF.
- `data/group-b-combined.json`: 151 unique words, with PDF entries taking priority, then original Group B, then Group B thesaurus.
- `data/group-c-combined.json`: 154 unique words, with PDF entries taking priority, then original Group C, then Group C thesaurus.
- The original `new120` and ungrouped lists remain in `practice.html`, but are **not assigned arbitrarily** to Group B or Group C exam banks.
- Source spelling is preserved, including regional variants. Typing answers are compared case-insensitively, trimming surrounding spaces.

## Speech reliability / important limitation

The exam uses the browser's built-in Web Speech API (`speechSynthesis`), avoiding third-party network TTS services for exam playback. Voices differ by browser, operating system and device. Browsers may suspend speech or timers when a tab is in the background, the phone locks, or audio focus changes. Keep the page visible and screen awake. Press **Start exam** to enable speech on mobile. If a voice fails or stalls, pause and replay the current word. A production-grade competition deployment should use reviewed, pre-recorded audio clips for every word/sentence, and test on the actual devices.

No server-side storage or anti-cheating features are provided. This is a practice simulator, not a certified competition system.


## Learning Lab (new)

Open `learning.html` from the navigation bar. Choose Group B or C and the combined or 2026-only word bank. Listen to slow or natural pronunciation, hear the word-sentence-word sequence, reveal a spelling clue, type an answer, and review missed or due words. Progress is stored in browser localStorage on that device. Spelling chunks are visual memory aids, not phonetic syllabification. Browser speech voices vary by device. The strict exam remains separate in `index.html`.

## Unified kid-friendly theme
All three pages now share the same bee-themed navigation, warm yellow/orange and mint palette, friendly typography, large touch targets and responsive layouts. The original practice engine remains embedded in `practice.html`; the shared stylesheet and `css/practice-theme.css` restyle it without modifying its logic.
