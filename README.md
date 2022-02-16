# TimeKeeper
A Node.js server supporting a generic API to create and display timers, countdowns, and messages to client browsers.

## Installing this software:
Copy the code to a working directly on your computer. Make sure Node is installed.
Run `npm install` to make sure all required modules are downloaded and installed.
Run `node main.js` to start the server. Runs on port 4000 by default.

## Using the API:
### Rooms:
Rooms allow you to control and specify which timers appear. This is helpful if you are running clocks in multiple venues or instances, and only want certain timers to appear on certain viewer screens.

#### Getting All Rooms:
Make a GET request to `/api/rooms` to receive a JSON reply of all available rooms.
Room objects are defined as:

* `id`: Unique ID generated by the server upon creation of the Room object.
* `name`: The friendly name of the room, displayed to the user when connecting to the viewer client.
* `enabled`: Boolean true/false, indicates if the Room is available for selection or not.

#### Getting a specific Room:
Make a GET request to `/api/room/roomID`, where *roomID* is the ID of the room, to receive a JSON reply of the room information.
If an invalid Room ID is specified, a reply of `{returnStatus: "invalid-room-id"}` will be returned. 

#### Adding a Room:
Make a POST request to `/api/room/add`, specifying all the Room object data, except for the ID, which will be automatically generated. The newly created Room object will be returned as a JSON reply. 

#### Updating a Room:
Make a POST request to `/api/room/roomID`, where roomID is the ID of the Room object, along with a JSON Room object in the POST body. It will return the updated Room object as a JSON reply. 

#### Deleting a Room:
Make a POST request to `/api/room/delete/roomID`, where *roomID* is the ID of the Room object. 

### Timers:
Timers are the objects that TimeKeeper will count down to, based on the viewer's current local system time.

#### Getting All Timers:
Make a GET request to `/api/timers` to receive a JSON reply of all available timers.

#### Getting a specific Timer:
Make a GET request to `/api/timer/timerID`, where timerID is the ID of the timer, to receive a JSON reply of the room information.
If an invalid Timer ID is specified, a reply of {returnStatus: "invalid-timer-id"} will be returned. 
Timer objects are defined as:

* `id`: Unique ID of the Timer object.
* `datetime`: The datetime in epoch milliseconds that the viewer page should count down to. See JavaScript date object and the getTime() method for more information.
* `label`: Friendly label to display alongside the timer, for a description.
* `expireMillis`: The number of milliseconds left in the countdown where the timer should start blinking red.
* `publishMillis`: The number of milliseconds left in the countdown where the timer should appear on the viewer page.
* `roomID`: The Room ID that this Timer should appear on. Specifying "room-0" means this Timer will be sent to all viewer pages regardless of the room they are viewing.
* `triggers`: Object array of triggers.
	* `id`: Unique ID of the Trigger Object. If you exclude this, one will be automatically generated.
	* `time`: The time to run this trigger, used as an offset from the time specified in the Trigger object `datetime` property. For example, a value of `-3000` would execute this trigger 3 seconds before the Timer reaches 0. `+3000` would execute the trigger 3 seconds after it reached 0.
	* `type`: Type of trigger, used to know how to execute. Currently implemented types: `http`
	* `properties`: Object containing properties for the trigger, varies depending on the type.
		`http` Properties:
		* `url`: The URL to request
		* `method`: `'GET'` or `'POST'`
		* `contentType`: The mime type to send. Will default to `application/json` if you exclude it
		* `data`: If using `'POST'`, the data to send

#### Adding a Timer:
Make a POST request to `/api/timer/add`, specifying all the Timer object data. If you exclude the ID, it will be automatically generated. The newly created Timer object will be returned as a JSON reply. 

#### Updating a Timer:
Make a POST request to `/api/timer/timerID`, where *timerID* is the ID of the Timer object, along with a JSON Timer object in the POST body. It will return the updated Timer object as a JSON reply. 

#### Deleting a Timer:
Expired Timers older than 5 minutes are automatically deleted, however if you wish to manually delete a timer, make a POST request to `/api/timer/delete/timerID`, where *timerID* is the ID of the Timer object. 

#### Adding a Countdown Timer:
Make a GET request to `/api/countdown/roomID/length`, where *roomID* is the ID of the Room object that this timer should be sent to. *length* signifies in seconds how long the countdown should be. The countdown is calculated based on the current datetime of the server.

#### Disabling Triggers for a Timer:
Make a GET request to `/api/timer/timerID/triggers-disable/` where *timerID* is the ID of the Timer object. You can re-enable with `triggers-enable`.

### Messages:
Messages can be sent and displayed on viewer clients.

#### Getting All Messages:
Make a GET request to `/api/messages` to receive a JSON reply of all available Message objects.

Message objects are defined as:

* `id`: Unique ID generated by the server upon creation of the Message object.
* `datetime`: The datetime in epoch milliseconds that the viewer page should count down to. See JavaScript date object and the getTime() method for more information.
* `message`: The actual message to display. HTML is OK to use.
* `expireMillis`: The number of milliseconds left in the countdown where the Message should start blinking red.
* `publishMillis"`: The number of milliseconds left in the countdown where the Message should appear on the viewer page.
* `roomID`: The Room ID that this Timer should appear on. Specifying "room-0" means this Message will be sent to all viewer pages regardless of the room they are viewing.

#### Adding a Message:
Make a POST request to `/api/message/add`, specifying all the Message object data, except for the ID, which will be automatically generated. The newly created Message object will be returned as a JSON reply. 

#### Updating a Message:
Make a POST request to `/api/message/messageID`, where *messageID* is the ID of the Message object, along with a JSON Timer object in the POST body. It will return the updated Timer object as a JSON reply. 

#### Deleting a Message:
Expired Messages older than 5 minutes are automatically deleted, however if you wish to manually delete a timer, make a POST request to `/api/message/delete/*messageID*`, where *messageID* is the ID of the Message object. 
