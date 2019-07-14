<?php
require_once __DIR__ . '/vendor/autoload.php';

use Workerman\Worker;

// массив для связи соединения пользователя и необходимого нам параметра
$users = [];
// создаём ws-сервер, к которому будут подключаться все наши пользователи
$ws_worker = new Worker("websocket://0.0.0.0:8000");
// создаём обработчик, который будет выполняться при запуске ws-сервера

// Принимаем сообщения пользователей и отправляем сообщения
$ws_worker->onMessage = function ($connection, $data) use (&$users) {
	// файд где хрянятся все пользователи
	$users_arr = file_get_contents('users.txt');

	$users_arr = json_decode($users_arr, JSON_UNESCAPED_SLASHES);

	$data = json_decode($data, JSON_UNESCAPED_SLASHES);

	// проверка на бан пользователей, и если кто то онлайн о выселять их с чата
	foreach ($users_arr as $key => $value) {
		if ($value['ban'] == 'true' && $value['time_ban'] != 'forever' && new DateTime() > new DateTime($users_arr[$key]['time_ban']['date'])) {
			$users_arr[$key]['ban'] = 'false';
			$users_arr[$key]['time_ban'] = '';
		} elseif ($value['ban'] == 'true') {

			$check_ban_arr['ban'] = 'true';
			$check_ban_arr['date'] = $users_arr[$key]['time_ban']['date'];

			$f_users1 = fopen("test.txt", "a");
			$json_users = json_encode($users, JSON_UNESCAPED_SLASHES);
			fwrite($f_users1, $json_users);
			fclose($f_users1);

			if ($users[$value['nickname']]) {
				$users[$value['nickname']]->send(json_encode($check_ban_arr, JSON_UNESCAPED_SLASHES));
				unset($users[$value['nickname']]);
			}

		}
	}

	// обрабтка когда пришел запрос на бан или на создание новго модераора
	if (isset($data['ban_time']) || isset($data['addModer'])) {
		foreach ($users_arr as $k => $v) {
			if ($v['nickname'] === $data['nickname']) {
				if (isset($data['ban_time'])) {

					$users_arr[$k]['ban'] = 'true';

					switch ($data['ban_time']) {
						case 'noTime':
							$users_arr[$k]['time_ban'] = '';
							$users_arr[$k]['ban'] = 'false';
							break;
						case 'one':
							$users_arr[$k]['time_ban'] = date_add(new DateTime(), new DateInterval('PT1M'));
							break;
						case 'hour':
							$users_arr[$k]['time_ban'] = date_add(new DateTime(), new DateInterval('PT1H'));
							break;
						case 'forever':
							$users_arr[$k]['time_ban'] = 'forever';
							break;
					}
				} elseif (isset($data['addModer'])) {
					$users_arr[$k]['role'] = 'moderator';
					$users_arr[$k]['time_ban'] = '';
					$users_arr[$k]['ban'] = 'false';
				}
			}
		}
	}

	// перезаписываем изминения если она были
	file_put_contents('users.txt', '');
	$f_users = fopen("users.txt", "a");
	$json_users = json_encode($users_arr, JSON_UNESCAPED_SLASHES);
	fwrite($f_users, $json_users);
	fclose($f_users);


	// записываем сообщениеесли оно было и отправляем все пользоваелям
	$messages = file_get_contents('message.txt');
	$messages = json_decode($messages, JSON_UNESCAPED_SLASHES);

	$mas_num = count($messages);
	$messages[$mas_num] = $data;

	file_put_contents('message.txt', '');

	$fp = fopen("message.txt", "a");
	$mytext = json_encode($messages, JSON_UNESCAPED_SLASHES);
	fwrite($fp, $mytext);
	fclose($fp);
	// то что отправляем
	$chat_info = (object)[
		'arr_msg' => $messages,
		'arr_users' => $users_arr,
	];
	// отправка всем
	foreach ($users as $key => $webconnection) {
		$webconnection->send(json_encode($chat_info, JSON_UNESCAPED_SLASHES));
	}

};
// присоединение пользоватаеля
$ws_worker->onConnect = function ($connection) use (&$users){
	$connection->onWebSocketConnect = function ($connection) use (&$users){
		$user = $_GET['user'];

		// при подключении нового пользователя сохраняем get-параметр, который же сами и передали со страницы сайта
		$users[$user] = $connection;

		$messages = file_get_contents('message.txt');

		// Открываем файл с юзарами
		$users_arr = file_get_contents('users.txt');

		$users_arr = json_decode($users_arr, JSON_UNESCAPED_SLASHES);

		// проверка бан пользователя и есть ли он вообще
		$check_user = true;
		$check_ban = false;
		$check_ban_arr = [];
		if ($users_arr) {
			foreach ($users_arr as $key => $value) {
				if ($users_arr[$key]['nickname'] == $user) {
					$check_user = false;
				}

				if ($value['ban'] == 'true' && $value['time_ban'] != 'forever' && new DateTime() > new DateTime($users_arr[$key]['time_ban']['date'])) {
					$users_arr[$key]['ban'] = 'false';
					$users_arr[$key]['time_ban'] = '';
				} elseif (($value['ban'] == 'true' && $value['time_ban'] != 'forever' && $users_arr[$key]['nickname'] == $user) || ($value['time_ban'] == 'forever' && $users_arr[$key]['nickname'] == $user)) {
					// удаляем параметр при отключении пользователя
					$user = array_search($connection, $users);
					unset($users[$user]);
					$check_ban_arr['ban'] = 'true';
					$check_ban_arr['date'] = $users_arr[$key]['time_ban']['date'];
					$check_ban = true;
				}
			}
		}
		// если нету то  добавлем его
		if ($check_ban) {
			$connection->send(json_encode($check_ban_arr, JSON_UNESCAPED_SLASHES));
		} else {
			if ($check_user) {
				$users_arr[count($users_arr)] = (object)[
					'nickname' => $user,
					'role' => 'user',
					'ban' => 'false',
					'time_ban' => '',
				];
			}
			//Записываем его в наш файл
			file_put_contents('users.txt', '');

			$fp = fopen("users.txt", "a");
			$text_users = json_encode($users_arr, JSON_UNESCAPED_SLASHES);
			fwrite($fp, $text_users);
			fclose($fp);

			$chat_info = (object)[
				'arr_msg' => json_decode($messages, JSON_UNESCAPED_SLASHES),
				'arr_users' => $users_arr,
			];
			//отправляем все соообщения которые раньше были и информацию о других пользователях
			$connection->send(json_encode($chat_info, JSON_UNESCAPED_SLASHES));
		}

	};
};
// когда пользователь вышел удаляем уго из соединения
$ws_worker->onClose = function ($connection) use (&$users){
	// удаляем параметр при отключении пользователя
	$user = array_search($connection, $users);
	unset($users[$user]);
};

// Run worker
Worker::runAll();
