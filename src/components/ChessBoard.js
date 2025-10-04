import React, { useState } from 'react';
import './ChessBoard.css';

// Initial chess board setup
const initialBoard = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

const ChessBoard = () => {
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');

  const isWhitePiece = (piece) => {
    return ['♙', '♖', '♘', '♗', '♕', '♔'].includes(piece);
  };

  const isBlackPiece = (piece) => {
    return ['♟', '♜', '♞', '♝', '♛', '♚'].includes(piece);
  };

  const getPieceType = (piece) => {
    const pieceMap = {
      '♙': 'pawn', '♟': 'pawn',
      '♖': 'rook', '♜': 'rook',
      '♘': 'knight', '♞': 'knight',
      '♗': 'bishop', '♝': 'bishop',
      '♕': 'queen', '♛': 'queen',
      '♔': 'king', '♚': 'king'
    };
    return pieceMap[piece] || '';
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    const pieceType = getPieceType(piece);
    const targetPiece = board[toRow][toCol];
    const isWhite = isWhitePiece(piece);
    
    // Can't capture own piece
    if ((isWhite && isWhitePiece(targetPiece)) || (!isWhite && isBlackPiece(targetPiece))) {
      return false;
    }

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    switch (pieceType) {
      case 'pawn':
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        // Move forward
        if (colDiff === 0 && rowDiff === direction && !targetPiece) {
          return true;
        }
        // Double move from start
        if (colDiff === 0 && fromRow === startRow && rowDiff === 2 * direction && 
            !targetPiece && !board[fromRow + direction][fromCol]) {
          return true;
        }
        // Capture diagonally
        if (absColDiff === 1 && rowDiff === direction && targetPiece) {
          return true;
        }
        return false;

      case 'rook':
        if (rowDiff === 0 || colDiff === 0) {
          return isPathClear(fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

      case 'bishop':
        if (absRowDiff === absColDiff) {
          return isPathClear(fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'queen':
        if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
          return isPathClear(fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'king':
        return absRowDiff <= 1 && absColDiff <= 1;

      default:
        return false;
    }
  };

  const isPathClear = (fromRow, fromCol, toRow, toCol) => {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) {
        return false;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];
    
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const selectedPiece = board[selectedRow][selectedCol];
      
      // Check if it's the correct turn
      const isWhiteTurn = currentTurn === 'white';
      if ((isWhiteTurn && !isWhitePiece(selectedPiece)) || 
          (!isWhiteTurn && !isBlackPiece(selectedPiece))) {
        setSelectedSquare(null);
        return;
      }

      // Try to move
      if (isValidMove(selectedRow, selectedCol, row, col, selectedPiece)) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = selectedPiece;
        newBoard[selectedRow][selectedCol] = '';
        setBoard(newBoard);
        setSelectedSquare(null);
        setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
      } else if (row === selectedRow && col === selectedCol) {
        // Deselect if clicking same square
        setSelectedSquare(null);
      } else if (piece && ((currentTurn === 'white' && isWhitePiece(piece)) || 
                           (currentTurn === 'black' && isBlackPiece(piece)))) {
        // Select different piece of same color
        setSelectedSquare([row, col]);
      } else {
        setSelectedSquare(null);
      }
    } else if (piece) {
      // Select piece only if it's the correct turn
      if ((currentTurn === 'white' && isWhitePiece(piece)) || 
          (currentTurn === 'black' && isBlackPiece(piece))) {
        setSelectedSquare([row, col]);
      }
    }
  };

  const renderSquare = (row, col) => {
    const piece = board[row][col];
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
    
    return (
      <div
        key={`${row}-${col}`}
        className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && <div className="piece">{piece}</div>}
      </div>
    );
  };

  return (
    <div className="chess-container">
      <h1>Chess Game</h1>
      <div className="turn-indicator">
        Current Turn: <span className={currentTurn}>{currentTurn.toUpperCase()}</span>
      </div>
      <div className="chess-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((_, colIndex) => renderSquare(rowIndex, colIndex))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;
