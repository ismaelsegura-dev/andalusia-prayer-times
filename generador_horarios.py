#!/usr/bin/env python3
"""
Generador de PDFs de Horarios de Oración — Ramadán 1447h (2025/2026)
Mezquitas: Granada · Sevilla · Barcelona
Árabe renderizado correctamente via Pillow (sin arabic-reshaper externo).
"""

import os
from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Fuentes ReportLab (para texto latino) ──────────────────────────────────
pdfmetrics.registerFont(TTFont('FreeSans',      '/usr/share/fonts/truetype/freefont/FreeSans.ttf'))
pdfmetrics.registerFont(TTFont('FreeSansBold',  '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerifBold', '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf'))

# ── Fuentes Pillow (para texto árabe) ─────────────────────────────────────
PIL_FONT_AR_SM = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSerif.ttf',     size=26)
PIL_FONT_AR_MD = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf', size=24)

AR_IMGS_DIR = '/home/claude/arabic_imgs'
os.makedirs(AR_IMGS_DIR, exist_ok=True)
os.makedirs(f'{AR_IMGS_DIR}/hdr', exist_ok=True)


def make_ar_img(text, font, color_rgba, key, subdir=''):
    """Renderiza texto árabe en PNG transparente y devuelve la ruta."""
    path = os.path.join(AR_IMGS_DIR, subdir, f'{key}.png')
    if not os.path.exists(path):
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        W, H = tw + 16, th + 10
        img = PILImage.new('RGBA', (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.text(((W - tw) / 2, (H - th) / 2 - bbox[1]), text, font=font, fill=color_rgba)
        img.save(path)
    return path


def draw_ar(c, text, font, color_rgba, key, cx, cy, subdir=''):
    """Dibuja texto árabe (como imagen) centrado en (cx, cy)."""
    path = make_ar_img(text, font, color_rgba, key, subdir)
    img = PILImage.open(path)
    iw, ih = img.size
    # Convertir píxeles → puntos (72 dpi ÷ 96 ppi × escala)
    scale = 0.48   # ajustado visualmente para tamaño de texto ~7-9pt
    pw = iw * scale
    ph = ih * scale
    c.drawImage(path, cx - pw / 2, cy - ph / 2,
                width=pw, height=ph, mask='auto')


# ─────────────────────────────────────────────────────────────────────────────
#  DATOS DE LAS MEZQUITAS
# ─────────────────────────────────────────────────────────────────────────────

MEZQUITAS = {
    "granada": {
        "nombre_es":  "Granada",
        "fundacion":  None,
        "col_pri":    HexColor("#1B4332"),
        "col_sec":    HexColor("#2D6A4F"),
        "col_acc":    HexColor("#C8A84B"),
        "header_img": "/home/claude/logos/granada_header2.png",
        "geo": "Granada (37°11'N / 3°36'O)  ·  Alt: 828 m  ·  Long. ref.: 15°E  ·  UTC+1  ·  Crepúsculo: 18°  ·  Qiblah: 100.4°",
        "contacto":   None,
        "web":        None,
        "datos": [
            ( 1,"jue 19 feb","الخميس",   "06:32","07:52","13:33","16:32","19:04","20:25"),
            ( 2,"vie 20 feb","الجمعة",   "06:31","07:51","13:33","16:33","19:05","20:26"),
            ( 3,"sab 21 feb","السبت",    "06:30","07:50","13:33","16:33","19:06","20:26"),
            ( 4,"dom 22 feb","الأحد",    "06:28","07:49","13:33","16:34","19:07","20:27"),
            ( 5,"lun 23 feb","الاثنين",  "06:27","07:47","13:33","16:35","19:08","20:28"),
            ( 6,"mar 24 feb","الثلاثاء", "06:26","07:46","13:33","16:35","19:09","20:29"),
            ( 7,"mie 25 feb","الأربعاء", "06:25","07:45","13:33","16:36","19:10","20:30"),
            ( 8,"jue 26 feb","الخميس",   "06:23","07:43","13:32","16:37","19:11","20:31"),
            ( 9,"vie 27 feb","الجمعة",   "06:22","07:42","13:32","16:37","19:12","20:32"),
            (10,"sab 28 feb","السبت",    "06:21","07:41","13:32","16:38","19:13","20:33"),
            (11,"dom 01 mar","الأحد",    "06:20","07:39","13:32","16:39","19:14","20:34"),
            (12,"lun 02 mar","الاثنين",  "06:18","07:38","13:32","16:39","19:15","20:35"),
            (13,"mar 03 mar","الثلاثاء", "06:17","07:37","13:31","16:40","19:16","20:36"),
            (14,"mie 04 mar","الأربعاء", "06:15","07:35","13:31","16:40","19:17","20:37"),
            (15,"jue 05 mar","الخميس",   "06:14","07:34","13:31","16:41","19:18","20:38"),
            (16,"vie 06 mar","الجمعة",   "06:13","07:32","13:31","16:42","19:19","20:39"),
            (17,"sab 07 mar","السبت",    "06:11","07:31","13:31","16:42","19:20","20:40"),
            (18,"dom 08 mar","الأحد",    "06:10","07:30","13:30","16:43","19:21","20:41"),
            (19,"lun 09 mar","الاثنين",  "06:08","07:28","13:30","16:43","19:22","20:42"),
            (20,"mar 10 mar","الثلاثاء", "06:07","07:27","13:30","16:44","19:23","20:43"),
            (21,"mie 11 mar","الأربعاء", "06:05","07:25","13:30","16:44","19:24","20:44"),
            (22,"jue 12 mar","الخميس",   "06:04","07:24","13:29","16:45","19:25","20:45"),
            (23,"vie 13 mar","الجمعة",   "06:02","07:22","13:29","16:45","19:26","20:46"),
            (24,"sab 14 mar","السبت",    "06:01","07:21","13:29","16:46","19:27","20:47"),
            (25,"dom 15 mar","الأحد",    "05:59","07:19","13:28","16:46","19:28","20:48"),
            (26,"lun 16 mar","الاثنين",  "05:58","07:18","13:28","16:47","19:28","20:49"),
            (27,"mar 17 mar","الثلاثاء", "05:56","07:16","13:28","16:47","19:29","20:50"),
            (28,"mie 18 mar","الأربعاء", "05:55","07:15","13:28","16:47","19:30","20:51"),
            (29,"jue 19 mar","الخميس",   "05:53","07:13","13:27","16:48","19:31","20:52"),
            (30,"vie 20 mar","الجمعة",   "05:52","07:12","13:27","16:48","19:32","20:53"),
        ],
        "lunar": ("19/03/2026","19h 29m 43s","20h 15m 31s","00h 45m 47s","00d 17h 06m"),
    },

    "sevilla": {
        "nombre_es":  "Sevilla",
        "fundacion":  "Fundación Mezquita de Sevilla",
        "col_pri":    HexColor("#6B1A0E"),
        "col_sec":    HexColor("#A33020"),
        "col_acc":    HexColor("#E8A020"),
        "header_img": "/home/claude/logos/sevilla_header2.png",
        "geo": "Sevilla (37°23'N / 5°59'O)  ·  Alt: 150 m  ·  Long. ref.: 15°E  ·  UTC+1  ·  Crepúsculo: 18°  ·  Qiblah: 98.8°",
        "contacto":   "Plaza Ponce de León 9, 41003 Sevilla  ·  Tel: +34 954 022 979  ·  Fax: +34 954 048 747",
        "web":        "info@mezquitadesevilla.com  ·  mezquitadesevilla.com  ·  @MezquitaSevilla",
        "datos": [
            ( 1,"jue 19 feb","الخميس",   "06:41","08:06","13:43","16:41","19:10","20:34"),
            ( 2,"vie 20 feb","الجمعة",   "06:40","08:04","13:43","16:42","19:11","20:35"),
            ( 3,"sab 21 feb","السبت",    "06:39","08:03","13:43","16:43","19:12","20:36"),
            ( 4,"dom 22 feb","الأحد",    "06:38","08:02","13:42","16:43","19:13","20:37"),
            ( 5,"lun 23 feb","الاثنين",  "06:37","08:01","13:42","16:44","19:14","20:38"),
            ( 6,"mar 24 feb","الثلاثاء", "06:35","07:59","13:42","16:45","19:15","20:39"),
            ( 7,"mie 25 feb","الأربعاء", "06:34","07:58","13:42","16:45","19:16","20:40"),
            ( 8,"jue 26 feb","الخميس",   "06:33","07:57","13:42","16:46","19:17","20:41"),
            ( 9,"vie 27 feb","الجمعة",   "06:32","07:55","13:42","16:47","19:18","20:42"),
            (10,"sab 28 feb","السبت",    "06:30","07:54","13:42","16:47","19:19","20:43"),
            (11,"dom 01 mar","الأحد",    "06:29","07:53","13:41","16:48","19:20","20:44"),
            (12,"lun 02 mar","الاثنين",  "06:28","07:51","13:41","16:49","19:21","20:45"),
            (13,"mar 03 mar","الثلاثاء", "06:26","07:50","13:41","16:49","19:22","20:46"),
            (14,"mie 04 mar","الأربعاء", "06:25","07:48","13:41","16:50","19:23","20:47"),
            (15,"jue 05 mar","الخميس",   "06:24","07:47","13:41","16:50","19:24","20:48"),
            (16,"vie 06 mar","الجمعة",   "06:22","07:46","13:40","16:51","19:25","20:48"),
            (17,"sab 07 mar","السبت",    "06:21","07:44","13:40","16:52","19:26","20:49"),
            (18,"dom 08 mar","الأحد",    "06:19","07:43","13:40","16:52","19:27","20:50"),
            (19,"lun 09 mar","الاثنين",  "06:18","07:41","13:40","16:53","19:28","20:51"),
            (20,"mar 10 mar","الثلاثاء", "06:16","07:40","13:39","16:53","19:29","20:52"),
            (21,"mie 11 mar","الأربعاء", "06:15","07:38","13:39","16:54","19:30","20:53"),
            (22,"jue 12 mar","الخميس",   "06:13","07:37","13:39","16:54","19:31","20:54"),
            (23,"vie 13 mar","الجمعة",   "06:12","07:35","13:39","16:55","19:32","20:55"),
            (24,"sab 14 mar","السبت",    "06:10","07:34","13:38","16:55","19:33","20:56"),
            (25,"dom 15 mar","الأحد",    "06:09","07:32","13:38","16:56","19:34","20:57"),
            (26,"lun 16 mar","الاثنين",  "06:07","07:31","13:38","16:56","19:34","20:58"),
            (27,"mar 17 mar","الثلاثاء", "06:06","07:29","13:37","16:56","19:35","20:59"),
            (28,"mie 18 mar","الأربعاء", "06:04","07:28","13:37","16:57","19:36","21:00"),
            (29,"jue 19 mar","الخميس",   "06:02","07:26","13:37","16:57","19:37","21:01"),
            (30,"vie 20 mar","الجمعة",   "06:01","07:25","13:37","16:58","19:38","21:02"),
        ],
        "lunar": ("19/03/2026","19h 36m 45s","20h 22m 59s","00h 46m 14s","00d 17h 13m"),
    },

    "barcelona": {
        "nombre_es":  "Barcelona",
        "fundacion":  "Fundación Mezquita de Barcelona",
        "col_pri":    HexColor("#002B5C"),
        "col_sec":    HexColor("#0055A4"),
        "col_acc":    HexColor("#F0B800"),
        "header_img": "/home/claude/logos/barcelona_header2.png",
        "geo": "Barcelona (41°23'N / 2°09'E)  ·  Alt: 25 m  ·  Long. ref.: 15°E  ·  UTC+1  ·  Crepúsculo: 18°  ·  Qiblah: 110.5°",
        "contacto":   "Carrer Benet Mercadé 26 Local 1, 08012 Barcelona  ·  Tel: +34 935 312 292",
        "web":        "info@bcnmosque.com  ·  bcnmosque.com",
        "datos": [
            ( 1,"jue 19 feb","الخميس",   "06:09","07:36","13:10","16:02","18:34","20:02"),
            ( 2,"vie 20 feb","الجمعة",   "06:08","07:35","13:10","16:03","18:36","20:03"),
            ( 3,"sab 21 feb","السبت",    "06:06","07:33","13:10","16:04","18:37","20:04"),
            ( 4,"dom 22 feb","الأحد",    "06:05","07:32","13:10","16:05","18:38","20:05"),
            ( 5,"lun 23 feb","الاثنين",  "06:04","07:30","13:10","16:06","18:39","20:06"),
            ( 6,"mar 24 feb","الثلاثاء", "06:02","07:29","13:10","16:07","18:40","20:07"),
            ( 7,"mie 25 feb","الأربعاء", "06:01","07:27","13:10","16:08","18:42","20:08"),
            ( 8,"jue 26 feb","الخميس",   "05:59","07:26","13:09","16:08","18:43","20:09"),
            ( 9,"vie 27 feb","الجمعة",   "05:58","07:24","13:09","16:09","18:44","20:11"),
            (10,"sab 28 feb","السبت",    "05:56","07:23","13:09","16:10","18:45","20:12"),
            (11,"dom 01 mar","الأحد",    "05:55","07:21","13:09","16:11","18:46","20:13"),
            (12,"lun 02 mar","الاثنين",  "05:53","07:20","13:09","16:12","18:47","20:14"),
            (13,"mar 03 mar","الثلاثاء", "05:52","07:18","13:08","16:12","18:49","20:15"),
            (14,"mie 04 mar","الأربعاء", "05:50","07:17","13:08","16:13","18:50","20:16"),
            (15,"jue 05 mar","الخميس",   "05:48","07:15","13:08","16:14","18:51","20:18"),
            (16,"vie 06 mar","الجمعة",   "05:47","07:13","13:08","16:15","18:52","20:19"),
            (17,"sab 07 mar","السبت",    "05:45","07:12","13:08","16:15","18:53","20:20"),
            (18,"dom 08 mar","الأحد",    "05:44","07:10","13:07","16:16","18:54","20:21"),
            (19,"lun 09 mar","الاثنين",  "05:42","07:09","13:07","16:17","18:55","20:22"),
            (20,"mar 10 mar","الثلاثاء", "05:40","07:07","13:07","16:17","18:57","20:23"),
            (21,"mie 11 mar","الأربعاء", "05:39","07:05","13:07","16:18","18:58","20:25"),
            (22,"jue 12 mar","الخميس",   "05:37","07:04","13:06","16:19","18:59","20:26"),
            (23,"vie 13 mar","الجمعة",   "05:35","07:02","13:06","16:19","19:00","20:27"),
            (24,"sab 14 mar","السبت",    "05:33","07:00","13:06","16:20","19:01","20:28"),
            (25,"dom 15 mar","الأحد",    "05:32","06:59","13:05","16:21","19:02","20:29"),
            (26,"lun 16 mar","الاثنين",  "05:30","06:57","13:05","16:21","19:03","20:30"),
            (27,"mar 17 mar","الثلاثاء", "05:28","06:55","13:05","16:22","19:04","20:32"),
            (28,"mie 18 mar","الأربعاء", "05:26","06:54","13:05","16:22","19:06","20:33"),
            (29,"jue 19 mar","الخميس",   "05:24","06:52","13:04","16:23","19:07","20:34"),
            (30,"vie 20 mar","الجمعة",   "05:23","06:50","13:04","16:24","19:08","20:35"),
        ],
        "lunar": ("19/03/2026","19h 06m 08s","19h 53m 40s","00h 47m 32s","00d 16h 42m"),
    },
}

# ─────────────────────────────────────────────────────────────────────────────
#  MAPA DÍA ÁRABE → CLAVE DE IMAGEN
# ─────────────────────────────────────────────────────────────────────────────
AR_DIA_KEY = {
    "الخميس":   "khamis",
    "الجمعة":   "jumaa",
    "السبت":    "sabt",
    "الأحد":    "ahad",
    "الاثنين":  "ithnayn",
    "الثلاثاء": "thulatha",
    "الأربعاء": "arbiaa",
}

# Pre-generar todas las imágenes de días
for ar, key in AR_DIA_KEY.items():
    make_ar_img(ar, PIL_FONT_AR_SM, (70, 70, 70, 255), key)

# Pre-generar cabeceras árabes (blancas)
AR_HEADERS = {
    "h_ramadan": "رمضان",
    "h_fecha":   "فبراير/مارس",
    "h_diasem":  "الأسبوع",
    "h_fajr":    "الفجر",
    "h_shuruq":  "الشروق",
    "h_dhuhr":   "الظهر",
    "h_asr":     "العصر",
    "h_maghrib": "المغرب",
    "h_isha":    "العشاء",
}
for key, ar in AR_HEADERS.items():
    make_ar_img(ar, PIL_FONT_AR_MD, (255, 255, 255, 255), key, subdir='hdr')


# ─────────────────────────────────────────────────────────────────────────────
#  FUNCIÓN PRINCIPAL DE GENERACIÓN
# ─────────────────────────────────────────────────────────────────────────────

def generar_pdf(ciudad_key: str, output_path: str):
    m = MEZQUITAS[ciudad_key]
    W, H = A4

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"Horarios Ramadán 1447h — {m['nombre_es']}")
    c.setAuthor(m.get('fundacion') or f"Mezquita de {m['nombre_es']}")
    c.setSubject("Horarios de Salah · Ramadān 1447h · 2025/2026")

    col_pri = m["col_pri"]
    col_sec = m["col_sec"]
    col_acc = m["col_acc"]
    BLANCO      = colors.white
    NEGRO       = colors.black
    GRIS_C      = HexColor("#F4F3EF")
    GRIS_L      = HexColor("#DDD9D0")
    DORADO_BG   = HexColor("#FFFBF0")
    TEXT_DARK   = HexColor("#1A1A1A")
    TEXT_MED    = HexColor("#3A3A3A")
    TEXT_LIGHT  = HexColor("#888888")

    # ══════════════════════════════════════════════════════════════════
    # 1. CABECERA — imagen original del documento de cada mezquita
    # ══════════════════════════════════════════════════════════════════
    HEADER_H = 46 * mm

    # Fondo blanco limpio para la cabecera
    c.setFillColor(BLANCO)
    c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)

    header_img = m.get("header_img")
    if header_img and os.path.exists(header_img):
        pil_h = PILImage.open(header_img)
        iw, ih = pil_h.size
        target_w = W
        target_h = target_w * ih / iw
        c.drawImage(header_img, 0, H - target_h,
                    width=target_w, height=target_h,
                    preserveAspectRatio=True, mask='auto')

    # Barra de acento bajo la cabecera (doble)
    c.setFillColor(col_acc)
    c.rect(0, H - HEADER_H, W, 2.2 * mm, fill=1, stroke=0)
    c.setFillColor(col_pri)
    c.rect(0, H - HEADER_H - 1.8 * mm, W, 1.8 * mm, fill=1, stroke=0)

    # ══════════════════════════════════════════════════════════════════
    # 2. TABLA DE HORARIOS
    # ══════════════════════════════════════════════════════════════════
    # Columnas (izq → dcha): Ram. | Fecha | Día (ar) | Fajr | Šurūq | Ẓuhr | ʿAṣr | Magrib | ʿIšāʾ
    LABELS_ES  = ["Ram.", "Fecha",       "Día",       "Fajr", "Šurūq", "Ẓuhr", "ʿAṣr", "Magrib", "ʿIšāʾ"]
    HDR_AR_KEYS = ["h_ramadan","h_fecha","h_diasem",  "h_fajr","h_shuruq","h_dhuhr","h_asr","h_maghrib","h_isha"]
    COL_W = [13*mm, 24*mm, 21*mm, 15.5*mm, 15.5*mm, 14*mm, 14*mm, 16*mm, 16*mm]
    TABLE_W = sum(COL_W)
    X0 = (W - TABLE_W) / 2
    ROW_H  = 5.6 * mm
    HEAD_H = 12 * mm    # cabecera bilingüe (árabe + español)

    y_table_top = H - HEADER_H - 5 * mm

    # ── Fondo cabecera tabla ──
    c.setFillColor(col_pri)
    c.rect(X0, y_table_top - HEAD_H, TABLE_W, HEAD_H, fill=1, stroke=0)

    # ── Línea separadora interna de cabecera ──
    c.setStrokeColor(HexColor("#FFFFFF33"))
    c.setLineWidth(0.4)
    c.line(X0, y_table_top - HEAD_H * 0.52, X0 + TABLE_W, y_table_top - HEAD_H * 0.52)

    # ── Cabecera: fila árabe (arriba) ──
    AR_HDR_SCALE = 0.42   # escala para imágenes de cabecera
    xc = X0
    for key, cw in zip(HDR_AR_KEYS, COL_W):
        img_path = os.path.join(AR_IMGS_DIR, 'hdr', f'{key}.png')
        pil_img  = PILImage.open(img_path)
        iw, ih   = pil_img.size
        pw, ph   = iw * AR_HDR_SCALE, ih * AR_HDR_SCALE
        # Centrar en la mitad superior de la cabecera
        cx = xc + cw / 2
        cy = y_table_top - HEAD_H * 0.25 - ph / 2
        c.drawImage(img_path, cx - pw / 2, cy, width=pw, height=ph, mask='auto')
        xc += cw

    # ── Cabecera: fila español (abajo, en color acento) ──
    xc = X0
    for label, cw in zip(LABELS_ES, COL_W):
        c.setFont("FreeSansBold", 6.8)
        c.setFillColor(col_acc)
        c.drawCentredString(xc + cw / 2, y_table_top - HEAD_H + 2.2 * mm, label)
        xc += cw

    # Líneas verticales en cabecera
    c.setStrokeColor(HexColor("#FFFFFF22"))
    c.setLineWidth(0.3)
    xc = X0
    for cw in COL_W[:-1]:
        xc += cw
        c.line(xc, y_table_top, xc, y_table_top - HEAD_H)

    # ── Filas de datos ──
    AR_ROW_SCALE = 0.46

    y = y_table_top - HEAD_H

    for idx, fila in enumerate(m["datos"]):
        n, fecha, dia_ar, fajr, shuruq, dhuhr, asr, maghrib, isha = fila
        is_qadr = (n == 27)

        # Fondo de fila
        if is_qadr:
            c.setFillColor(DORADO_BG)
        elif idx % 2 == 0:
            c.setFillColor(GRIS_C)
        else:
            c.setFillColor(BLANCO)
        c.rect(X0, y - ROW_H, TABLE_W, ROW_H, fill=1, stroke=0)

        # Barra lateral dorada en día 27
        if is_qadr:
            c.setFillColor(col_acc)
            c.rect(X0, y - ROW_H, 2.2 * mm, ROW_H, fill=1, stroke=0)

        # Línea divisoria superior (no en primera fila)
        c.setStrokeColor(GRIS_L)
        c.setLineWidth(0.25)
        c.line(X0, y, X0 + TABLE_W, y)

        # Centro vertical de la fila
        cy = y - ROW_H / 2

        # Contenido celda a celda
        xc = X0
        vals = [str(n), fecha, dia_ar, fajr, shuruq, dhuhr, asr, maghrib, isha]

        for vi, (val, cw) in enumerate(zip(vals, COL_W)):
            cx = xc + cw / 2

            if vi == 2:
                # Columna "Día" → imagen árabe
                ar_key  = AR_DIA_KEY.get(val, "ahad")
                img_path = os.path.join(AR_IMGS_DIR, f'{ar_key}.png')
                pil_img  = PILImage.open(img_path)
                iw, ih   = pil_img.size
                pw = min(iw * AR_ROW_SCALE, cw - 2 * mm)
                ph = ih * AR_ROW_SCALE
                c.drawImage(img_path, cx - pw / 2, cy - ph / 2,
                            width=pw, height=ph, mask='auto')
            else:
                # Texto latino
                base_y = cy - 2.7 * mm   # baseline

                if vi == 0:              # Nº Ramadán
                    c.setFont("FreeSansBold", 8.5)
                    c.setFillColor(HexColor("#7B5800") if is_qadr else col_pri)
                elif vi == 1:            # Fecha gregoriana
                    c.setFont("FreeSans", 7.8)
                    c.setFillColor(TEXT_MED)
                elif vi == 4:            # Šurūq (más tenue)
                    c.setFont("FreeSans", 8)
                    c.setFillColor(TEXT_LIGHT)
                elif vi == 7:            # Maghrib — color distintivo
                    c.setFont("FreeSansBold", 8.8)
                    c.setFillColor(col_sec)
                else:                    # Resto de horarios
                    c.setFont("FreeSans", 8.5)
                    c.setFillColor(TEXT_DARK)

                c.drawCentredString(cx, base_y, val)

            xc += cw

        y -= ROW_H

    # Borde exterior tabla
    tabla_total_h = HEAD_H + ROW_H * 30
    c.setStrokeColor(col_pri)
    c.setLineWidth(0.9)
    c.rect(X0, y_table_top - tabla_total_h, TABLE_W, tabla_total_h, fill=0, stroke=1)

    # ══════════════════════════════════════════════════════════════════
    # 3. LEYENDA LAYLAT AL-QADR
    # ══════════════════════════════════════════════════════════════════
    y_ley = y - 2.5 * mm
    c.setFillColor(DORADO_BG)
    c.setStrokeColor(col_acc)
    c.setLineWidth(0.7)
    c.roundRect(X0, y_ley - 5 * mm, TABLE_W, 5 * mm, 2, fill=1, stroke=1)
    c.setFillColor(HexColor("#7B5800"))
    c.setFont("FreeSansBold", 7.5)
    c.drawCentredString(W / 2, y_ley - 3.5 * mm,
                        "★  Día 27 de Ramadān — Laylat al-Qadr  ★")

    # ══════════════════════════════════════════════════════════════════
    # 4. PARÁMETROS LUNARES
    # ══════════════════════════════════════════════════════════════════
    y_lunar = y_ley - 8 * mm
    dia_l, psol, pluna, dif, edad = m["lunar"]

    c.setFillColor(col_pri)
    c.roundRect(X0, y_lunar - 16 * mm, TABLE_W, 16 * mm, 3, fill=1, stroke=0)
    # Franja de acento inferior
    c.setFillColor(col_acc)
    c.roundRect(X0, y_lunar - 16 * mm, TABLE_W, 2.5 * mm, 3, fill=1, stroke=0)

    c.setFillColor(BLANCO)
    c.setFont("FreeSansBold", 8.2)
    c.drawCentredString(W / 2, y_lunar - 5.5 * mm,
                        f"Parámetros lunares en {m['nombre_es']} — final de Ramadān")
    c.setFont("FreeSans", 7)
    c.drawCentredString(W / 2, y_lunar - 9.2 * mm,
        f"Día: {dia_l}   ·   Puesta del Sol: {psol}   ·   Puesta de la Luna: {pluna}")
    c.drawCentredString(W / 2, y_lunar - 12.5 * mm,
        f"Diferencia Luna-Sol: {dif}   ·   Edad lunar: {edad}   ·   Avistamiento: ● ● ○ ○ ○")

    # ══════════════════════════════════════════════════════════════════
    # 5. PIE DE PÁGINA
    # ══════════════════════════════════════════════════════════════════
    y_pie = 4.5 * mm

    # Doble línea decorativa
    c.setStrokeColor(col_acc)
    c.setLineWidth(1.8)
    c.line(15 * mm, y_pie + 14 * mm, W - 15 * mm, y_pie + 14 * mm)
    c.setStrokeColor(col_pri)
    c.setLineWidth(0.6)
    c.line(15 * mm, y_pie + 12.5 * mm, W - 15 * mm, y_pie + 12.5 * mm)

    c.setFont("FreeSans", 6.5)
    c.setFillColor(HexColor("#444444"))
    c.drawCentredString(W / 2, y_pie + 10 * mm, m["geo"])

    if m.get("contacto"):
        c.setFont("FreeSans", 6.5)
        c.setFillColor(HexColor("#333333"))
        c.drawCentredString(W / 2, y_pie + 7 * mm, m["contacto"])

    if m.get("web"):
        c.setFont("FreeSans", 6.5)
        c.setFillColor(col_sec)
        c.drawCentredString(W / 2, y_pie + 4.5 * mm, m["web"])

    c.setFont("FreeSans", 5.8)
    c.setFillColor(HexColor("#AAAAAA"))
    c.drawCentredString(W / 2, y_pie + 1.5 * mm,
        "Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°")

    c.save()
    print(f"✅  {m['nombre_es']:12s}  →  {output_path}")


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs("/mnt/user-data/outputs", exist_ok=True)
    for ciudad in ["granada", "sevilla", "barcelona"]:
        generar_pdf(ciudad, f"/mnt/user-data/outputs/ramadan_1447_{ciudad}.pdf")
    print("\n✨  Los tres PDFs han sido generados correctamente.")
