from PIL import Image, ImageDraw, ImageFont

def make_icon(size):
    img = Image.new('RGB', (size, size), color=(247, 126, 88))
    draw = ImageDraw.Draw(img)

    # "2026ORS" 上段、"presentation" 下段
    font_size_top = int(size * 0.24)
    font_size_bot = int(size * 0.18)

    try:
        font_top = ImageFont.truetype("arial.ttf", font_size_top)
        font_bot = ImageFont.truetype("arial.ttf", font_size_bot)
    except:
        font_top = ImageFont.load_default(font_size_top)
        font_bot = ImageFont.load_default(font_size_bot)

    # "2026ORS" を上半分に中央配置
    bbox_top = draw.textbbox((0, 0), "2026ORS", font=font_top)
    w_top = bbox_top[2] - bbox_top[0]
    draw.text(((size - w_top) / 2, size * 0.2), "2026ORS", font=font_top, fill="white")

    # "presentation" を下半分に中央配置
    bbox_bot = draw.textbbox((0, 0), "presentation", font=font_bot)
    w_bot = bbox_bot[2] - bbox_bot[0]
    draw.text(((size - w_bot) / 2, size * 0.58), "presentation", font=font_bot, fill="white")

    return img

make_icon(192).save('shared/icons/icon-192.png')
make_icon(512).save('shared/icons/icon-512.png')
print("Icons created with 2026ORS presentation text")
