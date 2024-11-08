const socket = io();
let roomId = prompt("Ingresa el ID de la sala (o crea una nueva)");
let playerSymbol;

// Unirse a la sala
socket.emit('join_room', roomId);

const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        socket.emit('make_move', roomId, index);
    });
});

socket.on('start_game', (data) => {
    playerSymbol = data.turn === 'X' ? 'O' : 'X';
    status.textContent = `Juego iniciado, eres ${playerSymbol}`;
});

socket.on('board_update', (board) => {
    board.forEach((symbol, index) => {
        cells[index].textContent = symbol;
    });
});

socket.on('turn_change', (turn) => {
    status.textContent = `Turno de ${turn}`;
});

socket.on('game_over', ({ winner }) => {
    status.textContent = `Juego terminado. Ganador: ${winner}`;
});




// Al recibir el mensaje de fin del juego, muestra el mensaje en winner-message
socket.on('game_over', ({ winner }) => {
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = `Juego terminado. Ganador: ${winner}`;
});
