# Voice AI CFO Example

This example demonstrates how to build a mobile voice interface that
handles reservation questions in a CFO-style voice.

## Server

`server/main.py` exposes a `/ask-cfo` endpoint using FastAPI. It:

1. Accepts an uploaded audio file.
2. Transcribes speech with `gpt-4o-mini-transcribe`.
3. Generates a concise answer using `gpt-4o` with a CFO persona.
4. Converts the text reply back into speech.
5. Streams the result as an MP3.

The server connects to a Supabase table named `reservations` to look up
existing bookings. The `check_availability` helper searches the table by
date (`YYYY-MM-DD`) or performs a fuzzy text match against `guest_name`,
`room`, or `notes` columns and forwards any matches to the CFO model for
summary. Supply your Supabase credentials via `SUPABASE_URL` and
`SUPABASE_KEY` environment variables.

Start the server:

```bash
pip install -r requirements.txt
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_KEY="<your_anon_key>"
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Mobile

`mobile/App.js` is a minimal React Native (Expo) client that records
audio, POSTs it to the server, and plays back the CFO voice answer.
Install dependencies:

```bash
expo install expo-av buffer
```

Run the app with Expo and update `YOUR_SERVER_IP` to point at the
running server.
