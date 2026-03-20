'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { NewsArticleContent } from './news-article-content'

interface NewsDetailModalProps {
  news: any | null
  isOpen: boolean
  onClose: () => void
}

export function NewsDetailModal({ news, isOpen, onClose }: NewsDetailModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const resetScroll = () => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        window.scrollTo(0, 0); 
      };
      resetScroll();
      const timers = [setTimeout(resetScroll, 10), setTimeout(resetScroll, 100)];
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [isOpen, news?.id])

  if (!news) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={scrollRef}
        className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-primary/20 p-0 rounded-[2.5rem] shadow-2xl shadow-primary/20 border-0"
      >
        <NewsArticleContent news={news} isModal={true} />
      </DialogContent>
    </Dialog>
  )
}
