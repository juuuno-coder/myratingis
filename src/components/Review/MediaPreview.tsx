"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MediaPreviewProps {
  type: 'link' | 'image' | 'video' | 'document';
  data: any; // URL or Array of URLs or Video ID
  isAB?: boolean;
  dataB?: any;
}

export function MediaPreview({ type, data, isAB, dataB }: MediaPreviewProps) {
  if (isAB) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className="relative flex-1 border-r border-slate-100 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">Option A</div>
          <RenderSingleMedia type={type} data={data} />
        </div>
        <div className="relative flex-1 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-orange-500/90 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">Option B</div>
          <RenderSingleMedia type={type} data={dataB} />
        </div>
      </div>
    );
  }

  return <RenderSingleMedia type={type} data={data} />;
}

function RenderSingleMedia({ type, data }: { type: string, data: any }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  if (type === 'image') {
    const images = Array.isArray(data) ? data : [data];
    const validImages = images.filter(img => typeof img === 'string' && img.trim());
    if (validImages.length === 0) return <Placeholder text="No Images" />;

    return (
      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center group">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Image 
            src={validImages[activeIdx]} 
            alt="Preview" 
            fill
            className="object-contain shadow-2xl rounded-lg transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        
        {validImages.length > 1 && (
          <>
            <button 
              onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : validImages.length - 1))}
              className="absolute left-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setActiveIdx(prev => (prev < validImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {validImages.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === activeIdx ? "bg-white w-6" : "bg-white/30")} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (type === 'video') {
    let videoUrl = data;
    if (typeof data === 'string' && data.includes('youtube.com/watch?v=')) {
      const id = data.split('v=')[1]?.split('&')[0];
      videoUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    } else if (typeof data === 'string' && data.includes('youtu.be/')) {
       const id = data.split('youtu.be/')[1];
       videoUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }

    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <iframe 
          src={videoUrl} 
          className="w-full h-full border-none" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
    );
  }

  if (type === 'document') {
    const documents = Array.isArray(data) ? data : [data];
    const validDocs = documents.filter(doc => typeof doc === 'string' && doc.trim());
    if (validDocs.length === 0) return <Placeholder text="No Documents" />;
    
    const docUrl = ensureProtocol(validDocs[activeIdx]);
    const lowerDocUrl = docUrl.toLowerCase().split('?')[0];
    const isPdf = lowerDocUrl.endsWith('.pdf');
    const isDoc = lowerDocUrl.endsWith('.doc') || lowerDocUrl.endsWith('.docx');
    
    // HWP, DOC, DOCX files often need a specialized viewer. Google Docs viewer is a common choice.
    const viewerUrl = (isPdf) ? docUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`;

    return (
      <div className="w-full h-full bg-white flex flex-col">
        <iframe 
          src={viewerUrl} 
          className="flex-1 w-full border-none h-full" 
          title="Document Viewer"
        />
        {validDocs.length > 1 && (
           <div className="h-12 bg-slate-900 flex items-center justify-between px-4 shrink-0">
             <button onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : validDocs.length-1))} className="text-white opacity-50 hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
             <span className="text-white font-black text-[10px] uppercase tracking-widest">{activeIdx + 1} / {validDocs.length} Documents</span>
             <button onClick={() => setActiveIdx(prev => (prev < validDocs.length - 1 ? prev + 1 : 0))} className="text-white opacity-50 hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
           </div>
        )}
      </div>
    );
  }

  // Default: Link (Iframe)
  const finalUrl = ensureProtocol(data);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      {data ? (
        <iframe 
          src={finalUrl} 
          className="w-full h-full border-none shadow-inner" 
          title="Link Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <Placeholder text="URL Missing" />
      )}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-chef-panel text-chef-text opacity-20 font-black text-xl uppercase tracking-tighter italic">
      {text}
    </div>
  );
}
