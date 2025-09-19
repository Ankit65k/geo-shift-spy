import { useState } from 'react';
import { Satellite, Zap, BarChart3, Map } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { ComparisonResults } from '@/components/ComparisonResults';
import { LoadingState } from '@/components/LoadingState';
import { compareImages, type CompareImagesResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';

const Index = () => {
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompareImagesResponse | null>(null);
  const { toast } = useToast();

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
      const response = await compareImages(beforeImage, afterImage);
      setResults(response);
      toast({
        title: "Analysis Complete",
        description: `Change detection completed. ${response.change_percentage.toFixed(2)}% change detected.`,
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <HeroGeometric 
        badge="AI-Powered Analysis"
        title1="Satellite Image"
        title2="Change Detector"
      />

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-earth flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-satellite-deep">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Advanced machine learning algorithms detect even subtle changes between satellite images.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-earth flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-satellite-deep">Quantified Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Get precise percentage measurements of detected changes with confidence indicators.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-earth flex items-center justify-center mx-auto mb-4">
                <Map className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-satellite-deep">Visual Heatmaps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Optional heatmap overlays highlight exactly where changes occurred in your images.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        {!results && !isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-satellite-deep mb-4">
                Upload Your Satellite Images
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
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
              <Button
                size="lg"
                className="px-8 py-3 text-lg font-semibold bg-gradient-earth hover:shadow-glow transition-all duration-300"
                onClick={handleDetectChanges}
                disabled={!canDetectChanges}
              >
                <Satellite className="h-5 w-5 mr-2" />
                Detect Changes
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-2xl mx-auto">
            <LoadingState />
          </div>
        )}

        {/* Results Section */}
        {results && beforeImage && afterImage && !isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-satellite-deep mb-4">
                Analysis Results
              </h2>
              <Button 
                variant="outline" 
                onClick={resetAnalysis}
                className="mb-6"
              >
                Start New Analysis
              </Button>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <ComparisonResults
                beforeImage={beforeImage}
                afterImage={afterImage}
                changePercentage={results.change_percentage}
                heatmapUrl={results.heatmap_url}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;