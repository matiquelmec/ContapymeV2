from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from calculators.ml_engine import FinancialClassifier

router = APIRouter()

class TrainModelRequest(BaseModel):
    organization_id: str

class SuggestAccountRequest(BaseModel):
    organization_id: str
    description: str

@router.post("/train")
async def train_financial_model(req: TrainModelRequest):
    """
    Entrena forzadamente el modelo de ML bayesiano para una PyME estructurando 
    los pesos en base a cómo ellos mismos codifican sus compras históricas.
    """
    clf = FinancialClassifier(req.organization_id)
    try:
        result = clf.train_model()
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("detail"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error entrenando modelo local: {str(e)}")


@router.post("/suggest")
async def suggest_account(req: SuggestAccountRequest):
    """
    Cerebro Activo: Recibe el texto de la glosa bancaria o F29 y lanza
    una inferencia de 2 milisegundos para predecir la imputación.
    """
    clf = FinancialClassifier(req.organization_id)
    try:
        # Intenta cargar The Sovereign AI Memory
        if not clf.load_model():
            # Modelo virgen: Entrenarlo on-the-fly si tiene historia
            res_train = clf.train_model()
            if res_train.get("status") == "error":
                return {
                    "account_id": None, 
                    "confidence": 0.0, 
                    "suggested": False, 
                    "reason": "La IA aún no tiene suficientes registros históricos para aprender de esta empresa. Necesita >15 datos."
                }
        
        # Inferencia Predictiva (Costo $0 USD, Tiempo: 0.002s)
        prediction = clf.predict(req.description)
        
        # Enriquecer predicción con data real de la cuenta
        if prediction.get("account_id"):
            from core.database import get_supabase
            db = get_supabase()
            res = db.table("chart_of_accounts").select("codigo, nombre").eq("id", prediction["account_id"]).single().execute()
            if res.data:
                prediction["account_code"] = res.data["codigo"]
                prediction["account_name"] = res.data["nombre"]
            else:
                prediction["account_code"] = "5.1.05.001"
                prediction["account_name"] = "Gastos y Comisiones Bancarias"

        return prediction
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo sináptico del modelo: {str(e)}")
