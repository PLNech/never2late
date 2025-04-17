/**
 * Server for the flower installation
 */
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Like a lotus opening at dawn, server blooms on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
