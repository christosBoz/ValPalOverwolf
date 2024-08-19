from flask import Flask, jsonify, request
import valclient  # Ensure valclient is installed and configured
from valclient.client import Client


client = Client(region="na")
client.activate()

allstuff = client.fetch_player_loadout()

print(allstuff)
        
# print(client.put_player_loadout(allstuff))





