from PIL import Image

def crop_bottom(input_path, output_path, pixels_to_crop=15):
    img = Image.open(input_path)
    width, height = img.size
    # Crop the image: box is (left, upper, right, lower)
    cropped_img = img.crop((0, 0, width, height - pixels_to_crop))
    cropped_img.save(output_path, "PNG")
    print(f"Successfully cropped {pixels_to_crop} pixels from the bottom of the image!")

if __name__ == "__main__":
    crop_bottom("public/retro-phone.png", "public/retro-phone.png", 15)
