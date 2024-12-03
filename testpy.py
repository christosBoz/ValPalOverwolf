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

def classify_hsl(h, s, l):
    """Classify HSL into predefined color ranges with adjusted brightness."""
    l = int(l * 1.3)  # Adjust lightness to account for reduced brightness (30% increase)
    l = min(l, 100)   # Ensure lightness doesn't exceed 100

    if l < 20 or (s < 25 and l < 30):  # Adjusted black threshold
        return "Black"
    elif l > 80 or (s < 25 and l > 30):  # Adjusted white threshold
        return "White"
    elif 0 <= h < 15 or 345 <= h <= 360:
        return "Red"
    elif 15 <= h < 45:
        return "Orange"
    elif 45 <= h < 70:
        return "Yellow"
    elif 70 <= h < 150:
        return "Green"
    elif 150 <= h < 240:
        return "Blue"
    elif 240 <= h < 300:
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

    # Display results
    print("Top Dominant Colors:")
    for color, count in dominant_colors:
        score = (count / total_pixels) * 100
        print(f"{color}: {score:.2f}%")

if __name__ == "__main__":
    image_url = input("Enter the image URL: ")
    buddy_mode = input("Enable buddy mode? (yes/no): ").strip().lower() == "yes"
    get_dominant_colors_from_url(image_url, buddy=buddy_mode)
