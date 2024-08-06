from valclient.client import Client



# Initialize the VALORANT client
client = Client(region="na")
client.activate()


print(client.store_fetch_entitlements(item_type = "dd3bf334-87f3-40bd-b043-682a57a8dc3a"))