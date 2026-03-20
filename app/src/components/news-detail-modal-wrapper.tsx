"use client";

import { NewsDetailModal } from "./news-detail-modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function NewsDetailModalWrapper({ news }: { news: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Cuando cerramos un modal interceptado, queremos volver a la home (atrás en el historial)
    router.back();
  };

  // Prevenir scroll en el body cuando el modal está montado
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <NewsDetailModal 
      news={news} 
      isOpen={isOpen} 
      onClose={handleClose} 
    />
  );
}
