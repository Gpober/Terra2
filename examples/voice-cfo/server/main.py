import io
import os

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from openai import OpenAI
from supabase import Client, create_client

app = FastAPI()
client = OpenAI()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def check_availability(query: str) -> list[dict]:
    """Lookup reservations in Supabase."""
    if not supabase:
        return []
    response = supabase.table("reservations").select("*").execute()
    return response.data or []


def format_cfo_response(question: str, reservations: list[dict]) -> str:
    if not reservations:
        return f"No reservations found. You asked: {question}"
    first = reservations[0]
    summary = ", ".join(f"{k}: {v}" for k, v in first.items())
    return f"First reservation -> {summary}. You asked: {question}"


@app.post("/ask-cfo")
async def ask_cfo(audio: UploadFile = File(...)):
    # 1. speech to text
    transcription = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe",
        file=audio.file,
    )
    question_text = transcription.text

    # 2. lookup reservation data
    reservations = check_availability(question_text)

    # 3. CFO-style reply
    cfo_response = client.responses.create(
        model="gpt-4o",
        input=[
            {"role": "system", "content": "You are a CFO who can handle reservation queries concisely."},
            {"role": "user", "content": format_cfo_response(question_text, reservations)},
        ],
    )
    answer_text = cfo_response.output_text

    # 4. text to speech
    speech = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input=answer_text,
    )

    # 5. stream back to client
    return StreamingResponse(io.BytesIO(speech.audio), media_type="audio/mpeg")
