import crypto from "node:crypto";

export interface IndexingNotificationResult {
  google: { success: boolean; status?: number; error?: string };
  indexNow: { success: boolean; status?: number; error?: string };
}

/**
 * Limpia y normaliza texto eliminando artefactos de codificación corruptos (ej. '?' en palabras)
 */
export function sanitizeJobSeoText(text: string): string {
  if (!text) return "";
  return text
    // Corrige patrones típicos de mala codificación en español
    .replace(/Gu\?a/g, "Guía")
    .replace(/gu\?a/g, "guía")
    .replace(/biling\?e/g, "bilingüe")
    .replace(/Biling\?e/g, "Bilingüe")
    .replace(/t\?cnico/g, "técnico")
    .replace(/T\?cnico/g, "Técnico")
    .replace(/mec\?nico/g, "mecánico")
    .replace(/Mec\?nico/g, "Mecánico")
    .replace(/el\?ctrico/g, "eléctrico")
    .replace(/El\?ctrico/g, "Eléctrico")
    .replace(/gesti\?n/g, "gestión")
    .replace(/Gesti\?n/g, "Gestión")
    .replace(/administraci\?n/g, "administración")
    .replace(/Administraci\?n/g, "Administración")
    .replace(/operaci\?n/g, "operación")
    .replace(/Operaci\?n/g, "Operación")
    // Reemplaza signos de interrogación aislados entre letras por nada o letra apropiada
    .replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])\?([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, "$1$2")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Eliminar zero-width chars
    .trim();
}

/**
 * Genera un slug SEO limpio sin caracteres corruptos ni signos de interrogación
 */
export function generateCleanJobSlug(title: string, company: string, uniqueSuffix: string): string {
  const cleanTitle = sanitizeJobSeoText(title);
  const cleanCompany = sanitizeJobSeoText(company);

  const normalizePart = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover tildes
      .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres no alfanuméricos por guiones
      .replace(/^-+|-+$/g, ""); // Quitar guiones iniciales o finales

  const titleSlug = normalizePart(cleanTitle);
  const companySlug = normalizePart(cleanCompany);
  const suffix = normalizePart(uniqueSuffix).slice(0, 8);

  return `${titleSlug}-${companySlug}-${suffix}`.replace(/--+/g, "-");
}

/**
 * Notifica a Bing / IndexNow sobre una URL de empleo nueva o actualizada
 */
export async function notifyIndexNow(url: string): Promise<{ success: boolean; status?: number; error?: string }> {
  const apiKey = process.env.INDEXNOW_KEY;
  if (!apiKey) {
    return { success: false, error: "INDEXNOW_KEY not configured in env" };
  }

  try {
    const payload = {
      host: "www.contapymepuq.cl",
      key: apiKey,
      keyLocation: `https://www.contapymepuq.cl/${apiKey}.txt`,
      urlList: [url],
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    return {
      success: response.ok || response.status === 202,
      status: response.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error in IndexNow",
    };
  }
}

/**
 * Crea un JWT firmado con RS256 para Google OAuth2 Service Account
 */
export function createGoogleOAuthJwt(
  clientEmail: string,
  privateKey: string,
  scopes: string = "https://www.googleapis.com/auth/indexing"
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claim = {
    iss: clientEmail,
    scope: scopes,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(header)}.${base64Url(claim)}`;

  // Limpiar private key por si viene con saltos de línea escapados en .env
  const formattedKey = privateKey.replace(/\\n/g, "\n");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  const signature = sign
    .sign(formattedKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${signature}`;
}

/**
 * Obtiene un Access Token de Google OAuth2 a partir de las credenciales de Service Account
 */
export async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string | null> {
  try {
    const jwtAssertion = createGoogleOAuthJwt(clientEmail, privateKey);

    const bodyParams = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion,
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      console.warn("[Google Indexing] OAuth token error:", await tokenRes.text());
      return null;
    }

    const data = await tokenRes.json();
    return data.access_token || null;
  } catch (err: any) {
    console.warn("[Google Indexing] Failed to acquire Google access token:", err?.message);
    return null;
  }
}

/**
 * Notifica a Google Indexing API sobre una oferta de empleo publicada o actualizada (URL_UPDATED o URL_DELETED)
 */
export async function notifyGoogleIndexingApi(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<{ success: boolean; status?: number; error?: string }> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return {
      success: false,
      error: "Google Indexing API credentials (client email / private key) not configured in env",
    };
  }

  try {
    const token = await getGoogleAccessToken(clientEmail, privateKey);
    if (!token) {
      return { success: false, error: "Failed to obtain Google access token" };
    }

    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, status: res.status, error: errorText };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err?.message || "Google Indexing network failure" };
  }
}

/**
 * Despachador integral de indexación inmediata para ofertas de empleo
 */
export async function notifySearchEnginesOfJob(slug: string): Promise<IndexingNotificationResult> {
  const canonicalJobUrl = `https://www.contapymepuq.cl/empleos/${slug}`;

  // Ejecutamos en paralelo Google e IndexNow de forma no bloqueante
  const [googleResult, indexNowResult] = await Promise.all([
    notifyGoogleIndexingApi(canonicalJobUrl, "URL_UPDATED"),
    notifyIndexNow(canonicalJobUrl),
  ]);

  return {
    google: googleResult,
    indexNow: indexNowResult,
  };
}

/**
 * Notifica a Bing / Yandex / IndexNow sobre un artículo de noticia publicado o actualizado
 */
export async function notifyIndexNowForNews(slug: string): Promise<{ success: boolean; status?: number; error?: string }> {
  const canonicalNewsUrl = `https://www.contapymepuq.cl/noticias/${slug}`;
  return notifyIndexNow(canonicalNewsUrl);
}

