from flask import Flask, jsonify, request
import valclient  # Ensure valclient is installed and configured

app = Flask(__name__)

@app.route('/get_account_xp', methods=['POST'])
def get_account_xp():
    data = request.json
    lockfile_details = data.get('lockfile')
    
    if not lockfile_details:
        return jsonify({"error": "Lockfile details are required"}), 400

    try:
        # Initialize valclient with the lockfile details
        client = valclient.Client(auth=lockfile_details)
        client.activate()
        
        # Fetch account XP using the valclient
        response = client.fetch('/account-xp/v1/players/{puuid}', endpoint_type='local')
        return jsonify(response)
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Ensure it's accessible externally
