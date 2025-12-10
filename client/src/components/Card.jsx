import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaPlay, FaRedo, FaDice } from 'react-icons/fa';
// Dynamic icon loading isn't straightforward with react-icons as it's a build-time tree-shakeable lib.
// We will need a mapping or a way to import.
// For "lightweight", let's import the full set of FA icons or use a dynamic icon component if we can find one,
// OR just support a specific subset as per prompt examples?
// Prompt says "from Font Awesome icons, e.g., 'fa-heart'".
// I'll assume we can use `react-icons/fa` and access them dynamically via an object map or similar.
import * as FaIcons from 'react-icons/fa';

const DynamicIcon = ({ name, size = 64 }) => {
  // Convert kebab-case (fa-heart) to PascalCase (FaHeart)
  const iconName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Check if icon exists in FaIcons, try adding "Fa" prefix if user just passed "heart"
  // The prompt examples are "fa-heart", "fa-star".
  // FaIcons exports are like FaHeart, FaStar.

  // Clean input: "fa-heart" -> "FaHeart"
  const pascalName = name.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());

  const IconComponent = FaIcons[pascalName] || FaIcons[pascalName.replace(/^Fa/, '')] || FaIcons.FaQuestion;

  return <IconComponent size={size} />;
};

const Card = ({ data }) => {
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [diceResult, setDiceResult] = useState(null);

  useEffect(() => {
    // Reset state when card data changes (e.g. drawn from deck)
    setTimer(null);
    setTimeLeft(null);
    setDiceResult(null);
  }, [data]);

  useEffect(() => {
    let interval = null;
    if (timer === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimer('finished');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, timeLeft]);

  const startTimer = () => {
    if (!data.action_value) return;
    const initialTime = parseInt(data.action_value.split(',')[0], 10); // Handle "both" case which might have "60,6"
    setTimeLeft(initialTime);
    setTimer('running');
  };

  const rollDice = () => {
    if (!data.action_value) return;
    // Handle "both": first is timer, second is dice. If just dice, first is dice.
    const values = data.action_value.toString().split(',');
    let sides = 6;
    if (data.action_type === 'both' && values.length > 1) {
        sides = parseInt(values[1], 10);
    } else if (data.action_type === 'dice') {
        sides = parseInt(values[0], 10);
    }

    setDiceResult(Math.floor(Math.random() * sides) + 1);
  };

  return (
    <div className="card-inner">
      <div className="card-title">{data.title}</div>
      <div className="card-body">
        <ReactMarkdown>{data.body}</ReactMarkdown>
      </div>

      <div className="action-container">
        {(data.action_type === 'timer' || data.action_type === 'both') && (
          <div className="action-item">
            {timeLeft === null ? (
               <button className="btn-action" onClick={startTimer}>
                 <FaPlay /> Start Timer ({parseInt(data.action_value.split(',')[0])}s)
               </button>
            ) : (
               <div className="timer-display">
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
            )}
          </div>
        )}

        {(data.action_type === 'dice' || data.action_type === 'both') && (
          <div className="action-item">
            {diceResult === null ? (
               <button className="btn-action" onClick={rollDice}>
                 <FaDice /> Roll Dice
               </button>
            ) : (
               <div className="dice-result">
                 Result: {diceResult}
                 <button className="btn-action" style={{marginLeft: '10px'}} onClick={rollDice}><FaRedo /></button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
export { DynamicIcon };
