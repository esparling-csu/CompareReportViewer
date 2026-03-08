// filename: static/ps_funclib.js
function psGetReportName(){
    try { return window.PS_REPORT_NAME || window.top.PS_REPORT_NAME || ""; }
    catch(e){ return ""; }
}

// The original code often passed file names or responseXML objects.
// We keep those signatures but convert to file paths for server transform.
function getFileDoc(obj) { return obj; }
function getXslDoc(obj) { return obj; }

function psTransformOnServer(xslFile, xmlFile, param, param2){
    var report = psGetReportName();
    if(!report) throw new Error("PS_REPORT_NAME not set");
    var url = "/api/transform?report="+encodeURIComponent(report)
            +"&xsl="+encodeURIComponent(xslFile)
            +"&xml="+encodeURIComponent(xmlFile)
            +"&param="+encodeURIComponent(param||"")
            +"&param2="+encodeURIComponent(param2||"");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false); // sync to preserve old behavior
    xhr.send(null);
    if(xhr.status !== 200) throw new Error("transform failed: "+xhr.status+" "+xhr.responseText);
    return xhr.responseText;
}

function psHtmlToFragment(html){
    var t = document.createElement("template");
    t.innerHTML = html;
    return t.content;
}

function getResultChrome2(xsl, xml, param, param2){
    var html = psTransformOnServer(xsl, xml, param, param2);
    return psHtmlToFragment(html);
}
function getResultNetscape2(xsl, xml, param, param2){ return getResultChrome2(xsl, xml, param, param2); }
function getResultIE(xsl, xml, param){ return psTransformOnServer(xsl, xml, param, ""); }

// Add other helpers (getArgs, replaceAll, etc.) here as needed
