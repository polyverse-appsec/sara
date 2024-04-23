import React, { useEffect, useState, useRef } from 'react';

function new_script(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    if (typeof document !== "undefined") {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => resolve(script));
      script.addEventListener('error', e => reject(e));
      document.body.appendChild(script);
    } else {
      reject(new Error("Document is undefined"));
    }
  });
}

const MermaidWrapper: React.FC<{ markup: string }> = ({ markup }) => {
  const [isMermaidLoaded, setIsMermaidLoaded] = useState<boolean>(false);
  const mermaidDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMermaid = async () => {
      if (!window.mermaid) {
        try {
          await new_script('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js');
          (window as any).mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
          });
          setIsMermaidLoaded(true);
        } catch (error) {
          console.error('Mermaid loading failed', error);
        }
      } else {
        setIsMermaidLoaded(true);
      }
    };

    loadMermaid();
  }, []);

  useEffect(() => {
    if (isMermaidLoaded && mermaidDivRef.current) {
        (window as any).mermaid.contentLoaded();
      try {
        (window as any).mermaid.init(undefined, mermaidDivRef.current);
      } catch (error) {
        console.error('Mermaid diagram rendering failed', error);
      }
    }
  }, [markup, isMermaidLoaded]);

  return <div ref={mermaidDivRef} className="mermaid">{markup}</div>;
};

MermaidWrapper.displayName = 'MermaidWrapper';
export default MermaidWrapper;
