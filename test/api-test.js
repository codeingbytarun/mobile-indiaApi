const http = require('http');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { estimatePrice } = require('../src/utils/priceEstimator');

const runTests = async () => {
  console.log('🧪 Starting MobiMarket API Automated Test Suite...\n');

  // Start temporary server for testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  };

  const makeRequest = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqHeaders = { ...headers };
      let bodyData = null;

      if (body) {
        bodyData = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(bodyData);
      }

      const req = http.request(
        url,
        {
          method,
          headers: reqHeaders
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, body: json });
            } catch {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );

      req.on('error', reject);
      if (bodyData) req.write(bodyData);
      req.end();
    });
  };

  try {
    // 1. Health Check
    await test('GET /api/v1/health returns 200 with operational status', async () => {
      const res = await makeRequest('/api/v1/health');
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.body.success || res.body.data.status !== 'healthy') {
        throw new Error('Health check payload invalid');
      }
    });

    // 2. Master Catalog Root
    await test('GET /api/v1 returns catalog inventory with 9 modules & 45 endpoints', async () => {
      const res = await makeRequest('/api/v1');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.totalModules !== 9 || res.body.data.totalEndpoints !== 45) {
        throw new Error('Catalog module/endpoint count mismatch');
      }
    });

    // 3. Meta Data Cities
    await test('GET /api/v1/meta/cities returns verified cities including Jaipur', async () => {
      const res = await makeRequest('/api/v1/meta/cities');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const jaipur = res.body.data.find((c) => c.name === 'Jaipur');
      if (!jaipur || !jaipur.localities.includes('Malviya Nagar')) {
        throw new Error('Jaipur localities missing in response');
      }
    });

    // 4. Meta Data Brands
    await test('GET /api/v1/meta/brands returns Apple, Samsung, OnePlus catalogs', async () => {
      const res = await makeRequest('/api/v1/meta/brands');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length < 5) {
        throw new Error('Brands list incomplete');
      }
    });

    // 5. Price Estimator Algorithm
    await test('GET /api/v1/meta/price-estimator computes fair valuation for iPhone 13', async () => {
      const res = await makeRequest(
        '/api/v1/meta/price-estimator?model=iPhone%2013&storage=128GB&condition=Like%20New&batteryHealth=89'
      );
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.averageMarketPrice || !res.body.data.suggestedListPrice) {
        throw new Error('Estimator response missing valuation fields');
      }
    });

    // 6. Auth Send OTP
    let sessionId = '';
    await test('POST /api/v1/auth/send-otp dispatches OTP and returns sessionId', async () => {
      const res = await makeRequest('/api/v1/auth/send-otp', 'POST', {
        phone: '9829012345',
        channel: 'sms'
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.sessionId) throw new Error('sessionId missing from OTP response');
      sessionId = res.body.data.sessionId;
    });

    // 7. Auth Verify OTP & Issue Token
    let buyerToken = '';
    await test('POST /api/v1/auth/verify-otp validates OTP and returns JWT tokens', async () => {
      const res = await makeRequest('/api/v1/auth/verify-otp', 'POST', {
        phone: '9829099887',
        otp: '482910',
        sessionId,
        roleHint: 'buyer',
        name: 'Tarun Baliyan'
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.token || !res.body.data.user) {
        throw new Error('Token or user missing in verify-otp response');
      }
      buyerToken = res.body.data.token;
    });

    // 8. Auth Me with Token
    await test('GET /api/v1/auth/me returns active buyer profile', async () => {
      const res = await makeRequest('/api/v1/auth/me', 'GET', null, {
        Authorization: `Bearer ${buyerToken}`
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.name !== 'Tarun Baliyan') throw new Error('User name mismatch in /auth/me');
    });

    // 9. Shops List
    await test('GET /api/v1/shops lists verified local shops in Jaipur', async () => {
      const res = await makeRequest('/api/v1/shops?city=Jaipur');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Shops list is empty');
      }
    });

    // 10. Shop Profile & Inventory
    await test('GET /api/v1/shops/sharma-telecom returns storefront profile and inventory', async () => {
      const res = await makeRequest('/api/v1/shops/sharma-telecom');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.shop || !Array.isArray(res.body.data.inventory)) {
        throw new Error('Shop profile or inventory missing');
      }
    });

    // 11. Shop QR Code
    await test('GET /api/v1/shops/shop_01/qr generates QR Code Data URL', async () => {
      const res = await makeRequest('/api/v1/shops/shop_01/qr');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.qrCodeDataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid QR code data URL');
      }
    });

    // 12. Phones Browsing & Filtering
    await test('GET /api/v1/phones returns inspected phones with filters', async () => {
      const res = await makeRequest('/api/v1/phones?city=Jaipur&brand=Apple');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Phones response data must be array');
    });

    // 13. Featured Spotlight Phones
    await test('GET /api/v1/phones/featured returns homepage spotlight devices', async () => {
      const res = await makeRequest('/api/v1/phones/featured?city=Jaipur');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Featured phones missing');
      }
    });

    // 14. Compare Phone Models
    await test('GET /api/v1/phones/compare provides side-by-side shop comparison', async () => {
      const res = await makeRequest('/api/v1/phones/compare?model=iPhone%2013&city=Jaipur');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.lowestPrice || !Array.isArray(res.body.data.listings)) {
        throw new Error('Comparison response missing lowestPrice or listings');
      }
    });

    // 15. Lead Generation & WhatsApp Deep Link
    await test('POST /api/v1/leads logs inquiry and generates WhatsApp redirect URL', async () => {
      const res = await makeRequest(
        '/api/v1/leads',
        'POST',
        {
          phoneId: 'ph_01',
          channel: 'whatsapp'
        },
        { Authorization: `Bearer ${buyerToken}` }
      );
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      if (!res.body.data.redirectUrl.includes('wa.me')) {
        throw new Error('WhatsApp deep link missing from lead response');
      }
    });

    // 16. Buyer Cart Operations
    await test('POST /api/v1/buyer/cart adds device and GET fetches cart with savings', async () => {
      const addRes = await makeRequest(
        '/api/v1/buyer/cart',
        'POST',
        { phoneId: 'ph_01' },
        { Authorization: `Bearer ${buyerToken}` }
      );
      if (addRes.status !== 200) throw new Error(`Add to cart failed with status ${addRes.status}`);

      const getRes = await makeRequest('/api/v1/buyer/cart', 'GET', null, {
        Authorization: `Bearer ${buyerToken}`
      });
      if (getRes.status !== 200) throw new Error(`Get cart failed with status ${getRes.status}`);
      if (getRes.body.data.itemsCount < 1 || getRes.body.data.totalSavings <= 0) {
        throw new Error('Cart items or savings calculation invalid');
      }
    });

    // 17. Seller Analytics Dashboard
    const shopkeeperToken = generateToken({
      id: 'usr_101',
      role: 'shopkeeper',
      phone: '9829012345',
      shopId: 'shop_01',
      name: 'Rajesh Sharma'
    });

    await test('GET /api/v1/analytics/dashboard/shop_01 returns KPI metrics', async () => {
      const res = await makeRequest('/api/v1/analytics/dashboard/shop_01', 'GET', null, {
        Authorization: `Bearer ${shopkeeperToken}`
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.activeInventoryCount === undefined || res.body.data.viewsTotal === undefined) {
        throw new Error('KPI metrics missing in dashboard analytics response');
      }
    });

    // 18. 404 Route Not Found Handling
    await test('GET /api/v1/unknown-route returns standard 404 envelope', async () => {
      const res = await makeRequest('/api/v1/unknown-route');
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      if (res.body.success !== false || res.body.error !== 'NOT_FOUND') {
        throw new Error('Standard 404 error envelope missing');
      }
    });

    console.log(`\n==============================================`);
    console.log(`🎉 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==============================================\n`);
  } finally {
    server.close();
  }

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
