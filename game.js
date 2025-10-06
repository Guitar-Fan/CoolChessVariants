// js/game.js

// The conductor of the orchestra. Manages state, turns, and game rules.

const game = {
    currentPlayer: 'w',
    selectedPiece: null,
    possibleMoves: [],
    quantumSelection: [], // For picking two squares for a superposition move
    isQuantumMove: false,
    
    // Player turn tracking
    whiteTunnelUsed: false,
    blackTunnelUsed: false,

    start() {
        board.drawBoard();
        board.setupPieces();
        this.currentPlayer = 'w';
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.isQuantumMove = false;
        this.quantumSelection = [];
        this.updateStatus();
        this.addEventListeners();
        document.getElementById('tunnel-btn').disabled = false;
        this.whiteTunnelUsed = false;
        this.blackTunnelUsed = false;
    },
    
    addEventListeners() {
        board.element.addEventListener('click', (e) => this.handleSquareClick(e));
        document.getElementById('new-game-btn').addEventListener('click', () => this.start());
        // TODO: Quantum Tunnel logic
    },

    handleSquareClick(event) {
        const square = event.target.closest('.square');
        if (!square) return;

        const squareId = square.dataset.id;
        const pieceOnSquare = this.getPieceAt(squareId);

        if (this.isQuantumMove) {
            this.handleQuantumSelection(squareId);
            return;
        }

        if (this.selectedPiece) {
            // A piece is selected, try to move it
            if (this.possibleMoves.includes(squareId)) {
                this.executeMove(this.selectedPiece, squareId);
            } else {
                // Invalid move or deselecting
                this.clearSelection();
                if (pieceOnSquare && pieceOnSquare.color === this.currentPlayer) {
                    this.selectPiece(pieceOnSquare);
                }
            }
        } else if (pieceOnSquare && pieceOnSquare.color === this.currentPlayer) {
            // No piece is selected, select this one
            this.selectPiece(pieceOnSquare);
        }
    },

    selectPiece(piece) {
        this.clearSelection();
        this.selectedPiece = piece;
        
        let moves;
        // if the piece is in superposition, the only move is to collapse it.
        if (piece.inSuperposition) {
            moves = piece.quantumPositions;
            this.updateStatus("This piece is in superposition. Click one of its positions to collapse it.");
        } else {
            moves = piece.getPossibleMoves(board);
            this.updateStatus("Select a square to move to. You may select two squares for a quantum move.");
        }
        
        this.possibleMoves = moves;
        
        // Highlight the selected piece's square(s) and possible moves
        if (piece.inSuperposition) {
             piece.quantumPositions.forEach(p => board.squares[p].classList.add('selected'));
        } else {
            board.squares[piece.position].classList.add('selected');
        }
       
        this.showMoveIndicators(moves);
    },

    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.isQuantumMove = false;
        this.quantumSelection = [];
        document.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
        document.querySelectorAll('.indicator').forEach(i => i.remove());
    },

    showMoveIndicators(moves) {
        moves.forEach(move => {
            const square = board.squares[move];
            const indicator = document.createElement('div');
            
            if (board.getPiece(move)) {
                indicator.className = 'indicator capture-indicator';
            } else {
                indicator.className = 'indicator move-indicator';
            }
            square.appendChild(indicator);
        });
    },
    
    handleQuantumSelection(squareId) {
        if (!this.possibleMoves.includes(squareId)) {
            this.updateStatus("Invalid quantum move selection. Please pick from the highlighted squares.");
            return;
        }

        // prevent selecting the same square twice
        if (this.quantumSelection.includes(squareId)) return;

        this.quantumSelection.push(squareId);
        board.squares[squareId].classList.add('selected'); // Highlight quantum choices
        
        if (this.quantumSelection.length === 1) {
             this.updateStatus(`First position ${squareId} selected. Choose a second valid move.`);
        } else if (this.quantumSelection.length === 2) {
            this.executeQuantumMove(this.selectedPiece, this.quantumSelection);
        }
    },

    executeMove(piece, targetPos) {
        // This is a "classical" move, or collapsing a quantum state
        const originalPos = piece.position;
        
        // Handle capture
        const capturedPiece = board.getPiece(targetPos);
        if(capturedPiece) {
            delete board.pieces[targetPos];
        }

        // Update piece state
        if (piece.inSuperposition) {
            piece.inSuperposition = false;
            piece.quantumPositions = [];
        } else {
             delete board.pieces[originalPos];
        }
       
        piece.position = targetPos;
        board.pieces[targetPos] = piece;
        
        if (piece.type === 'pawn') piece.hasMoved = true;

        this.finishTurn();
    },
    
    executeQuantumMove(piece, targets) {
        const originalPos = piece.position;
        
        // Can't do a quantum move if it captures on both ends. that's just not how it works.
        if (board.getPiece(targets[0]) && board.getPiece(targets[1])) {
            this.updateStatus("A quantum move cannot capture two pieces at once. Try again.");
            this.clearSelection();
            return;
        }
        
        // remove the piece from its original spot
        delete board.pieces[originalPos];
        
        // put it into superposition
        piece.inSuperposition = true;
        piece.quantumPositions = targets;
        piece.position = null; // A quantum piece has no single position
        
        if (piece.type === 'pawn') piece.hasMoved = true;
        
        this.finishTurn();
    },
    
    finishTurn() {
        this.checkForQuantumCollapse();
        board.renderPieces(); // Full re-render to handle all state changes
        this.currentPlayer = (this.currentPlayer === 'w') ? 'b' : 'w';
        this.clearSelection();
        this.updateStatus();
    },

    // A very important function
    checkForQuantumCollapse() {
        const opponentColor = (this.currentPlayer === 'w') ? 'b' : 'w';
        let allOpponentMoves = [];

        // Gather all possible moves for the opponent
        for (const pos in board.pieces) {
            const p = board.pieces[pos];
            if (p.color === opponentColor && !p.inSuperposition) {
                allOpponentMoves.push(...p.getPossibleMoves(board));
            }
        }
        allOpponentMoves = [...new Set(allOpponentMoves)]; // remove duplicates

        // Now check our pieces in superposition
        for (const pos in board.pieces) {
            const piece = board.pieces[pos];
            if (piece.color === this.currentPlayer && piece.inSuperposition) {
                const [pos1, pos2] = piece.quantumPositions;
                const canAttackPos1 = allOpponentMoves.includes(pos1);
                const canAttackPos2 = allOpponentMoves.includes(pos2);
                
                if (canAttackPos1 && canAttackPos2) {
                    // Piece is observed at both locations... it's captured!
                    // In this variant, we just remove it. A bit brutal.
                    delete board.pieces[pos];
                    // we need a better way to find and delete this piece...
                    // since its position is null. this is a hack.
                    // Let's find it by its quantum positions instead.
                    const piece_to_delete = Object.values(board.pieces).find(p => 
                        p.inSuperposition && p.quantumPositions.includes(pos1)
                    );
                    // This is messy. Refactor later. The issue is we iterate over a changing object.
                    // For now, let's just make it disappear from the game logic.
                    piece_to_delete.color = 'deleted'; // a hack to remove it from play
                } else if (canAttackPos1) {
                    // Collapses to pos2
                    this.collapsePiece(piece, pos2, pos1);
                } else if (canAttackPos2) {
                    // Collapses to pos1
                    this.collapsePiece(piece, pos1, pos2);
                }
            }
        }
        // Cleanup the 'deleted' pieces. Man, this is bad code. But it works.
        const pieceKeys = Object.keys(board.pieces);
        for(const key of pieceKeys) {
            if(board.pieces[key].color === 'deleted') {
                delete board.pieces[key];
            }
        }
    },
    
    collapsePiece(piece, safePos, attackedPos) {
        piece.inSuperposition = false;
        piece.quantumPositions = [];
        piece.position = safePos;
        board.pieces[safePos] = piece;
        // console.log(`A ${piece.type} was observed at ${attackedPos} and collapsed to ${safePos}!`);
    },

    getPieceAt(squareId) {
        // Because of superposition, we can't just check board.pieces[squareId]
        // We have to check all quantum pieces as well.
        const classicalPiece = board.getPiece(squareId);
        if (classicalPiece) return classicalPiece;

        for (const key in board.pieces) {
            const piece = board.pieces[key];
            if (piece.inSuperposition && piece.quantumPositions.includes(squareId)) {
                return piece;
            }
        }
        return null;
    },

    updateStatus() {
        const turnText = this.currentPlayer === 'w' ? "White's Turn" : "Black's Turn";
        document.getElementById('turn-indicator').innerText = turnText;
        document.getElementById('game-status').innerText = "Select a piece to move.";
    }
};