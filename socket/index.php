<?php
$colors = array('#007AFF', '#FF7000', '#FF7000', '#15E25F', '#CFC700', '#CFC700', '#CF1100', '#CF00BE', '#F00');
$color_pick = array_rand($colors);
// echo "<pre>";print_r($_SERVER);exit;
?>

<!DOCTYPE html>
<html>

<head>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style type="text/css">
		.chat-wrapper {
			font: bold 11px/normal 'lucida grande', tahoma, verdana, arial, sans-serif;
			background: #00a6bb;
			padding: 20px;
			margin: 20px auto;
			box-shadow: 2px 2px 2px 0px #00000017;
			max-width: 700px;
			min-width: 500px;
		}

		#message-box {
			width: 97%;
			display: inline-block;
			height: 300px;
			background: #fff;
			box-shadow: inset 0px 0px 2px #00000017;
			overflow: auto;
			padding: 10px;
		}

		.user-panel {
			margin-top: 10px;
		}

		input[type=text] {
			border: none;
			padding: 5px 5px;
			box-shadow: 2px 2px 2px #0000001c;
		}

		input[type=text]#name {
			width: 20%;
		}

		input[type=text]#message {
			width: 60%;
		}

		button#send-message {
			border: none;
			padding: 5px 15px;
			background: #11e0fb;
			box-shadow: 2px 2px 2px #0000001c;
		}
	</style>
</head>

<body>

	<div class="chat-wrapper">
		<div>
			<h1><?php echo gethostname().' NODE JS LOCAL SOKCET'.date('Y-m-d H:i:s'); ?></h1>
		</div>
		<div id="message-box"></div>
		<div class="user-panel">
			<input type="text" name="name" id="name" placeholder="Your Name" maxlength="15" />
			<input type="text" name="message" id="message" placeholder="Type your message here..." maxlength="100" />
			<button id="send-message">Send</button>
		</div>
	</div>

	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
	<script language="javascript" type="text/javascript">
		var msgBox = $('#message-box');
		var server = "<?php echo gethostname(); ?>";
		// var wsUri = "wss://35agk1oes1.execute-api.us-east-1.amazonaws.com/Prod/"; //ELSNER
		var wsUri = "wss://elevate.elsner.com/wss/"; //AITL
		//Message send button
		$('#send-message').click(function() {
			send_message();
		});

		//User hits enter key 
		$("#message").on("keydown", function(event) {
			if (event.which == 13) {
				send_message();
			}
		});
		//Send message
		function send_message() {
			var message_input = $('#message'); //user message text
			var name_input = $('#name');

			if (name_input.val() == "") { //empty name?
				alert("Enter your Name please!");
				return;
			}
			if (message_input.val() == "") { //emtpy message?
				alert("Enter Some message Please!");
				return;
			}

			//prepare json data
			/*
				{"action":"sendmessage", "data":"hello world"}
			*/
			var msg = {
				message: message_input.val(),
				name: name_input.val()+" "+new Date().toLocaleString(),
				color: '<?php echo $colors[$color_pick]; ?>',
				type : 'usermsg'
			};
			//convert and send data to server
			// msg = JSON.stringify(msg);
			// var send = {
			// 	action : 'sendmessage',
			// 	data : msg,
			// }
			console.log(msg);
			mySocket.send(JSON.stringify(msg));
			message_input.val(''); //reset message input
		}


		var mySocket;
		const socketMessageListener = (ev) => {
			// msgBox.append('<div style="color:#bbbbbb">' + ev.data + '</div>');
			var response = JSON.parse(ev.data); //PHP sends Json data
			// console.log(response);
			var res_type = response.type; //message type
			var user_message = response.message; //message text
			var user_name = response.name; //user name
			var user_color = response.color; //color

			switch (res_type) {
				case 'usermsg':
					msgBox.append('<div><span class="user_name" style="color:' + user_color + '">' + user_name + '</span> : <span class="user_message">' + user_message + '</span></div>');
					break;
				case 'system':
					msgBox.append('<div style="color:#bbbbbb">' + user_message + '</div>');
					break;
			}
			msgBox[0].scrollTop = msgBox[0].scrollHeight; //scroll message
			// console.log(event.data);
		};

		// Open
		const socketOpenListener = (ev) => {
			msgBox.append('<div class="system_msg" style="color:#bbbbbb">Welcome to my "Demo WebSocket Chat box" ON <h1>' + server + ' '+new Date()+'</h1> !</div>'); //notify user
			// mySocket.send('hello');
			var msg = {
				message: "<?php echo $_SERVER['REMOTE_ADDR'].' connected.';?>",
				type : 'system'
			};
			//convert and send data to server
			msg = JSON.stringify(msg);
			var send = {
				action : 'sendmessage',
				data : msg,
			}
			console.log(msg);
			mySocket.send(JSON.stringify(send));
		};

		// Closed
		const socketCloseListener = (event) => {
			if (mySocket) {
				console.log('Disconnected.');
				msgBox.append('<div class="system_msg">Connection Closed, Re-Connecting...'+new Date()+'</div>');
				// $.ajax({  
                //     type: 'POST',  
                //     url: 'socket_test.php', 
                //     data: { status: '2' },
                // });
				// $.ajax({  
                //     type: 'GET',  
                //     url: 'https://www.allintheloop.net/apiv7/resSocket', 
                //     data: { status: '2' },
                // });
			}
			mySocket = new WebSocket(wsUri);
			mySocket.addEventListener('open', socketOpenListener);
			mySocket.addEventListener('message', socketMessageListener);
			mySocket.addEventListener('close', socketCloseListener);
		};
		
		try{
		socketCloseListener();
		}
		catch (e){
			console.log(e);
		}
		
	</script>
</body>

</html>
