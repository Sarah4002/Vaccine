#!/usr/bin/env python3
"""
VacciTrack - generation autonome d'une fiche PDF de vaccination.
Usage: python generate_pdf_report.py '<json_payload>' output.pdf
"""

import json
import sys
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def fmt_date(value):
    if not value:
        return ""
    try:
        if isinstance(value, str):
            cleaned = value.split("T")[0]
            dt = datetime.strptime(cleaned, "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
    except Exception:
        pass
    return str(value)


def calc_age(date_naissance):
    if not date_naissance:
        return ""
    try:
        cleaned = str(date_naissance).split("T")[0]
        dob = datetime.strptime(cleaned, "%Y-%m-%d").date()
        today = date.today()
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return str(years)
    except Exception:
        return ""


def yes_no(value):
    return "Oui" if value else "Non"


def as_text(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(str(v) for v in value if v not in (None, ""))
    if isinstance(value, bool):
        return yes_no(value)
    return str(value)


def draw_wrapped_text(pdf, text, x, y, max_width, line_height=5 * mm, font_name="Helvetica", font_size=10):
    pdf.setFont(font_name, font_size)
    words = [w for w in as_text(text).split() if w]
    if not words:
        return y

    line = words[0]
    for word in words[1:]:
        candidate = f"{line} {word}"
        if pdf.stringWidth(candidate, font_name, font_size) <= max_width:
            line = candidate
            continue
        pdf.drawString(x, y, line)
        y -= line_height
        line = word

    pdf.drawString(x, y, line)
    return y - line_height


def label_value(pdf, label, value, x, y, width, value_font="Helvetica", value_size=10):
    pdf.setFillColor(colors.HexColor("#6b7280"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(x, y, label.upper())
    pdf.setFillColor(colors.black)
    return draw_wrapped_text(pdf, value or "-", x, y - 5 * mm, width, font_name=value_font, font_size=value_size)


def build_sections(payload):
    patient = payload.get("patient", {}) or {}
    vacc = payload.get("vaccination", {}) or {}
    proto = payload.get("protocoleData", {}) or {}
    vtype = payload.get("type", "") or vacc.get("type", "")

    patient_name = f"{patient.get('prenom', '')} {patient.get('nom', '')}".strip() or "Patient"
    address_parts = [
        patient.get("adressePrecise"),
        patient.get("adresse"),
        patient.get("commune"),
        patient.get("daira"),
        patient.get("wilaya"),
    ]
    address = ", ".join(part for part in address_parts if part)

    general = [
        ("Patient", patient_name),
        ("Type de vaccin", vacc.get("vaccin") or vtype),
        ("Date d'administration", fmt_date(vacc.get("dateAdministration"))),
        ("Date prochaine dose", fmt_date(vacc.get("dateProchaineDose"))),
        ("Statut", vacc.get("statut")),
        ("Dose", vacc.get("dose")),
    ]

    patient_details = [
        ("Date de naissance", fmt_date(patient.get("dateNaissance"))),
        ("Age", calc_age(patient.get("dateNaissance"))),
        ("Sexe", patient.get("sexe")),
        ("Poids", patient.get("poids")),
        ("Telephone", patient.get("telephone")),
        ("Adresse", address),
        ("Antecedents", patient.get("antecedents")),
        ("Allergies", patient.get("allergies")),
        ("Maladies chroniques", patient.get("maladiesChroniques")),
    ]

    protocole = []
    for key, value in proto.items():
        if key == "mpvi":
            continue
        if value in (None, "", [], {}):
            continue
        protocole.append((key, as_text(value)))

    mpvi = proto.get("mpvi", {}) or {}
    mpvi_details = []
    for key, value in mpvi.items():
        if value in (None, "", [], {}):
            continue
        mpvi_details.append((key, as_text(value)))

    return general, patient_details, protocole, mpvi_details


def generate_pdf(payload, output_path):
    general, patient_details, protocole, mpvi_details = build_sections(payload)
    patient = payload.get("patient", {}) or {}
    patient_name = f"{patient.get('prenom', '')} {patient.get('nom', '')}".strip() or "Patient"

    pdf = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    margin = 18 * mm

    pdf.setTitle(f"Carte vaccinale - {patient_name}")

    y = height - margin
    pdf.setFillColor(colors.HexColor("#0f172a"))
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(margin, y, "Fiche de Vaccination")
    y -= 8 * mm

    pdf.setFillColor(colors.HexColor("#475569"))
    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin, y, "Document genere automatiquement par VacciTrack")
    y -= 10 * mm

    pdf.setStrokeColor(colors.HexColor("#cbd5e1"))
    pdf.line(margin, y, width - margin, y)
    y -= 10 * mm

    sections = [
        ("Resume", general),
        ("Informations patient", patient_details),
        ("Protocole", protocole or [("Details", "Aucune donnee protocolaire renseignee")]),
    ]
    if mpvi_details:
        sections.append(("MPVI", mpvi_details))

    for title, rows in sections:
        pdf.setFillColor(colors.HexColor("#1d4ed8"))
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(margin, y, title)
        y -= 6 * mm

        for label, value in rows:
            next_y = label_value(pdf, label, value, margin, y, width - (2 * margin))
            y = next_y - 2 * mm
            if y < 25 * mm:
                pdf.showPage()
                y = height - margin

        y -= 4 * mm
        if y < 25 * mm:
            pdf.showPage()
            y = height - margin

    pdf.save()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_pdf_report.py '<json>' output.pdf", file=sys.stderr)
        sys.exit(1)

    try:
        payload = json.loads(sys.argv[1])
    except json.JSONDecodeError as exc:
        print(f"JSON error: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        generate_pdf(payload, sys.argv[2])
    except Exception as exc:
        print(f"PDF generation error: {exc}", file=sys.stderr)
        sys.exit(1)
