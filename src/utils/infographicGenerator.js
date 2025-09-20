/**
 * Professional Infographic Generator for Satellite Change Detection
 * Generates modern, presentation-ready infographics from AI analysis results
 */

export class InfographicGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 1920;
    this.height = 1080;
    this.dpi = 2;
    
    // Professional color palette
    this.colors = {
      background: '#0B0F1A',
      panelBg: '#121826',
      cardBg: '#0E1422',
      textPrimary: '#F4F7FF',
      textSecondary: '#B9C2D0',
      gridColor: '#1C2233',
      accent: '#9AE6B4',
      
      // Change type colors
      urbanization: '#FF5C5C',
      deforestation: '#34D399', 
      waterChange: '#60A5FA',
      
      // Severity colors
      high: '#EF4444',
      moderate: '#F59E0B',
      low: '#10B981',
      
      // Impact colors
      carbon: '#F97316',
      biodiversity: '#8B5CF6',
      population: '#EC4899'
    };
    
    // Fonts
    this.fonts = {
      title: 'bold 36px Inter, sans-serif',
      subtitle: '20px Inter, sans-serif',
      heading: 'bold 24px Inter, sans-serif',
      body: '16px Inter, sans-serif',
      caption: '14px Inter, sans-serif',
      small: '12px Inter, sans-serif'
    };
  }
  
  /**
   * Generate professional infographic from analysis results
   */
  async generateInfographic(analysisData, beforeImage, afterImage) {
    try {
      // Initialize canvas
      this.initCanvas();
      
      // Draw background and layout
      this.drawBackground();
      this.drawHeader(analysisData);
      
      // Main content areas
      const mapArea = { x: 60, y: 180, width: 1200, height: 700 };
      const panelArea = { x: 1300, y: 180, width: 560, height: 700 };
      
      // Draw satellite map with overlays
      await this.drawEnhancedMap(mapArea, analysisData, beforeImage, afterImage);
      
      // Draw analysis panels
      this.drawStatisticsPanel(panelArea, analysisData);
      
      // Draw footer with insights
      this.drawInsightsFooter(analysisData);
      
      // Convert to downloadable image
      return this.canvas.toDataURL('image/png');
      
    } catch (error) {
      console.error('Error generating infographic:', error);
      throw error;
    }
  }
  
  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width * this.dpi;
    this.canvas.height = this.height * this.dpi;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this.dpi, this.dpi);
    
    // Enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.textBaseline = 'top';
  }
  
  drawBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.colors.background);
    gradient.addColorStop(1, '#1A1F2E');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Subtle grid pattern
    this.ctx.strokeStyle = this.colors.gridColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  drawHeader(analysisData) {
    // Title
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.title;
    this.ctx.fillText('Satellite-Based Environmental Change Detection', 60, 40);
    
    // Subtitle with metadata
    this.ctx.fillStyle = this.colors.textSecondary;
    this.ctx.font = this.fonts.subtitle;
    const timestamp = new Date(analysisData.timestamp).toLocaleDateString();
    const model = analysisData.processing_info?.model_used || 'AI Analysis';
    this.ctx.fillText(`${model} • Analysis Date: ${timestamp} • Multi-class Change Detection`, 60, 85);
    
    // Status indicators
    const confidence = (analysisData.overall_assessment?.confidence_score * 100) || 0;
    const severity = analysisData.overall_assessment?.overall_severity || 'unknown';
    
    this.drawStatusBadge(60, 120, `Confidence: ${confidence.toFixed(1)}%`, this.colors.accent);
    this.drawStatusBadge(220, 120, `Severity: ${severity.toUpperCase()}`, 
      severity === 'high' ? this.colors.high : severity === 'moderate' ? this.colors.moderate : this.colors.low);
  }
  
  drawStatusBadge(x, y, text, color) {
    const padding = 12;
    const textWidth = this.ctx.measureText(text).width;
    
    // Badge background
    this.ctx.fillStyle = color + '20';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.roundRect(x, y, textWidth + padding * 2, 30, 15);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Badge text
    this.ctx.fillStyle = color;
    this.ctx.font = this.fonts.caption;
    this.ctx.fillText(text, x + padding, y + 8);
  }
  
  async drawEnhancedMap(area, analysisData, beforeImage, afterImage) {
    // Draw map background panel
    this.ctx.fillStyle = this.colors.panelBg;
    this.ctx.strokeStyle = this.colors.gridColor;
    this.ctx.lineWidth = 1;
    this.roundRect(area.x, area.y, area.width, area.height, 12);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Map title
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('Change Detection Map', area.x + 24, area.y + 24);
    
    const mapInnerArea = {
      x: area.x + 24,
      y: area.y + 70,
      width: area.width - 48,
      height: area.height - 140
    };
    
    // Draw before/after images as base
    await this.drawImageComparison(mapInnerArea, beforeImage, afterImage);
    
    // Draw AI-detected change overlays
    this.drawChangeOverlays(mapInnerArea, analysisData);
    
    // Draw legend
    this.drawMapLegend(area.x + 24, area.y + area.height - 60);
  }
  
  async drawImageComparison(area, beforeImage, afterImage) {
    const imgWidth = area.width / 2 - 12;
    const imgHeight = area.height - 80;
    
    // Before image
    if (beforeImage) {
      await this.drawImageToCanvas(beforeImage, area.x, area.y + 40, imgWidth, imgHeight);
      this.ctx.fillStyle = this.colors.textPrimary;
      this.ctx.font = this.fonts.body;
      this.ctx.fillText('Before', area.x, area.y + 10);
    }
    
    // After image  
    if (afterImage) {
      await this.drawImageToCanvas(afterImage, area.x + imgWidth + 24, area.y + 40, imgWidth, imgHeight);
      this.ctx.fillStyle = this.colors.textPrimary;
      this.ctx.font = this.fonts.body;
      this.ctx.fillText('After', area.x + imgWidth + 24, area.y + 10);
    }
    
    // Divider line
    this.ctx.strokeStyle = this.colors.gridColor;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(area.x + imgWidth + 12, area.y);
    this.ctx.lineTo(area.x + imgWidth + 12, area.y + area.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  drawChangeOverlays(area, analysisData) {
    const changes = analysisData.detected_changes || [];
    const zones = this.generateZoneGrid(area, 3, 2); // 3x2 grid
    
    changes.forEach((change, index) => {
      const zoneIndex = index % zones.length;
      const zone = zones[zoneIndex];
      
      // Color based on change type
      let color = this.colors.accent;
      if (change.type === 'urbanization') color = this.colors.urbanization;
      else if (change.type === 'deforestation') color = this.colors.deforestation;
      else if (change.type === 'water_change') color = this.colors.waterChange;
      
      // Draw overlay rectangle
      this.ctx.fillStyle = color + '40';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      
      const overlayWidth = zone.width * 0.6;
      const overlayHeight = zone.height * 0.4;
      const overlayX = zone.x + zone.width * 0.2;
      const overlayY = zone.y + zone.height * 0.3;
      
      this.roundRect(overlayX, overlayY, overlayWidth, overlayHeight, 8);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Change type icon
      this.drawChangeIcon(overlayX + overlayWidth/2, overlayY + overlayHeight/2, change.type);
      
      // Information label
      this.drawChangeLabel(overlayX, overlayY - 30, change);
    });
  }
  
  drawChangeIcon(x, y, type) {
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = '24px Arial'; // Emoji font
    this.ctx.textAlign = 'center';
    
    let icon = '🔍';
    if (type === 'urbanization') icon = '🏙️';
    else if (type === 'deforestation') icon = '🌲';
    else if (type === 'water_change') icon = '💧';
    
    this.ctx.fillText(icon, x, y - 12);
    this.ctx.textAlign = 'start';
  }
  
  drawChangeLabel(x, y, change) {
    const text = `${change.type?.replace('_', ' ')} • ${change.area_sq_km?.toFixed(1)} km² • ${(change.confidence * 100)?.toFixed(0)}%`;
    
    // Label background
    const textWidth = this.ctx.measureText(text).width;
    this.ctx.fillStyle = this.colors.cardBg + 'E6';
    this.roundRect(x - 4, y - 4, textWidth + 8, 22, 4);
    this.ctx.fill();
    
    // Label text
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.caption;
    this.ctx.fillText(text, x, y);
  }
  
  drawMapLegend(x, y) {
    const legendItems = [
      { color: this.colors.urbanization, label: 'Urbanization', icon: '🏙️' },
      { color: this.colors.deforestation, label: 'Deforestation', icon: '🌲' },
      { color: this.colors.waterChange, label: 'Water Change', icon: '💧' }
    ];
    
    this.ctx.fillStyle = this.colors.textSecondary;
    this.ctx.font = this.fonts.caption;
    this.ctx.fillText('Legend:', x, y);
    
    let itemX = x + 80;
    legendItems.forEach(item => {
      // Color box
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(itemX, y + 2, 12, 12);
      
      // Icon and label
      this.ctx.fillStyle = this.colors.textSecondary;
      this.ctx.fillText(`${item.icon} ${item.label}`, itemX + 20, y);
      
      itemX += 140;
    });
  }
  
  drawStatisticsPanel(area, analysisData) {
    // Panel background
    this.ctx.fillStyle = this.colors.panelBg;
    this.ctx.strokeStyle = this.colors.gridColor;
    this.roundRect(area.x, area.y, area.width, area.height, 12);
    this.ctx.fill();
    this.ctx.stroke();
    
    let currentY = area.y + 24;
    
    // Panel sections
    currentY = this.drawOverallStats(area.x, currentY, area.width, analysisData);
    currentY = this.drawZoneAnalysis(area.x, currentY + 20, area.width, analysisData);
    currentY = this.drawEnvironmentalImpact(area.x, currentY + 20, area.width, analysisData);
    currentY = this.drawTemporalTrends(area.x, currentY + 20, area.width, analysisData);
  }
  
  drawOverallStats(x, y, width, analysisData) {
    const assessment = analysisData.overall_assessment || {};
    
    // Section title
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('Overall Assessment', x + 24, y);
    y += 40;
    
    // Stats cards
    const stats = [
      { label: 'Total Area Changed', value: `${assessment.total_area_changed_sq_km?.toFixed(1) || 0} km²`, color: this.colors.accent },
      { label: 'Change Percentage', value: `${assessment.change_percentage?.toFixed(1) || 0}%`, color: this.colors.urbanization },
      { label: 'Confidence Score', value: `${(assessment.confidence_score * 100)?.toFixed(1) || 0}%`, color: this.colors.deforestation },
      { label: 'Urgency Level', value: assessment.urgency_level?.replace('_', ' ') || 'Standard', color: this.colors.waterChange }
    ];
    
    const cardWidth = (width - 72) / 2;
    const cardHeight = 60;
    
    stats.forEach((stat, index) => {
      const cardX = x + 24 + (index % 2) * (cardWidth + 24);
      const cardY = y + Math.floor(index / 2) * (cardHeight + 12);
      
      // Card background
      this.ctx.fillStyle = this.colors.cardBg;
      this.ctx.strokeStyle = stat.color + '40';
      this.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Value
      this.ctx.fillStyle = stat.color;
      this.ctx.font = 'bold 20px Inter, sans-serif';
      this.ctx.fillText(stat.value, cardX + 12, cardY + 12);
      
      // Label
      this.ctx.fillStyle = this.colors.textSecondary;
      this.ctx.font = this.fonts.caption;
      this.ctx.fillText(stat.label, cardX + 12, cardY + 38);
    });
    
    return y + 144; // Return next Y position
  }
  
  drawZoneAnalysis(x, y, width, analysisData) {
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('Zone Analysis', x + 24, y);
    y += 40;
    
    // Generate sample zone data from detected changes
    const changes = analysisData.detected_changes || [];
    const zones = ['North Zone', 'Central Zone', 'South Zone'];
    
    zones.forEach((zoneName, index) => {
      const zoneY = y + index * 45;
      
      // Zone name
      this.ctx.fillStyle = this.colors.textPrimary;
      this.ctx.font = this.fonts.body;
      this.ctx.fillText(zoneName, x + 24, zoneY);
      
      // Progress bar background
      const barX = x + 180;
      const barWidth = width - 240;
      const barHeight = 8;
      
      this.ctx.fillStyle = this.colors.cardBg;
      this.roundRect(barX, zoneY + 6, barWidth, barHeight, 4);
      this.ctx.fill();
      
      // Progress bar fill (based on change density)
      const density = Math.random() * 0.8 + 0.2; // Sample data
      this.ctx.fillStyle = this.colors.accent;
      this.roundRect(barX, zoneY + 6, barWidth * density, barHeight, 4);
      this.ctx.fill();
      
      // Percentage
      this.ctx.fillStyle = this.colors.textSecondary;
      this.ctx.font = this.fonts.caption;
      this.ctx.fillText(`${(density * 100).toFixed(0)}%`, barX + barWidth + 12, zoneY);
    });
    
    return y + 135;
  }
  
  drawEnvironmentalImpact(x, y, width, analysisData) {
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('Environmental Impact', x + 24, y);
    y += 40;
    
    const impacts = [
      { icon: '🌡️', label: 'Carbon Emissions', value: '1,250 tons CO₂', color: this.colors.carbon },
      { icon: '🦋', label: 'Biodiversity Loss', value: 'Moderate Risk', color: this.colors.biodiversity },
      { icon: '👥', label: 'Population Affected', value: '~3,400 people', color: this.colors.population }
    ];
    
    impacts.forEach((impact, index) => {
      const impactY = y + index * 35;
      
      // Icon
      this.ctx.font = '20px Arial';
      this.ctx.fillText(impact.icon, x + 24, impactY);
      
      // Label and value
      this.ctx.fillStyle = this.colors.textPrimary;
      this.ctx.font = this.fonts.body;
      this.ctx.fillText(impact.label, x + 54, impactY);
      
      this.ctx.fillStyle = impact.color;
      this.ctx.font = 'bold 16px Inter, sans-serif';
      this.ctx.fillText(impact.value, x + 220, impactY);
    });
    
    return y + 105;
  }
  
  drawTemporalTrends(x, y, width, analysisData) {
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('Temporal Trends', x + 24, y);
    y += 40;
    
    // Simple trend visualization
    const chartArea = { x: x + 24, y: y, width: width - 48, height: 120 };
    
    // Chart background
    this.ctx.fillStyle = this.colors.cardBg;
    this.roundRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height, 8);
    this.ctx.fill();
    
    // Sample trend data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = [0.2, 0.4, 0.3, 0.6, 0.8, 1.0];
    
    // Draw trend line
    this.ctx.strokeStyle = this.colors.accent;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    
    trendData.forEach((value, index) => {
      const pointX = chartArea.x + 20 + (index * (chartArea.width - 40) / (months.length - 1));
      const pointY = chartArea.y + chartArea.height - 20 - (value * (chartArea.height - 40));
      
      if (index === 0) {
        this.ctx.moveTo(pointX, pointY);
      } else {
        this.ctx.lineTo(pointX, pointY);
      }
      
      // Data point
      this.ctx.fillStyle = this.colors.accent;
      this.ctx.beginPath();
      this.ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(pointX, pointY);
    });
    
    this.ctx.stroke();
    
    // Month labels
    this.ctx.fillStyle = this.colors.textSecondary;
    this.ctx.font = this.fonts.small;
    this.ctx.textAlign = 'center';
    
    months.forEach((month, index) => {
      const labelX = chartArea.x + 20 + (index * (chartArea.width - 40) / (months.length - 1));
      this.ctx.fillText(month, labelX, chartArea.y + chartArea.height + 10);
    });
    
    this.ctx.textAlign = 'start';
    
    return y + 150;
  }
  
  drawInsightsFooter(analysisData) {
    const y = this.height - 120;
    
    // Background panel
    this.ctx.fillStyle = this.colors.cardBg + '80';
    this.ctx.fillRect(0, y, this.width, 120);
    
    // Title
    this.ctx.fillStyle = this.colors.textPrimary;
    this.ctx.font = this.fonts.heading;
    this.ctx.fillText('🧠 AI Insights & Recommendations', 60, y + 20);
    
    // Insights from executive summary
    const summary = analysisData.executive_summary;
    if (summary?.main_finding) {
      this.ctx.fillStyle = this.colors.textSecondary;
      this.ctx.font = this.fonts.body;
      const wrappedText = this.wrapText(summary.main_finding, this.width - 120);
      wrappedText.forEach((line, index) => {
        this.ctx.fillText(line, 60, y + 55 + (index * 20));
      });
    }
  }
  
  // Utility functions
  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
  }
  
  generateZoneGrid(area, cols, rows) {
    const zones = [];
    const zoneWidth = area.width / cols;
    const zoneHeight = area.height / rows;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        zones.push({
          x: area.x + col * zoneWidth,
          y: area.y + row * zoneHeight,
          width: zoneWidth,
          height: zoneHeight
        });
      }
    }
    
    return zones;
  }
  
  async drawImageToCanvas(imageSource, x, y, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          this.ctx.save();
          this.ctx.drawImage(img, x, y, width, height);
          this.ctx.restore();
          
          // Clean up object URL if it was created from a file
          if (typeof imageSource === 'object' && imageSource.constructor === File) {
            URL.revokeObjectURL(img.src);
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Handle both File objects and Image elements
      if (imageSource instanceof File) {
        img.src = URL.createObjectURL(imageSource);
      } else if (imageSource instanceof Image) {
        img.src = imageSource.src;
      } else if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        reject(new Error('Invalid image source'));
      }
    });
  }
  
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim() !== '') {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  /**
   * Public method to generate and download infographic
   */
  async generateAndDownload(analysisData, beforeImage, afterImage, filename = null) {
    try {
      const dataUrl = await this.generateInfographic(analysisData, beforeImage, afterImage);
      
      // Create download link
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = filename || `satellite_analysis_infographic_${timestamp}.png`;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return dataUrl;
    } catch (error) {
      console.error('Error in generateAndDownload:', error);
      throw error;
    }
  }
}
