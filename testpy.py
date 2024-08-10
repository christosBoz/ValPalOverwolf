from valclient.client import Client



# Initialize the VALORANT client
client = Client(region="na")
client.activate()

username = client.rnet_fetch_active_alias().get('game_name')
print(username)