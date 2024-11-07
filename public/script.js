const socket = io();
let playerSymbol;
let roomId;

// Al recibir la asignación de una sala
socket.on('room_assigned', (assignedRoomId) => {
    roomId = assignedRoomId;
    console.log(`Sala asignada: ${roomId}`);
});

// Unirse a la sala y comenzar el juego cuando haya dos jugadores
socket.on('start_game', (data) => {
    playerSymbol = data.turn === 'X' ? 'O' : 'X';
    const status = document.getElementById('status');
    status.textContent = `Juego iniciado, eres ${playerSymbol}`;
});

// Elementos del tablero
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        socket.emit('make_move', index);
    });
});

// Actualizar el tablero
socket.on('board_update', (board) => {
    board.forEach((symbol, index) => {
        cells[index].textContent = symbol;
    });
});

// Cambiar turno
socket.on('turn_change', (turn) => {
    status.textContent = `Turno de ${turn}`;
});

// Muestra el resultado del juego
socket.on('game_over', ({ winner }) => {
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = `Juego terminado. Ganador: ${winner}`;
    status.textContent = "Juego terminado.";
});
