async function main() {
  try {
    const res = await fetch("https://fashion-puce-gamma.vercel.app/api/stores?nocache=" + Date.now());
    const json = await res.json();
    console.log("JSON Response:");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
