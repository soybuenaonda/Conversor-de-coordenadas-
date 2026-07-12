let contadorItems = 0;
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

// Determina la banda de latitud UTM (C a X)
function obtenerBanda(lat) {
    const bandas = 'CDEFGHJKLMNPQRSTUVWXX';
    return bandas.charAt(Math.floor((lat + 80) / 8)) || 'N/A';
}

// Convierte grados decimales a formato Grados, Minutos y Segundos (DMS)
function decimalToDMS(dec, isLat) {
    const dir = isLat ? (dec < 0 ? 'S' : 'N') : (dec < 0 ? 'W' : 'E');
    dec = Math.abs(dec);
    const d = Math.floor(dec);
    const m = Math.floor((dec - d) * 60);
    const s = ((dec - d - m/60) * 3600).toFixed(3);
    return `${d}º ${m}' ${s}" ${dir}`;
}

// Disparador desde el área de texto Decimal
function procesarDecimales() {
    const txt = document.getElementById('inputDecimal').value.trim();
    if (txt) ejecutarConversion(txt, 'DECIMAL');
    document.getElementById('inputDecimal').value = '';
}

// Disparador desde el área de texto UTM
function procesarUTM() {
    const txt = document.getElementById('inputUTM').value.trim();
    const hemisferio = document.getElementById('hemisferioUTM').value;
    if (txt) ejecutarConversion(txt, 'UTM', hemisferio);
    document.getElementById('inputUTM').value = '';
}

// Función principal de procesamiento y conversión
function ejecutarConversion(texto, tipo, hemisferio = 'N') {
    const rows = texto.split('\n');
    const tbody = document.querySelector('#resultTable tbody');

    rows.forEach(row => {
        if (!row.trim()) return;

        let lat, lon, x, y, zona;
        let esValido = true;

        if (tipo === 'DECIMAL') {
            // Reemplaza comas decimales por puntos y limpia espacios extras
            const cols = row.replace(',', '.').split(/\s+/).filter(c => c !== "");
            
            if (cols.length >= 2) {
                lat = parseFloat(cols[0]);
                lon = parseFloat(cols[1]);
                
                if (isNaN(lat) || isNaN(lon)) {
                    esValido = false;
                } else {
                    // Cálculo global automático de la Zona según la longitud
                    zona = Math.floor((lon + 180) / 6) + 1;
                    const sufijoSur = lat < 0 ? " +south" : "";
                    const utmP = `+proj=utm +zone=${zona}${sufijoSur} +datum=WGS84 +units=m +no_defs`;
                    
                    [x, y] = proj4(wgs84, utmP, [lon, lat]);
                }
            } else {
                esValido = false;
            }

        } else {
            // LIMPIEZA AVANZADA: Convierte comas a puntos y pulveriza caracteres ocultos/guiones raros de Excel
            let filaLimpia = row.replace(',', '.').replace(/[-¤]/g, ' ');
            const cols = filaLimpia.split(/\s+/).filter(c => c !== "");
            
            if (cols.length >= 2) {
                x = parseFloat(cols[0]);
                y = parseFloat(cols[1]);
                
                // Si el usuario no provee la zona, por defecto aplica la 18
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
        
        // Inserción estructurada en la tabla si los datos matemáticos son coherentes
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

// Copiar coordenadas en Grados Decimales
function copiarDecimales() {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => t += `${r.cells[1].innerText}\t${r.cells[2].innerText}\n`);
    if (t) navigator.clipboard.writeText(t).then(() => alert("Decimales copiados al portapapeles"));
}

// Copiar coordenadas estructuradas en formato UTM
function copiarUTM(fmt) {
    let t = "";
    document.querySelectorAll('#resultTable tbody tr').forEach(r => {
        t += fmt === 'XY' ? `${r.cells[3].innerText}\t${r.cells[4].innerText}\n` : 
                           `${r.cells[3].innerText}\t${r.cells[4].innerText}\t${r.cells[5].innerText}\n`;
    });
    if (t) navigator.clipboard.writeText(t).then(() => alert("Coordenadas UTM copiadas al portapapeles"));
}

// Resetea por completo los contadores e interfaz de la tabla
function limpiarTabla() { 
    document.querySelector('#resultTable tbody').innerHTML = ''; 
    contadorItems = 0; 
}
