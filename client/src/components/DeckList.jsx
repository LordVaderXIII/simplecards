import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';

const DeckList = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const res = await fetch('/api/decks');
      if (res.ok) {
        const data = await res.json();
        setDecks(data);
      }
    } catch (err) {
      console.error('Failed to fetch decks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        // Refresh list
        fetchDecks();
        alert('Deck uploaded successfully!');
      } else {
        const err = await res.json();
        alert('Upload failed: ' + err.error);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, deckName) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete deck "${deckName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/deck/${deckName}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDecks();
      } else {
        const err = await res.json();
        alert('Failed to delete deck: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting deck:', err);
      alert('Error deleting deck');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="title">Decks</div>
        <label className="btn-primary">
          <FaPlus style={{ marginRight: '5px' }} /> Upload CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : decks.length === 0 ? (
        <div className="empty-state">No decks found. Upload a CSV to get started.</div>
      ) : (
        <div className="deck-list">
          {decks.map((deck) => (
            <Link key={deck.name} to={`/deck/${deck.name}`} className="deck-item">
              <span>{deck.name}</span>
              <button
                className="btn-delete"
                onClick={(e) => handleDelete(e, deck.name)}
                title="Delete Deck"
                aria-label={`Delete deck ${deck.name}`}
              >
                <FaTrash />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckList;
