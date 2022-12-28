const socket = io('http://localhost:3000/');
const inputMsg = document.getElementById('textarea1');
const send = document.getElementById('send');
send.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit('new-message', inputMsg.value);
    display(inputMsg.value,'positionLeft');
    inputMsg.value = "";
});

socket.on('message-from-backend', (data) => {
    display(data.message,'positionRight');
});


function display(message,position) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = 
    `<div class="message-wrapper #f44336 red ${position}">
        <p id="message">${message}</p>
    </div>`;
    document.getElementById('display-container').append(messageElement);
}