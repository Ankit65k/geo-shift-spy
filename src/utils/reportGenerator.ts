import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EnvironmentalReport } from '@/services/api';

export class ReportGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private yPosition: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.margin = 20;
    this.yPosition = this.margin;
    this.lineHeight = 6;
  }

  private checkPageBreak(additionalHeight = 0) {
    if (this.yPosition + additionalHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
      return true;
    }
    return false;
  }

  private addText(text: string, fontSize = 12, isBold = false, maxWidth?: number) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const textWidth = maxWidth || (this.pageWidth - 2 * this.margin);
    const lines = this.doc.splitTextToSize(text, textWidth);
    const textHeight = lines.length * this.lineHeight;
    
    this.checkPageBreak(textHeight);
    
    this.doc.text(lines, this.margin, this.yPosition);
    this.yPosition += textHeight + 2;
  }

  private addHeading(text: string, level = 1) {
    const fontSize = level === 1 ? 18 : level === 2 ? 14 : 12;
    this.yPosition += 5;
    this.checkPageBreak(10);
    this.addText(text, fontSize, true);
    this.yPosition += 3;
  }

  private addSection(title: string, content: string) {
    this.addHeading(title, 2);
    this.addText(content);
    this.yPosition += 5;
  }

  private addBulletPoints(points: string[]) {
    points.forEach((point, index) => {
      const cleanPoint = point.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/🔍|🏷️|⚠️|📍|🌍|💰|⏱️|🎯/g, '').trim();
      this.addText(`• ${cleanPoint}`, 10);
    });
  }

  private formatExecutiveSummary(summary: string): string {
    return summary
      .split('\n\n')
      .map(paragraph => paragraph.replace(/🌍|📊|🏷️|📍|⏱️|⚠️/g, '').trim())
      .filter(paragraph => paragraph.length > 0)
      .join('\n\n');
  }

  private addRecommendationActions(actions: any[]) {
    actions.forEach((action, index) => {
      this.checkPageBreak(30);
      this.addText(`${index + 1}. ${action.action}`, 11, true);
      this.addText(`   Responsible: ${action.responsible}`, 9);
      this.addText(`   Timeline: ${action.timeline} | Cost: ${action.cost}`, 9);
      this.addText(`   Success Metrics: ${action.successMetrics}`, 9);
      this.yPosition += 3;
    });
  }

  public async generateEnvironmentalReport(report: EnvironmentalReport): Promise<Blob> {
    // Header
    this.addHeading('ENVIRONMENTAL ANALYSIS REPORT', 1);
    this.addText(`Location: ${report.metadata.location}`, 10);
    this.addText(`Analysis Date: ${new Date(report.metadata.analysisTimestamp).toLocaleString()}`, 10);
    this.addText(`Version: ${report.metadata.analysisVersion} | Confidence: ${(report.metadata.confidence * 100).toFixed(0)}%`, 10);
    this.yPosition += 10;

    // Executive Summary
    this.addSection('EXECUTIVE SUMMARY', this.formatExecutiveSummary(report.executiveSummary));

    // Analysis Overview
    this.addHeading('ANALYSIS OVERVIEW', 2);
    this.addText(`Total Change: ${report.analysis.totalChangePercentage.toFixed(1)}%`, 11, true);
    this.addText(`Change Type: ${report.analysis.changeType}`, 10);
    this.addText(`Severity: ${report.analysis.severity}`, 10);
    this.addText(`Risk Score: ${report.analysis.riskScore}/10`, 10);
    this.addText(`Urgency Level: ${report.analysis.urgencyLevel}`, 10);
    this.addText(`Affected Area: ${report.analysis.affectedArea.value} ${report.analysis.affectedArea.unit}`, 10);
    this.yPosition += 8;

    // Key Insights
    this.addHeading('KEY INSIGHTS', 2);
    this.addBulletPoints(report.keyInsights);
    this.yPosition += 8;

    // Predictions
    this.addHeading('FUTURE PREDICTIONS', 2);
    
    this.addHeading('Short Term (3-6 months)', 3);
    this.addText(`Projected Change: ${report.predictions.shortTerm.projectedChange}`, 10);
    this.addText(`Scenario: ${report.predictions.shortTerm.scenario}`, 10);
    this.addText(`Confidence: ${(report.predictions.shortTerm.confidence * 100).toFixed(0)}% | Risk Level: ${report.predictions.shortTerm.riskLevel}`, 10);
    
    this.addHeading('Medium Term (1-2 years)', 3);
    this.addText(`Projected Change: ${report.predictions.mediumTerm.projectedChange}`, 10);
    this.addText(`Scenario: ${report.predictions.mediumTerm.scenario}`, 10);
    this.addText(`Confidence: ${(report.predictions.mediumTerm.confidence * 100).toFixed(0)}% | Risk Level: ${report.predictions.mediumTerm.riskLevel}`, 10);
    
    this.addHeading('Long Term (5-10 years)', 3);
    this.addText(`Projected Change: ${report.predictions.longTerm.projectedChange}`, 10);
    this.addText(`Scenario: ${report.predictions.longTerm.scenario}`, 10);
    this.addText(`Confidence: ${(report.predictions.longTerm.confidence * 100).toFixed(0)}% | Risk Level: ${report.predictions.longTerm.riskLevel}`, 10);

    // Trend Analysis
    this.addHeading('Trend Analysis', 3);
    this.addText(`Current Trajectory: ${report.predictions.trendAnalysis.currentTrajectory}`, 10);
    this.addText(`Acceleration Factor: ${report.predictions.trendAnalysis.accelerationFactor}`, 10);
    this.addText(`Critical Threshold: ${report.predictions.trendAnalysis.criticalThreshold}`, 10);
    this.addText(`Time to Threshold: ${report.predictions.trendAnalysis.timeToThreshold}`, 10);
    this.yPosition += 8;

    // Recommendations
    this.addHeading('ACTIONABLE RECOMMENDATIONS', 2);
    this.addText(report.recommendations.executiveSummary, 10);
    this.yPosition += 5;

    // Immediate Actions
    this.addHeading('Immediate Actions (0-72 hours)', 3);
    this.addText(`Total Cost: ${report.recommendations.immediateActions.totalEstimatedCost}`, 10, true);
    this.addRecommendationActions(report.recommendations.immediateActions.actions);

    // Short Term Actions
    this.addHeading('Short Term Actions (1 week - 3 months)', 3);
    this.addText(`Total Cost: ${report.recommendations.shortTermActions.totalEstimatedCost}`, 10, true);
    this.addRecommendationActions(report.recommendations.shortTermActions.actions);

    // Long Term Actions
    this.addHeading('Long Term Actions (3 months - 2 years)', 3);
    this.addText(`Total Cost: ${report.recommendations.longTermActions.totalEstimatedCost}`, 10, true);
    this.addRecommendationActions(report.recommendations.longTermActions.actions);

    // Zone-wise Analysis
    this.addHeading('ZONE-WISE ANALYSIS', 2);
    this.addText(`Most Affected Zone: ${report.analysis.zonalAnalysis.mostAffected.zone} (${report.analysis.zonalAnalysis.mostAffected.percentage.toFixed(1)}% change)`, 10);
    this.addText(`Least Affected Zone: ${report.analysis.zonalAnalysis.leastAffected.zone} (${report.analysis.zonalAnalysis.leastAffected.percentage.toFixed(1)}% change)`, 10);
    
    this.addHeading('Detailed Breakdown:', 3);
    report.analysis.zonalAnalysis.breakdown.forEach((zone) => {
      this.addText(`${zone.zone}: ${zone.percentage.toFixed(1)}% change`, 10);
    });
    this.yPosition += 8;

    // Temporal Analysis
    this.addHeading('TEMPORAL ANALYSIS', 2);
    this.addText(`Trend Direction: ${report.analysis.temporalTrends.trend_direction}`, 10);
    this.addText(`Rate of Change: ${report.analysis.temporalTrends.rate_of_change}`, 10);
    this.addText(`Volatility: ${report.analysis.temporalTrends.volatility}`, 10);
    this.addText(`Seasonality: ${report.analysis.temporalTrends.seasonality}`, 10);
    this.yPosition += 8;

    // Visualization Recommendations
    this.addHeading('RECOMMENDED VISUALIZATIONS', 2);
    this.addText('Essential Dashboard Charts:', 11, true);
    report.visualizationSuggestions.dashboardCharts.essential.forEach((chart) => {
      this.addText(`• ${chart.type}: ${chart.title} - ${chart.purpose}`, 9);
    });
    
    this.yPosition += 5;
    this.addText('Supplementary Charts:', 11, true);
    report.visualizationSuggestions.dashboardCharts.supplementary.forEach((chart) => {
      this.addText(`• ${chart}`, 9);
    });

    this.yPosition += 5;
    this.addText('Critical Map Visualizations:', 11, true);
    report.visualizationSuggestions.maps.critical.forEach((map) => {
      this.addText(`• ${map.type}: ${map.title} - ${map.purpose}`, 9);
    });

    // Footer
    this.checkPageBreak(20);
    this.yPosition += 10;
    this.addText('---', 10, false, this.pageWidth - 2 * this.margin);
    this.addText(`Report generated on ${new Date().toLocaleString()}`, 8);
    this.addText(`Next review date: ${report.metadata.nextReviewDate}`, 8);
    this.addText('Generated by Satellite Image Change Detector - Environmental Analysis System', 8);

    return new Promise((resolve) => {
      const pdfBlob = new Blob([this.doc.output('blob')], { type: 'application/pdf' });
      resolve(pdfBlob);
    });
  }

  public downloadReport(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const downloadEnvironmentalReport = async (report: EnvironmentalReport, location?: string) => {
  const generator = new ReportGenerator();
  const pdfBlob = await generator.generateEnvironmentalReport(report);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const locationName = location?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown_location';
  const filename = `Environmental_Analysis_Report_${locationName}_${timestamp}.pdf`;
  
  generator.downloadReport(pdfBlob, filename);
};