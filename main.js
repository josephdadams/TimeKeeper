 /* TimeKeeper */

//express variables
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

//socket.io variables
const http = require('http').Server(app);
const io = require('socket.io')(http);
const listenPort = 4000;

//filesystem variables
const fs = require('fs');
const JSONdatafile = 'timekeeper-data.json'; //local storage JSON file

//TimeKeeper Arrays
var Rooms = []; // array of Room Objects to display
var Timers = []; // array of Timer Objects to display
var Messages = []; // array of Message Objects to display

const SupportedTriggerTypes = ['http'];

const axios = require('axios').default; //used for HTTP triggers

//app route setups
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

//about the author, this program, etc.
app.get('/about', function (req, res) {
	res.sendFile(__dirname + '/views/about.html');
});

//serve up any files in the static folder like images, CSS, client-side JS, etc.
app.use(express.static('views/static'));

//Room APIs
app.get('/api/rooms', function (req, res) {
	//gets all Room objects
	res.send(TimeKeeper_GetRooms(true));
});

app.get('/api/room/:roomid', function (req, res) {
	//gets a specific timer object
	let roomID = req.params.roomid;

	let roomObj = TimeKeeper_GetTimer(roomID);

	if (roomObj === null)
	{
		//return as invalid
		res.send({returnStatus: 'invalid-room-id'});
	}
	else
	{
		res.send({returnStatus: 'success', room: roomObj});
	}
});

app.post('/api/room/add', function (req, res) {
	//add the new timer object into the array
	let roomObj = TimeKeeper_AddRoom(req.body);
	if (roomObj !== null)
	{
		res.send({returnStatus: 'success', room: roomObj});
	}
});

app.post('/api/room/update/:roomid', function (req, res) {
	//updates the room object that already exists in the array
	let roomID = req.params.roomid;

	let roomObj = TimeKeeper_UpdateRoom(roomID, req.body);

	if (roomObj !== null)
	{
		res.send({returnStatus: 'success', room: roomObj});
	}
});
 
app.post('/api/room/delete/:roomid', function (req, res) {
	//updates the room object that already exists in the array
	let roomID = req.params.roomid;

	TimeKeeper_DeleteRoom(roomID);

	res.send({returnStatus: 'success'});
});
 
//Timer APIs
app.get('/api/timers', function (req, res) {
	//gets all Timer objects
	res.send(Timers);
});

app.get('/api/timer/:timerid', function (req, res) {
	//gets a specific timer object
	let timerID = req.params.timerid;

	let timerObj = TimeKeeper_GetTimer(timerID);

	if (timerObj === null)
	{
		//return as invalid
		res.send({returnStatus: 'invalid-timer-id'});
	}
	else
	{
		res.send({returnStatus: 'success', timer: timerObj});
	}
});

app.post('/api/timer/add', function (req, res) {
	//add the new timer object into the array
	let timerObj = TimeKeeper_AddTimer(req.body);
	if (timerObj !== null)
	{
		res.send({returnStatus: 'success', timer: timerObj});
	}
});
 
app.post('/api/timer/update/:timerid', function (req, res) {
	//updates the timer object that already exists in the array
	let timerID = req.params.timerid;

	let timerObj = TimeKeeper_UpdateTimer(timerID, req.body);

	if (timerObj !== null)
	{
		res.send({returnStatus: 'success', timer: timerObj});
	}
});
 
app.post('/api/timer/delete/:timerid', function (req, res) {
	//updates the timer object that already exists in the array
	let timerID = req.params.timerid;

	TimeKeeper_DeleteTimer(timerID);

	res.send({returnStatus: 'success'});
 });

app.get('/api/countdown/:roomid/:length', function (req, res) {
	let roomID = req.params.roomid;
	let length = parseInt(req.params.length);

	let obj = {};

	let d = new Date();
	let dt = new Date(d.getTime() + (length * 1000));

	obj.label = '';
	obj.datetime = dt.getTime();
	obj.publishMillis = 120000;
	obj.expireMillis = 120000;
	obj.roomID = roomID;	

	//add the new timer object into the array
	let timerObj = TimeKeeper_AddTimer(obj);
	if (timerObj !== null)
	{
		res.send({returnStatus: 'success', timer: timerObj});
	}
});

app.get('/api/:timerid/triggers-disable', function (req, res) {
	let timerID = req.params.timerID;
	//disable the triggers for the selected timer
	let timerObj = TimeKeeper_EnableTriggers(timerID, false);
	if (timerObj !== null) {
		res.send({returnStatus: 'success', timer: timerObj});
	}
});

app.get('/api/:timerid/triggers-enable', function (req, res) {
	let timerID = req.params.timerID;
	//disable the triggers for the selected timer
	let timerObj = TimeKeeper_EnableTriggers(timerID, true);
	if (timerObj !== null) {
		res.send({returnStatus: 'success', timer: timerObj});
	}
});
 
 //Message APIs
app.get('/api/messages', function (req, res) {
	//gets all Message objects
	res.send(Messages);
});

app.post('/api/message/add', function (req, res) {
	console.log('add msg received:');
	console.log(req.body);
	//add the new timer object into the array
	TimeKeeper_AddMessage(req.body);
	res.send({returnStatus: 'success'});
});

app.post('/api/message/update/:messageid', function (req, res) {
	//updates the timer object that already exists in the array
	let messageID = req.params.messageid;

	let messageObj = TimeKeeper_UpdateMessage(messageID, req.body);

	if (messageObj !== null)
	{
		res.send({returnStatus: 'success', message: messageObj});
	}
});
 
app.post('/api/message/delete/:messageid', function (req, res) {
	//updates the timer object that already exists in the array
	let messageID = req.params.messageid;

	TimeKeeper_DeleteMessage(messageID);

	res.send({returnStatus: 'success'});
});

function loadFile() //loads settings on first load of app
{
	let rawdata = fs.readFileSync(JSONdatafile);
	let myJson = JSON.parse(rawdata); 

	if (myJson.Rooms)
	{
		Rooms = myJson.Rooms;
	}

	if (myJson.Timers)
	{
		Timers = myJson.Timers;
	}

	if (myJson.Messages)
	{
		Messages = myJson.Messages;
	}
}

function saveFile() //saves settings to a local storage file for later recalling on restarts, etc.
{
	var myJson = {
		Rooms: Rooms,
		Timers: Timers,
		Messages: Messages 
	};

	fs.writeFileSync(JSONdatafile, JSON.stringify(myJson, null, 1), 'utf8', function(error) {
		if (error)
		{ 
			console.log('error: ' + error);
		}
		else
		{
			console.log('file saved');
		}
	});
}

//SOCKET.IO config
io.sockets.on('connection', function(socket) {
	// VIEWER SOCKETS //
	socket.on('TimeKeeper_JoinRoom', function(roomID) {
		switch(roomID)
		{
			case 'TimeKeeper_Clients':
				socket.join('TimeKeeper_Clients');
				break;
			default:
				socket.join(roomID);
				console.log(roomID + ' joined.');
				socket.emit('TimeKeeper_Timers', TimeKeeper_GetTimers(roomID));
				socket.emit('TimeKeeper_Messages', TimeKeeper_GetMessages(roomID));
				break;
		}
	});
	
	socket.on('TimeKeeper_GetAllRooms', function(onlyShowEnabled) {
		socket.emit('TimeKeeper_Rooms', TimeKeeper_GetRooms(onlyShowEnabled)); 
	});

	socket.on('TimeKeeper_GetTimers', function(roomID) {
		socket.emit('TimeKeeper_Timers', TimeKeeper_GetTimers(roomID)); 
	});

	socket.on('TimeKeeper_GetMessages', function(roomID) {
		socket.emit('TimeKeeper_Messages', TimeKeeper_GetMessages(roomID)); 
	});

	socket.on('disconnect', function(){
		switch(socket.room)
		{
			case 'Viewer':
				console.log('Viewer Client Disconnected.');
				break;
			default:
				break;
		}
	});
});

function uuidv4() //unique UUID generator for IDs
{
	return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

//TimeKeeper Data Functions
function TimeKeeper_GetRooms(onlyShowEnabled)
{
	let roomsArray = [];

	if (onlyShowEnabled)
	{
		for (let i = 0; i < Rooms.length; i++)
		{
			if (Rooms[i].enabled)
			{
				roomsArray.push(Rooms[i]);
			}
		}
	}
	else
	{
		roomsArray = Rooms;
	}

	return roomsArray;
}

function TimeKeeper_GetRoom(roomID)
{
	let roomObj = Rooms.find(o => o.id === roomID);

	if (roomObj === undefined)
	{
		roomObj = null;
	}

	return roomObj;
}

function TimeKeeper_AddRoom(roomObj)
{
	let newRoomObj = {};

	newRoomObj.id = 'room-' + uuidv4();
	newRoomObj.name = roomObj.name;
	newRoomObj.enabled = roomObj.enabled;

	Rooms.push(newRoomObj);
	saveFile();
}

function TimeKeeper_UpdateRoom(roomID, roomObj)
{
	let updatedRoomObj = Rooms.find((o, i) => {
		if (o.id === roomID)
		{
			Rooms[i] = roomObj; // need to update this to go property by property, and data check each one
			return true; // stop searching
		}
	});

	saveFile();

	return updatedRoomObj;
}

function TimeKeeper_DeleteRoom(roomID)
{
	Rooms.find((o, i) => {
		if (o.id === roomID)
		{
			Rooms.splice(i, 1);
		}
	});

	saveFile();
}

function TimeKeeper_GetAllTimers()
{
	return Timers;
}

function TimeKeeper_GetTimers(roomID)
{
	let timersArray = [];

	for (let i = 0; i < Timers.length; i++)
	{
		if ((Timers[i].roomID === roomID) || (roomID === 'room-0'))
		{
			timersArray.push(Timers[i]);
		}
	}

	return timersArray;
}

function TimeKeeper_GetTimer(timerID)
{
	let timerObj = Timers.find(o => o.id === timerID);

	if (timerObj === undefined)
	{
		timerObj = null;
	}

	return timerObj;
}

function TimeKeeper_AddTimer(timerObj)
{
	let newTimerObj = {};

	if (!timerObj.id) { //only add the id if we didn't already send one - helpful for API uses where we might want to have the same ID every time
		newTimerObj.id = 'timer-' + uuidv4();
	}
	else {
		newTimerObj.id = timerObj.id;
	}
	newTimerObj.datetime = timerObj.datetime;
	newTimerObj.label = timerObj.label;
	newTimerObj.expireMillis = timerObj.expireMillis;
	newTimerObj.publishMillis = timerObj.publishMillis;
	newTimerObj.roomID = timerObj.roomID;

	if (timerObj.triggersEnabled === true) {
		newTimerObj.triggersEnabled = true;
	}
	else if (timerObj.triggersEnabled === false) {
		newTimerObj.triggersEnabled = false;
	}
	else {
		newTimerObj.triggersEnabled = true;
	}

	if (timerObj.triggers) {
		newTimerObj.triggers = [];
		//process the triggers specified in the timer object
		for (let i = 0; i < timerObj.triggers.length; i++) {
			let valid = true;
			let triggerObj = timerObj.triggers[i];

			if (!triggerObj.id) {
				triggerObj.id = 'trigger' + uuidv4();
			}

			if (!SupportedTriggerTypes.includes(triggerObj.type)) { //the type is not one of the currently implemented types
				valid = false;
			}

			if (valid) {
				newTimerObj.triggers.push(triggerObj);
			}
		}
	}

	Timers.push(newTimerObj);
	if (timerObj.roomID === 'room-0')
	{
		io.emit('TimeKeeper_Timers', TimeKeeper_GetTimers(timerObj.roomID));
	}
	else
	{
		io.to(timerObj.roomID).emit('TimeKeeper_Timers', TimeKeeper_GetTimers(timerObj.roomID)); //send it to the unique room
	}
	
	console.log('sending new timer to room: ' + timerObj.roomID);
	
	io.to('room-0').emit('TimeKeeper_Timers', TimeKeeper_GetAllTimers()); //send update timers to room-0
	
	saveFile();

	return newTimerObj;
}

function TimeKeeper_UpdateTimer(timerID, timerObj)
{
	let updatedTimerObj = {};
	let found = false;

	for (let i = 0; i < Timers.length; i++)
	{
		if (Timers[i].id === timerID)
		{
			Timers[i].datetime = timerObj.datetime;
			Timers[i].label = timerObj.label;
			Timers[i].publishMillis = timerObj.publishMillis;
			Timers[i].expireMillis = timerObj.expireMillis;
			Timers[i].roomID = timerObj.roomID;
			found = true;
			break;
		}
	}

	if (found) //send the updated timer to the room
	{
		saveFile();

		if (timerObj.roomID === 'room-0')
		{
			io.emit('TimeKeeper_Timers', TimeKeeper_GetTimers(timerObj.roomID));
		}
		else
		{
			io.to(timerObj.roomID).emit('TimeKeeper_Timers', TimeKeeper_GetTimers(timerObj.roomID));
		}
	}
	else // just re-add it if it got deleted
	{
		timerObj.id = timerID;
		TimeKeeper_AddTimer(timerObj);
	}

	updatedTimerObj = timerObj;

	return updatedTimerObj;
}

function TimeKeeper_DeleteTimer(timerID)
{
	let index = null;

	for (let i = 0; i < Timers.length; i++)
	{
		if (Timers[i].id === timerID)
		{
			index = i;
			break;
		}
	}

	if (index !== null)
	{
		let roomID = Timers[index].roomID;

		Timers.splice(index, 1);

		if (roomID === 'room-0')
		{
			io.emit('TimeKeeper_Timers', TimeKeeper_GetTimers(roomID));
		}
		else
		{
			io.to(roomID).emit('TimeKeeper_Timers', TimeKeeper_GetTimers(roomID));
		}
	}

	saveFile();
}

function TimeKeeper_EnableTriggers(timerId, value) {
	for (let i = 0; i < Timers.length; i++) {
		if (Timers[i].id === timerId) {
			Timers[i].triggersEnabled = value;
			return Timers[i];
		}
	}
}

function TimeKeeper_GetMessages(roomID)
{
	let messagesArray = [];

	for (let i = 0; i < Messages.length; i++)
	{
		if ((Messages[i].roomID === roomID) || (Messages[i].roomID === 'room-0'))
		{
			messagesArray.push(Messages[i]);
		}
	}

	return messagesArray;
}

function TimeKeeper_GetMessage(messageID)
{
	let messageObj = Messages.find(o => o.id === messageID);

	if (messageObj === undefined)
	{
		messageObj = null;
	}

	return messageObj;
}

function TimeKeeper_AddMessage(messageObj)
{
	let newMessageObj = {};

	newMessageObj.id = 'message-' + uuidv4();
	newMessageObj.datetime = new Date().getTime();
	newMessageObj.message = messageObj.message;
	newMessageObj.expireMillis = messageObj.expireMillis;
	newMessageObj.publishMillis = messageObj.publishMillis;
	newMessageObj.roomID = messageObj.roomID;

	Messages.push(newMessageObj);

	if (messageObj.roomID === 'room-0')
	{
		io.emit('TimeKeeper_Messages', TimeKeeper_GetTimers(messageObj.roomID));
	}
	else
	{
		io.to(messageObj.roomID).emit('TimeKeeper_Messages', TimeKeeper_GetTimers(messageObj.roomID));
	}

	console.log('sending new message to room: ' + newMessageObj.roomID);
	console.log(TimeKeeper_GetMessages(messageObj.roomID));
	saveFile();
}

function TimeKeeper_UpdateMessage(messageID, messageObj)
{
	let updatedMessageObj = {};
	let found = false;

	for (let i = 0; i < Messages.length; i++)
	{
		if (Messages[i].id === messageID)
		{
			Messages[i].datetime = messageObj.datetime;
			Messages[i].message = messageObj.message;
			Messages[i].publishMillis = messageObj.publishMillis;
			Messages[i].expireMillis = messageObj.expireMillis;
			Messages[i].roomID = messageObj.roomID;
			found = true;
			break;
		}
	}

	if (found) //send the updated message to the room
	{
		saveFile();

		if (messageObj.roomID === 'room-0')
		{
			io.emit('TimeKeeper_Messages', TimeKeeper_GetMessages(messageObj.roomID));
		}
		else
		{
			io.to(messageObj.roomID).emit('TimeKeeper_Messages', TimeKeeper_GetMessages(messageObj.roomID));
		}
	}
	else // just re-add it if it got deleted
	{
		messageObj.id = messageID;
		TimeKeeper_AddTimer(messageObj);
	}

	updatedMessageObj = messageObj;

	return updatedMessageObj;
}

function TimeKeeper_DeleteMessage(messageID)
{
	let index = null;

	for (let i = 0; i < Messages.length; i++)
	{
		if (Messages[i].id === messageID)
		{
			index = i;
			break;
		}
	}

	if (index !== null)
	{
		let roomID = Messages[index].roomID;

		Messages.splice(index, 1);

		if (roomID === 'room-0')
		{
			io.emit('TimeKeeper_Messages', TimeKeeper_GetMessages(roomID));
		}
		else
		{
			io.to(roomID).emit('TimeKeeper_Messages', TimeKeeper_GetMessages(roomID));
		}
	}

	saveFile();
}

function TimeKeeper_ReviewTimers()
{
	// looks at all the timers and deletes any that are older than 5 minutes (that ran out 5 minutes ago or more)
	console.log('Reviewing old timers and messages.');

	let d = new Date();
	let Timers_ToDelete = [];
	let Messages_ToDelete = [];

	//Review Timers for expired ones
	for (let i = 0; i < Timers.length; i++)
	{
		let dt = Timers[i].datetime;
		let distance = dt - d + 1000;
		if (distance < - (5 * 60 * 1000)) // 5 mimutes
		{
			// delete this from the array, but add it to an array of items to delete, rather than deleting it from the same array while looping
			console.log(Timers[i].id + ' has expired.');
			Timers_ToDelete.push(Timers[i].id);
		}
	}

	for (let i = 0; i < Timers_ToDelete.length; i++)
	{
		TimeKeeper_DeleteTimer(Timers_ToDelete[i]);
	}

	//Review Messages for expired ones
	for (let i = 0; i < Messages.length; i++)
	{
		let dt = Messages[i].datetime;
		let distance = dt - d + 1000;
		if (distance < - (5 * 60 * 1000)) // 5 mimutes
		{
			// delete this from the array, but add it to an array of items to delete, rather than deleting it from the same array while looping
			console.log(Messages[i].id + ' has expired.');
			Messages_ToDelete.push(Messages[i].id);
		}
	}

	for (let i = 0; i < Messages_ToDelete.length; i++)
	{
		TimeKeeper_DeleteMessage(Messages_ToDelete[i]);
	}

	saveFile();

	setTimeout(TimeKeeper_ReviewTimers, 60 * 1000); // runs every minute
}

function TimeKeeper_CheckTriggers()
{
	//looks at all the timers and runs any triggers if it is time to do so
	for (let i = 0; i < Timers.length; i++)
	{
		let timer = Timers[i];
		if (timer.triggers) {
			let dtTimer = timer.datetime;
			for (let j = 0; j < timer.triggers.length; j++) {
				let trigger = timer.triggers[j];
				let time = trigger.time;
				let dtTrigger = dtTimer + time; //the time since epoch for the trigger time. Could be more or less than the actual timer
				let dtNow = new Date().getTime(); //curent epoch time
				console.log('dtTimer:  ' + dtTimer);
				console.log('dtTrigger:' + dtTrigger);
				console.log('dtNow:    ' + dtNow);
				if (dtTrigger <= dtNow) { //the trigger needs to be run
					TimeKeeper_CheckTrigger(timer.id, trigger.id);
				}
				else {
					console.log('no');
				}
			}
		}
	}
}

function TimeKeeper_CheckTrigger(timerId, triggerId) {
	console.log('checking trigger...');
	for (let i = 0; i < Timers.length; i++) {
		if (Timers[i].id === timerId) {
			for (let j = 0; j < Timers[i].triggers.length; j++) {
				if (Timers[i].triggers[j].id === triggerId) {
					//this is the one we want
					if (!Timers[i].triggers[j].runCount && Timers[i].triggersEnabled) { //only run it if it has not been run yet and triggers are enabled for this timer
						console.log('Executing Trigger...');
						TimeKeeper_ExecuteTrigger(Timers[i].triggers[j]);
						Timers[i].triggers[j].runCount = 1;
					}
				}
			}
		}
	}
}

function TimeKeeper_ExecuteTrigger(triggerObj) {
	if (triggerObj.type === 'http') {
		console.log('Executing Trigger...');
		TimeKeeper_ExecuteTrigger_HTTP(triggerObj);
	}
}

function TimeKeeper_ExecuteTrigger_HTTP(triggerObj) {
	let props = triggerObj.properties;

	let options = {};
	if (props.method === 'GET') {
		//do an HTTP GET

		options.method = 'GET';
		options.url = props.url;

		axios(options);
	}
	else if (props.method === 'POST') {
		//do HTTP POST
		options.method = 'POST';
		options.url = props.url;
		options.data = props.data;
		if (props.contentType) {
			options.headers = { 'content-type': props.contentType }
		}
		
		axios(options);
	}
	else { //maybe add PATCH, PUT, etc. some day
		console.log('unsupported HTTP method for trigger: ' + triggerObj);
	}
}

http.listen(listenPort, function () {
	console.log('listening on *:' + listenPort);
});

loadFile(); //loads the last saved set of data
TriggerInterval = setInterval(TimeKeeper_CheckTriggers, 500); //starts the process to see which triggers need running
TimeKeeper_ReviewTimers(); //starts the review process to delete expired timers and messages from the arrays