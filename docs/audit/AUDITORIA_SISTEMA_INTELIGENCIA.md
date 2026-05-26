# 📊 Reporte de Auditoría: Motor de Inteligencia (AI) en Vivo
**Proyecto:** CONTAPYMEPUQ — Ecosistema Contable Magallánico  
**Fecha de Auditoría:** 26 de Mayo, 2026  
**Estado:** AUDITADO CON HALLAZGOS Y REMEDIACIONES RECOMENDADAS  

---

## 🔍 1. Resumen Ejecutivo
Se ha llevado a cabo un análisis estático y dinámico en vivo del **Motor de Inteligencia** de Contapymepuq, abarcando tanto el clasificador local de aprendizaje automático bayesiano ([ml_engine.py](file:///c:/Users/Mat%C3%ADas%20Riquelme/Desktop/Proyectos%20documentados/Contapymepuq/engine/calculators/ml_engine.py)) como la integración de LLMs basada en Groq Cloud ([ai.py](file:///c:/Users/Mat%C3%ADas%20Riquelme/Desktop/Proyectos%20documentados/Contapymepuq/engine/core/ai.py)). 

La conclusión principal es que **el sistema representa bien sus módulos en el Blueprint, pero existe una disparidad significativa entre el marketing visual de la UI ("Sovereign AI Active Brain") y la simplicidad matemática del clasificador local bayesiano**. Además, se han detectado brechas de robustez en el preprocesamiento de datos y un bug en la validación del umbral mínimo de entrenamiento.

---

## 🧠 2. Auditoría del Clasificador Contable (Sovereign AI)

### A. La Paradoja de Confianza Constante (15.38%)
Durante las pruebas en vivo con la organización `Logística Patagonia SpA` (`f8758d56-0675-41e4-bc31-e3013052292a`), el motor reportó un entrenamiento exitoso con **13 muestras** y **10 cuentas contables únicas**. Sin embargo, al probar glosas típicas de conciliación, el resultado fue idéntico en todas las pruebas:

*   **PAGO TRANSBANK MENSUAL** $\rightarrow$ `Sugerida: False | Confianza: 15.38%`
*   **CARGO POR COMISION BANCARIA** $\rightarrow$ `Sugerida: False | Confianza: 15.38%`
*   **COMPRA COMBUSTIBLE COPEC S.A.** $\rightarrow$ `Sugerida: False | Confianza: 15.38%`
*   **PAGO DE LUZ CHILECTRA OFICINA** $\rightarrow$ `Sugerida: False | Confianza: 15.38%`

**Explicación Matemática:**  
Dado que el volumen de entrenamiento era extremadamente bajo (13 muestras) y la cardinalidad de clases alta (10 cuentas únicas), casi todas las cuentas contables tenían exactamente $1$ muestra, excepto una que tenía $2$ muestras. 
Al ingresar glosas de prueba con términos que no existían en el vocabulario entrenado (debido a la falta de historia), el clasificador Naive Bayes aplicó la suavización de Laplace y devolvió la probabilidad *a priori* de la clase mayoritaria: 
$$\text{Prior} = \frac{2}{13} \approx 15.38\%$$
Esto demuestra que con menos de 30-50 muestras por organización, el clasificador local se vuelve determinista a nivel de priors y es incapaz de generar inferencias de utilidad.

### B. Bug de Filtrado en Umbral de Entrenamiento (Brecha Crítica)
En [ml_engine.py:L44](file:///c:/Users/Mat%C3%ADas%20Riquelme/Desktop/Proyectos%20documentados/Contapymepuq/engine/calculators/ml_engine.py#L44), el código realiza el siguiente chequeo:
```python
# Regla Antifragilidad: ¿Tienen historial para aprender? 
if len(data) < 15:
    return {"status": "error", "detail": "Se requieren un mínimo de 15 movimientos históricos..."}
```
Sin embargo, esta validación se hace sobre el listado crudo de la base de datos (`data`). Posteriormente, el script filtra los asientos de apertura y glosas vacías, reduciendo el dataset a $13$ muestras.
*   **Impacto:** El modelo se entrena con menos datos del límite de seguridad establecido por el propio sistema (15), reduciendo la frontera de decisión.
*   **Remediación:** Mover la validación de longitud *después* del bucle de filtrado, evaluando `len(X) < 15` (o idealmente elevar este umbral a 30 muestras válidas).

### C. Fortalezas Detectadas
*   **Umbral de Seguridad Eficiente:** El umbral de confianza duro (`confidence > 0.70`) impidió de manera exitosa que se sugirieran cuentas erróneas en el frontend al marcar todas las inferencias débiles como `suggested: False`. Esto protege la integridad del ERP.
*   **Latencia Nula (0.002s):** Al ser un modelo bayesiano cargado en memoria RAM local mediante `joblib`, el tiempo de inferencia es de tan solo 2ms en CPU y a costo cero de APIs.

---

## 📡 3. Auditoría del Motor de Noticias (Groq Cloud LLM)

### A. Resultados del Análisis en Vivo
El worker de noticias que utiliza el modelo `llama-3.3-70b-versatile` de Groq se ejecutó de forma óptima:
*   **Headline Original:** *"Aumento del desempleo en Magallanes preocupa al comercio detallista de Punta Arenas"*
*   **Reescritura Editorial:** *"Desempleo en Magallanes impacta al comercio"* (Excelente reducción, tono sobrio y profesional).
*   **Categorización:** Normalizada correctamente a `"ECONOMÍA"`.
*   **Prompt Visual:** Generado en inglés siguiendo rigurosamente las pautas artísticas de fotografía de prensa documental e hiperrealista de la Patagonia.

### B. Oportunidades de Mejora y Robustez
1.  **Robustez de Scraping RSS:** El worker actual utiliza `xml.etree.ElementTree` directamente sobre la respuesta de texto. Los RSS de diarios locales (especialmente en Magallanes) suelen contener caracteres especiales mal escapados o estructuras HTML corruptas que causan excepciones de parseo de XML. Se recomienda envolver el parseo en un bloque `try/except` robusto por cada `item` o usar `beautifulsoup4` con el parser `lxml-xml`.
2.  **Mecanismo de Reintento (Groq API):** Las conexiones HTTP con Groq se realizan a través de `httpx.AsyncClient` con un timeout simple de 30 segundos, pero carece de un sistema de reintentos exponenciales. Ante un pico de carga de Groq (HTTP 429 / 503), el ciclo del worker fallará.

---

## ⚖️ 4. Conclusión: ¿Representa bien el sistema las funcionalidades de IA?

La respuesta corta es: **Sí, pero bajo un esquema híbrido y con un enfoque de marketing de interfaz elevado.**

*   **En la UI (Next.js):** Se presenta como un "Cerebro Inteligente de Inferencia Instantánea" y "Sovereign AI". Esto es comercialmente atractivo, pero técnicamente el ERP solo cuenta con una **regresión bayesiana de coincidencia de texto**. No hay redes neuronales profundas (Deep Learning) ni procesamiento semántico local (no hay Embeddings).
*   **En el Core:** La integración con Groq para noticias es un pipeline de IA Generativa moderno y funcional. El motor de auditoría matemática (RPCs) es robusto y determinista, lo cual es excelente para fines contables donde la aleatoriedad de la IA tradicional es inaceptable.

---

## 🛠️ 5. Plan de Remediación Técnica (Código Propuesto)

### Corrección del Umbral de Entrenamiento en `ml_engine.py`

Se sugerifica modificar [ml_engine.py:L43-62](file:///c:/Users/Mat%C3%ADas%20Riquelme/Desktop/Proyectos%20documentados/Contapymepuq/engine/calculators/ml_engine.py#L43-L62) para asegurar que el límite de 15 muestras se evalúe sobre las líneas limpias (`X`) y no sobre los datos crudos (`data`):

```diff
-        # Regla Antifragilidad: ¿Tienen historial para aprender? 
-        if len(data) < 15:
-            return {"status": "error", "detail": "Se requieren un mínimo de 15 movimientos históricos..."}
-            
         X = []
         y = []
         
         for item in data:
             glosa = item["journal_entries"]["glosa"]
             acc_id = item["account_id"]
             
             if glosa and acc_id and not glosa.startswith("S/G") and "apertura" not in str(glosa).lower():
                 X.append(str(glosa).lower().strip())
                 y.append(str(acc_id))
                 
+        # Regla Antifragilidad: Evaluar sobre el set de entrenamiento final filtrado
+        if len(X) < 15:
+            return {
+                "status": "error", 
+                "detail": f"Se requieren un mínimo de 15 movimientos históricos válidos para generar certidumbre. Encontrados: {len(X)}."
+            }
+
         if len(set(y)) < 2:
             return {"status": "error", "detail": "El modelo necesita al menos dos cuentas contables..."}
```

Este ajuste evitará entrenamientos con datasets insuficientes que generen la paradoja del 15.38% de confianza en todas las predicciones.
