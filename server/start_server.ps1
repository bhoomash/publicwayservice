# Start the FastAPI server in virtual environment
Set-Location $PSScriptRoot
& .\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
