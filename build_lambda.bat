tar -a -cf "%1.zip" -C .venv\Lib\site-packages * -C "..\..\..\src\lambdas\%1" lambda_function.py
