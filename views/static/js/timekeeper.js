const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

var socket = null;
var TimeKeeper_Rooms = [];
var TimeKeeper_Timers = [];
var TimeKeeper_Messages = [];

var timerID = null;

var autoJoinInterval = null;

function updateClock()
{
	var d = new Date();

	clockHM.innerHTML = ((d.getHours() + 11) % 12 + 1) + ":" + (10 > d.getMinutes() ? "0" : "") + d.getMinutes();
	clockS.innerHTML = (10 > d.getSeconds() ? "0" : "") + d.getSeconds();
	clockAMPM.innerHTML = d.getHours() >= 12 ? "PM" : "AM";
	clockdate.innerHTML = monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();

	TimeKeeper_UpdateAllTimers(d);
	TimeKeeper_UpdateAllMessages(d);

	setTimeout(updateClock, 1000 - d.getTime() % 1000 + 20);
}

function TimeKeeper_Connect()
{    
	socket = io.connect();

	socket.on('connect', function() {
		socket.emit("TimeKeeper_GetAllRooms", true);
	});

	socket.on("TimeKeeper_Rooms", function (timeKeeperRooms) {
		TimeKeeper_Rooms = timeKeeperRooms;
		TimeKeeper_UpdateRoomList();
	});

	socket.on("TimeKeeper_Timers", function(timers) {
		TimeKeeper_Timers = timers;
	});

	socket.on("TimeKeeper_Messages", function(messages) {
		TimeKeeper_Messages = messages;
	});
}
	
function TimeKeeper_UpdateRoomList()
{
	//updates a drop down list of available time rooms that the user has to join when this page is loaded for the first time
	let selRoomList = $('#selRoomList');
	selRoomList.empty();

	$("<option />", {
        val: 'room-0',
        text: 'Select a Room to join...'
    }).appendTo(selRoomList);

	for (let i = 0; i < TimeKeeper_Rooms.length; i++)
	{
		$("<option />", {
			val: TimeKeeper_Rooms[i].id,
			text: TimeKeeper_Rooms[i].name
		}).appendTo(selRoomList);
	}

	let selAddRoomList = $('#addTimerRoom');
	selAddRoomList.empty();

	$("<option />", {
        val: 'room-0',
        text: 'Send to all Rooms'
    }).appendTo(selAddRoomList);

	for (let i = 0; i < TimeKeeper_Rooms.length; i++)
	{
		$("<option />", {
			val: TimeKeeper_Rooms[i].id,
			text: TimeKeeper_Rooms[i].name
		}).appendTo(selAddRoomList);
	}

	autoJoinInterval = setTimeout(TimeKeeper_AutoJoinRoom, 5000); //auto join room-0 after 15 seconds
}

function TimeKeeper_AutoJoinRoom()
{
	TimeKeeper_JoinRoom();
}
	
function TimeKeeper_JoinRoom()
{
	// send the socket to join the requested room, it returns an array of all current timers in that room
	let selRoomList = document.getElementById("selRoomList");
	let roomID = selRoomList.options[selRoomList.selectedIndex].value;
	socket.emit("TimeKeeper_JoinRoom", roomID);
	clearInterval(autoJoinInterval);

	let divSelectRoom = document.getElementById("divSelectRoom");
	divSelectRoom.style.display = "none";

	let room = TimeKeeper_Rooms.find(x => x.id === roomID);
	if (room) {
		$('#divSelectedRoom').text(room.name.toUpperCase());
	}
}

function TimeKeeper_DisplayMessage(msg)
{
	let divMessage = document.getElementById("divMessage");
	divMessage.innerHTML = msg.replace("\n","<br />");
}
	
function TimeKeeper_UpdateAllTimers(d)
{
	let divTimersContainer = document.getElementById("divTimersContainer");
	divTimersContainer.innerHTML = "";
	divTimersContainer.className = "timers-container";

	for (let i = 0; i < TimeKeeper_Timers.length; i++)
	{
		if (TimeKeeper_Timers[i].expired)
		{
			// do something with expired timers here
		}
		else
		{
			//HTML Elements
			let divTimerContainer = document.createElement("div");
			divTimerContainer.id = "divTimer-" + i;
			divTimerContainer.className = "timer-container";

			//HUD - like triggers exist, etc.
			let divTimerHUD = document.createElement("div");
			divTimerHUD.className = "timer-hud";

			if (TimeKeeper_Timers[i].triggers && TimeKeeper_Timers[i].triggers.length > 0) {
				let btnTriggers = document.createElement("span");
				btnTriggers.className = "fa fa-solid fa-bolt fa-lg timer-hud-element";
				btnTriggers.innerHTML = "";
				divTimerHUD.appendChild(btnTriggers);
			}

			divTimerContainer.appendChild(divTimerHUD);

			//Controls
			let divControls = document.createElement("div");
			divControls.className = "timer-controls";

			let btnEdit = document.createElement("span");
			btnEdit.className = "fa fa-solid fa-pencil fa-lg timer-control";
			btnEdit.innerHTML = "";
			btnEdit.onclick = function() {
				timerID = TimeKeeper_Timers[i].id;
				$('#addTimerLabel').val(TimeKeeper_Timers[i].label);
				let dtDate = new Date(TimeKeeper_Timers[i].datetime);
				let dtString = dtDate.toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'});
				$('#addTimerDateDT').val(datetimeLocal(dtString));
				$('#addTimerPublish').val(TimeKeeper_Timers[i].publishMillis);
				$('#addTimerExpire').val(TimeKeeper_Timers[i].expireMillis);
				$('#addTimerRoom').val(TimeKeeper_Timers[i].roomID);
				$('#modalAddTimer').modal('show');
			};
			divControls.appendChild(btnEdit);

			let btnDelete = document.createElement("span");
			btnDelete.className = "fa fa-solid fa-trash fa-lg timer-control";
			btnDelete.innerHTML = "";
			btnDelete.onclick = function() {
				socket.emit('TimeKeeper_DeleteTimer', TimeKeeper_Timers[i].id);
			};
			divControls.appendChild(btnDelete);

			divTimerContainer.appendChild(divControls);

			let divDays = document.createElement("div");
			divDays.className = "countdown";
			let divDays_Digits = document.createElement("div");
			divDays_Digits.className = "countdown_digit";
			let divDays_Label = document.createElement("div");
			divDays_Label.innerHTML = "Days";
			divDays_Label.className = "countdown_digitlabel";

			let divHours = document.createElement("div");
			divHours.className = "countdown";
			let divHours_Digits = document.createElement("div");
			divHours_Digits.className = "countdown_digit";
			let divHours_Label = document.createElement("div");
			divHours_Label.innerHTML = "Hours";
			divHours_Label.className = "countdown_digitlabel";

			let divMinutes = document.createElement("div");
			divMinutes.className = "countdown";
			let divMinutes_Digits = document.createElement("div");
			divMinutes_Digits.className = "countdown_digit";
			let divMinutes_Label = document.createElement("div");
			divMinutes_Label.innerHTML = "Minutes";
			divMinutes_Label.className = "countdown_digitlabel";

			let divSeconds = document.createElement("div");
			divSeconds.className = "countdown";
			let divSeconds_Digits = document.createElement("div");
			divSeconds_Digits.className = "countdown_digit";
			let divSeconds_Label = document.createElement("div");
			divSeconds_Label.innerHTML = "Seconds";
			divSeconds_Label.className = "countdown_digitlabel";

			let divLabel = document.createElement("div");
			divLabel.className = "countdown_label";                    

			let dt = new Date(Number(TimeKeeper_Timers[i].datetime));
			let publishMillis = TimeKeeper_Timers[i].publishMillis;
			let expireMillis = TimeKeeper_Timers[i].expireMillis;
			let label = TimeKeeper_Timers[i].label;

			// Find the distance between now and the count down date
			let distance =  dt - d + 1000;

			// Time calculations for days, hours, minutes and seconds
			let dt_days = Math.floor(distance / (1000 * 60 * 60 * 24));
			let dt_hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			let dt_minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			let dt_seconds = Math.floor((distance % (1000 * 60)) / 1000);

			// Display the timer
			if ((distance < publishMillis) || (globalUnpublishedTimers == true))
			{
				if (dt_days > 0)
				{
					divDays_Digits.innerHTML = dt_days;         
				}
				else
				{
					divDays.style.display = "none";
				}

				divHours_Digits.innerHTML = (10 > dt_hours ? "0" : "") + dt_hours;
				divMinutes_Digits.innerHTML = (10 > dt_minutes ? "0" : "") + dt_minutes;
				divSeconds_Digits.innerHTML = (10 > (dt_seconds) ? "0" : "") + dt_seconds;

				let countdowntime = ""; // friendly string of the date/time we are counting down to
				countdowntime += ((dt.getHours() + 11) % 12 + 1) + ":";
				countdowntime += (10 > dt.getMinutes() ? "0" : "") + dt.getMinutes() + ":";
				countdowntime += (10 > dt.getSeconds() ? "0" : "") + dt.getSeconds() + " ";
				countdowntime += dt.getHours() >= 12 ? "PM" : "AM";                    
				let labelString = monthNames[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear() + " " + countdowntime;
				if (label !== "")
				{
					labelString += "&nbsp;&nbsp;&nbsp;" + label;        
				}
				divLabel.innerHTML = labelString;
			}
			else
			{
				divTimerContainer.style.display = "none";
			}

			if (distance < expireMillis) // color it red if within our expire threshold
			{
				divDays_Digits.style.color = "#e55182";
				divHours_Digits.style.color = "#e55182";
				divMinutes_Digits.style.color = "#e55182";
				divSeconds_Digits.style.color = "#e55182";

				divControls.style.display = "none"; //hide the controls for an expired timer, just let it expire
			}

			if (distance < 0)
			{
				if (publishMillis === 0)
				{
					divTimerContainer.style.display = "none";        
				}
				else
				{
					divDays_Digits.innerHTML = "0";
					divHours_Digits.innerHTML = "00";
					divMinutes_Digits.innerHTML = "00";
					divSeconds_Digits.innerHTML = "00";

					divDays_Digits.className = "expired";
					divHours_Digits.className = "expired";
					divMinutes_Digits.className = "expired";
					divSeconds_Digits.className = "expired";

					if (distance < -30000) // hide the countdown when it's been expired for 30 seconds or more
					{
						divTimerContainer.style.display = "none";
						TimeKeeper_Timers[i].expired = true;
					}
				}
			}

			//Append all the HTML elements
			divDays.appendChild(divDays_Digits);
			divDays.appendChild(divDays_Label);

			divHours.appendChild(divHours_Digits);
			divHours.appendChild(divHours_Label);

			divMinutes.appendChild(divMinutes_Digits);
			divMinutes.appendChild(divMinutes_Label);

			divSeconds.appendChild(divSeconds_Digits);
			divSeconds.appendChild(divSeconds_Label);                    

			divTimerContainer.appendChild(divDays);
			divTimerContainer.appendChild(divHours);
			divTimerContainer.appendChild(divMinutes);
			divTimerContainer.appendChild(divSeconds);
			divTimerContainer.appendChild(divLabel);

			divTimersContainer.appendChild(divTimerContainer);
		}
	}
}

function TimeKeeper_UpdateAllMessages(d)
{
	let divMessagesContainer = document.getElementById("divMessagesContainer");

	divMessagesContainer.innerHTML = "";

	for (let i = 0; i < TimeKeeper_Messages.length; i++)
	{
		if (TimeKeeper_Messages[i].expired)
		{
			// do something with explicitly expired messages here
		}
		else
		{
			//HTML Elements
			let divMessage = document.createElement("div");
			divMessage.id = "divMessage-" + i;
			divMessage.className = "message-container";

			let dt = new Date(Number(TimeKeeper_Messages[i].datetime));
			let publishMillis = TimeKeeper_Messages[i].publishMillis;
			let expireMillis = TimeKeeper_Messages[i].expireMillis;

			divMessage.innerHTML = TimeKeeper_Messages[i].message;

			// Find the distance between now and the count down date
			let distance =  dt - d + 1000;

			// Display the message
			if (distance < publishMillis)
			{
				divMessage.style.display = "block";
			}
			else
			{
				divMessage.style.display = "none";
			}

			if (distance < expireMillis) // color it red if within our expire threshold
			{
				divMessage.style.color = "#e55182";
			}

			if (distance < 0)
			{
				if (publishMillis === 0)
				{
					divMessage.style.display = "none";        
				}
				else
				{
					divMessage.className = "expired";

					if (distance < -30000) // hide the countdown when it's been expired for 30 seconds or more
					{
						divMessage.style.display = "none";
						TimeKeeper_Messages[i].expired = true;
					}
				}
			}

			//Append all the HTML elements
			divMessagesContainer.appendChild(divMessage);
		}
	}
}

function TimeKeeper_AddTimer() {
	let timerObj = {};

	//get the value with jquery
	timerObj.label = $('#addTimerLabel').val();
	let dtDate = new Date($('#addTimerDateDT').val());
	timerObj.datetime = dtDate.getTime();
	timerObj.publishMillis = parseInt($('#addTimerPublish').val());
	timerObj.expireMillis = parseInt($('#addTimerExpire').val());
	timerObj.roomID = $('#addTimerRoom').val();

	if (timerID == 'timer-add')
    {
		socket.emit('TimeKeeper_AddTimer', timerObj);
	}
	else
	{
		socket.emit('TimeKeeper_UpdateTimer', timerID, timerObj);
	}

	$('#modalAddTimer').modal('hide');
}