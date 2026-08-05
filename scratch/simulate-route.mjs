import { GET } from '../app/api/shopping-admin/config/route.js';

console.log("Running GET simulation...");
try {
  const response = await GET();
  console.log("Simulation complete. Response status:", response.status);
} catch (err) {
  console.error("Simulation failed! Caught error:", err);
}
