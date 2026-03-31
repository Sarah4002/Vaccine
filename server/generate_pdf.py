#!/usr/bin/env python3
import json
import sys

if __name__ == '__main__' and len(sys.argv) >= 3:
    try:
        from generate_pdf_report import generate_pdf as _generate_pdf
        _generate_pdf(json.loads(sys.argv[1]), sys.argv[2])
        print(f"PDF generated: {sys.argv[2]}")
        sys.exit(0)
    except Exception:
        pass
"""
VacciTrack — Remplissage automatique de la carte de vaccination antirabique
Usage: python generate_vaccination_card.py '<json_payload>' output.pdf
"""

import sys
import json
import os
from datetime import datetime, date

# ── ReportLab imports ─────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from pypdf import PdfReader, PdfWriter
import io

# ── Constants ─────────────────────────────────────────────────────────────────
PDF_W = 595.5
PDF_H = 419.25

def fmt_date(d):
    """Format date to DD/MM/YYYY"""
    if not d:
        return ""
    try:
        if isinstance(d, str):
            if 'T' in d:
                d = d.split('T')[0]
            parts = d.split('-')
            if len(parts) == 3:
                return f"{parts[2]}/{parts[1]}/{parts[0]}"
    except:
        pass
    return str(d) if d else ""

def calc_age(date_naissance):
    if not date_naissance:
        return ""
    try:
        if 'T' in date_naissance:
            date_naissance = date_naissance.split('T')[0]
        dob = datetime.strptime(date_naissance, '%Y-%m-%d')
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return str(age)
    except:
        return ""

def draw_filled_circle(c, x, y, r=5):
    """Draw a filled circle (for grade selection)"""
    c.setFillColorRGB(0, 0, 0)
    c.circle(x, y, r, fill=1, stroke=0)

def draw_x_in_circle(c, x, y, r=5):
    """Draw an X mark for checkbox"""
    c.setFillColorRGB(0, 0, 0)
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(1.5)
    c.line(x - r + 1, y - r + 1, x + r - 1, y + r - 1)
    c.line(x + r - 1, y - r + 1, x - r + 1, y + r - 1)

def fill_card(payload: dict) -> bytes:
    """Fill vaccination card PDF and return bytes"""
    patient = payload.get('patient', {})
    vacc    = payload.get('vaccination', {})
    proto   = payload.get('protocoleData', {})
    vtype   = payload.get('type', 'rage')

    # ── Patient info ──────────────────────────────────────────────────────────
    nom_prenom    = f"{patient.get('prenom', '')} {patient.get('nom', '')}".strip()
    age           = calc_age(patient.get('dateNaissance', ''))
    poids         = str(patient.get('poids', ''))
    adresse_parts = [
        patient.get('adressePrecise', ''),
        patient.get('commune', ''),
        patient.get('daira', ''),
        patient.get('wilaya', ''),
    ]
    adresse = ', '.join(p for p in adresse_parts if p)
    if not adresse:
        adresse = patient.get('adresse', '')

    grade           = proto.get('grade', 'Grade II')
    date_exposition = fmt_date(proto.get('dateExposition', vacc.get('dateAdministration', '')))
    medecin         = proto.get('medecin', '')
    observations    = proto.get('observations', '')

    # ERIG data
    erig              = proto.get('erig', False)
    erig_date         = fmt_date(proto.get('erigDate', ''))
    erig_dose_totale  = proto.get('erigQuantiteTotale', '')
    erig_infilt       = proto.get('erigQuantiteIM', '')
    erig_lot          = proto.get('erigLot', '')
    erig_peremption   = fmt_date(proto.get('erigPeremption', ''))

    # VAR data
    var_type    = proto.get('varType', 'tissulaire')
    var_lot     = proto.get('varLot', '')
    var_perem   = fmt_date(proto.get('varPeremption', ''))
    var_date    = fmt_date(vacc.get('dateAdministration', ''))

    # Soins
    soins_locaux = proto.get('soinsLocaux', False)

    # Espece
    espece = proto.get('especeAnimale', '')

    # Terrain (comorbidities)
    terrain = patient.get('maladiesChroniques', '') or patient.get('antecedents', '')

    # Types exposition
    types_expo = proto.get('circonstancesMorsure', '')

    # ── Create overlay PDF ────────────────────────────────────────────────────
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(PDF_W, PDF_H))

    def set_font(size=9, bold=False):
        if bold:
            c.setFont("Helvetica-Bold", size)
        else:
            c.setFont("Helvetica", size)

    def draw_text(x, pdf_y, text, size=9, bold=False, max_width=None):
        """Draw text at PDF coordinates (y from top, converted to RL coords)"""
        rl_y = PDF_H - pdf_y
        set_font(size, bold)
        c.setFillColorRGB(0, 0, 0)
        if max_width and len(text) > 0:
            # Truncate if needed
            while c.stringWidth(text, "Helvetica", size) > max_width and len(text) > 1:
                text = text[:-1]
        c.drawString(x, rl_y, text)

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 1 — Right side: Patient identity + Grade selection
    # ═══════════════════════════════════════════════════════════════════════

    # Nom et prénom (after label at x=386, top=230)
    draw_text(390, 236, nom_prenom, size=9, max_width=175)

    # Age (after "Age :" label ending ~x=331, top=247)
    draw_text(338, 253, age, size=9)

    # Poids (after "Poids :" label ending ~x=453, top=247)
    draw_text(460, 253, poids, size=9)

    # Adresse line 1 (after "Adresse :" label ending ~x=350, top=264)
    draw_text(356, 270, adresse[:65], size=8, max_width=220)

    # Adresse line 2 if long
    if len(adresse) > 65:
        draw_text(313, 283, adresse[65:130], size=8, max_width=270)

    # Date d'exposition (after "Date d'exposition :" label, top=299)
    draw_text(405, 305, date_exposition, size=9, max_width=165)

    # Grade circles — Grade I at ~x=364, Grade II at ~x=448, Grade III at ~x=552, y=334
    grade_x_map = {
        'Grade I':   (371, 334),
        'Grade II':  (455, 334),
        'Grade III': (539, 334),
    }
    if grade in grade_x_map:
        gx, gy = grade_x_map[grade]
        draw_filled_circle(c, gx, PDF_H - gy, r=4)

    # Médecin (left side, top=337)
    draw_text(270, 341, medecin, size=8, max_width=90)

    # Observations (left side, top ~350-380)
    if observations:
        obs_lines = [observations[i:i+50] for i in range(0, min(len(observations), 100), 50)]
        for i, line in enumerate(obs_lines[:2]):
            draw_text(30, 355 + i*11, line, size=7.5, max_width=200)

    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 2 — Left side: Treatment details
    # ═══════════════════════════════════════════════════════════════════════

    # Terrain particulier / comorbidités (top=14, after label)
    if terrain:
        draw_text(135, 20, terrain[:60], size=7.5, max_width=155)

    # Types d'exposition (top ~43)
    # Morsure circle at ~x=123, Griffure at ~x=185, Léchage at ~x=245, y=48
    expo_type = proto.get('circonstancesMorsure', '').lower()
    if 'morsure' in expo_type:
        draw_filled_circle(c, 116, PDF_H - 48, r=4)
    elif 'griffure' in expo_type or 'griff' in expo_type:
        draw_filled_circle(c, 183, PDF_H - 48, r=4)
    elif 'léchage' in expo_type or 'lechage' in expo_type:
        draw_filled_circle(c, 245, PDF_H - 48, r=4)

    # Au niveau de (location, top ~57)
    loc = proto.get('localisationPlaies', '')
    if loc:
        draw_text(93, 62, loc[:50], size=8, max_width=200)

    # Espèce animale — Chien at ~x=38, Chat at ~x=130, Autre at ~x=200, y=82
    espece_map = {
        'chien': (30, 82),
        'chat':  (119, 82),
        'autre': (187, 82),
    }
    if espece.lower() in espece_map:
        ex, ey = espece_map[espece.lower()]
        draw_filled_circle(c, ex, PDF_H - ey, r=4)

    if espece.lower() == 'autre' and proto.get('especeAnimalePrecise'):
        draw_text(218, 82, proto['especeAnimalePrecise'][:18], size=8, max_width=80)

    # Soins locaux — Oui circle at ~x=114, Non at ~x=155, y=136
    if soins_locaux:
        draw_filled_circle(c, 113, PDF_H - 136, r=4)
    else:
        draw_filled_circle(c, 155, PDF_H - 136, r=4)

    # Sérum (ERIG) — label ends ~x=67, Oui circle ~x=107, Non ~x=170, y=155
    if erig:
        draw_filled_circle(c, 108, PDF_H - 155, r=4)
        # Date ERIG administration (top=167)
        draw_text(130, 173, erig_date, size=8.5, max_width=170)
        # Dose totale (top=182)
        draw_text(145, 188, erig_dose_totale + (' ml' if erig_dose_totale else ''), size=8.5, max_width=135)
        # Voie infiltré (top=196)
        infiltre = proto.get('erigQuantiteIM', '')
        draw_text(140, 202, infiltre, size=8.5, max_width=50)
        # en IM
        draw_text(155, 212, '', size=8.5)
        # Lot ERIG (top=224)
        draw_text(80, 230, erig_lot, size=8.5, max_width=210)
        # Date péremption ERIG (top=241)
        draw_text(133, 247, erig_peremption, size=8.5, max_width=150)
    else:
        draw_filled_circle(c, 170, PDF_H - 155, r=4)

    # Vaccin antirabique type — Cellulaire at ~x=190, Tissulaire at ~x=245, y=265
    if var_type == 'cellulaire':
        draw_filled_circle(c, 185, PDF_H - 265, r=4)
    else:
        draw_filled_circle(c, 245, PDF_H - 265, r=4)

    # Date administration vaccin (top=278)
    draw_text(130, 284, var_date, size=8.5, max_width=170)

    # Lot N° vaccin (top=292)
    draw_text(80, 298, var_lot, size=8.5, max_width=210)

    # Date péremption vaccin (top=308)
    draw_text(133, 314, var_perem, size=8.5, max_width=150)

    # Vaccin antitétanique - Non by default (top=333 area)
    # Circles at ~x=182 (Oui) and ~x=228 (Non), y=348
    draw_filled_circle(c, 228, PDF_H - 348, r=4)

    # Antibiotique - Non by default (top~375)
    draw_filled_circle(c, 228, PDF_H - 388, r=4)

    c.save()
    packet.seek(0)

    # ── Merge overlay with original ───────────────────────────────────────────
    original = PdfReader(open('/mnt/user-data/uploads/carte_de_vaccination_z.pdf', 'rb'))
    overlay  = PdfReader(packet)
    writer   = PdfWriter()

    for i, orig_page in enumerate(original.pages):
        if i < len(overlay.pages):
            orig_page.merge_page(overlay.pages[i])
        writer.add_page(orig_page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_vaccination_card.py '<json>' output.pdf", file=sys.stderr)
        sys.exit(1)

    payload_str = sys.argv[1]
    output_path = sys.argv[2]

    try:
        payload = json.loads(payload_str)
    except json.JSONDecodeError as e:
        print(f"JSON error: {e}", file=sys.stderr)
        sys.exit(1)

    pdf_bytes = fill_card(payload)

    with open(output_path, 'wb') as f:
        f.write(pdf_bytes)

    print(f"PDF generated: {output_path} ({len(pdf_bytes)} bytes)")
