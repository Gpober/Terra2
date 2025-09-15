import io
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from openai import OpenAI

app = FastAPI()
client = OpenAI()


def check_availability(query: str) -> str:
    """Placeholder for reservation lookup."""
    # In a real app this would query your reservation DB or API.
    return "Reservations are wide open."  # dummy response


def format_cfo_response(question: str, availability: str) -> str:
    return f"{availability} You asked: {question}"


@app.post("/ask-cfo")
async def ask_cfo(audio: UploadFile = File(...)):
    # 1. speech to text
    transcription = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe",
        file=audio.file,
    )
    question_text = transcription.text

    # 2. lookup reservation data
    availability = check_availability(question_text)

    # 3. CFO-style reply
    cfo_response = client.responses.create(
        model="gpt-4o",
        input=[
            {"role": "system", "content": "You are a CFO who can handle reservation queries concisely."},
            {"role": "user", "content": format_cfo_response(question_text, availability)},
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
