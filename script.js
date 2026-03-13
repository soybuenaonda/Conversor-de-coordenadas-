let contadorItems = 0;
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

function obtenerBanda(lat) {
    const bandas = 'CDEFGHJKLMNPQRSTUVWXX';
    return bandas.charAt(Math.floor((lat + 80) / 8)) || 'N/A';
}

function decimalToDMS(dec, isLat) {
    const dir = isLat ? (dec < 0 ? 'S' : 'N') : (dec < 0 ? 'W' : 'E');
    dec = Math.abs(dec);
    const d = Math.floor(dec), m = Math.floor((dec - d) * 60), s = ((dec - d - m/60) * 3600).toFixed(3);
    return `${d}º ${m}' ${s}" ${dir}`;
}

function procesarDecimales() {
    const txt = document.getElementById('inputDecimal').value.trim();
    if (txt) ejecutarConversion(txt, 'DECIMAL');
    document.getElementById('inputDecimal').value = '';
}

function procesarUTM() {
    const txt = document.getElementById('inputUTM').value.trim();
    if (txt) ejecutarConversion(txt, 'UTM');
    document.getElementById('inputUTM').value = '';
}

function ejecutarConversion(texto, tipo) {
    const rows = texto.split('\n');
    const tbody = document.querySelector('#resultTable tbody');

    rows.forEach(row => {
        const cols = row.split(/\s+/).filter(c => c !== "");
        if (cols.length >= 2) {
            let lat, lon, x, y, zona;
            if (tipo === 'DECIMAL') {
                lat = parseFloat(cols[0].replace(',', '.'));
                lon = parseFloat(cols[1].replace(',', '.'));
                zona = Math.floor((lon + 180) / 6) + 1;
                const utmP = `+proj=utm +zone=${zona} ${lat < 0 ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
                [x, y] = proj4(wgs84, utmP, [lon, lat]);
            } else {
                x = parseFloat(cols[0].replace(',', '.'));
                y = parseFloat(cols[1].replace(',', '.'));
                zona = cols[2] ? parseInt(cols[2]) : 19;
                const utmP = `+proj=utm +zone=${zona} ${y > 5000000 ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
                [lon, lat] = proj4(utmP, wgs84, [x, y]);
            }
            if (!isNaN(lat)) {
                contadorItems++;
                const b = obtenerBanda(lat);
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${contadorItems}</td><td>${lat.toFixed(8)}</td><td>${lon.toFixed(8)}</td>
                    <td>${x.toFixed(3)}</td><td>${y.toFixed(3)}</td><td>${zona}</td><td>${b}</td>
                    <td>${decimalToDMS(lat, true)}</td><td>${decimalToDMS(lon, false)}</td>
                    <td>${zona}${b} ${Math.round(x)} ${Math.round(y)}</td>`;
                tbody.appendChild(tr);
            }
        }
    });
}

function copiarDecimales() {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => t += `${r.cells[1].innerText}\t${r.cells[2].innerText}\n`);
    if(t) navigator.clipboard.writeText(t).then(() => alert("Decimales copiados"));
}

function copiarUTM(fmt) {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => {
        t += fmt === 'XY' ? `${r.cells[3].innerText}\t${r.cells[4].innerText}\n` : 
                           `${r.cells[3].innerText}\t${r.cells[4].innerText}\t${r.cells[5].innerText}\n`;
    });
    if(t) navigator.clipboard.writeText(t).then(() => alert("UTM copiados"));
}

function limpiarTabla() { document.querySelector('#resultTable tbody').innerHTML = ''; contadorItems = 0; }