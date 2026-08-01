import sys, openpyxl
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
out = []
for ws in wb.worksheets:
    out.append(f"=== SHEET: {ws.title}  ({ws.max_row} rows x {ws.max_column} cols) ===")
    for row in ws.iter_rows(values_only=True):
        cells = ["" if c is None else str(c).strip() for c in row]
        if any(cells):
            out.append(" | ".join(cells))
    out.append("")
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
print("written:", sys.argv[2])
