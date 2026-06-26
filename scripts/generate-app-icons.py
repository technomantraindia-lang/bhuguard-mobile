"""Generate Expo app icons from assets/bhuguard-logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "assets"
LOGO_PATH = ASSETS / "bhuguard-logo.png"
BG_LIGHT = "#F6FAF4"
BG_PRIMARY = "#005129"


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def compose_icon(size: int, logo_scale: float, background: str | None, transparent: bool = False) -> Image.Image:
    logo = Image.open(LOGO_PATH).convert("RGBA")
    if transparent:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        canvas = Image.new("RGBA", (size, size), (*hex_to_rgb(background or BG_LIGHT), 255))

    logo_max = int(size * logo_scale)
    logo.thumbnail((logo_max, logo_max), Image.Resampling.LANCZOS)
    offset = ((size - logo.width) // 2, (size - logo.height) // 2)
    canvas.paste(logo, offset, logo)

    return canvas


def compose_monochrome(size: int) -> Image.Image:
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_max = int(size * 0.55)
    logo.thumbnail((logo_max, logo_max), Image.Resampling.LANCZOS)

    alpha = logo.split()[-1]
    mono = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    white_logo = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white_logo.putalpha(alpha)
    offset = ((size - white_logo.width) // 2, (size - white_logo.height) // 2)
    mono.paste(white_logo, offset, white_logo)
    return mono


def main() -> None:
    if not LOGO_PATH.exists():
        raise SystemExit(f"Logo not found: {LOGO_PATH}")

    compose_icon(1024, 0.68, BG_LIGHT).convert("RGB").save(ASSETS / "icon.png")
    compose_icon(1024, 0.52, None, transparent=True).save(ASSETS / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), hex_to_rgb(BG_PRIMARY)).save(ASSETS / "android-icon-background.png")
    compose_monochrome(1024).save(ASSETS / "android-icon-monochrome.png")
    compose_icon(512, 0.72, BG_PRIMARY).convert("RGB").save(ASSETS / "splash-icon.png")
    compose_icon(192, 0.72, BG_LIGHT).convert("RGB").save(ASSETS / "favicon.png")
    print("Generated Bhuguard app icons in assets/")


if __name__ == "__main__":
    main()
