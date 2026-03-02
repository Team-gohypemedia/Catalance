import http from 'http';
import https from 'https';

const localUrl = 'http://localhost:5000/api';
const prodUrl = 'https://catalance-backend.vercel.app/api';

const pms = [
    { email: 'manager@example.com', password: 'password123' },
    { email: 'rishav@catalance.com', password: 'password123' }
];

async function doPost(urlStr, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const reqFn = url.protocol === 'https:' ? https.request : http.request;
        const reqData = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqData)
            }
        };
        const req = reqFn(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data: JSON.parse(body || "{}") });
            });
        });
        req.on('error', reject);
        req.write(reqData);
        req.end();
    });
}

async function doGet(urlStr, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const reqFn = url.protocol === 'https:' ? https.request : http.request;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req = reqFn(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(body); } catch (e) { parsed = { error: "Failed to parse json" }; }
                resolve({ status: res.statusCode, data: parsed.data });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testApi(baseUrl, envName) {
    console.log(`\n--- Testing ${envName} (${baseUrl}) ---`);
    for (const pm of pms) {
        console.log(`\nLogging in as ${pm.email}...`);
        const loginRes = await doPost(`${baseUrl}/auth/login`, pm);

        if (loginRes.status !== 200) {
            console.log(`Failed to login ${pm.email}: ${loginRes.status}`);
            continue;
        }

        const token = loginRes.data.data?.token || loginRes.data.token;
        if (!token) {
            console.log(`No token retrieved for ${pm.email}`);
            continue;
        }

        // Test Projects
        const projRes = await doGet(`${baseUrl}/projects`, token);
        console.log(`GET /projects -> Status: ${projRes.status}, Count: ${projRes.data?.length}`);
        if (projRes.data?.length > 0) {
            console.log(`   Sample Project IDs: ${projRes.data.slice(0, 2).map(p => p.id).join(', ')}`);
        }

        // Test Disputes
        const dispRes = await doGet(`${baseUrl}/disputes`, token);
        console.log(`GET /disputes -> Status: ${dispRes.status}, Count: ${dispRes.data?.length}`);
        if (dispRes.data?.length > 0) {
            console.log(`   Sample Dispute IDs: ${dispRes.data.slice(0, 2).map(d => d.id).join(', ')}`);
        }

        // Test Chat Conversations
        const chatRes = await doGet(`${baseUrl}/chat/conversations`, token);
        console.log(`GET /chat/conversations -> Status: ${chatRes.status}, Count: ${chatRes.data?.length}`);
        if (chatRes.data?.length > 0) {
            console.log(`   Sample Chat IDs: ${chatRes.data.slice(0, 2).map(c => c.id).join(', ')}`);
        }
    }
}

async function main() {
    await testApi(localUrl, 'LOCAL');
    await testApi(prodUrl, 'PRODUCTION');
}

main().catch(console.error);
