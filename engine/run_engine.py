# Contapyme V2 - Motor Python
# Ejecutar con: uvicorn main:app --reload --port 8000

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
