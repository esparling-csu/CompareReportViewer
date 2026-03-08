// filename: static/ps_definitionstatus.js

function psGetQueryParam(name) {
    var qs = window.location.search || "";
    if (qs.startsWith("?")) qs = qs.substring(1);

    var parts = qs.split("&");
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        var k = decodeURIComponent(kv[0] || "");
        if (k === name) {
            return decodeURIComponent(kv.slice(1).join("=") || "");
        }
    }
    return "";
}

function psSetHtml(divId, html) {
    var el = document.getElementById(divId);
    if (el) el.innerHTML = html;
}

function psSetText(divId, text) {
    var el = document.getElementById(divId);
    if (el) el.textContent = text;
}

function psShowReportDetails() {
    var host = document.getElementById("divReportDetailsHost");
    if (host) host.style.display = "block";
}

function psShowDefinitionTypes() {
    // Definition types are always visible in our layout; this is just a no-op hook
    return;
}

function psRenderTopSelected(objtype) {
    var label = objtype ? ("Selected: " + objtype) : "";
    var el = document.getElementById("spanSelectedObjType");
    if (el) el.textContent = label;
}

function psInitDefinitionStatusPage() {
    var objtype = psGetQueryParam("objtype");
    psRenderTopSelected(objtype);

    // Left pane: definition types list (same as landing)
    psSetHtml(
        "divObjtypeList",
        psTransformOnServer("objtypes.xsl", "project.xml", "", "")
    );

    // Report details block: use header.xsl for now (it contains key report fields)
    // If you have a dedicated XSL for details, swap it here.
    psSetHtml(
        "divReportDetails",
        psTransformOnServer("header.xsl", "project.xml", "", "")
    );

    // Right pane: selected definition-type content
    //
    // We will start with defStatus.xsl if present (commonly used by definitionstatus.html).
    // It expects js_param = objtype in the legacy viewer logic.
    //
    // If your report does not include defStatus.xsl, we can switch to items.xsl logic next.
    try {
        psSetHtml(
            "divDefinitionTypeBody",
            psTransformOnServer("defStatus.xsl", "project.xml", objtype, "")
        );
    } catch (e) {
        // Fallback: show a helpful message inside the pane.
        var msg = ""
            + "<div style='padding:6px;'>"
            + "No definition-status transform available yet for: <b>"
            + (objtype || "(missing objtype)")
            + "</b><br><br>"
            + "Error: " + String(e.message || e)
            + "</div>";
        psSetHtml("divDefinitionTypeBody", msg);
    }

    // Show report details by default (you said you want it at the top)
    psShowReportDetails();
}
