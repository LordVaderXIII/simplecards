import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaPlay, FaPause, FaStop, FaUndo, FaDice } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';

const DynamicIcon = ({ name, size = 64 }) => {
  const pascalName = name.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
  const IconComponent = FaIcons[pascalName] || FaIcons[pascalName.replace(/^Fa/, '')] || FaIcons.FaQuestion;
  return <IconComponent size={size} />;
};

const Card = ({ data }) => {
  const [timerState, setTimerState] = useState('idle'); // idle, running, paused, finished
  const [timeLeft, setTimeLeft] = useState(null);
  const [initialTime, setInitialTime] = useState(null);
  const [diceResult, setDiceResult] = useState(null);

  useEffect(() => {
    setTimerState('idle');
    setTimeLeft(null);
    setInitialTime(null);
    setDiceResult(null);
  }, [data]);

  useEffect(() => {
    let interval = null;
    if (timerState === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerState === 'running') {
      setTimerState('finished');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerState, timeLeft]);

  const initTimer = (e) => {
    e.stopPropagation();
    if (!data.action_value) return;
    const duration = parseInt(data.action_value.split(',')[0], 10);
    setInitialTime(duration);
    setTimeLeft(duration);
    setTimerState('running');
  };

  const toggleTimer = (e) => {
      e.stopPropagation();
      if (timerState === 'running') {
          setTimerState('paused');
      } else if (timerState === 'paused') {
          setTimerState('running');
      }
  };

  const stopTimer = (e) => {
      e.stopPropagation();
      setTimerState('idle');
      setTimeLeft(null);
  };

  const resetTimer = (e) => {
      e.stopPropagation();
      setTimeLeft(initialTime);
      setTimerState('paused');
  };

  const rollDice = (e) => {
    e.stopPropagation();
    if (!data.action_value) return;
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
            {timerState === 'idle' ? (
               <button className="btn-action" onClick={initTimer}>
                 <FaPlay /> Start Timer ({parseInt(data.action_value.split(',')[0])}s)
               </button>
            ) : (
                <div className="timer-container">
                 <div className="timer-display">
                    {timeLeft !== null ? (
                        `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                    ) : "0:00"}
                 </div>
                 <div className="timer-controls">
                    {timerState === 'running' && (
                        <button className="btn-icon" onClick={toggleTimer} title="Pause" aria-label="Pause Timer"><FaPause size={20} color="white" /></button>
                    )}
                    {timerState === 'paused' && (
                        <button className="btn-icon" onClick={toggleTimer} title="Resume" aria-label="Resume Timer"><FaPlay size={20} color="white" /></button>
                    )}
                    {timerState === 'finished' && (
                         <span style={{color: 'red', fontWeight: 'bold', display: 'flex', alignItems: 'center'}}>Done!</span>
                    )}

                    <button className="btn-icon" onClick={resetTimer} title="Reset" aria-label="Reset Timer"><FaUndo size={20} color="white" /></button>
                    <button className="btn-icon" onClick={stopTimer} title="Stop" aria-label="Stop Timer"><FaStop size={20} color="white" /></button>
                 </div>
               </div>
            )}
          </div>
        )}

        {(data.action_type === 'dice' || data.action_type === 'both') && (
          <div className="action-item" style={data.action_type === 'both' ? {marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px'} : {}}>
            {diceResult === null ? (
               <button className="btn-action" onClick={rollDice}>
                 <FaDice /> Roll Dice
               </button>
            ) : (
               <div className="dice-result">
                 <span className="dice-value">Result: {diceResult}</span>
                 <button className="btn-action" onClick={rollDice}><FaDice /> Roll Again</button>
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
