from flask import Flask, request

app = Flask(__name__)

# In-memory player tracker (reset on restart)
match_players = {}

@app.route('/checkin', methods=['POST'])
def check_in():
    data = request.json
    match_id = data.get('matchId')
    username = data.get('username')

    if not match_id or not username:
        return {"status": "error", "message": "Invalid payload"}, 400

    # Track players in each match
    if match_id not in match_players:
        match_players[match_id] = []
    if username not in match_players[match_id]:
        match_players[match_id].append(username)

    return {"status": "success", "players": match_players[match_id]}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)