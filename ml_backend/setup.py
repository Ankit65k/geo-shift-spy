#!/usr/bin/env python3
"""
Setup script for Geo Shift Spy ML Backend
Installs all required dependencies and sets up the Python environment
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}:")
        print(f"   Command: {command}")
        print(f"   Exit code: {e.returncode}")
        print(f"   Error output: {e.stderr}")
        return None

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    
    if version.major != 3 or version.minor < 8:
        print(f"❌ Python 3.8+ is required, but you have Python {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def create_virtual_environment():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("📦 Virtual environment already exists")
        return True
    
    result = run_command("python -m venv venv", "Creating virtual environment")
    return result is not None

def install_requirements():
    """Install Python requirements"""
    # Determine pip command based on OS
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/MacOS
        pip_cmd = "venv/bin/pip"
    
    # Upgrade pip first
    run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip")
    
    # Install PyTorch first (for better compatibility)
    print("🔥 Installing PyTorch...")
    torch_cmd = f"{pip_cmd} install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118"
    if run_command(torch_cmd, "Installing PyTorch with CUDA support") is None:
        # Fallback to CPU-only version
        print("⚠️  CUDA installation failed, trying CPU-only PyTorch...")
        cpu_cmd = f"{pip_cmd} install torch torchvision torchaudio"
        run_command(cpu_cmd, "Installing PyTorch (CPU-only)")
    
    # Install other requirements
    result = run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python dependencies")
    return result is not None

def create_directories():
    """Create necessary directories"""
    directories = [
        "models",
        "preprocessing", 
        "utils",
        "model_cache",
        "logs",
        "uploads"
    ]
    
    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(exist_ok=True)
            print(f"📁 Created directory: {directory}")
        else:
            print(f"📁 Directory exists: {directory}")

def create_init_files():
    """Create __init__.py files for Python packages"""
    init_files = [
        "models/__init__.py",
        "preprocessing/__init__.py", 
        "utils/__init__.py"
    ]
    
    for init_file in init_files:
        path = Path(init_file)
        if not path.exists():
            path.touch()
            print(f"📝 Created: {init_file}")

def create_env_file():
    """Create sample .env file"""
    env_content = """# ML Backend Environment Variables

# Server Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=true

# Model Configuration  
MODEL_CACHE_DIR=./model_cache
MAX_IMAGE_SIZE=10485760  # 10MB

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/ml_backend.log

# Optional: Model URLs (if hosting pretrained weights)
# CHANGEFORMER_WEIGHTS_URL=https://your-host.com/changeformer_weights.pth
# SIAM_UNET_WEIGHTS_URL=https://your-host.com/siam_unet_weights.pth
# DEEPLABV3_WEIGHTS_URL=https://your-host.com/deeplabv3plus_weights.pth
# XVIEW2_WEIGHTS_URL=https://your-host.com/xview2_weights.pth
"""
    
    env_path = Path(".env")
    if not env_path.exists():
        env_path.write_text(env_content)
        print("📄 Created sample .env file")
    else:
        print("📄 .env file already exists")

def test_imports():
    """Test if key packages can be imported"""
    print("🧪 Testing package imports...")
    
    test_packages = [
        "torch",
        "torchvision", 
        "PIL",
        "numpy",
        "fastapi",
        "uvicorn",
        "cv2",
        "rasterio"
    ]
    
    # Determine python command
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/MacOS
        python_cmd = "venv/bin/python"
    
    failed_imports = []
    
    for package in test_packages:
        result = run_command(f'{python_cmd} -c "import {package}; print(f\"{package}: OK\")"', 
                           f"Testing import {package}")
        if result is None:
            failed_imports.append(package)
    
    if failed_imports:
        print(f"⚠️  Some packages failed to import: {failed_imports}")
        print("   You may need to install additional system dependencies")
    else:
        print("✅ All packages imported successfully")

def create_startup_scripts():
    """Create startup scripts for different platforms"""
    
    # Windows batch script
    windows_script = """@echo off
echo Starting Geo Shift Spy ML Backend...
cd /d "%~dp0"
call venv\\Scripts\\activate
python app.py
pause
"""
    
    Path("start_ml_backend.bat").write_text(windows_script)
    
    # Unix shell script
    unix_script = """#!/bin/bash
echo "Starting Geo Shift Spy ML Backend..."
cd "$(dirname "$0")"
source venv/bin/activate
python app.py
"""
    
    unix_path = Path("start_ml_backend.sh")
    unix_path.write_text(unix_script)
    # Make executable on Unix systems
    if os.name != 'nt':
        os.chmod(unix_path, 0o755)
    
    print("🚀 Created startup scripts:")
    print("   - Windows: start_ml_backend.bat")
    print("   - Unix/Linux/MacOS: start_ml_backend.sh")

def main():
    """Main setup function"""
    print("🛰️  Geo Shift Spy ML Backend Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_environment():
        print("❌ Failed to create virtual environment")
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        print("❌ Failed to install requirements")
        sys.exit(1)
    
    # Create directories and files
    create_directories()
    create_init_files()
    create_env_file()
    
    # Test imports
    test_imports()
    
    # Create startup scripts
    create_startup_scripts()
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Review and customize the .env file")
    print("2. Start the ML backend:")
    if os.name == 'nt':
        print("   - Windows: start_ml_backend.bat")
    else:
        print("   - Unix/Linux/MacOS: ./start_ml_backend.sh")
    print("3. The ML backend will be available at http://localhost:8001")
    print("\nFor development:")
    if os.name == 'nt':
        print("   - Activate venv: venv\\Scripts\\activate")
    else:
        print("   - Activate venv: source venv/bin/activate")
    print("   - Start server: python app.py")

if __name__ == "__main__":
    main()