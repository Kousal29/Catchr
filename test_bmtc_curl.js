const { execSync } = require('child_process');

function curlPost(url, payload) {
  const jsonStr = JSON.stringify(payload).replace(/"/g, '""'); 
  const cmd = `curl.exe -s -X POST "${url}" -H "Content-Type: application/json" -H "lan: en" -H "deviceType: WEB" -d "${jsonStr}"`;
  const stdout = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(stdout);
}

const res = curlPost("https://bmtcmobileapistaging.amnex.com/WebAPI/SearchByRouteDetails_v4", { routeid: 1695, servicetypeid: 0 });
require('fs').writeFileSync('bmtc_res.json', JSON.stringify(res, null, 2));
console.log("Done");
