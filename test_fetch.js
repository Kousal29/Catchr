const fs = require('fs');

async function testApi() {
  try {
    const res = await fetch("https://bmtcmobileapi.karnataka.gov.in/WebAPI/SearchByRouteDetails_v4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "lan": "en",
        "deviceType": "WEB"
      },
      body: JSON.stringify({ routeid: 1695, servicetypeid: 0 })
    });
    const data = await res.json();
    fs.writeFileSync('bmtc_res.json', JSON.stringify(data, null, 2));
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}

testApi();
