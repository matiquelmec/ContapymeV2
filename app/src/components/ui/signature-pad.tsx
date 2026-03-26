"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check, Undo, PenTool } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar escala para retina/high-dpi
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;

    // Color de fondo para que no sea transparente al guardar (opcional)
    // ctx.fillStyle = "#ffffff";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasContent(true);
    }
    // Prevenir scroll en tactil
    if (e.cancelable) e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasContent(false);
      onClear?.();
    }
  };

  const save = () => {
    if (!hasContent) return;
    const canvas = canvasRef.current;
    if (canvas) {
      // Exportar como PNG base64
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-rose-200 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-white border-2 border-rose-100 rounded-[2rem] overflow-hidden shadow-inner">
          <div className="absolute top-4 left-6 flex items-center gap-2 pointer-events-none opacity-40">
            <PenTool className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-900">Panel de Firma Digital Táctil</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-64 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground select-none">Firme aquí con el mouse o dedo</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={clear}
          className="flex-1 h-12 rounded-2xl border-2 border-rose-100 hover:bg-rose-50 text-rose-600 font-black uppercase text-[10px] tracking-widest gap-2 active:scale-95 transition-all"
        >
          <Eraser className="w-4 h-4" /> Limpiar Panel
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={!hasContent}
          className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-30"
        >
          <Check className="w-4 h-4" /> Capturar Firma
        </Button>
      </div>
    </div>
  );
}
