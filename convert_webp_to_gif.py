from PIL import Image, ImageSequence
import sys

input_path = sys.argv[1]
output_path = sys.argv[2]

print(f"Converting {input_path} to {output_path}...")
try:
    im = Image.open(input_path)
    # Resize to 800 width, keeping aspect ratio
    width, height = im.size
    new_width = 800
    new_height = int(height * (new_width / width))
    
    frames = []
    # Use ImageSequence to extract all frames correctly
    for frame in ImageSequence.Iterator(im):
        # Convert to RGB to drop alpha channels which cause issues in WebP -> GIF duration
        f = frame.copy().convert('RGB')
        f = f.resize((new_width, new_height), Image.Resampling.LANCZOS)
        frames.append(f)
        
    if not frames:
        raise ValueError("No frames could be extracted from the WebP file.")
        
    # Save as looping GIF
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        optimize=False,
        duration=100, # 10fps
        loop=0
    )
    print(f"Conversion successful! Total frames: {len(frames)}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
