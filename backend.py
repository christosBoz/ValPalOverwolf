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
    print(type(current_loadout))

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


import requests

def get_weapons():
    # Fetch entitlements (items owned)
    weapons_owned = client.store_fetch_entitlements()
    chromas_owned = client.store_fetch_entitlements(item_type="3ad1b2b2-acdb-4524-852f-954a76ddae0a")
    levels_owned = client.store_fetch_entitlements(item_type="e7c63390-eda7-46e0-bb7a-a6abdacd2433")
    
    entitlements = chromas_owned.get('Entitlements', [])
    chromas_owned_ids = [chroma['ItemID'].upper() for chroma in entitlements]
    
    levels_entitlements = levels_owned.get('Entitlements', [])
    levels_owned_ids = [level['ItemID'].upper() for level in levels_entitlements]

    # Fetch weapon skins data from the API
    api_url = "https://vinfo-api.com/json/weaponSkins"
    response = requests.get(api_url)
    weapon_skins_data = response.json()

    # Create a dictionary to store weapon skins data by offerId
    weapon_skins_by_offerid = {item['offerId']: item for item in weapon_skins_data}

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_weapons = []
    for item in weapons_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data
        if item_id in weapon_skins_by_offerid:
            weapon_skin = weapon_skins_by_offerid[item_id]
            
            owned_chromas = [weapon_skin["chromas"][0]]
            for chroma in weapon_skin.get("chromas", []):
                if chroma["id"] in chromas_owned_ids:
                    owned_chromas.append(chroma)

            owned_levels = []
            for level in weapon_skin.get("levels", []):
                if level["id"] in levels_owned_ids:
                    owned_levels.append(level)

            # Create updated item with collected chromas and levels
            updated_item = {
                "ItemID": weapon_skin["id"],
                "OfferID": item_id,
                "Weaponid": weapon_skin["weaponId"],
                "Name": weapon_skin["name"],
                "Chromas": owned_chromas,
                "Levels": owned_levels
            }
            
            updated_weapons.append(updated_item)

    # Add default "Standard" skins for each weapon
    for weapon_skin in weapon_skins_data:
        if weapon_skin["name"].startswith("Standard") or weapon_skin["name"].startswith("Random") or weapon_skin["name"] == "Melee":
            print(weapon_skin)
            print(weapon_skin)
            weapon_id = weapon_skin["weaponId"]
            default_chroma = weapon_skin["chromas"][0]
            default_levels = weapon_skin["levels"]

            # Create default item with the default chroma and levels
            default_item = {
                "ItemID": weapon_skin["id"],
                "OfferID": None,
                "Weaponid": weapon_id,
                "Name": weapon_skin["name"],
                "Chromas": [default_chroma],
                "Levels": default_levels
            }
            
            updated_weapons.append(default_item)

    # Sort updated_weapons by Weaponid
    updated_weapons_sorted = sorted(updated_weapons, key=lambda x: x["Weaponid"])
    
    return updated_weapons_sorted
def get_buddies():

    buddies_owned = client.store_fetch_entitlements(item_type = "dd3bf334-87f3-40bd-b043-682a57a8dc3a")

    # Fetch weapon skins data from the API
    api_url = "https://vinfo-api.com/json/charms"
    response = requests.get(api_url)
    buddies_data = response.json()

    buddies_by_offerid = {item['offerId']: item for item in buddies_data}

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_buddies = []
    for item in buddies_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data
        if item_id in buddies_by_offerid:
            buddy = buddies_by_offerid[item_id]
            
            # Create updated item with collected chromas
            updated_item = {
                "ItemID": buddy["id"],
                "Name": buddy["name"],
                "ImageURL": buddy["displayIcon"],
                "InstanceID": item["InstanceID"],
                "LevelID": item_id,
                "Uses": 2
            }
            
            updated_buddies.append(updated_item)

    # Sort updated_entitlements by Weaponid
    updated_cards_sorted = sorted(updated_buddies, key=lambda x: x["Name"])
    return updated_cards_sorted

# Create a new JSON structure with three fields and the entitlements as the value for the first field

def get_cards():
    cards_owned = client.store_fetch_entitlements(item_type = "3f296c07-64c3-494c-923b-fe692a4fa1bd")

    # Fetch weapon skins data from the API
    api_url = "https://vinfo-api.com/json/playerCards"
    response = requests.get(api_url)
    cards_data = response.json()

    cards_by_offerid = {item['offerId']: item for item in cards_data}

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_cards = []
    for item in cards_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data
        if item_id in cards_by_offerid:
            card = cards_by_offerid[item_id]
            
            # Create updated item with collected chromas
            updated_item = {
                "ItemID": item_id,
                "Name": card["name"],
                "smallImageURL": card["smallIcon"],
                "wideImageURL": card["wideIcon"],
                "largeImageURL": card["largeIcon"],
            }
            
            updated_cards.append(updated_item)

    # Sort updated_entitlements by Weaponid
    updated_cards_sorted = sorted(updated_cards, key=lambda x: x["Name"])
    return updated_cards_sorted

def get_sprays():
    sprays_owned = client.store_fetch_entitlements(item_type = "d5f120f8-ff8c-4aac-92ea-f2b5acbe9475")

    # Fetch weapon skins data from the API
    api_url = "https://vinfo-api.com/json/sprays"
    response = requests.get(api_url)
    cards_data = response.json()

    sprays_by_offerid = {item['offerId']: item for item in cards_data}

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_sprays = []
    for item in sprays_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data
        if item_id in sprays_by_offerid:
            spray = sprays_by_offerid[item_id]
            
            # Create updated item with collected chromas
            updated_item = {
                "ItemID": item_id,
                "Name": spray["name"],
                "ImageURL": spray["displayIcon"],
            }
            
            updated_sprays.append(updated_item)

    # Sort updated_entitlements by Name
    updated_cards_sorted = sorted(updated_sprays, key=lambda x: x["Name"])
    return updated_cards_sorted

def get_titles():
    titles_owned = client.store_fetch_entitlements(item_type = "de7caa6b-adf7-4588-bbd1-143831e786c6")

    # Fetch weapon skins data from the API
    api_url = "https://vinfo-api.com/json/playerTitles"
    response = requests.get(api_url)
    titles_data = response.json()

    titles_by_offerid = {item['offerId']: item for item in titles_data}

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_titles = []
    for item in titles_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data
        if item_id in titles_by_offerid:
            title = titles_by_offerid[item_id]
            
            # Create updated item with collected chromas
            updated_item = {
                "ItemID": item_id,
                "Name": title["name"],
                "Title": title["titleText"],
            }
            
            updated_titles.append(updated_item)

    # Sort updated_entitlements by Name
    updated_cards_sorted = sorted(updated_titles, key=lambda x: x["Name"])
    return updated_cards_sorted

@app.route('/refresh_inventory', methods=['GET'])
def refresh_inventory():
    updated_items_owned = {
        "User": get_currentuser_id(),
        "Weapons": get_weapons(),
        "Buddies": get_buddies(),
        "Cards": get_cards(),
        "Sprays": get_sprays(),
        "Titles": get_titles(),
    }

    return updated_items_owned

if __name__ == '__main__':
    app.run(debug=True)