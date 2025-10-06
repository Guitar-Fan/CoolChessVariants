// js/game.js

// The conductor of the orchestra. Manages state, turns, and game rules.

const game = {
    currentPlayer: 'w',
    selectedPiece: null,
    possibleMoves: [],
    quantumSelection: [], // For picking two squares for a superposition move
    isQuantumMove: false,
    tunnelMode: false,
    
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
        this.tunnelMode = false;
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
                // Check if user wants to make a quantum move (right-click or double-click behavior)
                // For now, we'll use a simple heuristic: if more moves are available, offer quantum option
                if (!this.selectedPiece.inSuperposition && this.possibleMoves.length > 1 && !pieceOnSquare) {
                    this.startQuantumMove();
                    this.handleQuantumSelection(squareId);
                } else {
                    this.executeMove(this.selectedPiece, squareId);
                }
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
            
            // Add tunnel moves if in tunnel mode
            if (this.tunnelMode) {
                const tunnelMoves = piece.getTunnelMoves(board);
                moves = [...moves, ...tunnelMoves];
                this.updateStatus("Tunnel mode: Select where to tunnel to.");
            } else {
                const canQuantum = this.canMakeQuantumMove(piece, moves);
                if (canQuantum) {
                    this.updateStatus("Click a square to move normally, or press 'Q' then click two squares for a quantum move.");
                } else {
                    this.updateStatus("Select a square to move to.");
                }
            }
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
        this.tunnelMode = false;
        this.quantumSelection = [];
        document.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
        document.querySelectorAll('.indicator').forEach(i => i.remove());
        
        // Re-enable tunnel button if not used
        const tunnelUsed = this.currentPlayer === 'w' ? this.whiteTunnelUsed : this.blackTunnelUsed;
        document.getElementById('tunnel-btn').disabled = tunnelUsed;
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
        
        // Check if this is a tunnel move
        const isTunnelMove = this.tunnelMode && originalPos && this.isTunnelMove(originalPos, targetPos);
        
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
        
        // Update piece movement flags
        if (piece.hasMoved !== undefined) {
            piece.hasMoved = true;
        }

        // Reset tunnel mode after use
        if (isTunnelMove) {
            this.tunnelMode = false;
            this.updateStatus(`${piece.type} tunneled to ${targetPos}!`);
        }

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
        
        // Switch players
        this.currentPlayer = (this.currentPlayer === 'w') ? 'b' : 'w';
        
        // Check for game end conditions
        if (this.isCheckmate(this.currentPlayer)) {
            const winner = this.currentPlayer === 'w' ? 'Black' : 'White';
            this.updateStatus(`Checkmate! ${winner} wins!`);
            return;
        }
        
        if (this.isStalemate(this.currentPlayer)) {
            this.updateStatus("Stalemate! The game is a draw.");
            return;
        }
        
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

    updateStatus(message) {
        const turnText = this.currentPlayer === 'w' ? "White's Turn" : "Black's Turn";
        document.getElementById('turn-indicator').innerText = turnText;
        if (message) {
            document.getElementById('game-status').innerText = message;
        } else {
            document.getElementById('game-status').innerText = "Select a piece to move.";
        }
    },

    // Check if a piece can make a quantum move
    canMakeQuantumMove(piece, moves) {
        // Kings cannot enter superposition (for checkmate purposes)
        if (piece.type === 'king') return false;
        
        // Need at least 2 valid moves to make a quantum move
        if (moves.length < 2) return false;
        
        // Count non-capture moves (quantum moves can't capture on both squares)
        const nonCaptureMoves = moves.filter(move => !board.getPiece(move));
        return nonCaptureMoves.length >= 2;
    },

    // Start quantum move selection
    startQuantumMove() {
        this.isQuantumMove = true;
        this.quantumSelection = [];
        this.updateStatus("Quantum move mode: Select first position.");
    },

    // Enhanced quantum collapse detection
    checkForQuantumCollapse() {
        const quantumPieces = Object.values(board.pieces).filter(p => p.inSuperposition);
        
        for (const piece of quantumPieces) {
            const [pos1, pos2] = piece.quantumPositions;
            const attackers1 = this.getAttackersOf(pos1, piece.color === 'w' ? 'b' : 'w');
            const attackers2 = this.getAttackersOf(pos2, piece.color === 'w' ? 'b' : 'w');
            
            if (attackers1.length > 0 && attackers2.length > 0) {
                // Piece is observed at both locations - it's captured!
                this.capturePiece(piece);
                this.updateStatus(`${piece.type} was observed at both quantum positions and captured!`);
            } else if (attackers1.length > 0) {
                // Collapses to pos2
                this.collapsePiece(piece, pos2, pos1);
                this.updateStatus(`${piece.type} collapsed to avoid capture!`);
            } else if (attackers2.length > 0) {
                // Collapses to pos1
                this.collapsePiece(piece, pos1, pos2);
                this.updateStatus(`${piece.type} collapsed to avoid capture!`);
            }
        }
    },

    // Get pieces attacking a specific position
    getAttackersOf(position, attackerColor) {
        const attackers = [];
        for (const pos in board.pieces) {
            const piece = board.pieces[pos];
            if (piece && piece.color === attackerColor && !piece.inSuperposition) {
                const moves = piece.getPossibleMoves(board);
                if (moves.includes(position)) {
                    attackers.push(piece);
                }
            }
        }
        return attackers;
    },

    // Remove a piece that was captured in superposition
    capturePiece(piece) {
        // Find and remove the piece from board.pieces
        const pieceKeys = Object.keys(board.pieces);
        for (const key of pieceKeys) {
            if (board.pieces[key] === piece) {
                delete board.pieces[key];
                break;
            }
        }
    },

    // Check for checkmate considering quantum states
    isCheckmate(color) {
        // Find the king
        let king = null;
        for (const pos in board.pieces) {
            const piece = board.pieces[pos];
            if (piece && piece.type === 'king' && piece.color === color) {
                king = piece;
                break;
            }
        }
        
        if (!king) return false;
        
        // If king is in superposition, check if all positions are under attack
        if (king.inSuperposition) {
            const [pos1, pos2] = king.quantumPositions;
            const attacked1 = board.isSquareUnderAttack(pos1, color === 'w' ? 'b' : 'w');
            const attacked2 = board.isSquareUnderAttack(pos2, color === 'w' ? 'b' : 'w');
            
            // Both positions must be under attack for quantum checkmate
            if (!(attacked1 && attacked2)) return false;
        } else {
            // Regular check
            if (!board.isInCheck(color)) return false;
        }
        
        // Check if any legal move exists
        return this.getAllLegalMoves(color).length === 0;
    },

    // Check for stalemate
    isStalemate(color) {
        // Find the king
        let king = null;
        for (const pos in board.pieces) {
            const piece = board.pieces[pos];
            if (piece && piece.type === 'king' && piece.color === color) {
                king = piece;
                break;
            }
        }
        
        if (!king) return false;
        
        // King must not be in check for stalemate
        if (king.inSuperposition) {
            const [pos1, pos2] = king.quantumPositions;
            const attacked1 = board.isSquareUnderAttack(pos1, color === 'w' ? 'b' : 'w');
            const attacked2 = board.isSquareUnderAttack(pos2, color === 'w' ? 'b' : 'w');
            
            // If either position is safe, not in check
            if (!attacked1 || !attacked2) {
                return this.getAllLegalMoves(color).length === 0;
            }
        } else {
            if (!board.isInCheck(color)) {
                return this.getAllLegalMoves(color).length === 0;
            }
        }
        
        return false;
    },

    // Get all legal moves for a color, considering quantum states
    getAllLegalMoves(color) {
        const moves = [];
        for (const pos in board.pieces) {
            const piece = board.pieces[pos];
            if (piece && piece.color === color) {
                if (piece.inSuperposition) {
                    // Quantum piece can collapse to either position
                    piece.quantumPositions.forEach(qPos => {
                        moves.push({from: qPos, to: qPos, piece: piece, isCollapse: true});
                    });
                } else {
                    const pieceMoves = piece.getPossibleMoves(board);
                    pieceMoves.forEach(move => {
                        // For now, we'll consider all moves legal in quantum chess
                        // More sophisticated legal move checking would be needed for full implementation
                        moves.push({from: piece.position, to: move, piece: piece});
                    });
                }
            }
        }
        return moves;
    },

    // Add keyboard support for quantum moves
    addEventListeners() {
        board.element.addEventListener('click', (e) => this.handleSquareClick(e));
        document.getElementById('new-game-btn').addEventListener('click', () => this.start());
        document.getElementById('tunnel-btn').addEventListener('click', () => this.activateQuantumTunnel());
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'q' && this.selectedPiece && !this.selectedPiece.inSuperposition) {
                if (this.canMakeQuantumMove(this.selectedPiece, this.possibleMoves)) {
                    this.startQuantumMove();
                }
            }
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    },

    // Check if a move is a tunnel move
    isTunnelMove(fromPos, toPos) {
        const [fromCol, fromRow] = board.getCoords(fromPos);
        const [toCol, toRow] = board.getCoords(toPos);
        
        const colDiff = Math.abs(toCol - fromCol);
        const rowDiff = Math.abs(toRow - fromRow);
        
        // Tunnel moves are exactly 2 squares away in any direction
        return (colDiff === 2 && rowDiff === 0) || 
               (colDiff === 0 && rowDiff === 2) || 
               (colDiff === 2 && rowDiff === 2);
    },

    // Implement quantum tunneling
    activateQuantumTunnel() {
        const tunnelUsed = this.currentPlayer === 'w' ? this.whiteTunnelUsed : this.blackTunnelUsed;
        if (tunnelUsed) {
            this.updateStatus("Quantum tunnel already used!");
            return;
        }
        
        // Set tunnel mode
        this.tunnelMode = true;
        this.updateStatus("Quantum tunnel activated! Select a piece to tunnel through an adjacent piece.");
        document.getElementById('tunnel-btn').disabled = true;
        
        if (this.currentPlayer === 'w') {
            this.whiteTunnelUsed = true;
        } else {
            this.blackTunnelUsed = true;
        }
    }
};