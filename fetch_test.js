async function test() {
  try {
    const res = await fetch('https://quicky-production.up.railway.app/products');
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('RESPONSE:', text.substring(0, 100));
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}
test();
