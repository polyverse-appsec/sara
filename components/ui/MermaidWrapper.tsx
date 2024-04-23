import React, { useEffect, useState, useRef } from 'react';

import { useCopyToClipboard } from './../../lib/hooks/use-copy-to-clipboard'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button } from './button'
import { IconCheck, IconCopy } from './icons'
import { Skeleton } from '@radix-ui/themes';

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
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

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
  }, [markup, isMermaidLoaded])

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(markup)
  }

  return (
    <div className="flex flex-col items-center justify-between w-full px-6 py-2">
      <div className="flex items-center justify-between w-full px-6 py-2 bg-zinc-800 text-zinc-100">
        <span className="text-xs self-start py-2">Sara-generated Diagram</span>
        <Tooltip.Root>
            <Tooltip.Provider>
              <Tooltip.Trigger className="flex items-center cursor-pointer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-xs hover:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0"
                  onClick={onCopy}
                >
                  {isCopied ? <IconCheck /> : <IconCopy />}
                  <span className="sr-only">Copy Diagram</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content
                side="left"
                align="end"
                className="clipboardCopyToolTip"
              >
                Copy to Clipboard
              </Tooltip.Content>
            </Tooltip.Provider>
          </Tooltip.Root>
      </div>
      <Skeleton loading={!isMermaidLoaded} className="w-full">
        {!isMermaidLoaded ? (
          // italicize the loading text
          <div className="italic">Sara Generating Diagram...</div>
        ) : (
          <div ref={mermaidDivRef} className="mermaid">{markup}</div>
        )}
      </Skeleton>
    </div>
  )
}

MermaidWrapper.displayName = 'MermaidWrapper';
export default MermaidWrapper;
