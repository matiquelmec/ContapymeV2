/**
 * Video Story Generator Utility — Convierte el canvas renderizado de StoryCard
 * en un video de alta definición (WebM/MP4) de 6 a 8 segundos con animación suave.
 */

export async function recordCanvasToVideo(
  canvas: HTMLCanvasElement,
  durationMs: number = 6000
): Promise<File | null> {
  if (!canvas) return null;

  return new Promise((resolve) => {
    try {
      // Verificar soporte del navegador para MediaRecorder
      const stream = canvas.captureStream ? canvas.captureStream(60) : null;
      if (!stream) {
        resolve(null);
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : '';

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 8000000, // 8 Mbps para excelente calidad HD
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([finalBlob], `noticia-animada-${Date.now()}.${ext}`, {
          type: finalBlob.type,
        });
        resolve(file);
      };

      recorder.start();

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationMs);
    } catch (error) {
      console.error('Error grabando video de canvas:', error);
      resolve(null);
    }
  });
}
