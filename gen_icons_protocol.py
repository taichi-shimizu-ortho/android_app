from PIL import Image, ImageDraw, ImageFont

def make_icon(size):
    img = Image.new('RGB', (size, size), color=(102, 126, 234))
    draw = ImageDraw.Draw(img)

    font_size = int(size * 0.4)

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default(font_size)

    # "P" を中央に配置
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((size - w) / 2, (size - h) / 2), text, font=font, fill="white")

    return img

make_icon(192).save('docs/protocol/icons/icon-192.png')
make_icon(512).save('docs/protocol/icons/icon-512.png')
print("Protocol icons created")
