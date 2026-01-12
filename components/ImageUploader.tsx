
import React, { useRef } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: File[];
  setImages: (images: File[]) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...images, ...newFiles].slice(0, 3); // Max 3 limit for Veo references
      setImages(totalFiles);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple
        disabled={disabled}
      />

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Upload Button */}
        {images.length < 3 && (
          <button
            onClick={triggerUpload}
            disabled={disabled}
            className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-zinc-600 hover:text-blue-400 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="p-3 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform mb-2">
                <Plus size={24} />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest">Tambah</span>
          </button>
        )}

        {/* Image Previews */}
        {images.map((file, idx) => (
          <div key={idx} className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-zinc-800 group shadow-xl">
            <img
              src={URL.createObjectURL(file)}
              alt="Reference"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    onClick={() => removeImage(idx)}
                    className="p-2 bg-red-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                >
                    <X size={16} />
                </button>
              </div>
            )}
             <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
        ))}

        {images.length === 0 && (
            <div className="flex items-center text-zinc-700 text-xs ml-2 select-none font-medium italic">
                <ImageIcon size={16} className="mr-2 opacity-50" />
                <span>Unggah hingga 3 foto referensi gaya (Opsional)</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
