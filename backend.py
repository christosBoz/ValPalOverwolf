from xmlrpc.client import ResponseError
from flask import Flask, json, jsonify, request
from flask_cors import CORS
import requests
import valclient  # Ensure valclient is installed and configured
import typing as t
import base64
from PIL import Image
import colorsys
from collections import Counter
import requests
from io import BytesIO


clients = {}

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class CustomClient(valclient.Client):
    def __init__(self, region: t.Text = "na", auth: t.Optional[t.Mapping] = None, lockfile_content: t.Optional[str] = None, *args, **kwargs):
        self.base_endpoint_local = "http://127.0.0.1:{port}"
        self.base_endpoint = "https://pd.{shard}.a.pvp.net"
        self.base_endpoint_glz = "https://glz-{region}-1.{shard}.a.pvp.net"
        self.base_endpoint_shared = "https://shared.{shard}.a.pvp.net"

        self.regions = ["na", "eu", "latam", "br", "ap", "kr", "pbe"]
        self.region_shard_override = {
        "latam": "na",
        "br": "na",
        }
        self.shard_region_override = {"pbe": "na"}

        self.queues = [
        "competitive",
        "custom",
        "deathmatch",
        "ggteam",
        "snowball",
        "spikerush",
        "unrated",
        "onefa",
        "null",
]
        self.puuid = ""
        self.player_name = ""
        self.player_tag = ""
        self.lockfile = {}
        self.headers = {}
        self.local_headers = {}
        self.region = region
        self.shard = region
        self.auth = None
        self.client_platform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9"
        self.session = {}  # Placeholder for session data
        self.entitlements = ""
        if lockfile_content:
            # Parse the lockfile content and use it to initialize the client
            self.lockfile = self._parse_lockfile(lockfile_content)
        else:
            self.lockfile = None
        self.base_url, self.base_url_glz, self.base_url_shared = self.__build_urls()

    def __build_urls(self) -> t.Tuple[str, str, str]:
        """Generate URLs based on region/shard"""
        base_url = self.base_endpoint.format(shard=self.shard)
        base_url_glz = self.base_endpoint_glz.format(shard=self.shard, region=self.region)
        base_url_shared = self.base_endpoint_shared.format(shard=self.shard)
        return base_url, base_url_glz, base_url_shared

    def region_to_shard(self, region: str) -> str:
        """Convert region to shard if necessary"""
        region_shard_map = {
            'na': 'na',
            'latam': 'na',
            'br': 'na',
            'pbe': 'pbe',
            'eu': 'eu',
            'ap': 'ap',
            'kr': 'kr'
        }
        return region_shard_map.get(region, 'na')

    def _parse_lockfile(self, lockfile_content: str) -> t.Dict[str, str]:
        """Parse the lockfile content and return a dictionary."""
        data = lockfile_content.split(':')
        keys = ["name", "PID", "port", "password", "protocol"]
        if len(data) != len(keys):
            raise ValueError('Lockfile format is incorrect')
        return dict(zip(keys, data))

    def set_session(self, session_data: t.Dict[str, t.Any]) -> None:
        """Set the session data."""
        self.session = session_data
    def set_entitlements(self, entitlementData: t.Dict[str, t.Any]) -> None:
        """Set the session data."""
        self.entitlements = entitlementData

    def activate(self) -> None:
        try:
            if self.lockfile:
                # Normally here you would set up headers or other client state based on self.lockfile
                self.puuid, self.headers, self.local_headers = self.__get_headers()
                # Instead of fetching the session, use the provided session data
                self.player_name = self.session.get("game_name", "")
                self.player_tag = self.session.get("game_tag", "")

            else:
                self.puuid, self.headers, self.local_headers = self.auth.authenticate()
        except Exception as e:
            print(f"Unable to activate; {str(e)}")
    def __verify_status_code(self, status_code, exceptions={}):
        """Verify that the request was successful according to exceptions"""
        if status_code in exceptions.keys():
            response_exception = exceptions[status_code]
            raise response_exception[0](response_exception[1])

    def __get_headers(self) -> t.Tuple[t.Text, t.Mapping[t.Text, t.Any]]:
        """Get authorization headers to make requests"""
        try:
            if self.auth is None:
                return self.__get_auth_headers()
            puuid, headers, _ = self.auth.authenticate()
            headers["X-Riot-ClientPlatform"] = (self.client_platform,)
            headers["X-Riot-ClientVersion"] = self.__get_current_version()
            return puuid, headers, None

        except Exception as e:
            print(e)
            raise ("Unable to get headers; is VALORANT running?")
    def __get_auth_headers(self) -> t.Tuple[t.Text, t.Mapping[t.Text, t.Any]]: 
        # headers for pd/glz endpoints
        local_headers = {
            "Authorization": (
                "Basic "
                + base64.b64encode(
                    ("riot:" + self.lockfile["password"]).encode()
                ).decode()
            )
        }
        puuid = self.entitlements["subject"]
        headers = {
            "Authorization": f"Bearer {self.entitlements['accessToken']}",
            "X-Riot-Entitlements-JWT": self.entitlements["token"],
            "X-Riot-ClientPlatform": self.client_platform,
            "X-Riot-ClientVersion": self.__get_current_version(), #
        }
        return puuid, headers, local_headers
    def __get_current_version(self) -> str:
        data = requests.get("https://valorant-api.com/v1/version")
        data = data.json()["data"]
        return f"{data['branch']}-shipping-{data['buildVersion']}-{data['version'].split('.')[3]}"  # return formatted version string
    def fetch(
        self, endpoint="/", endpoint_type="pd", exceptions={}
    ) -> dict:  # exception: code: {Exception, Message}
        """Get data from a pd/glz/local endpoint"""
        data = None
        if endpoint_type in ["pd", "glz", "shared"]:
            response = requests.get(
                f'{self.base_url_glz if endpoint_type == "glz" else self.base_url if endpoint_type == "pd" else self.base_url_shared if endpoint_type == "shared" else self.base_url}{endpoint}',
                headers=self.headers,
            )

            # custom exceptions for http status codes
            self.__verify_status_code(response.status_code, exceptions)

            try:
                data = json.loads(response.text)
            except:  # as no data is set, an exception will be raised later in the method
                pass

        elif endpoint_type == "local":
            response = requests.get(
                "https://127.0.0.1:{port}{endpoint}".format(
                    port=self.lockfile["port"], endpoint=endpoint
                ),
                headers=self.local_headers,
                verify=False,
            )

            # custom exceptions for http status codes
            self.__verify_status_code(response.status_code, exceptions)

            try:
                data = response.json()
            except:  # as no data is set, an exception will be raised later in the method
                pass

        if data is None:
            raise ResponseError("Request returned NoneType")

        if "httpStatus" not in data:
            return data
        if data["httpStatus"] == 400:
            # if headers expire (i dont think they ever do but jic), refresh em!
            if self.auth is None:
                self.puuid, self.headers, self.local_headers = self.__get_headers()
            else:
                self.puuid, self.headers, self.local_headers = self.auth.authenticate()
            return self.fetch(endpoint=endpoint, endpoint_type=endpoint_type)
        
@app.route('/activate', methods=['POST'])
def activate_client():
    data = request.json
    lockfile_content = data.get('lockfileContent')
    session_data = data.get('sessionData')
    entitlements_data = data.get('entitlementsData')

    if not lockfile_content:
        return jsonify({"error": "Lockfile content is required"}), 400

    if not session_data:
        return jsonify({"error": "Session data is required"}), 400

    try:
        # Initialize CustomClient with the lockfile details
        client = CustomClient(lockfile_content=lockfile_content)

        # Set the session data and entitlements
        client.set_session(session_data)
        client.set_entitlements(entitlements_data)

        # Activate the client
        client.activate()

        # Store the client instance in the global dictionary
        puuid = client.puuid
        clients[puuid] = client

        return jsonify({"message": "Client activated successfully", "puuid": puuid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/get-username', methods=['GET'])
def get_currentuser_name():
    puuid = request.args.get('puuid')

    if not puuid:
        return jsonify({"error": "PUUID is required"}), 400

    client = clients.get(puuid)

    if not client:
        return jsonify({"error": "Client not found"}), 404
    username = client.player_name
    return username


@app.route('/refresh-inventory', methods=['GET'])
def refresh_inventory():
    puuid = request.args.get('puuid')

    if not puuid:
        return jsonify({"error": "PUUID is required"}), 400

    client = clients.get(puuid)

    if not client:
        return jsonify({"error": "Client not found"}), 404

    try:
        updated_items_owned = {
            "Weapons": get_weapons(client),
            "Buddies": get_buddies(client),
            "Cards": get_cards(client),
            "Sprays": get_sprays(client),
            "Titles": get_titles(client),
        }

        return jsonify(updated_items_owned)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/import-loadout', methods=['GET'])
def import_loadout():
    puuid = request.args.get('puuid')

    if not puuid:
        return jsonify({"error": "PUUID is required"}), 400

    client = clients.get(puuid)

    if not client:
        return jsonify({"error": "Client not found"}), 404

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

@app.route('/update_loadout', methods=['POST'])
def update_loadout():
    puuid = request.args.get('puuid')

    if not puuid:
        return jsonify({"error": "PUUID is required"}), 400

    client = clients.get(puuid)

    if not client:
        return jsonify({"error": "Client not found"}), 404
    loadout = request.json  # Get the JSON data sent from the frontend
    # Assume `client` is an instance of the class where put_player_loadout is defined
    updated_loadout = client.put_player_loadout(loadout)
    return jsonify(updated_loadout)  # Return the updated loadout as JSON



def get_weapons(client):
    # Fetch entitlements (items owned)
    weapons_owned = client.store_fetch_entitlements()
    chromas_owned = client.store_fetch_entitlements(item_type="3ad1b2b2-acdb-4524-852f-954a76ddae0a")
    levels_owned = client.store_fetch_entitlements(item_type="e7c63390-eda7-46e0-bb7a-a6abdacd2433")
    
    entitlements = chromas_owned.get('Entitlements', [])
    chromas_owned_ids = [chroma['ItemID'] for chroma in entitlements]
    
    levels_entitlements = levels_owned.get('Entitlements', [])
    levels_owned_ids = [level['ItemID'] for level in levels_entitlements]

    # Fetch weapon skins data from the Valorant API
    api_url = "https://valorant-api.com/v1/weapons"
    response = requests.get(api_url)
    weapon_data = response.json().get('data', [])

    # Create a dictionary to store weapon skins data by the first level's UUID
    weapon_skins_by_level_uuid = {}
    for weapon in weapon_data:
        for skin in weapon.get('skins', []):
            if skin.get("levels") and len(skin["levels"]) > 0:
                first_level_uuid = skin["levels"][0]["uuid"]
                weapon_skins_by_level_uuid[first_level_uuid] = {
                    "skin": skin,
                    "weapon_uuid": weapon['uuid']
                }

    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_weapons = []
    
    # Process owned weapons
    for item in weapons_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            continue  # Skip processing this item ID to avoid duplication
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed

        # Check if the itemID exists in the weapon skins data by the first level's UUID
        if item_id in weapon_skins_by_level_uuid:
            weapon_skin_data = weapon_skins_by_level_uuid[item_id]
            weapon_skin = weapon_skin_data["skin"]
            weapon_uuid = weapon_skin_data["weapon_uuid"]
            
            owned_chromas = [weapon_skin["chromas"][0]]
            for chroma in weapon_skin.get("chromas", []):
                if chroma["uuid"] in chromas_owned_ids:
                    owned_chromas.append(chroma)

            owned_levels = []
            for level in weapon_skin.get("levels", []):
                if level["uuid"] in levels_owned_ids:
                    owned_levels.append(level)

            # Create updated item with collected chromas and levels
            updated_item = {
                "ItemID": weapon_skin["uuid"],
                "OfferID": item_id,
                "Weaponid": weapon_uuid,
                "Name": weapon_skin["displayName"],
                "Chromas": owned_chromas,
                "Levels": owned_levels
            }
            
            updated_weapons.append(updated_item)

    # Create a set of owned weapon UUIDs for quick lookup
    owned_weapon_uuids = {w["Weaponid"] for w in updated_weapons}

    # Add default "Standard" skins for each weapon
    for weapon in weapon_data:
        for skin in weapon.get('skins', []):
            if skin["displayName"].startswith("Standard") or skin["displayName"].startswith("Random") or skin["displayName"] == "Melee":
                print(skin["displayName"])
                # Only add default melee skins if they are not already included as owned

                default_chroma = skin["chromas"][0]
                default_levels = skin["levels"]

                # Create default item with the default chroma and levels
                default_item = {
                    "ItemID": skin["uuid"],
                    "OfferID": None,
                    "Weaponid": weapon["uuid"],
                    "Name": skin["displayName"],
                    "Chromas": [default_chroma],
                    "Levels": default_levels
                }
                    
                updated_weapons.append(default_item)

    # Sort updated_weapons by Weaponid
    updated_weapons_sorted = sorted(updated_weapons, key=lambda x: x["Weaponid"])
    
    return updated_weapons_sorted
def get_buddies(client):

    buddies_owned = client.store_fetch_entitlements(item_type = "dd3bf334-87f3-40bd-b043-682a57a8dc3a")

    # Fetch weapon skins data from the API
    api_url = "https://valorant-api.com/v1/buddies"
    response = requests.get(api_url)
    buddies_data = response.json().get('data', [])

    buddies_by_level_uuid = {}
    for buddy in buddies_data: 
        if buddy.get("levels") and len(buddy["levels"]) > 0:
            first_level_uuid = buddy["levels"][0]["uuid"]
            buddies_by_level_uuid[first_level_uuid] = {
                "buddy": buddy
            }
    # Initialize a set to keep track of processed ItemIDs
    processed_item_ids = set()

    # Update weapons_owned["Entitlements"] to match the structure from weapon_skins_data
    updated_buddies = []
    for item in buddies_owned["Entitlements"]:
        item_id = item["ItemID"]

        # Check if the itemID has already been processed
        if item_id in processed_item_ids:
            for buddy in updated_buddies:
                if buddy["LevelID"] == item_id:
                    # print(buddy)
                    # print(buddy['InstanceID2'])
                    print(item["InstanceID"])
                    buddy["InstanceID2"] = item["InstanceID"]
                    
            continue
        else:
            processed_item_ids.add(item_id)  # Mark this item ID as processed
            

        # Check if the itemID exists in the weapon skins data
        if item_id in buddies_by_level_uuid:
            buddy_data = buddies_by_level_uuid[item_id]
            buddy = buddy_data["buddy"]
            
            # Create updated item with collected chromas
            updated_item = {
                "ItemID": buddy["uuid"],
                "Name": buddy["displayName"],
                "ImageURL": buddy["displayIcon"],
                "InstanceID1": item["InstanceID"],
                "InstanceID2": "",
                "Dominant Colors": get_dominant_colors_from_url(buddy["displayIcon"], buddy=True),
                "LevelID": item_id,
                "Uses": 2
            }
            
            updated_buddies.append(updated_item)

    # Sort updated_entitlements by Weaponid
    updated_buddies_sorted = sorted(updated_buddies, key=lambda x: x["Name"])
    return updated_buddies_sorted

# Create a new JSON structure with three fields and the entitlements as the value for the first field

def get_cards(client):
    cards_owned = client.store_fetch_entitlements(item_type = "3f296c07-64c3-494c-923b-fe692a4fa1bd")

    # Fetch weapon skins data from the API
    api_url = "https://valorant-api.com/v1/playercards"
    response = requests.get(api_url)
    cards_data = response.json().get('data', [])

    cards_by_offerid = {item['uuid']: item for item in cards_data}

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
                "Name": card["displayName"],
                "smallImageURL": card["smallArt"],
                "wideImageURL": card["wideArt"],
                "largeImageURL": card["largeArt"],
            }
            
            updated_cards.append(updated_item)
    standard_card = {
        "ItemID": "9fb348bc-41a0-91ad-8a3e-818035c4e561" ,
        "Name": "VALORANT Card",
        "smallImageURL": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png",
        "wideImageURL": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
        "largeImageURL": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png",
    }
    updated_cards.append(standard_card)

    # Sort updated_entitlements by Weaponid
    updated_cards_sorted = sorted(updated_cards, key=lambda x: x["Name"])
    return updated_cards_sorted

def get_sprays(client):
    sprays_owned = client.store_fetch_entitlements(item_type = "d5f120f8-ff8c-4aac-92ea-f2b5acbe9475")

    # Fetch weapon skins data from the API
    api_url = "https://valorant-api.com/v1/sprays"
    response = requests.get(api_url)
    sprays_data = response.json().get('data', [])

    sprays_by_offerid = {item['uuid']: item for item in sprays_data}

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
                "Name": spray["displayName"], 
                "displayIcon": spray["displayIcon"],
                "fullDisplayImg": spray["fullTransparentIcon"],
                "fullDisplayGif": spray["animationGif"]
            }
            
            updated_sprays.append(updated_item)

    # Sort updated_entitlements by Name
    updated_sprays_sorted = sorted(updated_sprays, key=lambda x: x["Name"])
    return updated_sprays_sorted

def get_titles(client):
    titles_owned = client.store_fetch_entitlements(item_type = "de7caa6b-adf7-4588-bbd1-143831e786c6")

    # Fetch weapon skins data from the API
    api_url = "https://valorant-api.com/v1/playertitles"
    response = requests.get(api_url)
    titles_data = response.json().get('data', [])

    titles_by_offerid = {item['uuid']: item for item in titles_data}

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
                "Name": title["displayName"],
                "Title": title["titleText"],
            }
            
            updated_titles.append(updated_item)

    # Sort updated_entitlements by Name
    updated_titles_sorted = sorted(updated_titles, key=lambda x: x["Name"])
    return updated_titles_sorted


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)



def rgb_to_hsl(r, g, b):
    """Convert RGB to HSL."""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return int(h * 360), int(s * 100), int(l * 100)

def classify_hsl(h, s, l):
    """Classify HSL into predefined color ranges with adjusted brightness."""
    l = int(l * 1.3)  # Adjust lightness to account for reduced brightness (30% increase)
    l = min(l, 100)   # Ensure lightness doesn't exceed 100

    if l < 10 and s <=5:  # Adjusted black threshold
        return "Black"
    elif l > 70 and s <=5:  # Adjusted white threshold
        return "White"
    elif 10< l > 70 and s <=5:  # Adjusted white threshold
        return "Grey"
    elif 0 <= h < 15 or 345 <= h <= 360:
        return "Red"
    elif 15 <= h < 45:
        return "Orange"
    elif 45 <= h < 70:
        return "Yellow"
    elif 70 <= h < 155:
        return "Green"
    elif 155 <= h < 260:
        return "Blue"
    elif 260 <= h < 300:
        return "Purple"
    elif 300 <= h < 345:
        return "Pink"
    else:
        return "Unknown"

def get_dominant_colors_from_url(image_url, buddy=False):
    """Get the top 3 dominant colors in an image from a URL, with optional cropping."""
    try:
        # Download the image
        response = requests.get(image_url)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))

        # Convert PNG to RGBA if not already in RGBA mode
        if image.format == "PNG" and "A" not in image.mode:
            image = image.convert("RGBA")
        elif image.mode not in ("RGB", "RGBA"):
            # Convert other modes (like grayscale) to RGB or RGBA
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the image: {e}")
        return

    # Get image dimensions
    width, height = image.size

    # Define the area to ignore (top-right corner: 20% height, 54.7% width)
    crop_width = int(width * 0.547)
    crop_height = int(height * 0.2)

    # Crop the image to exclude the top-right section
    if buddy:
        image = image.crop((0, 0, width - crop_width, height - crop_height))

    # Process pixels, skipping transparent ones
    pixels = list(image.getdata())
    color_counts = Counter()

    for pixel in pixels:
        if len(pixel) == 4:  # RGBA mode
            r, g, b, a = pixel
            if a == 0:  # Skip fully transparent pixels
                continue
        else:
            r, g, b = pixel

        h, s, l = rgb_to_hsl(r, g, b)
        color_class = classify_hsl(h, s, l)
        color_counts[color_class] += 1

    total_pixels = sum(color_counts.values())
    if total_pixels == 0:
        print("No visible pixels found in the image.")
        return

    dominant_colors = color_counts.most_common(3)
    return dominant_colors
   