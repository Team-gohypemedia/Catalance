from PIL import Image

def clean_checkerboard(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # We will identify the checkerboard colors:
    # 1. Pure or near white: e.g. R, G, B all >= 240
    # 2. Light grey checkers: e.g. R, G, B are all very close (within 3) and in range 190-210
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Check for white checker
            if r >= 240 and g >= 240 and b >= 240:
                pixels[x, y] = (0, 0, 0, 0)
                continue
                
            # Check for grey checker
            if 185 <= r <= 215 and 185 <= g <= 215 and 185 <= b <= 215:
                # Make sure they are monochromatic (very close values)
                if abs(r - g) <= 4 and abs(g - b) <= 4 and abs(r - b) <= 4:
                    pixels[x, y] = (0, 0, 0, 0)
                    continue
                    
            # Check for intermediate/anti-aliased checker pixels (e.g. around 220-238)
            if 215 <= r <= 239 and 215 <= g <= 239 and 215 <= b <= 239:
                if abs(r - g) <= 4 and abs(g - b) <= 4 and abs(r - b) <= 4:
                    pixels[x, y] = (0, 0, 0, 0)
                    continue

    img.save(output_path, "PNG")
    print("Cleaned background successfully!")

if __name__ == "__main__":
    clean_checkerboard("public/retro-phone.png", "public/retro-phone.png")
