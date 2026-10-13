const fetch = require('node-fetch') || globalThis.fetch;

async function test() {
  const res = await fetch('https://bmtcmobileapi.karnataka.gov.in/WebAPI/SearchByRouteDetails_v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://nammabmtcapp.karnataka.gov.in',
      'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    },
    body: JSON.stringify({ routeid: 1695, servicetypeid: 0 })
  });
  const text = await res.text();
  require('fs').writeFileSync('bmtc_res.json', text);
  console.log('Status:', res.status, 'Saved to bmtc_res.json');
}
test();
