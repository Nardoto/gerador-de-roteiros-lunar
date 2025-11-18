const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = 3000;

// Importar handlers das APIs
const loginHandler = require('./api/login');
const gerarHandler = require('./api/gerar');
const gerarTakesHandler = require('./api/gerar-takes');
const gerarTrilhaHandler = require('./api/gerar-trilha');
const gerarPersonagensHandler = require('./api/gerar-personagens');
const verifyTokenHandler = require('./api/verify-token');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// Criar mock req/res para as APIs
function createMockRequest(req, body) {
    return {
        method: req.method,
        headers: req.headers,
        body: body,
        url: req.url,
    };
}

function createMockResponse(res) {
    return {
        statusCode: 200,
        headers: {},
        setHeader(key, value) {
            this.headers[key] = value;
        },
        writeHead(statusCode, headers = {}) {
            this.statusCode = statusCode;
            Object.assign(this.headers, headers);
            res.writeHead(statusCode, headers);
        },
        write(chunk) {
            res.write(chunk);
        },
        end(chunk) {
            if (chunk) res.write(chunk);
            res.end();
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.setHeader('Content-Type', 'application/json');
            res.writeHead(this.statusCode, this.headers);
            res.end(JSON.stringify(data));
        },
    };
}

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Rotas de API
    if (req.url.startsWith('/api/')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const parsedBody = body ? JSON.parse(body) : {};
                const mockReq = createMockRequest(req, parsedBody);
                const mockRes = createMockResponse(res);

                // Roteamento
                if (req.url === '/api/login') {
                    await loginHandler(mockReq, mockRes);
                } else if (req.url === '/api/verify-token') {
                    await verifyTokenHandler(mockReq, mockRes);
                } else if (req.url === '/api/gerar') {
                    await gerarHandler(mockReq, mockRes);
                } else if (req.url === '/api/gerar-takes') {
                    await gerarTakesHandler(mockReq, mockRes);
                } else if (req.url === '/api/gerar-trilha') {
                    await gerarTrilhaHandler(mockReq, mockRes);
                } else if (req.url === '/api/gerar-personagens') {
                    await gerarPersonagensHandler(mockReq, mockRes);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API route not found' }));
                }
            } catch (error) {
                console.error('API Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // Servir arquivos estáticos
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './public/login.html';
    } else if (filePath === './index.html') {
        filePath = './public/index.html';
    } else if (filePath === './login.html') {
        filePath = './public/login.html';
    } else if (!filePath.startsWith('./public/')) {
        filePath = './public' + req.url;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📝 Acesse no navegador para testar o gerador\n`);
});
