from fpdf import FPDF
from pathlib import Path
import datetime

class PDFReport(FPDF):
    def __init__(self, title="Scan Report"):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        self.alias_nb_pages()
        self.set_title(title)
        self.add_page()
        self._add_title(title)

    def header(self):
        self.set_font("Arial", "I", 8)
        self.set_text_color(120)
        self.cell(0, 8, "SecureNetLite - Confidential", align="R")
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.set_text_color(120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def _add_title(self, title):
        self.set_font("Arial", "B", 20)
        self.set_text_color(0, 102, 204)
        self.cell(0, 12, "SecureNetLite", ln=True, align="C")
        self.set_font("Arial", "B", 15)
        self.set_text_color(0)
        self.cell(0, 10, title, ln=True, align="C")
        self.set_font("Arial", "", 10)
        self.set_text_color(90)
        self.cell(
            0,
            8,
            f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            ln=True,
            align="C"
        )
        self.ln(10)

    def _set_heading(self, heading, risk_level=None):
        color_map = {
            "critical": (127, 29, 29),
            "high": (220, 38, 38),
            "medium": (234, 179, 8),
            "low": (34, 197, 94),
            "info": (59, 130, 246),
            "informational": (59, 130, 246),
        }
        color = (0, 0, 0)
        if risk_level:
            color = color_map.get(risk_level.lower(), (0, 0, 0))
        self.set_text_color(*color)
        self.set_font("Arial", "B", 13)
        self.cell(0, 9, heading, ln=True)
        self.set_draw_color(*color)
        self.set_line_width(0.6)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(6)
        
    def add_key_value_section(self, heading, data: dict, risk_level=None):
        if not data:
            return
        self._set_heading(heading, risk_level)
        self.set_font("Arial", "", 11)
        self.set_text_color(40)
        for key, value in data.items():
            label = key.replace("_", " ").title()
            self.set_font("Arial", "B", 11)
            self.cell(55, 8, f"{label}:", ln=False)
            self.set_font("Arial", "", 11)
            self.multi_cell(0, 8, str(value))
        self.ln(4)

    def add_text_block(self, heading, text: str):
        if not text or not text.strip():
            return
        self._set_heading(heading)
        self.set_font("Courier", "", 9)
        self.set_text_color(50)
        lines = text.splitlines()
        max_lines = 90
        for i in range(0, len(lines), max_lines):
            chunk = "\n".join(lines[i:i + max_lines])
            self.multi_cell(0, 5, chunk)
            if i + max_lines < len(lines):
                self.add_page()
        self.ln(4)
        
    def add_table(self, heading, data: list, columns: list):
        if not data:
            return
        self._set_heading(heading)
        self.set_font("Arial", "B", 11)
        total_width = self.w - self.l_margin - self.r_margin
        col_width = total_width / len(columns)
        for col in columns:
            self.cell(col_width, 8, col.replace("_", " ").title(), border=1, align="C")
        self.ln()
        self.set_font("Arial", "", 10)
        for row in data:
            for col in columns:
                self.cell(col_width, 8, str(row.get(col, "-")), border=1)
            self.ln()

        self.ln(6)
    def output(self, filename):
        reports_dir = Path("reports")
        reports_dir.mkdir(parents=True, exist_ok=True)
        full_path = reports_dir / filename
        super().output(str(full_path))
        print(f"[PDFReport] PDF saved at: {full_path}")
        return str(full_path)
