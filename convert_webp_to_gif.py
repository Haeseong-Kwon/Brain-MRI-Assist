from PIL import Image
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
    try:
        while True:
            frame = im.copy()
            frame = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)
            frames.append(frame)
            im.seek(im.tell() + 1)
    except EOFError:
        pass
        
    # Save as looping GIF (optimization helps reduce size)
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        optimize=False,
        duration=100, # 10fps
        loop=0
    )
    print("Conversion successful!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
