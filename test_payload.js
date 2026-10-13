const fetch = require('node-fetch') || globalThis.fetch;

async function testPayload(payload) {
  try {
    const res = await fetch('https://bmtcmobileapi.karnataka.gov.in/WebAPI/SearchByRouteDetails_v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://nammabmtcapp.karnataka.gov.in',
        'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`\nPayload:`, payload);
    console.log(`Status:`, res.status);
    console.log(`Response:`, text.substring(0, 200));
  } catch (e) {
    console.error("Error for payload", payload, e.message);
  }
}

async function run() {
  await testPayload({ routeno: "500" });
  await testPayload({ routeid: "500" });
  await testPayload({ searchstring: "500" });
  await testPayload({ keyword: "500" });
  await testPayload({ RouteNo: "500" });
}
run();
