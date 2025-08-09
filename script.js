class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameState = 'ready'; // ready, playing, won, lost
        this.board = [];
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.startTime = null;
        this.timer = null;
        this.firstClick = true;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeGame();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.flagCounter = document.getElementById('flag-counter');
        this.timerElement = document.getElementById('timer');
        this.gameStatus = document.getElementById('game-status');
        this.restartBtn = document.getElementById('restart-btn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.modal = document.getElementById('game-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.finalTime = document.getElementById('final-time');
        this.finalDifficulty = document.getElementById('final-difficulty');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
    }
    
    attachEventListeners() {
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeDifficulty(e.target.dataset.difficulty);
            });
        });
        
        this.playAgainBtn.addEventListener('click', () => {
            this.hideModal();
            this.restartGame();
        });
        
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        
        // Prevent right-click context menu on game board
        this.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    initializeGame() {
        const config = this.difficulties[this.currentDifficulty];
        this.createBoard(config.rows, config.cols, config.mines);
        this.renderBoard();
        this.updateUI();
    }
    
    createBoard(rows, cols, mines) {
        this.board = [];
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.gameState = 'ready';
        this.firstClick = true;
        
        // Initialize empty board
        for (let r = 0; r < rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < cols; c++) {
                this.board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    row: r,
                    col: c
                };
            }
        }
        
        this.rows = rows;
        this.cols = cols;
        this.totalMines = mines;
    }
    
    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        const config = this.difficulties[this.currentDifficulty];
        
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or if already has mine
            if ((row === firstClickRow && col === firstClickCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        // Calculate neighbor mine counts
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    this.board[r][c].neighborMines = this.countNeighborMines(r, c);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board ${this.currentDifficulty}`;
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(event, row, col) {
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        // First click - place mines and start timer
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.gameState = 'playing';
            this.firstClick = false;
        }
        
        if (cell.isMine) {
            this.gameOver(false);
        } else {
            this.revealCell(row, col);
            this.checkWinCondition();
        }
        
        this.updateUI();
    }
    
    handleRightClick(row, col) {
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed) return;
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flaggedCount--;
        } else {
            cell.isFlagged = true;
            this.flaggedCount++;
        }
        
        this.updateUI();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        // If cell has no neighboring mines, reveal all neighbors
        if (cell.neighborMines === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
    }
    
    checkWinCondition() {
        const totalCells = this.rows * this.cols;
        if (this.revealedCount === totalCells - this.totalMines) {
            this.gameOver(true);
        }
    }
    
    gameOver(won) {
        this.gameState = won ? 'won' : 'lost';
        this.stopTimer();
        
        // Reveal all mines
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) {
                    this.board[r][c].isRevealed = true;
                }
            }
        }
        
        this.updateUI();
        this.showModal(won);
    }
    
    showModal(won) {
        const time = this.getElapsedTime();
        this.modalTitle.textContent = won ? '🎉 Congratulations!' : '💥 Game Over!';
        this.modalMessage.textContent = won ? 
            'You successfully cleared all the mines!' : 
            'You hit a mine! Better luck next time.';
        this.finalTime.textContent = `${time}s`;
        this.finalDifficulty.textContent = this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
        
        this.modal.classList.add('show');
    }
    
    hideModal() {
        this.modal.classList.remove('show');
    }
    
    updateUI() {
        // Update flag counter
        const remainingFlags = this.totalMines - this.flaggedCount;
        this.flagCounter.textContent = remainingFlags.toString().padStart(2, '0');
        
        // Update game status
        this.gameStatus.className = 'game-status';
        if (this.gameState === 'ready') {
            this.gameStatus.textContent = 'Click a cell to start!';
        } else if (this.gameState === 'playing') {
            this.gameStatus.textContent = 'Game in progress... Good luck!';
            this.gameStatus.classList.add('playing');
        } else if (this.gameState === 'won') {
            this.gameStatus.textContent = '🎉 You won! Congratulations!';
            this.gameStatus.classList.add('won');
        } else if (this.gameState === 'lost') {
            this.gameStatus.textContent = '💥 Game over! You hit a mine.';
            this.gameStatus.classList.add('lost');
        }
        
        // Update board display
        this.updateBoardDisplay();
    }
    
    updateBoardDisplay() {
        const cells = this.gameBoard.querySelectorAll('.cell');
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellElement = cells[r * this.cols + c];
                const cell = this.board[r][c];
                
                // Reset classes
                cellElement.className = 'cell';
                cellElement.textContent = '';
                
                if (cell.isFlagged && !cell.isRevealed) {
                    cellElement.classList.add('flagged');
                    cellElement.textContent = '🚩';
                } else if (cell.isRevealed) {
                    cellElement.classList.add('revealed');
                    
                    if (cell.isMine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellElement.classList.add(`number-${cell.neighborMines}`);
                        cellElement.textContent = cell.neighborMines;
                    }
                }
            }
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = this.getElapsedTime();
            this.timerElement.textContent = elapsed.toString().padStart(3, '0');
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    changeDifficulty(difficulty) {
        if (difficulty === this.currentDifficulty) return;
        
        // Update active button
        this.difficultyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        this.currentDifficulty = difficulty;
        this.restartGame();
    }
    
    restartGame() {
        this.stopTimer();
        this.timerElement.textContent = '000';
        this.hideModal();
        this.initializeGame();
        
        // Add restart animation
        this.restartBtn.style.animation = 'none';
        setTimeout(() => {
            this.restartBtn.style.animation = '';
        }, 10);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
