const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'logs.json');

// Middleware para registrar la IP y la hora
app.use((req, res, next) => {
    // Si la ruta es la raíz o el index.html, registramos la visita
    if (req.path === '/' || req.path === '/index.html') {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Obtener fecha y hora en zona horaria de Bolivia
        const dateOptions = { 
            timeZone: 'America/La_Paz', 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        const boliviaTime = new Intl.DateTimeFormat('es-BO', dateOptions).format(new Date());

        const logEntry = {
            ip: clientIp,
            date: boliviaTime,
            userAgent: req.headers['user-agent'] || 'Desconocido'
        };

        // Leer el archivo de logs existente
        fs.readFile(LOG_FILE, 'utf8', (err, data) => {
            let logs = [];
            if (!err && data) {
                try {
                    logs = JSON.parse(data);
                } catch (e) {
                    console.error("Error al leer logs.json", e);
                }
            }
            // Agregar el nuevo registro al inicio o final (lo ponemos al final)
            logs.push(logEntry);
            
            // Guardar el archivo
            fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), (err) => {
                if (err) console.error("Error al guardar el log", err);
            });
        });
    }
    next();
});

// Ruta especial para ver los registros
app.get('/logs', (req, res) => {
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
        let logs = [];
        if (!err && data) {
            try {
                logs = JSON.parse(data);
            } catch (e) {}
        }

        // Generar un HTML simple para mostrar los registros
        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Registro de Conexiones</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background-color: #f4f7f6; color: #333; }
                h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #3498db; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                tr:hover { background-color: #f1f1f1; }
                .empty { text-align: center; font-style: italic; color: #777; padding: 20px; }
            </style>
        </head>
        <body>
            <h2>Registro de Accesos - Rosas</h2>
            <table>
                <tr>
                    <th>#</th>
                    <th>Dirección IP</th>
                    <th>Fecha y Hora (Bolivia)</th>
                    <th>Navegador (User Agent)</th>
                </tr>
                ${logs.length === 0 ? '<tr><td colspan="4" class="empty">No hay registros todavía.</td></tr>' : ''}
                ${logs.reverse().map((l, i) => `
                <tr>
                    <td>${logs.length - i}</td>
                    <td>${l.ip}</td>
                    <td>${l.date}</td>
                    <td>${l.userAgent}</td>
                </tr>
                `).join('')}
            </table>
        </body>
        </html>
        `;
        res.send(html);
    });
});

// Servir archivos estáticos (tu index.html, imágenes, música, etc.)
app.use(express.static(path.join(__dirname, '')));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`Servidor iniciado correctamente.`);
    console.log(`Página principal: http://localhost:${PORT}`);
    console.log(`Ver registros:    http://localhost:${PORT}/logs`);
    console.log(`===========================================`);
});
