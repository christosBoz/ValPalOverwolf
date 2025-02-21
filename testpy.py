from PIL import Image
import colorsys
from collections import Counter
import requests
from io import BytesIO

def rgb_to_hsl(r, g, b):
    """Convert RGB to HSL."""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return int(h * 360), int(s * 100), int(l * 100)

def is_neutral(h, s, l):
    """Check if a color is gray, black, or white."""
    return (l < 20 or l > 80) or s < 25  # Neutral colors (black, white, gray)

def get_dominant_hue_from_url(image_url):
    """Get the most common hue in an image, excluding gray, black, and white pixels."""
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))
        
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the image: {e}")
        return None

    pixels = list(image.getdata())
    hue_counts = Counter()

    for pixel in pixels:
        if len(pixel) == 4:
            r, g, b, a = pixel
            if a == 0:
                continue
        else:
            r, g, b = pixel

        h, s, l = rgb_to_hsl(r, g, b)
        
        if not is_neutral(h, s, l):
            hue_counts[h] += 1

    if not hue_counts:
        print("No dominant hue found (all neutral colors).")
        return None
    
    most_common_hue, _ = hue_counts.most_common(1)[0]
    print(f"Most common hue: {most_common_hue}°")
    return most_common_hue

if __name__ == "__main__":
    image_url = input("Enter the image URL: ")
    get_dominant_hue_from_url(image_url)