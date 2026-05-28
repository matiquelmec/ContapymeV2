import os
import joblib
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from core.database import get_supabase

# Directorio local seguro para congelar y guardar los cerebros (pesos sinápticos) de cada PyME
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml_models')

class FinancialClassifier:
    """
    🧠 THE SOVEREIGN AI: Motor de Inteligencia Contable (Zero-Cost / Cero Latencia Externa)
    En base a historiales contables, aprende el comportamiento de los ingresos/gastos 
    y predice a qué cuenta contable deberia ir un movimiento bancario o F29 solo por su glosa/descripción.
    """
    def __init__(self, organization_id: str):
        self.organization_id = organization_id
        self.model_path = os.path.join(MODELS_DIR, f"clf_{organization_id}.pkl")
        self.pipeline = None
        
        if not os.path.exists(MODELS_DIR):
            os.makedirs(MODELS_DIR, exist_ok=True)
            
    def load_model(self) -> bool:
        if os.path.exists(self.model_path):
            self.pipeline = joblib.load(self.model_path)
            return True
        return False

    def train_model(self) -> dict:
        db = get_supabase()
        
        # 1. Alimentación (Inferencia de Historial PyME)
        # Solo necesitamos leer qué escribieron en la glosa VS en qué cuenta terminaron guardándolo.
        res = db.table("journal_entry_lines").select(
            "account_id, chart_of_accounts(codigo, nombre), journal_entries!inner(glosa, organization_id)"
        ).eq("journal_entries.organization_id", self.organization_id).execute()
        
        data = res.data or []
        
        # Regla Antifragilidad: ¿Tienen historial para aprender? 
        if len(data) < 15:
            return {"status": "error", "detail": "Se requieren un mínimo de 15 movimientos históricos para generar certidumbre predictiva."}
            
        X = []
        y = []
        
        for item in data:
            glosa = item["journal_entries"]["glosa"]
            acc_id = item["account_id"]
            coa = item.get("chart_of_accounts", {})
            tipo_mov = coa.get("codigo", "") if coa else ""
            
            # Filtramos cuentas transitorias o de apertura que ensucian el Text Mining
            if glosa and acc_id and not glosa.startswith("S/G") and "apertura" not in str(glosa).lower():
                X.append(str(glosa).lower().strip())
                y.append(str(acc_id))
                
        if len(set(y)) < 2:
            return {"status": "error", "detail": "El modelo necesita al menos dos cuentas contables destino para generar frontera de decisión de Naive Bayes."}

        # 2. Pipeline NLP (Estructura de Red)
        # N-Gram=1,2 captura "Pago Factura" en vez de solo "Pago" o "Factura".
        self.pipeline = Pipeline([
            ('vect', CountVectorizer(ngram_range=(1, 2), stop_words=['el','la','los','las','de','del','para','y','o', 'por'])),
            ('clf', MultinomialNB())
        ])
        
        # 3. Entrenamiento Asíncrono (Dura ~2ms a 50ms en CPU)
        self.pipeline.fit(X, y)
        
        # 4. Exportar el Weights Graph al disco
        joblib.dump(self.pipeline, self.model_path)
        
        return {
            "status": "success", 
            "samples_trained": len(X), 
            "unique_accounts_learned": len(set(y)),
            "message": "Cerebro Bayeasin Actualizado."
        }

    def predict(self, description: str) -> dict:
        """
        Dada una descripción (Ej: 'Pago Transbank Mensual'), sugiere la mejor cuenta contable.
        """
        if not self.pipeline:
            if not self.load_model():
                # On-The-Fly Training Warning: Primera vez que lo usan.
                result = self.train_model()
                if result.get("status") == "error":
                    return {"account_id": None, "confidence": 0.0, "reason": result["detail"]}
        
        cleaned_desc = str(description).lower().strip()
        
        # Hacer predicción pura
        pred_label = self.pipeline.predict([cleaned_desc])[0]
        
        # Extraer puntaje lógico de Certeza
        probas = self.pipeline.predict_proba([cleaned_desc])[0]
        confidence = float(max(probas))
        
        # Mapeamos la variable de salida (account_id) directo al frontend
        return {
            "account_id": pred_label,
            "confidence": round(confidence * 100, 2),
            "suggested": confidence > 0.70  # Umbral duro de certeza
        }
