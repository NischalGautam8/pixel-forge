:: start_comfyui.bat
@echo off
echo Starting ComfyUI with GTX 1650 optimizations...
:: Assuming comfyui is cloned into worker/comfyui and venv is set up
cd comfyui
call .\venv\Scripts\activate.bat
python main.py --listen 0.0.0.0 --port 8188 --lowvram --disable-smart-memory --preview-method auto
