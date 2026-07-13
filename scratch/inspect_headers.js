async function main() {
  try {
    const res = await fetch("https://fashion-puce-gamma.vercel.app/api/stores");
    console.log("Status:", res.status);
    console.log("Headers:");
    for (const [k, v] of res.headers.entries()) {
      console.log(`- ${k}: ${v}`);
    }
  } catch (err) {
    console.error(err);
  }
}
main();
