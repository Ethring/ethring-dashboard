#!/bin/bash

set -e

cd ./tests/mockserver2
[ ! -d "./env" ] && python3 -m venv env
source ./env/bin/activate
pip install -r requirements.txt
mitmdump -s moxy.py --set mock=config.json --set listen_port=8082
