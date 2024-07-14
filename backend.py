from flask import Flask, jsonify
from flask_cors import CORS
import json
import requests
from valclient.client import Client

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Initialize the VALORANT client
client = Client(region="na")
client.activate()

@app.route('/import_loadout', methods=['GET'])
def import_loadout():
    current_loadout = client.fetch_player_loadout()

    # Fetch the weapon skins data from the API
    weapon_skins_url = "https://vinfo-api.com/json/weaponSkins"
    response = requests.get(weapon_skins_url)
    weapon_skins_data = response.json()

    # Create a mapping from ChromaID to displayIcon
    chroma_to_icon = {}
    for skin in weapon_skins_data:
        for chroma in skin.get('chromas', []):
            chroma_id = chroma['id'].upper()
            display_icon = chroma['displayIcon']
            chroma_to_icon[chroma_id] = display_icon

    # Add the displayIcon to each weapon in the loadout
    for gun in current_loadout['Guns']:
        chroma_id = gun.get('ChromaID').upper()
        if chroma_id in chroma_to_icon:
            gun['displayIcon'] = chroma_to_icon[chroma_id]

    # Return the JSON data
    return jsonify(current_loadout)

@app.route('/get-userid', methods=['GET'])
def get_currentuser_id():
    userid = client.session_fetch().get('subject')
    return userid

if __name__ == '__main__':
    app.run(debug=True)