import { useState, useCallback } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  label: string;
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  disabled?: boolean;
}

export const ImageUpload = ({ label, onImageSelect, selectedImage, disabled }: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  }, [onImageSelect, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const removeImage = useCallback(() => {
    onImageSelect(null as any);
  }, [onImageSelect]);

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300
      ${isDragOver ? 'border-earth-cyan shadow-glow' : 'border-border shadow-card'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-hover'}
    `}>
      <div
        className={`
          p-8 min-h-[300px] flex flex-col items-center justify-center
          ${isDragOver ? 'bg-earth-cyan/5' : 'bg-gradient-subtle'}
          transition-colors duration-300
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedImage ? (
          <div className="w-full text-center">
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected satellite image"
                className="max-w-full max-h-48 rounded-lg shadow-card object-contain"
              />
              {!disabled && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground font-medium">
              {selectedImage.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-earth flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{label}</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Drag and drop your satellite image here, or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id={`file-input-${label}`}
              disabled={disabled}
            />
            <Button
              variant="secondary"
              className="relative"
              disabled={disabled}
              asChild
            >
              <label htmlFor={`file-input-${label}`} className="cursor-pointer">
                <Image className="h-4 w-4 mr-2" />
                Select Image
              </label>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};