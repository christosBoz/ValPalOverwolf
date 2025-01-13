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

<<<<<<< HEAD
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
=======
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
    total_pixels = sum(color_counts.values())
    if total_pixels == 0:
        print("No visible pixels found in the image.")
        return []
    
    result_array = [(color, (count / total_pixels) * 100) for color, count in dominant_colors]

    
    # Display results
    print("Top Dominant Colors:")
    for color, count in dominant_colors:
        score = (count / total_pixels) * 100
        print(f"{color}: {score:.2f}%")

    return result_array

if __name__ == "__main__":
    image_url = input("Enter the image URL: ")
    buddy_mode = input("Enable buddy mode? (yes/no): ").strip().lower() == "yes"
    array = get_dominant_colors_from_url(image_url, buddy=buddy_mode)
    print(array)
>>>>>>> 58c9056cfae756add609d962ffc3e792f679fa62
