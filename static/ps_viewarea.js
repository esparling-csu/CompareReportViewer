// filename: static/ps_viewarea.js

function psGetQueryParam(name) {
    var qs = window.location.search || "";
    if (qs.startsWith("?")) qs = qs.substring(1);
    var parts = qs.split("&");
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        var k = decodeURIComponent(kv[0] || "");
        if (k === name) return decodeURIComponent(kv.slice(1).join("=") || "");
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

function psToggleReportDetails() {
    var host = document.getElementById("divReportDetailsHost");
    if (!host) return;
    host.style.display = (host.style.display === "none") ? "block" : "none";
}

function psResolveObjTypeXml(objtype) {
    var report = psGetReportName();
    var url = "/api/resolve_objtype_xml?report=" + encodeURIComponent(report)
            + "&objtype=" + encodeURIComponent(objtype);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);

    if (xhr.status !== 200) {
        throw new Error("resolve_objtype_xml failed: " + xhr.status + " " + xhr.responseText);
    }
    return xhr.responseText;
}

function psInitViewAreaPage() {
    var objtype = psGetQueryParam("objtype");
    psSetText("spanObjTypeLabel", objtype ? ("Selected: " + objtype) : "");

    // Left pane: definition types list
    psSetHtml("divObjtypeList",
        psTransformOnServer("objtypes.xsl", "project.xml", "", ""));

    // Top: report details (we’ll customize later)
    psSetHtml("divReportDetails",
        psTransformOnServer("header.xsl", "project.xml", "", ""));

    // Right pane: items list for selected objtype
    if (!objtype) {
        psSetHtml(
            "divItemsHost",
            "<div style='padding:6px;'>click a definition type.</div>"
        );
        return;
    }        

    // Right pane: items list for selected objtype
    try {
        var xmlRel = psResolveObjTypeXml(objtype);   // e.g. "BIP Data Source Definitions/BIP Data Source Definitions_1.xml"
        psSetHtml("divItemsHost",
            psTransformOnServer("items.xsl", xmlRel, "", ""));
    } catch (e) {
        psSetHtml("divItemsHost",
            "<div style='padding:6px;'>Could not load items for <b>"
            + (objtype || "(missing objtype)")
            + "</b><br><br>Error: " + String(e.message || e) + "</div>");
    }
}

// filename: static/ps_viewarea.js  (add)

function ItemSelect(objtype, itemid) {
    // Common Compare Viewer pattern: details block has id "tbl<itemid>"
    // Example: tblPSOPRDEFN
    var tblId = "tbl" + itemid;
    var el = document.getElementById(tblId);

    // Some reports use a different prefix; try a couple safe fallbacks
    if (!el) el = document.getElementById("row" + itemid);
    if (!el) el = document.getElementById(itemid);

    if (!el) {
        console.log("ItemSelect: details element not found for", objtype, itemid, "tried", tblId);
        return;
    }

    // Toggle display
    var cur = (el.style.display || "");
    el.style.display = (cur === "none") ? "" : "none";
}
