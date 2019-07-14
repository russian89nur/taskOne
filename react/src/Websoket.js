import React
  from 'react';
import ReactDOM
  from "react-dom";
import App
  from "./App";

// функция выводи сообщения
function MessagesUsers(props) {
  let arr = props.msg,
    content = arr.map((elem) =>
      <div className="row mt-2">
        <span className="col-6">{elem.name}</span>
        <span className="col-6">{elem.msg}</span>
      </div>
    );

  return (
    content
  );
}

// фукнция проверки данного пользователя, выводим под него все элементы
function CheckRoleUser(props) {
  switch (props.role) {
    case 'user':
      return (
        <div className="col-6"></div>
      );
    case 'moderator':
      if (props.user_role === 'user') {
        return (
          <div className="col-12">
            <button data-name={props.user_name} onClick={ClickSelect}>Бан</button>
            <select>
              <option value="noTime">Разбанить </option>
              <option value="one">2 Минуты</option>
              <option value="hour">На час</option>
              <option value="forever">Навcегда</option>
            </select>
          </div>
        );
      } else {
        return (
          <div className="col-6"></div>
        );
      }

    case 'admin':
      if (props.user_role === 'user') {
        return (
          <div className="col-12 row">
            <button data-name={props.user_name} onClick={ClickSelect}>Бан</button>
            <select>
              <option value="noTime">Разбанить</option>
              <option value="one">2 Минуты</option>
              <option value="hour">На час</option>
              <option value="forever">Навcегда</option>
            </select>
            <div className="col-6">
              <button data-name={props.user_name} className="btn btn-secondary" onClick={ClickAddModer} type="button">
                Сделать модератором
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="col-6"></div>
        );
      }
  }
}

// функция вывода элементов
function RegisteredUsers(props) {
  let arr = props.users,
    content = arr.map((elem) =>
      <div className="row border mt-2">
        <span className="col-6">{elem.nickname}</span>
        <span className="col-6">{elem.role}</span>
        <CheckRoleUser user_name={elem.nickname} user_role={elem.role} role={props.role}/>
      </div>
    );

  return (
    content
  );
}

// При нажатии кнопку "Создать нового модератора"
function ClickAddModer(e) {
  let th = e.target,
    message = {
      "nickname": th.dataset.name,
      "addModer": 'true',
    };
  console.log(JSON.stringify(message));
  soket_web.soket.send(JSON.stringify(message));
}

// При нажатии кнопку "Бан"
function ClickSelect(e) {
  let th = e.target,
    message = {
      "nickname": th.dataset.name,
      "ban_time": th.nextSibling.value,
    };
  console.log(JSON.stringify(message));
  soket_web.soket.send(JSON.stringify(message));
}

var soket_web;

// класс обрабатывающий полностью содениение websocket
class Websoket extends React.Component {
  constructor(props) {
    super(props);
    this.name = '';
  }
  // Приконективаемся к backend websocket
  connection(nickname) {
    this.soket = new WebSocket("ws://192.168.100.3:8000/?user=" + nickname);
    this.localsocket = new Websoket();

    soket_web = this;

    this.name = nickname;
    // подключен или нет
    this.soket.onopen = function (e) {
      console.log('Подключено');
    };
    //Отсоиденен
    this.soket.onclose = function (e) {
      // проверка на закрытие
      if (e.wasClean) {
        console.log('Отключено');
      }
      console.log("Код " + e.code + " причина " + e.reason);
    };
    // когда приходят сообщения и другая информация обработок
    this.soket.onmessage = function (e) {
      let answer = JSON.parse(e.data);
      // if (проверка на бан ) {если да то выкидываем его} else {то выводим сообщения и  всех юзеров  которые были хотя быраз в чате}
      if (answer['ban']) {
        if(answer['date'] === 'f'){
          document.getElementById("ban").innerText = 'Вы забанены до бесконечности, через 5 секунд redirect';
        } else {
          document.getElementById("ban").innerText = 'Вы забанены до '+answer['date']+' через 5 секунд redirect';
        }
        setTimeout(()=>{
          window.location.href = '/';
      }, 5000);

      } else {

        if (answer['arr_msg']) {
          for (let i = 0; i < answer['arr_msg'].length; i++) {
            if (answer['arr_msg'][i].name === nickname) {
              answer['arr_msg'][i].name = nickname + "(Я)";
            }
          }

          ReactDOM.render(
            <MessagesUsers msg={answer['arr_msg']}/>
            , document.getElementById('msg'));
        }

        let role_user;
        for (let i = 0; i < answer['arr_users'].length; i++) {
          if (answer['arr_users'][i].nickname === nickname) {
            role_user = answer['arr_users'][i].role;
          }
        }
        ReactDOM.render(
          <RegisteredUsers users={answer['arr_users']} role={role_user}/>,
          document.getElementById("users")
        );
      }
    };

    this.soket.onerror = function (e) {
      console.log('Ошибка');
      console.log(e.data);
    };
  }
  // Нажатие на кнопку отправить сообщение
  addMsg(message) {
    message.name = this.name;

    this.soket.send(JSON.stringify(message));
  }
}


export default Websoket;
