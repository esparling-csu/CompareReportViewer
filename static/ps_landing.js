// filename: static/ps_landing.js

function psSetDiv(divId, html) {
    var el = document.getElementById(divId);
    if (el) el.innerHTML = html;
}

function psInitLandingPage() {

    psSetDiv("divReportHeader",
        psTransformOnServer("header.xsl", "project.xml", "", ""));

    psSetDiv("divStatusSummary",
        psTransformOnServer("status.xsl", "project.xml", "", ""));

    psSetDiv("divObjtypeList",
        psTransformOnServer("objtypes.xsl", "project.xml", "", ""));
}
