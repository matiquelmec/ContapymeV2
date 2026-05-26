// Script de auditoría profesional para verificar la API de Web3Forms
const accessKey = "bf02614b-d7c7-4c07-8870-d9ce571e6ede";

async function testSubmit() {
  console.log("Iniciando prueba de envío a Web3Forms con la clave del usuario...");
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        access_key: accessKey,
        name: "Auditoría Antigravity",
        email: "psriquelme.m@gmail.com",
        message: "Esta es una prueba de auditoría profesional para verificar el envío.",
        subject: "Prueba de Auditoría Técnica",
        from_name: "Contapymepuq Auditoría"
      })
    });
    
    const resText = await response.text();
    console.log("\n--- RESULTADO DE LA API ---");
    console.log("Status Code:", response.status);
    console.log("Response Body (Raw):", resText);
    try {
      const resData = JSON.parse(resText);
      console.log("Parsed JSON:", JSON.stringify(resData, null, 2));
    } catch (e) {
      console.log("La respuesta no es JSON válido.");
    }
  } catch (error) {
    console.error("Error de conexión:", error.message);
  }
}

testSubmit();
