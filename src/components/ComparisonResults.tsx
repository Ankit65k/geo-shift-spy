import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonResultsProps {
  beforeImage: File;
  afterImage: File;
  changePercentage: number;
  heatmapUrl?: string;
}

export const ComparisonResults = ({ 
  beforeImage, 
  afterImage, 
  changePercentage, 
  heatmapUrl 
}: ComparisonResultsProps) => {
  const getChangeIcon = () => {
    if (changePercentage > 10) return <TrendingUp className="h-4 w-4" />;
    if (changePercentage > 1) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = () => {
    if (changePercentage > 10) return 'destructive';
    if (changePercentage > 1) return 'default';
    return 'secondary';
  };

  const getChangeDescription = () => {
    if (changePercentage > 10) return 'Significant Change';
    if (changePercentage > 1) return 'Moderate Change';
    return 'Minimal Change';
  };

  return (
    <div className="space-y-6">
      {/* Change Summary */}
      <Card className="p-6 bg-gradient-subtle shadow-card">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant={getChangeColor() as any} className="flex items-center gap-1 px-3 py-1">
              {getChangeIcon()}
              {getChangeDescription()}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-satellite-deep">
              {changePercentage.toFixed(2)}% Change Detected
            </h3>
            <Progress 
              value={Math.min(changePercentage, 100)} 
              className="w-full max-w-md mx-auto h-3"
            />
            <p className="text-sm text-muted-foreground">
              Analysis complete • {changePercentage < 1 ? 'Low' : changePercentage < 10 ? 'Medium' : 'High'} confidence
            </p>
          </div>
        </div>
      </Card>

      {/* Image Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-earth">
            <h4 className="font-semibold text-white flex items-center gap-2">
              Before Image
            </h4>
          </div>
          <div className="p-4">
            <img
              src={URL.createObjectURL(beforeImage)}
              alt="Before satellite image"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {beforeImage.name} • {(beforeImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-earth">
            <h4 className="font-semibold text-white flex items-center gap-2">
              After Image
            </h4>
          </div>
          <div className="p-4">
            <img
              src={URL.createObjectURL(afterImage)}
              alt="After satellite image"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {afterImage.name} • {(afterImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </Card>
      </div>

      {/* Heatmap Preview (Placeholder) */}
      {heatmapUrl && (
        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-space">
            <h4 className="font-semibold text-white">Change Heatmap</h4>
            <p className="text-sm text-white/80">Areas of detected change highlighted</p>
          </div>
          <div className="p-4">
            <img
              src={heatmapUrl}
              alt="Change detection heatmap"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
          </div>
        </Card>
      )}
    </div>
  );
};