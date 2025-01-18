from flask import Flask, jsonify, request
import valclient  # Ensure valclient is installed and configured
from valclient.client import Client
import json
import requests

client = Client(region="na")
client.activate()

print(client.coregame_fetch_player())