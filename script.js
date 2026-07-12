let contadorItems = 0;
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

function obtenerBanda(lat) {
    const bandas = 'CDEFGHJKLMNPQRSTUVWXX';
    return bandas.charAt(Math.floor((lat + 80) / 8)) || 'N/A';
}

function decimalToDMS(dec, isLat) {
    const dir = isLat ? (dec < 0 ? 'S' : 'N') : (dec < 0 ? 'W' : 'E');
    dec = Math.abs(dec);
    const d = Math.floor(dec);
    const m = Math.floor((dec - d) * 60);
    const s = ((dec - d - m/60) * 3600).toFixed(3);
    return `${d}º ${m}' ${s}" ${dir}`;
}

// Función robusta para interpretar números con separadores de miles o decimales invertidos
function parseCoordenada(val) {
    if (!val) return NaN;
    // Si contiene coma y punto (ej. 803,457.14), elimina la coma de miles
    if (val.includes(',') && val.includes('.')) {
        return parseFloat(val.replace(/,/g, ''));
    }
    // Si solo tiene coma (ej. 803457,14), asume que es el decimal español y lo cambia a punto
    if (val.includes(',') && !val.includes('.')) {
        return parseFloat(val.replace(',', '.'));
    }
    // Formato estándar
    return parseFloat(val);
}

function procesarDecimales() {
    const txt = document.getElementById('inputDecimal').value.trim();
    if (txt) ejecutarConversion(txt, 'DECIMAL');
    document.getElementById('inputDecimal').value = '';
}

function procesarUTM() {
    const txt = document.getElementById('inputUTM').value.trim();
    const hemisferio = document.getElementById('hemisferioUTM').value;
    if (txt) ejecutarConversion(txt, 'UTM', hemisferio);
    document.getElementById('inputUTM').value = '';
}

function ejecutarConversion(texto, tipo, hemisferio = 'N') {
    const rows = texto.split('\n');
    const tbody = document.querySelector('#resultTable tbody');

    rows.forEach(row => {
        if (!row.trim()) return;

        let lat, lon, x, y, zona;
        let esValido = true;

        if (tipo === 'DECIMAL') {
            const cols = row.split(/\s+/).filter(c => c !== "");
            if (cols.length >= 2) {
                lat = parseCoordenada(cols[0]);
                lon = parseCoordenada(cols[1]);
                
                if (isNaN(lat) || isNaN(lon)) {
                    esValido = false;
                } else {
                    zona = Math.floor((lon + 180) / 6) + 1;
                    const sufijoSur = lat < 0 ? " +south" : "";
                    const utmP = `+proj=utm +zone=${zona}${sufijoSur} +datum=WGS84 +units=m +no_defs`;
                    [x, y] = proj4(wgs84, utmP, [lon, lat]);
                }
            } else {
                esValido = false;
            }
        } else {
            // Limpieza estricta: Elimina caracteres residuales de Excel como "-¤"
            let filaLimpia = row.replace(/[-¤]/g, ' ');
            const cols = filaLimpia.split(/\s+/).filter(c => c !== "");
            
            if (cols.length >= 2) {
                x = parseCoordenada(cols[0]);
                y = parseCoordenada(cols[1]);
                
                zona = cols[2] ? parseInt(cols[2]) : 18; 
                
                if (isNaN(x) || isNaN(y) || isNaN(zona)) {
                    esValido = false;
                } else {
                    const sufijoSur = hemisferio === 'S' ? " +south" : "";
                    const utmP = `+proj=utm +zone=${zona}${sufijoSur} +datum=WGS84 +units=m +no_defs`;
                    [lon, lat] = proj4(utmP, wgs84, [x, y]);
                }
            } else {
                esValido = false;
            }
        }
        
        if (esValido && !isNaN(lat) && !isNaN(lon)) {
            contadorItems++;
            const b = obtenerBanda(lat);
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${contadorItems}</td>
                <td>${lat.toFixed(8)}</td>
                <td>${lon.toFixed(8)}</td>
                <td>${x.toFixed(3)}</td>
                <td>${y.toFixed(3)}</td>
                <td>${zona}</td>
                <td>${b}</td>
                <td>${decimalToDMS(lat, true)}</td>
                <td>${decimalToDMS(lon, false)}</td>
                <td>${zona}${b} ${Math.round(x)} ${Math.round(y)}</td>
            `;
            tbody.appendChild(tr);
        }
    });
}

function copiarDecimales() {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => t += `${r.cells[1].innerText}\t${r.cells[2].innerText}\n`);
    if (t) navigator.clipboard.writeText(t).then(() => alert("Decimales copiados al portapapeles"));
}

function copiarUTM(fmt) {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => {
        t += fmt === 'XY' ? `${r.cells[3].innerText}\t${r.cells[4].innerText}\n` : 
                           `${r.cells[3].innerText}\t${r.cells[4].innerText}\t${r.cells[5].innerText}\n`;
    });
    if (t) navigator.clipboard.writeText(t).then(() => alert("Coordenadas UTM copiadas al portapapeles"));
}

function limpiarTabla() { 
    document.querySelector('#resultTable tbody').innerHTML = ''; 
    contadorItems = 0; 
}
