import React from 'react';
import logo from './logo.svg';
import './App.css';
import Websoket from './Websoket';
import 'jquery';
import 'bootstrap/dist/css/bootstrap.css';

// выводим каркас
function App(props) {

  return (
    <div className="container">
      <h2 id="ban"></h2>
      <div className="row">
        <div className="col-6">
          <h3>Сообщения</h3>
        </div>
        <div className="col-6">
          <h3>Зарегестрированные пользватели:</h3>
        </div>
        <div className="col-3">
          <span>Nickname</span>
        </div>
        <div className="col-3">
          <span>Message</span>
        </div>
        <div className="col-3">
          <span>Nickname</span>
        </div>
        <div className="col-3">
          <span>role</span>
        </div>
        <div id="msg" className="col-6 border block_msg">

        </div>
        <div id="users" className="col-6 border block_msg">

        </div>
        <div className="col-12 px-0 d-flex flex-column">
          <textarea placeholder="Сообщение" name="msg" className="w-100" />
          <button id="addMsg">Отправить</button>
        </div>
      </div>
    </div>
  );
}

export default App;
