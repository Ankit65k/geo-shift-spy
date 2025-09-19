import { useState, useCallback } from 'react';
import { Upload, X, Image, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  label: string;
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  disabled?: boolean;
}

export const ImageUpload = ({ label, onImageSelect, selectedImage, disabled }: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateImage = (file: File): { isValid: boolean; error?: string } => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size too large. Please select an image under 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif', 'image/bmp', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: `Invalid file type. Please select a satellite image in JPEG, PNG, TIFF, BMP, or WebP format. Current type: ${file.type}`
      };
    }

    // Check if it's likely a satellite image (basic checks)
    const fileName = file.name.toLowerCase();
    const satelliteKeywords = ['satellite', 'landsat', 'sentinel', 'modis', 'aerial', 'ortho', 'geo', 'earth', 'sat'];
    const hasValidExtension = /\.(jpe?g|png|tiff?|bmp|webp)$/i.test(fileName);
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        error: 'Please provide an image file with a valid extension (.jpg, .jpeg, .png, .tiff, .tif, .bmp, .webp)'
      };
    }

    // Additional validation could include:
    // - Image dimensions check
    // - Basic image analysis to detect if it looks like a satellite image
    
    return { isValid: true };
  };

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
    setValidationError(null);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (!imageFile) {
      const error = 'Please drop an image file. Supported formats: JPEG, PNG, TIFF, BMP, WebP';
      setValidationError(error);
      toast({
        title: "Invalid File Type",
        description: error,
        variant: "destructive"
      });
      return;
    }
    
    const validation = validateImage(imageFile);
    if (!validation.isValid) {
      setValidationError(validation.error!);
      toast({
        title: "Invalid Image",
        description: validation.error!,
        variant: "destructive"
      });
      return;
    }
    
    setValidationError(null);
    onImageSelect(imageFile);
    toast({
      title: "Image Uploaded",
      description: `Successfully uploaded ${imageFile.name}`,
      variant: "default"
    });
  }, [onImageSelect, disabled, validateImage, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      const error = 'Please select an image file. Supported formats: JPEG, PNG, TIFF, BMP, WebP';
      setValidationError(error);
      toast({
        title: "Invalid File Type",
        description: error,
        variant: "destructive"
      });
      return;
    }
    
    const validation = validateImage(file);
    if (!validation.isValid) {
      setValidationError(validation.error!);
      toast({
        title: "Invalid Image",
        description: validation.error!,
        variant: "destructive"
      });
      return;
    }
    
    setValidationError(null);
    onImageSelect(file);
    toast({
      title: "Image Uploaded",
      description: `Successfully uploaded ${file.name}`,
      variant: "default"
    });
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  }, [onImageSelect, validateImage, toast]);

  const removeImage = useCallback(() => {
    onImageSelect(null as any);
  }, [onImageSelect]);

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 bg-white/[0.02]
      ${validationError ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 
        isDragOver ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : 'border-white/[0.1]'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/[0.2]'}
    `}>
      <div
        className={`
          p-8 min-h-[300px] flex flex-col items-center justify-center
          ${validationError ? 'bg-red-500/5' : isDragOver ? 'bg-blue-500/5' : 'bg-transparent'}
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
            <p className="mt-4 text-sm text-white/80 font-medium">
              {selectedImage.name}
            </p>
            <p className="text-xs text-white/60">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{label}</h3>
            <p className="text-sm text-white/60 text-center mb-2">
              Drag and drop your satellite image here, or click to browse
            </p>
            <p className="text-xs text-white/40 text-center mb-4">
              Supported formats: JPEG, PNG, TIFF, BMP, WebP • Max size: 10MB
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
              className="relative bg-white/10 hover:bg-white/20 text-white border-white/20"
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
        
        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-300">
              <p className="font-medium mb-1">Invalid Image</p>
              <p className="text-red-400/80">{validationError}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};