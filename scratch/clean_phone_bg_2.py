from PIL import Image
from collections import deque

def clean_checkerboard_advanced(input_path, output_path):
    # Load original image (or re-load from a backup if available, but since we overwrote it,
    # let's work on the current one. Any transparent pixels are already transparent, and we just need to clean the rest).
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # We want to identify the phone body.
    # The phone body is a connected component in the center of the image.
    # Alternatively, we can run a flood-fill from the edges of the image to find all background pixels.
    # Let's seed the queue with all border pixels.
    queue = deque()
    visited = set()
    
    # Add border pixels to queue
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
        
    # Directions for BFS
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    
    while queue:
        cx, cy = queue.popleft()
        r, g, b, a = pixels[cx, cy]
        
        # If it's already transparent, we can continue spreading because it's background
        is_bg = (a == 0)
        
        if not is_bg:
            # Determine if this pixel is background (checkerboard or shadow checkerboard)
            # 1. Monochromatic/greyish pixels: R, G, B are very close
            is_grey = abs(r - g) <= 18 and abs(g - b) <= 18 and abs(r - b) <= 18
            
            # 2. Very light pixels (white checker)
            is_white = (r >= 220 and g >= 220 and b >= 220)
            
            # 3. Intermediate shades of checkerboard
            is_checker_shade = (140 <= r <= 255) and is_grey
            
            # If it's grey/white or dark grey shadow (which also is monochromatic)
            if is_grey or is_white or is_checker_shade:
                is_bg = True
                pixels[cx, cy] = (0, 0, 0, 0) # Make it transparent
                
        if is_bg:
            # Spread to neighbors
            for dx, dy in dirs:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    # Save the cleaned image
    img.save(output_path, "PNG")
    print("Advanced background cleaning completed successfully!")

if __name__ == "__main__":
    clean_checkerboard_advanced("public/retro-phone.png", "public/retro-phone.png")
