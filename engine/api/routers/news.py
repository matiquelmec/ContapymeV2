from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from core.auth import verify_token
from workers.news_worker import _fetch_and_process_news

router = APIRouter()

@router.post("/sync")
async def trigger_news_sync(
    background_tasks: BackgroundTasks
):
    """
    Gatilla la sincronización y procesamiento de noticias regionales
    con IA (Groq) de fondo para evitar timeouts HTTP.
    """
    try:
        # Ejecutar como BackgroundTask para que FastAPI devuelva respuesta inmediata
        # mientras el worker procesa con Groq en paralelo.
        background_tasks.add_task(_fetch_and_process_news)
        return {"status": "success", "message": "Procesamiento e IA de noticias iniciado en segundo plano."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al iniciar sincronización: {str(e)}")
