import { useEffect, useRef } from 'react';
import QRCode from 'qrcode.js';

interface QRCodeGeneratorProps {
  text: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator = ({ text, size = 200, className = "" }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      try {
        const qr = new QRCode({
          content: text,
          padding: 4,
          width: size,
          height: size,
          color: "#000000",
          background: "#ffffff",
          ecl: "M",
        });
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = size;
          canvas.height = size;
          
          // Create an image from the QR code
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
          };
          img.src = `data:image/svg+xml;base64,${btoa(qr.svg())}`;
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={size}
      height={size}
    />
  );
};