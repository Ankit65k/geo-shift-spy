/**
 * Analysis Summary Generator
 * Creates comprehensive text and PDF summaries from satellite analysis results
 */

import jsPDF from 'jspdf';

export class SummaryGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.lineHeight = 7;
  }

  /**
   * Generate comprehensive text summary
   */
  generateTextSummary(analysisData) {
    const summary = [];
    const timestamp = new Date().toLocaleString();
    const analysisDate = analysisData.timestamp ? new Date(analysisData.timestamp).toLocaleDateString() : 'Unknown';

    // Header
    summary.push('='.repeat(80));
    summary.push('SATELLITE-BASED ENVIRONMENTAL CHANGE DETECTION REPORT');
    summary.push('='.repeat(80));
    summary.push(`Generated: ${timestamp}`);
    summary.push(`Analysis Date: ${analysisDate}`);
    summary.push(`Model: ${analysisData.processing_info?.model_used || 'AI Analysis System'}`);
    summary.push('');

    // Executive Summary
    if (analysisData.executive_summary?.main_finding) {
      summary.push('EXECUTIVE SUMMARY');
      summary.push('-'.repeat(50));
      summary.push(this.wrapText(analysisData.executive_summary.main_finding, 75));
      summary.push('');
    }

    // Overall Assessment
    if (analysisData.overall_assessment) {
      const assessment = analysisData.overall_assessment;
      summary.push('OVERALL ASSESSMENT');
      summary.push('-'.repeat(50));
      summary.push(`Total Area Analyzed: ${assessment.total_area_analyzed_sq_km?.toFixed(2) || 'N/A'} km²`);
      summary.push(`Total Area Changed: ${assessment.total_area_changed_sq_km?.toFixed(2) || 'N/A'} km²`);
      summary.push(`Change Percentage: ${assessment.change_percentage?.toFixed(2) || 'N/A'}%`);
      summary.push(`Confidence Score: ${(assessment.confidence_score * 100)?.toFixed(1) || 'N/A'}%`);
      summary.push(`Overall Severity: ${assessment.overall_severity?.toUpperCase() || 'N/A'}`);
      summary.push(`Urgency Level: ${assessment.urgency_level?.replace('_', ' ').toUpperCase() || 'N/A'}`);
      summary.push('');
    }

    // Detected Changes
    if (analysisData.detected_changes?.length > 0) {
      summary.push('DETECTED CHANGES');
      summary.push('-'.repeat(50));
      analysisData.detected_changes.forEach((change, index) => {
        summary.push(`${index + 1}. ${change.type?.replace('_', ' ').toUpperCase() || 'UNKNOWN CHANGE'}`);
        summary.push(`   Area: ${change.area_sq_km?.toFixed(2) || 'N/A'} km² (${change.area_percentage?.toFixed(1) || 'N/A'}%)`);
        summary.push(`   Confidence: ${(change.confidence * 100)?.toFixed(1) || 'N/A'}%`);
        summary.push(`   Severity: ${change.severity?.toUpperCase() || 'N/A'}`);
        
        if (change.environmental_impact) {
          summary.push('   Environmental Impact:');
          Object.entries(change.environmental_impact).forEach(([key, value]) => {
            summary.push(`     ${key.replace('_', ' ')}: ${value}`);
          });
        }
        summary.push('');
      });
    }

    // Geographic Context
    if (analysisData.geographic_context) {
      const geo = analysisData.geographic_context;
      summary.push('GEOGRAPHIC CONTEXT');
      summary.push('-'.repeat(50));
      summary.push(`Coordinate System: ${geo.coordinate_system || 'N/A'}`);
      summary.push(`Terrain Type: ${geo.terrain_type || 'N/A'}`);
      summary.push(`Climate Zone: ${geo.climate_zone || 'N/A'}`);
      
      if (geo.analysis_bounds) {
        summary.push(`Analysis Area: ${geo.analysis_bounds.total_area_sq_km || 'N/A'} km²`);
        summary.push(`Pixel Resolution: ${geo.analysis_bounds.pixel_resolution_m || 'N/A'}m`);
      }
      summary.push('');
    }

    // Environmental Summary
    if (analysisData.environmental_summary) {
      const envSummary = analysisData.environmental_summary;
      summary.push('ENVIRONMENTAL IMPACT ANALYSIS');
      summary.push('-'.repeat(50));
      
      if (envSummary.primary_concerns?.length > 0) {
        summary.push('Primary Environmental Concerns:');
        envSummary.primary_concerns.forEach(concern => {
          summary.push(`  • ${concern}`);
        });
        summary.push('');
      }
      
      summary.push(`Ecological Zones Affected: ${envSummary.ecological_zones_affected || 'N/A'}`);
      summary.push(`Estimated Recovery Time: ${envSummary.estimated_recovery_time || 'N/A'}`);
      summary.push('');
      
      if (envSummary.monitoring_recommendations?.length > 0) {
        summary.push('Monitoring Recommendations:');
        envSummary.monitoring_recommendations.forEach(rec => {
          summary.push(`  • ${rec}`);
        });
        summary.push('');
      }
      
      if (envSummary.immediate_actions_required?.length > 0) {
        summary.push('Immediate Actions Required:');
        envSummary.immediate_actions_required.forEach(action => {
          summary.push(`  • ${action}`);
        });
        summary.push('');
      }
    }

    // AI Insights
    if (analysisData.ai_insights?.length > 0) {
      summary.push('AI-GENERATED INSIGHTS');
      summary.push('-'.repeat(50));
      analysisData.ai_insights.forEach((insight, index) => {
        summary.push(`${index + 1}. ${insight.type?.replace('_', ' ').toUpperCase() || 'INSIGHT'}`);
        summary.push(`   Confidence: ${(insight.confidence * 100)?.toFixed(1) || 'N/A'}%`);
        summary.push(`   ${this.wrapText(insight.insight, 75, '   ')}`);
        if (insight.technical_details) {
          summary.push(`   Technical: ${this.wrapText(insight.technical_details, 75, '   ')}`);
        }
        summary.push('');
      });
    }

    // Data Quality
    if (analysisData.data_quality) {
      const quality = analysisData.data_quality;
      summary.push('DATA QUALITY ASSESSMENT');
      summary.push('-'.repeat(50));
      summary.push(`Cloud Coverage: ${quality.cloud_coverage_percent?.toFixed(1) || 'N/A'}%`);
      summary.push(`Atmospheric Conditions: ${quality.atmospheric_conditions || 'N/A'}`);
      summary.push(`Image Quality Score: ${quality.image_quality_score?.toFixed(2) || 'N/A'}`);
      summary.push(`Temporal Gap: ${quality.temporal_gap_days || 'N/A'} days`);
      summary.push('');
    }

    // Processing Information
    if (analysisData.processing_info) {
      const proc = analysisData.processing_info;
      summary.push('PROCESSING INFORMATION');
      summary.push('-'.repeat(50));
      summary.push(`Model Used: ${proc.model_used || 'N/A'}`);
      summary.push(`Dataset Integration: ${proc.dataset_integration || 'N/A'}`);
      summary.push(`Processing Time: ${proc.processing_time_seconds?.toFixed(1) || 'N/A'} seconds`);
      summary.push(`Resolution: ${proc.resolution || 'N/A'}`);
      if (proc.confidence_enhancement) {
        summary.push(`Confidence Enhancement: ${proc.confidence_enhancement}`);
      }
      summary.push('');
    }

    // Footer
    summary.push('='.repeat(80));
    summary.push('End of Report');
    summary.push(`Analysis ID: ${analysisData.analysis_id || 'N/A'}`);
    summary.push('Generated by Geo Shift Spy - Satellite Change Detection System');
    summary.push('='.repeat(80));

    return summary.join('\n');
  }

  /**
   * Generate PDF summary with professional formatting
   */
  async generatePDFSummary(analysisData, beforeImage = null, afterImage = null) {
    const pdf = new jsPDF();
    let yPosition = this.margin;

    // Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    yPosition = this.addText(pdf, 'Satellite Environmental Change Detection', this.margin, yPosition);
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'normal');
    yPosition = this.addText(pdf, 'Professional Analysis Report', this.margin, yPosition + 5);

    // Metadata
    pdf.setFontSize(10);
    const timestamp = new Date().toLocaleString();
    const analysisDate = analysisData.timestamp ? new Date(analysisData.timestamp).toLocaleDateString() : 'Unknown';
    yPosition = this.addText(pdf, `Generated: ${timestamp}`, this.margin, yPosition + 10);
    yPosition = this.addText(pdf, `Analysis Date: ${analysisDate}`, this.margin, yPosition);
    yPosition = this.addText(pdf, `Model: ${analysisData.processing_info?.model_used || 'AI Analysis'}`, this.margin, yPosition);

    // Executive Summary Section
    yPosition += 15;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = this.addText(pdf, 'Executive Summary', this.margin, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    if (analysisData.executive_summary?.main_finding) {
      yPosition = this.addWrappedText(pdf, analysisData.executive_summary.main_finding, this.margin, yPosition + 5);
    }

    // Overall Assessment
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    yPosition = this.addText(pdf, 'Overall Assessment', this.margin, yPosition);
    
    if (analysisData.overall_assessment) {
      const assessment = analysisData.overall_assessment;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      yPosition = this.addText(pdf, `Total Area Changed: ${assessment.total_area_changed_sq_km?.toFixed(2) || 'N/A'} km²`, this.margin + 5, yPosition + 5);
      yPosition = this.addText(pdf, `Change Percentage: ${assessment.change_percentage?.toFixed(2) || 'N/A'}%`, this.margin + 5, yPosition);
      yPosition = this.addText(pdf, `Confidence Score: ${(assessment.confidence_score * 100)?.toFixed(1) || 'N/A'}%`, this.margin + 5, yPosition);
      yPosition = this.addText(pdf, `Severity: ${assessment.overall_severity?.toUpperCase() || 'N/A'}`, this.margin + 5, yPosition);
      yPosition = this.addText(pdf, `Urgency: ${assessment.urgency_level?.replace('_', ' ').toUpperCase() || 'N/A'}`, this.margin + 5, yPosition);
    }

    // Check if we need a new page
    if (yPosition > this.pageHeight - 50) {
      pdf.addPage();
      yPosition = this.margin;
    }

    // Detected Changes
    if (analysisData.detected_changes?.length > 0) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      yPosition = this.addText(pdf, 'Detected Changes', this.margin, yPosition);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      analysisData.detected_changes.forEach((change, index) => {
        yPosition += 5;
        pdf.setFont(undefined, 'bold');
        yPosition = this.addText(pdf, `${index + 1}. ${change.type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}`, this.margin + 5, yPosition);
        
        pdf.setFont(undefined, 'normal');
        yPosition = this.addText(pdf, `Area: ${change.area_sq_km?.toFixed(2) || 'N/A'} km² (${change.area_percentage?.toFixed(1) || 'N/A'}%)`, this.margin + 10, yPosition);
        yPosition = this.addText(pdf, `Confidence: ${(change.confidence * 100)?.toFixed(1) || 'N/A'}%`, this.margin + 10, yPosition);
        yPosition = this.addText(pdf, `Severity: ${change.severity?.toUpperCase() || 'N/A'}`, this.margin + 10, yPosition);
        
        // Check page break
        if (yPosition > this.pageHeight - 50) {
          pdf.addPage();
          yPosition = this.margin;
        }
      });
    }

    // Environmental Impact
    if (analysisData.environmental_summary) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      yPosition = this.addText(pdf, 'Environmental Impact', this.margin, yPosition);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      const envSummary = analysisData.environmental_summary;
      yPosition = this.addText(pdf, `Ecological Zones Affected: ${envSummary.ecological_zones_affected || 'N/A'}`, this.margin + 5, yPosition + 5);
      yPosition = this.addText(pdf, `Recovery Time: ${envSummary.estimated_recovery_time || 'N/A'}`, this.margin + 5, yPosition);
      
      if (envSummary.primary_concerns?.length > 0) {
        yPosition += 5;
        pdf.setFont(undefined, 'bold');
        yPosition = this.addText(pdf, 'Primary Concerns:', this.margin + 5, yPosition);
        pdf.setFont(undefined, 'normal');
        
        envSummary.primary_concerns.forEach(concern => {
          yPosition = this.addText(pdf, `• ${concern}`, this.margin + 10, yPosition);
        });
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'italic');
    pdf.text('Generated by Geo Shift Spy - Satellite Change Detection System', this.margin, this.pageHeight - 10);
    pdf.text(`Analysis ID: ${analysisData.analysis_id || 'N/A'}`, this.pageWidth - this.margin - 50, this.pageHeight - 10);

    return pdf;
  }

  /**
   * Download text summary as .txt file
   */
  downloadTextSummary(analysisData, filename = null) {
    const summary = this.generateTextSummary(analysisData);
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `satellite_analysis_summary_${timestamp}.txt`;
    
    this.downloadFile(summary, filename || defaultFilename, 'text/plain');
  }

  /**
   * Download PDF summary
   */
  async downloadPDFSummary(analysisData, beforeImage = null, afterImage = null, filename = null) {
    const pdf = await this.generatePDFSummary(analysisData, beforeImage, afterImage);
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `satellite_analysis_report_${timestamp}.pdf`;
    
    pdf.save(filename || defaultFilename);
  }

  /**
   * Generate executive summary for quick overview
   */
  generateExecutiveSummary(analysisData) {
    const assessment = analysisData.overall_assessment || {};
    const changes = analysisData.detected_changes || [];
    const summary = analysisData.executive_summary || {};

    const executiveSummary = {
      title: 'Environmental Change Detection Executive Summary',
      date: analysisData.timestamp ? new Date(analysisData.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
      keyFindings: summary.main_finding || 'Comprehensive satellite analysis completed.',
      
      metrics: {
        totalAreaChanged: `${assessment.total_area_changed_sq_km?.toFixed(1) || '0.0'} km²`,
        changePercentage: `${assessment.change_percentage?.toFixed(1) || '0.0'}%`,
        confidenceScore: `${(assessment.confidence_score * 100)?.toFixed(1) || '0.0'}%`,
        overallSeverity: assessment.overall_severity || 'unknown',
        urgencyLevel: assessment.urgency_level || 'standard'
      },
      
      detectedChanges: changes.map(change => ({
        type: change.type?.replace('_', ' ') || 'Unknown',
        area: `${change.area_sq_km?.toFixed(1) || '0.0'} km²`,
        confidence: `${(change.confidence * 100)?.toFixed(0) || '0'}%`,
        severity: change.severity || 'unknown'
      })),
      
      recommendations: analysisData.environmental_summary?.immediate_actions_required || [],
      monitoringAdvice: analysisData.environmental_summary?.monitoring_recommendations || [],
      
      aiInsights: (analysisData.ai_insights || []).map(insight => ({
        type: insight.type?.replace('_', ' ') || 'Insight',
        confidence: `${(insight.confidence * 100)?.toFixed(0) || '0'}%`,
        summary: insight.insight || 'No details available'
      }))
    };

    return executiveSummary;
  }

  // Utility methods
  addText(pdf, text, x, y) {
    pdf.text(text, x, y);
    return y + this.lineHeight;
  }

  addWrappedText(pdf, text, x, y, maxWidth = 170) {
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach(line => {
      pdf.text(line, x, y);
      y += this.lineHeight;
    });
    return y;
  }

  wrapText(text, width, indent = '') {
    if (!text) return '';
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > width) {
        if (currentLine) {
          lines.push(indent + currentLine.trim());
          currentLine = word + ' ';
        } else {
          lines.push(indent + word);
          currentLine = '';
        }
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine.trim()) {
      lines.push(indent + currentLine.trim());
    }

    return lines.join('\n');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
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