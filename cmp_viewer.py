# filename: app.py

from pathlib import Path
from flask import Flask, render_template, request, abort, Response, send_from_directory
from Utilities.MyLogger import MyLogger
from lxml import etree
from flask import redirect, url_for
from urllib.parse import quote
import html
from urllib.parse import unquote


blog = MyLogger()

app = Flask(__name__)

REPORTS_ROOT = Path(r"C:\\offline\\compare_reports")


# ---------------------------------------------------------
# Helper
# ---------------------------------------------------------

def normalize_report_name(report: str) -> str:
    # Handle cases like:
    #   "Foo&amp;Bar"  -> "Foo&Bar"
    #   "Foo%26Bar"    -> "Foo&Bar"
    # If both happened (HTML-escape then URL-encode), unquote first, then unescape.
    try:
        report = unquote(report)
    except Exception:
        pass
    try:
        report = html.unescape(report)
    except Exception:
        pass
    return report

def safe_report_file(report: str, rel_path: str) -> Path:
    report = normalize_report_name(report)

    base = (REPORTS_ROOT / report).resolve()
    target = (base / rel_path).resolve()

    if base not in target.parents and target != base:
        blog.error(f"Invalid path attempt: {report} / {rel_path}")
        abort(400, "Invalid path")

    if not target.exists():
        blog.error(f"Missing file: {target}")
        abort(404, f"Missing file: {rel_path}")

    return target

# ---------------------------------------------------------
# Index Page (report listing)
# ---------------------------------------------------------

@app.get("/")
def index_page():
    reports = []

    if REPORTS_ROOT.exists():
        for folder in sorted(REPORTS_ROOT.iterdir()):
            if not folder.is_dir():
                continue

            source_date = ""

            project_xml = folder / "project.xml"
            if project_xml.exists():
                try:
                    tree = etree.parse(str(project_xml))
                    root = tree.getroot()

                    date_node = root.find(".//sourcedate")

                    if date_node is not None and date_node.text:
                        source_date = date_node.text.strip()

                except Exception as e:
                    blog.error(f"Failed parsing project.xml for {folder.name}: {e}")

            reports.append({
                "folder": folder.name,
                "label": folder.name,
                "sourcedate": source_date
            })

    blog.info(f"Loaded {len(reports)} reports")

    return render_template("cmp_viewer.html", reports=reports)


# ---------------------------------------------------------
# Report Landing Page
# ---------------------------------------------------------

@app.get("/r/<report>/")
def report_landing(report: str):
    report = normalize_report_name(report)
    report_dir = REPORTS_ROOT / report

    if not report_dir.exists():
        blog.error(f"Report not found: {report}")
        abort(404)

    blog.info(f"Opening report landing (viewarea) for report: {report}")

    # Landing goes straight to viewarea.html with no objtype
    return render_template("viewarea.html", report=report)


# ---------------------------------------------------------
# Serve Report Files (xml, xsl, css, etc.)
# ---------------------------------------------------------

@app.get("/r/<report>/<path:filename>")
def report_files(report: str, filename: str):
    report = normalize_report_name(report)
    base = REPORTS_ROOT / report

    if not base.exists():
        abort(404)

    safe_report_file(report, filename)

    return send_from_directory(base, filename)


# ---------------------------------------------------------
# XSLT Transform Endpoint (used by ps_funclib.js)
# ---------------------------------------------------------

@app.get("/api/transform")
def api_transform():
    report = normalize_report_name(request.args.get("report", ""))
    xsl = request.args.get("xsl", "")
    xml = request.args.get("xml", "")
    param = request.args.get("param", "")
    param2 = request.args.get("param2", "")

    if not report or not xsl or not xml:
        blog.error("Missing required transform parameters")
        abort(400)

    xsl_path = safe_report_file(report, xsl)
    xml_path = safe_report_file(report, xml)

    blog.info(f"Transform: {report} | {xsl} + {xml}")

    xsl_doc = etree.parse(str(xsl_path))
    xml_doc = etree.parse(str(xml_path))

    transform = etree.XSLT(xsl_doc)

    result = transform(
        xml_doc,
        js_param=etree.XSLT.strparam(param),
        js_param2=etree.XSLT.strparam(param2),
    )

    return Response(str(result), mimetype="text/html; charset=utf-8")

# filename: app.py  (add)

@app.get("/api/resolve_objtype_xml")
def api_resolve_objtype_xml():
    report = normalize_report_name(request.args.get("report", ""))
    objtype = request.args.get("objtype", "")

    if not report or not objtype:
        abort(400)

    base = (REPORTS_ROOT / report / objtype)
    if not base.exists():
        blog.error(f"Objtype folder not found: {report} / {objtype}")
        abort(404)

    # Prefer: "<objtype>.xml"
    preferred = base / f"{objtype}.xml"
    if preferred.exists():
        rel = f"{objtype}/{preferred.name}"
        return Response(rel, mimetype="text/plain; charset=utf-8")

    # Otherwise pick the first “main” xml (skip index.xml and cmp_*.xml)
    candidates = sorted([p for p in base.glob("*.xml") if p.is_file()])
    for p in candidates:
        n = p.name.lower()
        if n == "index.xml":
            continue
        if n.startswith("cmp_"):
            continue
        rel = f"{objtype}/{p.name}"
        return Response(rel, mimetype="text/plain; charset=utf-8")

    abort(404)


# Add this to app.py

@app.get("/r/<report>/definitionstatus.html")
def definition_status(report: str):
    report = normalize_report_name(report)
    report_dir = REPORTS_ROOT / report

    if not report_dir.exists():
        blog.error(f"Report not found: {report}")
        abort(404)

    blog.info(f"Opening definitionstatus.html for report: {report}")

    # objtype stays in the querystring; JS will read it
    return render_template("definitionstatus.html", report=report)


# filename: app.py  (add)

@app.get("/r/<report>/viewarea.html")
def viewarea(report: str):
    report = normalize_report_name(report)
    report_dir = REPORTS_ROOT / report
    
    if not report_dir.exists():
        blog.error(f"Report not found: {report}")
        abort(404)

    blog.info(f"Opening viewarea.html for report: {report}")
    return render_template("viewarea.html", report=report)


@app.get("/r/CompareViewer.html/")
def compareviewer_redirect():
    return redirect(url_for("cmp_viewer"))


@app.get("/r/<report>/status.html")
def status_page(report: str):
    report = normalize_report_name(report)
    report_dir = REPORTS_ROOT / report

    if not report_dir.exists():
        abort(404)

    blog.info(f"Opening report_view.html via status.html for {report}")

    return render_template("report_view.html", report=report)

from flask import request, redirect

@app.get("/r/<report>/view_summary.html")
def view_summary_redirect(report: str):
    report = normalize_report_name(report)
    report_dir = REPORTS_ROOT / report
    if not report_dir.exists():
        abort(404)

    objtype = request.args.get("objtype", "") or ""

    # Fix malformed delivered URLs like: objtype=Records?Template=CMTemplate
    objtype = objtype.split("?")[0].split("&")[0].strip()

    if not objtype:
        return redirect(f"/r/{report}/")

    report_enc = quote(report, safe="")
    return redirect(f"/r/{report_enc}/viewarea.html?objtype={objtype}")

# ---------------------------------------------------------
# Run
# ---------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=False, port=5001)
