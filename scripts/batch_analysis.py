#!/usr/bin/env python3
"""
Batch Analysis Script for Geo Shift Spy
Automatically processes Kaggle datasets and generates comprehensive environmental reports
"""

import os
import sys
import json
import requests
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import argparse
import logging
from datetime import datetime
import pandas as pd
from PIL import Image
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('batch_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BatchAnalyzer:
    def __init__(self, project_root: str = None, backend_url: str = "http://localhost:3001"):
        """Initialize batch analyzer"""
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.backend_url = backend_url.rstrip('/')
        self.datasets_dir = self.project_root / "datasets"
        self.results_dir = self.project_root / "batch_results"
        self.results_dir.mkdir(exist_ok=True)
        
        # Analysis configuration
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
        self.max_concurrent_requests = 5
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def check_backend_health(self) -> bool:
        """Check if the backend server is running and healthy"""
        try:
            async with self.session.get(f"{self.backend_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"✅ Backend server is healthy: {data.get('version', 'unknown')}")
                    return True
                else:
                    logger.error(f"❌ Backend server returned status: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Failed to connect to backend: {e}")
            return False

    async def get_available_models(self) -> Dict:
        """Get available models from backend"""
        try:
            async with self.session.get(f"{self.backend_url}/models") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"📊 Available models: {data.get('total_count', 0)}")
                    return data.get('models', {})
                else:
                    logger.warning(f"⚠️ Failed to get models: {response.status}")
                    return {}
        except Exception as e:
            logger.error(f"❌ Error getting models: {e}")
            return {}

    async def get_available_datasets(self) -> List[Dict]:
        """Get available datasets from backend"""
        try:
            async with self.session.get(f"{self.backend_url}/datasets") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"📁 Available datasets: {data.get('total_count', 0)}")
                    return data.get('datasets', [])
                else:
                    logger.warning(f"⚠️ Failed to get datasets: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"❌ Error getting datasets: {e}")
            return []

    def find_image_pairs(self, dataset_path: Path, pairing_strategy: str = 'sequential') -> List[Tuple[Path, Path]]:
        """Find pairs of images for before/after analysis"""
        image_files = []
        for ext in self.supported_formats:
            image_files.extend(list(dataset_path.rglob(f"*{ext}")))
        
        if len(image_files) < 2:
            logger.warning(f"⚠️ Not enough images in {dataset_path} (found {len(image_files)})")
            return []
        
        # Sort files for consistent pairing
        image_files.sort()
        
        pairs = []
        if pairing_strategy == 'sequential':
            # Pair consecutive images
            for i in range(0, len(image_files) - 1, 2):
                pairs.append((image_files[i], image_files[i + 1]))
        
        elif pairing_strategy == 'random':
            # Random pairing
            import random
            shuffled = image_files.copy()
            random.shuffle(shuffled)
            for i in range(0, len(shuffled) - 1, 2):
                pairs.append((shuffled[i], shuffled[i + 1]))
        
        elif pairing_strategy == 'temporal':
            # Try to pair based on temporal indicators in filenames
            # This is dataset-specific and would need customization
            pairs = self.create_temporal_pairs(image_files)
        
        logger.info(f"📸 Found {len(pairs)} image pairs using {pairing_strategy} strategy")
        return pairs

    def create_temporal_pairs(self, image_files: List[Path]) -> List[Tuple[Path, Path]]:
        """Create pairs based on temporal information in filenames"""
        # This is a simplified version - real implementation would parse dates from filenames
        pairs = []
        
        # Group by potential location/scene identifiers
        scene_groups = {}
        for img in image_files:
            # Extract scene identifier (this is very basic - would need dataset-specific logic)
            scene_id = img.stem[:10] if len(img.stem) >= 10 else img.stem[:5]
            if scene_id not in scene_groups:
                scene_groups[scene_id] = []
            scene_groups[scene_id].append(img)
        
        # Create pairs within each scene group
        for scene_id, images in scene_groups.items():
            if len(images) >= 2:
                images.sort()  # Sort by filename (assuming temporal order)
                for i in range(len(images) - 1):
                    pairs.append((images[i], images[i + 1]))
        
        return pairs

    def validate_image_pair(self, before_img: Path, after_img: Path) -> bool:
        """Validate that an image pair is suitable for analysis"""
        try:
            # Check file sizes
            before_size = before_img.stat().st_size
            after_size = after_img.stat().st_size
            
            if before_size < 1024 or after_size < 1024:  # Less than 1KB
                logger.warning(f"⚠️ Images too small: {before_img.name}, {after_img.name}")
                return False
            
            if before_size > 10 * 1024 * 1024 or after_size > 10 * 1024 * 1024:  # Greater than 10MB
                logger.warning(f"⚠️ Images too large: {before_img.name}, {after_img.name}")
                return False
            
            # Check if images can be opened
            with Image.open(before_img) as img:
                before_dims = img.size
            with Image.open(after_img) as img:
                after_dims = img.size
            
            # Check if dimensions are reasonable
            if min(before_dims) < 50 or min(after_dims) < 50:
                logger.warning(f"⚠️ Images too small dimensionally: {before_dims}, {after_dims}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error validating image pair: {e}")
            return False

    async def analyze_image_pair(self, before_img: Path, after_img: Path, 
                               model: str = 'sentinel2-change-detector', 
                               dataset: str = None) -> Optional[Dict]:
        """Analyze a single image pair"""
        try:
            # Prepare form data
            data = aiohttp.FormData()
            data.add_field('model', model)
            if dataset:
                data.add_field('dataset', dataset)
            
            # Add files
            async with aiofiles.open(before_img, 'rb') as f:
                before_content = await f.read()
            async with aiofiles.open(after_img, 'rb') as f:
                after_content = await f.read()
            
            data.add_field('beforeImage', before_content, 
                          filename=before_img.name, 
                          content_type='image/jpeg')
            data.add_field('afterImage', after_content, 
                          filename=after_img.name, 
                          content_type='image/jpeg')
            
            # Submit analysis request
            async with self.session.post(f"{self.backend_url}/compare", data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Analysis completed for {before_img.name} -> {after_img.name}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Analysis failed for {before_img.name}: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error analyzing image pair {before_img.name}: {e}")
            return None

    async def process_dataset(self, dataset_path: Path, 
                            model: str = 'sentinel2-change-detector',
                            dataset_integration: str = None,
                            max_pairs: int = None,
                            pairing_strategy: str = 'sequential') -> Dict:
        """Process all image pairs in a dataset"""
        logger.info(f"🔄 Processing dataset: {dataset_path.name}")
        
        # Find image pairs
        pairs = self.find_image_pairs(dataset_path, pairing_strategy)
        if not pairs:
            return {"error": "No suitable image pairs found"}
        
        # Limit number of pairs if specified
        if max_pairs and max_pairs < len(pairs):
            pairs = pairs[:max_pairs]
            logger.info(f"📊 Limited to {max_pairs} pairs")
        
        # Process pairs with concurrency control
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        results = []
        
        async def process_pair(before_img, after_img):
            async with semaphore:
                if not self.validate_image_pair(before_img, after_img):
                    return None
                return await self.analyze_image_pair(before_img, after_img, model, dataset_integration)
        
        # Process all pairs
        tasks = [process_pair(before, after) for before, after in pairs]
        analysis_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter successful results
        successful_results = [r for r in analysis_results if r is not None and not isinstance(r, Exception)]
        
        # Compile dataset summary
        dataset_summary = self.create_dataset_summary(dataset_path, successful_results, len(pairs))
        
        logger.info(f"✅ Dataset processing complete: {len(successful_results)}/{len(pairs)} successful")
        
        return {
            "dataset_name": dataset_path.name,
            "processing_summary": dataset_summary,
            "individual_analyses": successful_results,
            "total_pairs_processed": len(pairs),
            "successful_analyses": len(successful_results),
            "model_used": model,
            "dataset_integration": dataset_integration
        }

    def create_dataset_summary(self, dataset_path: Path, results: List[Dict], total_pairs: int) -> Dict:
        """Create a comprehensive summary of dataset analysis"""
        if not results:
            return {"error": "No successful analyses"}
        
        # Aggregate change detection results
        total_area_changed = sum(r.get('overall_assessment', {}).get('total_area_changed_sq_km', 0) for r in results)
        avg_confidence = np.mean([r.get('overall_assessment', {}).get('confidence_score', 0) for r in results])
        
        # Count change types
        change_type_counts = {}
        environmental_concerns = set()
        
        for result in results:
            for change in result.get('detected_changes', []):
                change_type = change.get('type', 'unknown')
                change_type_counts[change_type] = change_type_counts.get(change_type, 0) + 1
            
            # Collect environmental concerns
            concerns = result.get('environmental_summary', {}).get('primary_concerns', [])
            environmental_concerns.update(concerns)
        
        # Determine overall severity distribution
        severity_counts = {}
        for result in results:
            severity = result.get('overall_assessment', {}).get('overall_severity', 'unknown')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "dataset_path": str(dataset_path),
            "total_image_pairs": total_pairs,
            "successful_analyses": len(results),
            "success_rate_percentage": (len(results) / total_pairs) * 100,
            "aggregated_metrics": {
                "total_area_changed_sq_km": round(total_area_changed, 2),
                "average_confidence_score": round(avg_confidence, 3),
                "most_common_change_type": max(change_type_counts.items(), key=lambda x: x[1])[0] if change_type_counts else None,
                "change_type_distribution": change_type_counts,
                "severity_distribution": severity_counts
            },
            "environmental_overview": {
                "unique_concerns_identified": len(environmental_concerns),
                "primary_concerns": list(environmental_concerns)[:10],
                "high_impact_analyses": len([r for r in results if r.get('overall_assessment', {}).get('overall_severity') in ['high', 'critical']])
            },
            "processing_metadata": {
                "processing_date": datetime.now().isoformat(),
                "average_processing_time": np.mean([r.get('processing_info', {}).get('processing_time_seconds', 0) for r in results])
            }
        }

    async def generate_comprehensive_report(self, all_results: List[Dict], output_file: Path):
        """Generate a comprehensive report from all dataset analyses"""
        logger.info(f"📝 Generating comprehensive report: {output_file}")
        
        report = {
            "report_metadata": {
                "generation_date": datetime.now().isoformat(),
                "total_datasets_processed": len(all_results),
                "geo_shift_spy_version": "2.0.0",
                "report_type": "comprehensive_batch_analysis"
            },
            "executive_summary": self.create_executive_summary(all_results),
            "dataset_summaries": all_results,
            "global_insights": self.create_global_insights(all_results),
            "recommendations": self.generate_recommendations(all_results)
        }
        
        # Save comprehensive JSON report
        async with aiofiles.open(output_file.with_suffix('.json'), 'w') as f:
            await f.write(json.dumps(report, indent=2, default=str))
        
        # Generate CSV summary for easy analysis
        await self.generate_csv_summary(all_results, output_file.with_suffix('.csv'))
        
        # Generate markdown report for readability
        await self.generate_markdown_report(report, output_file.with_suffix('.md'))
        
        logger.info(f"✅ Reports generated: JSON, CSV, and Markdown formats")

    def create_executive_summary(self, all_results: List[Dict]) -> Dict:
        """Create executive summary of all analyses"""
        total_analyses = sum(r.get('successful_analyses', 0) for r in all_results)
        total_area_changed = sum(r.get('processing_summary', {}).get('aggregated_metrics', {}).get('total_area_changed_sq_km', 0) for r in all_results)
        
        all_concerns = set()
        high_impact_count = 0
        
        for result in all_results:
            summary = result.get('processing_summary', {})
            env_overview = summary.get('environmental_overview', {})
            all_concerns.update(env_overview.get('primary_concerns', []))
            high_impact_count += env_overview.get('high_impact_analyses', 0)
        
        return {
            "total_satellite_image_analyses": total_analyses,
            "total_environmental_area_changed_sq_km": round(total_area_changed, 2),
            "datasets_with_significant_changes": len([r for r in all_results if r.get('successful_analyses', 0) > 0]),
            "high_impact_environmental_changes": high_impact_count,
            "unique_environmental_concerns": len(all_concerns),
            "critical_findings": list(all_concerns)[:15]
        }

    def create_global_insights(self, all_results: List[Dict]) -> Dict:
        """Create global insights across all datasets"""
        # Aggregate change types across all datasets
        global_change_types = {}
        global_severities = {}
        
        for result in all_results:
            summary = result.get('processing_summary', {})
            metrics = summary.get('aggregated_metrics', {})
            
            # Aggregate change types
            for change_type, count in metrics.get('change_type_distribution', {}).items():
                global_change_types[change_type] = global_change_types.get(change_type, 0) + count
            
            # Aggregate severities
            for severity, count in metrics.get('severity_distribution', {}).items():
                global_severities[severity] = global_severities.get(severity, 0) + count
        
        return {
            "global_change_type_distribution": global_change_types,
            "global_severity_distribution": global_severities,
            "most_affected_change_type": max(global_change_types.items(), key=lambda x: x[1])[0] if global_change_types else None,
            "predominant_severity_level": max(global_severities.items(), key=lambda x: x[1])[0] if global_severities else None,
            "environmental_hotspots": self.identify_environmental_hotspots(all_results)
        }

    def identify_environmental_hotspots(self, all_results: List[Dict]) -> List[Dict]:
        """Identify datasets/regions with highest environmental impact"""
        hotspots = []
        
        for result in all_results:
            summary = result.get('processing_summary', {})
            metrics = summary.get('aggregated_metrics', {})
            env_overview = summary.get('environmental_overview', {})
            
            # Calculate impact score
            area_changed = metrics.get('total_area_changed_sq_km', 0)
            high_impact_count = env_overview.get('high_impact_analyses', 0)
            unique_concerns = env_overview.get('unique_concerns_identified', 0)
            
            impact_score = (area_changed * 0.4) + (high_impact_count * 25) + (unique_concerns * 5)
            
            if impact_score > 50:  # Threshold for "hotspot"
                hotspots.append({
                    "dataset_name": result.get('dataset_name'),
                    "impact_score": round(impact_score, 2),
                    "area_changed_sq_km": area_changed,
                    "high_impact_changes": high_impact_count,
                    "environmental_concerns": unique_concerns
                })
        
        # Sort by impact score
        hotspots.sort(key=lambda x: x['impact_score'], reverse=True)
        return hotspots[:10]  # Top 10 hotspots

    def generate_recommendations(self, all_results: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on analysis results"""
        recommendations = []
        
        # Calculate some metrics for recommendations
        total_high_impact = sum(r.get('processing_summary', {}).get('environmental_overview', {}).get('high_impact_analyses', 0) for r in all_results)
        total_area_changed = sum(r.get('processing_summary', {}).get('aggregated_metrics', {}).get('total_area_changed_sq_km', 0) for r in all_results)
        
        if total_high_impact > 10:
            recommendations.append("URGENT: Establish immediate monitoring protocols for high-impact environmental changes")
            recommendations.append("Deploy field verification teams to validate satellite-detected changes")
        
        if total_area_changed > 1000:
            recommendations.append("Implement large-scale conservation strategies for affected regions")
            recommendations.append("Coordinate with international environmental agencies for resource allocation")
        
        recommendations.extend([
            "Establish automated satellite monitoring with monthly analysis cycles",
            "Create early warning systems for rapid environmental changes",
            "Develop regional partnerships for coordinated environmental response",
            "Invest in higher-resolution satellite imagery for improved accuracy",
            "Create public dashboards for transparency in environmental monitoring"
        ])
        
        return recommendations

    async def generate_csv_summary(self, all_results: List[Dict], output_file: Path):
        """Generate CSV summary for easy analysis in spreadsheet tools"""
        rows = []
        
        for result in all_results:
            dataset_name = result.get('dataset_name', 'Unknown')
            summary = result.get('processing_summary', {})
            metrics = summary.get('aggregated_metrics', {})
            env_overview = summary.get('environmental_overview', {})
            
            rows.append({
                'Dataset': dataset_name,
                'Total_Pairs': result.get('total_pairs_processed', 0),
                'Successful_Analyses': result.get('successful_analyses', 0),
                'Success_Rate_%': round((result.get('successful_analyses', 0) / max(result.get('total_pairs_processed', 1), 1)) * 100, 2),
                'Total_Area_Changed_sq_km': metrics.get('total_area_changed_sq_km', 0),
                'Avg_Confidence': metrics.get('average_confidence_score', 0),
                'Most_Common_Change': metrics.get('most_common_change_type', 'None'),
                'High_Impact_Changes': env_overview.get('high_impact_analyses', 0),
                'Environmental_Concerns': env_overview.get('unique_concerns_identified', 0)
            })
        
        df = pd.DataFrame(rows)
        df.to_csv(output_file, index=False)
        logger.info(f"📊 CSV summary saved: {output_file}")

    async def generate_markdown_report(self, report: Dict, output_file: Path):
        """Generate markdown report for human readability"""
        markdown_content = f"""# Geo Shift Spy - Comprehensive Environmental Analysis Report

Generated on: {report['report_metadata']['generation_date']}

## Executive Summary

- **Total Satellite Image Analyses**: {report['executive_summary']['total_satellite_image_analyses']:,}
- **Total Environmental Area Changed**: {report['executive_summary']['total_environmental_area_changed_sq_km']:,.2f} sq km
- **Datasets with Significant Changes**: {report['executive_summary']['datasets_with_significant_changes']}
- **High Impact Environmental Changes**: {report['executive_summary']['high_impact_environmental_changes']}

## Global Insights

### Most Affected Change Types
"""
        
        global_insights = report.get('global_insights', {})
        change_dist = global_insights.get('global_change_type_distribution', {})
        
        for change_type, count in sorted(change_dist.items(), key=lambda x: x[1], reverse=True):
            markdown_content += f"- **{change_type.replace('_', ' ').title()}**: {count} occurrences\\n"
        
        markdown_content += f"""
### Environmental Hotspots

"""
        
        hotspots = global_insights.get('environmental_hotspots', [])
        for i, hotspot in enumerate(hotspots[:5], 1):
            markdown_content += f"{i}. **{hotspot['dataset_name']}** (Impact Score: {hotspot['impact_score']})\\n"
            markdown_content += f"   - Area Changed: {hotspot['area_changed_sq_km']:.2f} sq km\\n"
            markdown_content += f"   - High Impact Changes: {hotspot['high_impact_changes']}\\n\\n"
        
        markdown_content += f"""
## Recommendations

"""
        
        for i, rec in enumerate(report.get('recommendations', []), 1):
            markdown_content += f"{i}. {rec}\\n"
        
        markdown_content += f"""
## Dataset Details

"""
        
        for dataset_result in report.get('dataset_summaries', []):
            dataset_name = dataset_result.get('dataset_name', 'Unknown')
            summary = dataset_result.get('processing_summary', {})
            metrics = summary.get('aggregated_metrics', {})
            
            markdown_content += f"""
### {dataset_name}

- **Image Pairs Processed**: {dataset_result.get('total_pairs_processed', 0)}
- **Successful Analyses**: {dataset_result.get('successful_analyses', 0)}
- **Total Area Changed**: {metrics.get('total_area_changed_sq_km', 0):.2f} sq km
- **Average Confidence**: {metrics.get('average_confidence_score', 0):.3f}
- **Most Common Change**: {metrics.get('most_common_change_type', 'None')}

"""
        
        async with aiofiles.open(output_file, 'w') as f:
            await f.write(markdown_content)
        
        logger.info(f"📋 Markdown report saved: {output_file}")


async def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Batch process Kaggle datasets for environmental analysis')
    parser.add_argument('--datasets-dir', type=str, help='Path to datasets directory')
    parser.add_argument('--backend-url', type=str, default='http://localhost:3001', help='Backend server URL')
    parser.add_argument('--model', type=str, default='sentinel2-change-detector', help='Analysis model to use')
    parser.add_argument('--max-pairs', type=int, help='Maximum pairs to process per dataset')
    parser.add_argument('--pairing-strategy', type=str, default='sequential', 
                       choices=['sequential', 'random', 'temporal'], help='Image pairing strategy')
    parser.add_argument('--output-dir', type=str, help='Output directory for results')
    
    args = parser.parse_args()
    
    # Setup paths
    project_root = Path.cwd()
    datasets_dir = Path(args.datasets_dir) if args.datasets_dir else project_root / "datasets"
    output_dir = Path(args.output_dir) if args.output_dir else project_root / "batch_results"
    output_dir.mkdir(exist_ok=True)
    
    logger.info("🚀 STARTING BATCH ANALYSIS FOR GEO SHIFT SPY")
    logger.info("=" * 60)
    logger.info(f"📁 Datasets directory: {datasets_dir}")
    logger.info(f"🌐 Backend URL: {args.backend_url}")
    logger.info(f"🤖 Model: {args.model}")
    logger.info(f"📊 Max pairs per dataset: {args.max_pairs or 'unlimited'}")
    logger.info(f"🔄 Pairing strategy: {args.pairing_strategy}")
    
    if not datasets_dir.exists():
        logger.error(f"❌ Datasets directory not found: {datasets_dir}")
        logger.info("💡 Run 'python kaggle-integration/kaggle-setup.py' to download datasets first")
        return
    
    # Find available dataset directories
    dataset_dirs = [d for d in datasets_dir.iterdir() if d.is_dir()]
    if not dataset_dirs:
        logger.error("❌ No dataset directories found")
        return
    
    logger.info(f"📂 Found {len(dataset_dirs)} dataset directories")
    
    async with BatchAnalyzer(project_root, args.backend_url) as analyzer:
        # Check backend health
        if not await analyzer.check_backend_health():
            logger.error("❌ Backend server not available. Please start the server first.")
            return
        
        # Get available models and datasets
        models = await analyzer.get_available_models()
        datasets = await analyzer.get_available_datasets()
        
        if args.model not in models:
            logger.warning(f"⚠️ Model '{args.model}' not found. Using default.")
            args.model = 'sentinel2-change-detector'
        
        # Process each dataset
        all_results = []
        for dataset_dir in dataset_dirs:
            logger.info(f"\\n🔄 Processing dataset: {dataset_dir.name}")
            
            # Find matching dataset integration
            dataset_integration = None
            for ds in datasets:
                if ds.get('dataset_key') == dataset_dir.name:
                    dataset_integration = ds.get('dataset_key')
                    break
            
            result = await analyzer.process_dataset(
                dataset_dir, 
                args.model, 
                dataset_integration,
                args.max_pairs,
                args.pairing_strategy
            )
            
            all_results.append(result)
            
            # Save individual dataset result
            dataset_output = output_dir / f"{dataset_dir.name}_analysis.json"
            async with aiofiles.open(dataset_output, 'w') as f:
                await f.write(json.dumps(result, indent=2, default=str))
            
            logger.info(f"💾 Individual result saved: {dataset_output}")
        
        # Generate comprehensive report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = output_dir / f"comprehensive_analysis_{timestamp}"
        
        await analyzer.generate_comprehensive_report(all_results, report_file)
        
        logger.info("\\n✅ BATCH ANALYSIS COMPLETE")
        logger.info("=" * 50)
        logger.info(f"📈 Total datasets processed: {len(all_results)}")
        logger.info(f"📁 Results saved to: {output_dir}")
        logger.info(f"📊 Comprehensive report: {report_file}.json")
        logger.info(f"📋 Markdown report: {report_file}.md")
        logger.info(f"📈 CSV summary: {report_file}.csv")


if __name__ == "__main__":
    asyncio.run(main())