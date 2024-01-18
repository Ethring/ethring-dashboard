python3.12 -m venv ./env 
source ./env/bin/activate

pip install -r requirements.txt
mitmdump --quiet -s moxy.py --set mock=config.json --set listen_port=8082
google-chrome --proxy-server="http://localhost:8082" --ignore-certificate-errors