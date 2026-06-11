from PIL import Image
from collections import deque

def extract_transparent_phone(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # Queue for BFS from the border to flood-fill background pixels
    queue = deque()
    visited = set()
    
    # Add border pixels to start the flood fill
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
        visited.add((x, 0))
        visited.add((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))
        visited.add((0, y))
        visited.add((width - 1, y))
        
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    
    while queue:
        cx, cy = queue.popleft()
        r, g, b, a = pixels[cx, cy]
        
        # Determine if this pixel is white background.
        # Since the background is solid pure white, R, G, B will all be >= 245
        is_white_bg = (r >= 245 and g >= 245 and b >= 245)
        
        if is_white_bg:
            pixels[cx, cy] = (0, 0, 0, 0) # Make transparent
            
            # Spread to neighbors
            for dx, dy in dirs:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # Save the processed image
    img.save(output_path, "PNG")
    print("Successfully extracted phone image with perfectly transparent background!")

if __name__ == "__main__":
    # Path to the generated image
    generated_image_path = r"C:\Users\anike\.gemini\antigravity\brain\2ec7db1c-5023-456f-a9a1-2e1683948e9c\retro_phone_new_1781177129883.png"
    extract_transparent_phone(generated_image_path, "public/retro-phone.png")
