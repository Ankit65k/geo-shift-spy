import { useState, useRef } from 'react';
import { Satellite, Zap, BarChart3, Map } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { ComparisonResults } from '@/components/ComparisonResults';
import { LoadingState } from '@/components/LoadingState';
import { compareImages, type CompareImagesResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { FeaturesSection } from '@/components/ui/features-section';
import { motion } from 'framer-motion';
import satelliteHero from '@/assets/satellite-hero.jpg';

const Index = () => {
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompareImagesResponse | null>(null);
  const { toast } = useToast();
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDetectChanges = async () => {
    if (!beforeImage || !afterImage) {
      toast({
        title: "Missing Images",
        description: "Please select both before and after images to proceed.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      console.log('Starting image comparison...', {
        beforeImage: beforeImage.name,
        afterImage: afterImage.name
      });
      
      const response = await compareImages(beforeImage, afterImage);
      console.log('API Response received:', response);
      
      setResults(response);
      
      // Handle both old and new response formats for toast message
      const changeValue = response.overall_assessment?.total_area_changed_sq_km || response.change_percentage || 0;
      const unit = response.overall_assessment ? 'km²' : '%';
      
      toast({
        title: "Analysis Complete",
        description: `Change detection completed. ${changeValue.toFixed(2)}${unit} change detected.`,
      });
    } catch (error) {
      console.error('Error comparing images:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setResults(null);
  };

  const canDetectChanges = beforeImage && afterImage && !isLoading;

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Animated Hero Section */}
      <HeroGeometric 
        badge="AI-Powered Environmental Analysis"
        title1="Satellite Image"
        title2="Change Detection"
      />

      {/* Features Section */}
      <FeaturesSection onGetStarted={scrollToUpload} />

        {/* Upload Section */}
        <div ref={uploadSectionRef} className="container mx-auto px-4 py-16">
          {!results && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Upload Your Satellite Images
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto text-lg">
                  Select two satellite images of the same area taken at different times. 
                  Our AI will analyze and quantify the changes between them.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <ImageUpload
                  label="Before Image"
                  onImageSelect={setBeforeImage}
                  selectedImage={beforeImage}
                  disabled={isLoading}
                />
                <ImageUpload
                  label="After Image"
                  onImageSelect={setAfterImage}
                  selectedImage={afterImage}
                  disabled={isLoading}
                />
              </div>

              <div className="text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-green-500 hover:shadow-lg transition-all duration-300 text-white border-0"
                    onClick={handleDetectChanges}
                    disabled={!canDetectChanges}
                  >
                    <Satellite className="h-5 w-5 mr-2" />
                    Detect Changes
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto"
            >
              <LoadingState />
            </motion.div>
          )}

          {/* Results Section */}
          {results && beforeImage && afterImage && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Analysis Results
                </h2>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={resetAnalysis}
                    className="mb-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Start New Analysis
                  </Button>
                </motion.div>
              </div>
              
              <div className="max-w-6xl mx-auto">
                <ComparisonResults
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  response={results}
                />
              </div>
            </motion.div>
          )}
        </div>
    </div>
  );
};

export default Index;