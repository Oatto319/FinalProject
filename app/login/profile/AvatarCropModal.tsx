'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

const OUTPUT_SIZE = 320;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

function rotatedBoundingSize(width: number, height: number, rotationDeg: number) {
  const rad = (rotationDeg * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

async function cropToDataUrl(imageSrc: string, cropPixels: Area, rotationDeg: number): Promise<string> {
  const image = await loadImage(imageSrc);
  const { width: boxWidth, height: boxHeight } = rotatedBoundingSize(image.width, image.height, rotationDeg);

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = boxWidth;
  rotatedCanvas.height = boxHeight;
  const rotatedCtx = rotatedCanvas.getContext('2d');
  if (!rotatedCtx) throw new Error('เบราว์เซอร์ไม่รองรับ');

  rotatedCtx.translate(boxWidth / 2, boxHeight / 2);
  rotatedCtx.rotate((rotationDeg * Math.PI) / 180);
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = OUTPUT_SIZE;
  outputCanvas.height = OUTPUT_SIZE;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('เบราว์เซอร์ไม่รองรับ');

  outputCtx.drawImage(
    rotatedCanvas,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return outputCanvas.toDataURL('image/jpeg', 0.85);
}

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onApply,
}: {
  imageSrc: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCropPixels(areaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApply = async () => {
    if (!cropPixels) return;
    setApplying(true);
    setError('');
    try {
      const dataUrl = await cropToDataUrl(imageSrc, cropPixels, rotation);
      onApply(dataUrl);
    } catch {
      setError('แก้ไขรูปไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#2D3E50]">แก้ไขรูปภาพ</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="relative w-full h-80 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="px-6 py-4 flex items-center gap-3">
          <ZoomOut size={18} className="text-gray-400 flex-shrink-0" />
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#2D3E50]"
          />
          <ZoomIn size={18} className="text-gray-400 flex-shrink-0" />
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="ml-2 w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            title="หมุนรูป"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center px-6 -mt-1 mb-1">{error}</p>}

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <button onClick={handleReset} className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            รีเซ็ต
          </button>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors">
              ยกเลิก
            </button>
            <button
              onClick={handleApply} disabled={applying || !cropPixels}
              className="px-6 py-2.5 rounded-xl bg-[#2D3E50] hover:bg-[#1E293B] text-white font-bold text-sm transition-colors disabled:opacity-60"
            >
              {applying ? 'กำลังบันทึก...' : 'ใช้'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
