"""
google_news_decoder.py — Decodificador de URLs de Google News con BeautifulSoup4
================================================================================
Reemplaza la dependencia obsoleta googlenewsdecoder (que falla con ImportError
en selectolax >= 1.0 al importar el backend 'modest' descontinuado).
"""

import json
import logging
import re
from urllib.parse import quote, urlparse
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("contapyme.google_news_decoder")

def get_base64_str(source_url: str) -> dict:
    try:
        url = urlparse(source_url)
        path = url.path.split("/")
        if (
            url.hostname == "news.google.com"
            and len(path) > 1
            and path[-2] in ["articles", "read"]
        ):
            return {"status": True, "base64_str": path[-1]}
        return {"status": False, "message": "Invalid Google News URL format."}
    except Exception as e:
        return {"status": False, "message": f"Error in get_base64_str: {str(e)}"}

async def get_decoding_params(base64_str: str, client: httpx.AsyncClient) -> dict:
    urls_to_try = [
        f"https://news.google.com/articles/{base64_str}",
        f"https://news.google.com/rss/articles/{base64_str}"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    }
    
    for url in urls_to_try:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0, follow_redirects=True)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Buscar div con jscontroller dentro o adyacente a c-wiz
                target = soup.select_one("c-wiz > div[jscontroller]") or soup.select_one("div[data-n-a-sg]")
                if target and target.get("data-n-a-sg") and target.get("data-n-a-ts"):
                    return {
                        "status": True,
                        "signature": target.get("data-n-a-sg"),
                        "timestamp": target.get("data-n-a-ts"),
                        "base64_str": base64_str,
                    }
        except Exception as e:
            logger.debug(f"[GoogleNewsDecoder] Intento fallido en {url}: {e}")
            continue

    return {"status": False, "message": "Failed to fetch data attributes from Google News"}

async def decode_url(signature: str, timestamp: str, base64_str: str, client: httpx.AsyncClient) -> dict:
    try:
        url = "https://news.google.com/_/DotsSplashUi/data/batchexecute"
        payload = [
            "Fbv4je",
            f'["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"{base64_str}",{timestamp},"{signature}"]',
        ]
        headers = {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        }

        resp = await client.post(
            url,
            headers=headers,
            content=f"f.req={quote(json.dumps([[payload]]))}",
            timeout=10.0
        )
        if resp.status_code == 200:
            parts = resp.text.split("\n\n")
            if len(parts) > 1:
                parsed_data = json.loads(parts[1])[:-2]
                decoded_url = json.loads(parsed_data[0][2])[1]
                return {"status": True, "decoded_url": decoded_url}
        return {"status": False, "message": f"Unexpected response from batchexecute: {resp.status_code}"}
    except Exception as e:
        return {"status": False, "message": f"Error in decode_url: {str(e)}"}

async def decode_google_news_url_async(source_url: str, client: httpx.AsyncClient = None) -> dict:
    """Decodifica URL de Google News asíncronamente con httpx."""
    should_close = False
    if client is None:
        client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)
        should_close = True
    try:
        b64_res = get_base64_str(source_url)
        if not b64_res["status"]:
            return b64_res
        
        params_res = await get_decoding_params(b64_res["base64_str"], client)
        if not params_res["status"]:
            return params_res
            
        return await decode_url(
            params_res["signature"],
            params_res["timestamp"],
            params_res["base64_str"],
            client
        )
    finally:
        if should_close:
            await client.aclose()

def decode_google_news_url(source_url: str) -> dict:
    """Wrapper síncrono compatible con new_decoderv1."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Si ya hay un event loop corriendo, usar requests síncrono como fallback directo
            import requests
            b64_res = get_base64_str(source_url)
            if not b64_res["status"]:
                return b64_res
            base64_str = b64_res["base64_str"]
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            sig, ts = None, None
            for u in [f"https://news.google.com/articles/{base64_str}", f"https://news.google.com/rss/articles/{base64_str}"]:
                try:
                    r = requests.get(u, headers=headers, timeout=8)
                    if r.status_code == 200:
                        soup = BeautifulSoup(r.text, "html.parser")
                        el = soup.select_one("c-wiz > div[jscontroller]") or soup.select_one("div[data-n-a-sg]")
                        if el and el.get("data-n-a-sg"):
                            sig = el.get("data-n-a-sg")
                            ts = el.get("data-n-a-ts")
                            break
                except Exception:
                    pass
            if not sig:
                return {"status": False, "message": "Failed to extract params"}
            
            payload = [
                "Fbv4je",
                f'["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"{base64_str}",{ts},"{sig}"]',
            ]
            post_headers = {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
            post_r = requests.post(
                "https://news.google.com/_/DotsSplashUi/data/batchexecute",
                headers=post_headers,
                data=f"f.req={quote(json.dumps([[payload]]))}",
                timeout=8
            )
            if post_r.status_code == 200:
                parts = post_r.text.split("\n\n")
                if len(parts) > 1:
                    parsed_data = json.loads(parts[1])[:-2]
                    decoded_url = json.loads(parsed_data[0][2])[1]
                    return {"status": True, "decoded_url": decoded_url}
            return {"status": False, "message": "Batchexecute failed"}
        else:
            return loop.run_until_complete(decode_google_news_url_async(source_url))
    except Exception as e:
        return {"status": False, "message": str(e)}

# Alias idéntico a googlenewsdecoder.new_decoderv1
new_decoderv1 = decode_google_news_url
