import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  text: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator = ({ text, size = 200, className = "" }: QRCodeGeneratorProps) => {
  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = size;
      canvas.height = size;
      
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'qr-code.png';
              a.click();
              URL.revokeObjectURL(url);
            }
          });
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <QRCode
          id="qr-code-svg"
          value={text}
          size={size}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>
      <Button 
        onClick={downloadQR}
        variant="outline" 
        size="sm"
        className="flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>Download QR Code</span>
      </Button>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Scan this QR code to access your review form directly
      </p>
    </div>
  );
};