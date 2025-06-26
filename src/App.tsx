import React, { useEffect, useRef, useState } from 'react';

interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [isAddingArrow, setIsAddingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const img = new Image();
          const url = URL.createObjectURL(blob);
          
          img.onload = () => {
            setBaseImage(img);
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
          break;
        }
      }
    };

    const handleCopy = async (e: ClipboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
          }
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        handleCopy(e as unknown as ClipboardEvent);
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw base image if exists
    if (baseImage) {
      const scale = Math.min(
        canvas.width / baseImage.width,
        canvas.height / baseImage.height
      );
      const width = baseImage.width * scale;
      const height = baseImage.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      
      ctx.drawImage(baseImage, x, y, width, height);
    }

    // Draw arrows
    arrows.forEach(arrow => {
      drawArrow(ctx, arrow.startX, arrow.startY, arrow.endX, arrow.endY);
    });

    // Draw preview arrow when in arrow mode with start point set
    if (isAddingArrow && arrowStart && mousePosition) {
      drawArrow(ctx, arrowStart.x, arrowStart.y, mousePosition.x, mousePosition.y);
    }
  }, [baseImage, arrows, isAddingArrow, arrowStart, mousePosition]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingArrow) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!arrowStart) {
      setArrowStart({ x, y });
    } else {
      const newArrow: Arrow = {
        id: Date.now().toString(),
        startX: arrowStart.x,
        startY: arrowStart.y,
        endX: x,
        endY: y
      };
      setArrows([...arrows, newArrow]);
      setArrowStart(null);
      setIsAddingArrow(false);
      setMousePosition(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingArrow || !arrowStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleCanvasMouseLeave = () => {
    if (isAddingArrow && arrowStart) {
      setMousePosition(null);
    }
  };

  const handleClearCanvas = () => {
    setBaseImage(null);
    setArrows([]);
    setArrowStart(null);
    setIsAddingArrow(false);
    setMousePosition(null);
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <header className="bg-light border-bottom">
        <div className="container-fluid">
          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
            <h1 className="h4 my-2">Screenshot Editor</h1>
            <div className="ms-auto">
              <button
                className={`btn ${isAddingArrow ? 'btn-danger' : 'btn-primary'} me-2`}
                onClick={() => {
                  setIsAddingArrow(!isAddingArrow);
                  setArrowStart(null);
                  setMousePosition(null);
                }}
              >
                {isAddingArrow ? 'Cancel Arrow' : 'Add Arrow'}
              </button>
              <button className="btn btn-secondary" onClick={handleClearCanvas}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 d-flex justify-content-center align-items-center bg-secondary">
        <canvas
          ref={canvasRef}
          className="border"
          style={{ 
            backgroundColor: 'white',
            cursor: isAddingArrow ? 'crosshair' : 'default'
          }}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        ></canvas>
      </main>

      <footer className="bg-light border-top py-2">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">
              Ctrl+V to paste • {isAddingArrow ? 'Click to set arrow start and end' : 'Ctrl+C to copy'}
            </span>
            <button 
              className="btn btn-primary"
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                
                canvas.toBlob(async (blob) => {
                  if (!blob) return;
                  
                  try {
                    await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                    ]);
                    alert('Image copied to clipboard!');
                  } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                    alert('Failed to copy to clipboard');
                  }
                });
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;