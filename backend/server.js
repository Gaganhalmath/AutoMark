import app from "./src/app.js";

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`SmartAttend Backend running on http://localhost:${PORT}`);
});
