const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;
// Use /app/decks if in Docker (common pattern), else local decks folder
const DECKS_DIR = process.env.DECKS_DIR || path.join(__dirname, 'decks');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure decks directory exists
if (!fs.existsSync(DECKS_DIR)) {
  fs.mkdirSync(DECKS_DIR, { recursive: true });
}

// Multer for CSV uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper Functions ---

const getDeckPath = (deckName) => path.join(DECKS_DIR, `${deckName}.json`);
const getStatePath = (deckName) => path.join(DECKS_DIR, `${deckName}_state.json`);

// --- API Endpoints ---

// Upload CSV to create/update decks
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString('utf8'));

  stream
    .pipe(csv())
    .on('data', (data) => {
      // Basic validation: ensure deck_name exists
      if (data.deck_name) {
        results.push(data);
      }
    })
    .on('end', () => {
      if (results.length === 0) {
        return res.status(400).json({ error: 'No valid data found in CSV.' });
      }

      // Group by deck_name
      const decks = {};
      results.forEach((row) => {
        const deckName = row.deck_name.trim();
        if (!decks[deckName]) {
          decks[deckName] = {
            name: deckName,
            cards: [],
            updatedAt: new Date().toISOString()
          };
        }

        decks[deckName].cards.push({
          title: row.title || 'Untitled',
          body: row.body || '',
          action_type: row.action_type || 'none',
          action_value: row.action_value || '',
          back_icon: row.back_icon || 'fa-question'
        });
      });

      // Save each deck to a file
      const savedDecks = [];
      try {
        for (const [name, deckData] of Object.entries(decks)) {
          // Sanitize filename to prevent directory traversal
          const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
          const filePath = getDeckPath(safeName);
          fs.writeFileSync(filePath, JSON.stringify(deckData, null, 2));
          savedDecks.push(safeName);
        }
        res.json({ message: 'Decks processed successfully.', decks: savedDecks });
      } catch (err) {
        console.error('Error saving decks:', err);
        res.status(500).json({ error: 'Failed to save decks.' });
      }
    })
    .on('error', (err) => {
      console.error('CSV Parse Error:', err);
      res.status(500).json({ error: 'Failed to parse CSV.' });
    });
});

// List all decks
app.get('/api/decks', (req, res) => {
  try {
    const files = fs.readdirSync(DECKS_DIR);
    const decks = files
      .filter(file => file.endsWith('.json') && !file.endsWith('_state.json'))
      .map(file => {
        const name = path.basename(file, '.json');
        return { name }; // Could read file to get more metadata if needed
      });
    res.json(decks);
  } catch (err) {
    console.error('Error listing decks:', err);
    res.status(500).json({ error: 'Failed to list decks.' });
  }
});

// Get a specific deck
app.get('/api/deck/:name', (req, res) => {
  const deckName = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = getDeckPath(deckName);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: 'Error reading deck file.' });
    }
  } else {
    res.status(404).json({ error: 'Deck not found.' });
  }
});

// Get deck state
app.get('/api/deck/:name/state', (req, res) => {
  const deckName = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = getStatePath(deckName);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: 'Error reading state file.' });
    }
  } else {
    // Return default empty state if no state file exists
    res.json({});
  }
});

// Save deck state
app.post('/api/deck/:name/state', (req, res) => {
  const deckName = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = getStatePath(deckName);
  const state = req.body;

  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    res.json({ message: 'State saved.' });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).json({ error: 'Failed to save state.' });
  }
});

// Delete a deck
app.delete('/api/deck/:name', (req, res) => {
  const deckName = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = getDeckPath(deckName);
  const statePath = getStatePath(deckName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      return res.status(404).json({ error: 'Deck not found.' });
    }

    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }

    res.json({ message: 'Deck deleted successfully.' });
  } catch (err) {
    console.error('Error deleting deck:', err);
    res.status(500).json({ error: 'Failed to delete deck.' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  const indexFile = path.join(__dirname, 'client/dist/index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('App not built. Please run npm run build.');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
