import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'jquery';
import Websoket from './Websoket';
import * as serviceWorker from './serviceWorker';

// Nickname пользователя который заходит в чат
var nickname,
    socket = new Websoket();

// Вводим логин при загрузке страници
function checkNameUser(nick) {
  let check = true;
  while(check) {
    nick = prompt('Введите Nickname:', null);
    if (nick !== null && nick !== '') {
      check = false;
    }
  }
  return nick;
}

nickname = checkNameUser(nickname);

if (nickname) {
  // выводим каркас
  ReactDOM.render(<App />, document.getElementById('root'));

  // соеденяемся с сервером
  socket.connection(nickname, socket);

  window.onload = function () {
    //Отправка сообщения при нажатии на кнопку
    document.getElementById('addMsg').onclick = function () {
      let message = {
        msg: this.previousSibling.value,
      };
      socket.addMsg(message);
    };
  };
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
