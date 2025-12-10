import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaChevronLeft, FaUndo } from 'react-icons/fa';
import Card, { DynamicIcon } from './Card';

const DeckView = () => {
  const { name } = useParams();
  const [deck, setDeck] = useState(null);
  const [state, setState] = useState({
    shuffledOrder: [], // Array of indices
    drawnCards: [],    // Array of indices
    currentCardIndex: -1 // Index in shuffledOrder
  });
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load deck and state
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deckRes, stateRes] = await Promise.all([
            fetch(`/api/deck/${name}`),
            fetch(`/api/deck/${name}/state`)
        ]);

        if (deckRes.ok) {
            const deckData = await deckRes.json();
            setDeck(deckData);

            if (stateRes.ok) {
                const stateData = await stateRes.json();
                if (stateData && stateData.shuffledOrder && stateData.shuffledOrder.length > 0) {
                   setState(stateData);
                   // If currentCardIndex is valid, show it flipped?
                   // Usually we start face down unless already revealed.
                   // But "virtual table" implies we might want to see what we left off.
                   // For now, let's start face down unless user taps.
                   // Or if we persist "isFlipped" too.
                   // Let's assume on reload we see the back of the NEXT card or the current card if it was the top of the discard pile.
                   // If drawnCards has items, the top one is visible.
                   if (stateData.drawnCards.length > 0) {
                       setIsFlipped(true);
                   }
                } else {
                    // Initialize new state
                    initializeDeck(deckData);
                }
            } else {
                initializeDeck(deckData);
            }
        }
      } catch (err) {
        console.error("Error loading deck:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [name]);

  const initializeDeck = (deckData) => {
    if (!deckData || !deckData.cards) return;
    const indices = deckData.cards.map((_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newState = {
        shuffledOrder: indices,
        drawnCards: [],
        currentCardIndex: -1
    };
    setState(newState);
    saveState(newState);
  };

  const saveState = async (newState) => {
      try {
          await fetch(`/api/deck/${name}/state`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newState)
          });
      } catch (err) {
          console.error("Failed to save state", err);
      }
  };

  const handleDraw = () => {
    if (!deck) return;

    // If not flipped, flip it (reveal current card)
    if (!isFlipped) {
        // Check if we have cards left
        if (state.currentCardIndex < state.shuffledOrder.length - 1) {
            // Move to next card
            const nextIndex = state.currentCardIndex + 1;
            const newDrawn = [...state.drawnCards, state.shuffledOrder[nextIndex]];

            const newState = {
                ...state,
                currentCardIndex: nextIndex,
                drawnCards: newDrawn
            };
            setState(newState);
            saveState(newState);
            setIsFlipped(true);
        } else {
            alert("No more cards!");
        }
    } else {
        // If already flipped, tapping might mean "put away" or "draw next".
        // The prompt says "Tap/swipe to draw/flip a card".
        // Usually: Tap stack -> Draw (flip over).
        // Once drawn, it's visible. Tap again -> Draw next?
        // Let's toggle. If I tap a revealed card, maybe I want to hide it or draw the next one?
        // Let's make it: Tap = Draw Next.
        // Wait, if I want to just flip it back down?
        // Let's stick to simple: Tap deck -> Reveal next card.
        // The "Stack" visualization implies we see the back of the NEXT card if we haven't drawn it?
        // Or we see the face of the CURRENT card.
        // Let's do this:
        // Render: Stack of cards. Top card is either Back (if waiting to draw) or Face (if drawn).
        // If Face is shown, tapping it moves it to discard (visually) or just draws the next one on top.

        // Simpler:
        // Initial: Card Back.
        // Tap: Card Face (New Card).
        // Tap: Card Face (Next Card).
        // ...

        // So effectively, we are always seeing the "Top of the discard pile" or "Top of the draw pile".
        // If we just started, we see Top of Draw Pile (Back).
        // Tap -> Move Top of Draw to Top of Discard (Face).

        if (state.currentCardIndex < state.shuffledOrder.length - 1) {
             const nextIndex = state.currentCardIndex + 1;
            const newDrawn = [...state.drawnCards, state.shuffledOrder[nextIndex]];

            const newState = {
                ...state,
                currentCardIndex: nextIndex,
                drawnCards: newDrawn
            };
            setState(newState);
            saveState(newState);
            setIsFlipped(true); // Ensure we show the face
        } else {
            // End of deck
             alert("Deck is empty. Reshuffling...");
             initializeDeck(deck);
             setIsFlipped(false);
        }
    }
  };

  const handleReset = () => {
      if(window.confirm("Reshuffle deck?")) {
          initializeDeck(deck);
          setIsFlipped(false);
      }
  };

  if (loading || !deck) return <div>Loading...</div>;

  // Determine what to show
  // If currentCardIndex is -1, we haven't drawn any. Show Back.
  // If we have drawn, show the card at currentCardIndex.

  const currentCardId = state.currentCardIndex >= 0 ? state.shuffledOrder[state.currentCardIndex] : null;
  const currentCardData = currentCardId !== null ? deck.cards[currentCardId] : null;

  // Back Icon
  // Usually the back icon is for the *next* card or the deck branding.
  // We can look at the first card for the icon or it should be a deck property?
  // CSV has back_icon per card. Usually a deck has uniform backs.
  // We'll use the back_icon of the *next* card (if available) or the first card as a default.
  // Or just use the first card's back icon for the generic deck back.
  const deckBackIcon = deck.cards[0]?.back_icon || 'fa-question';

  return (
    <div className="container">
      <div className="nav-header">
        <Link to="/" className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', fontSize: '15px'}}>
             <FaChevronLeft /> Back
        </Link>
        <div className="nav-title">{deck.name}</div>
        <button onClick={handleReset} className="btn-primary" style={{padding: '8px', fontSize: '15px'}}>
            <FaUndo />
        </button>
      </div>

      <div className="card-table">
        <div className="card-stack" onClick={handleDraw}>
           <div className={`card ${isFlipped && currentCardData ? 'flipped' : ''}`}>
             {!isFlipped || !currentCardData ? (
               <div className="card-inner card-back">
                 <DynamicIcon name={deckBackIcon} />
                 <div style={{fontSize: '18px', marginTop: '20px'}}>Tap to Draw</div>
                 <div style={{fontSize: '14px', marginTop: '10px', opacity: 0.8}}>
                    {state.shuffledOrder.length - state.drawnCards.length} cards left
                 </div>
               </div>
             ) : (
               <Card data={currentCardData} />
             )}
           </div>
        </div>

        {/* Helper text */}
        <div style={{marginTop: '20px', color: '#888'}}>
            {isFlipped ? "Tap card to draw next" : "Tap to start"}
        </div>
      </div>
    </div>
  );
};

export default DeckView;
