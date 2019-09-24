# libamf
An Action Message Format library for node.js.

![Dependencies](https://img.shields.io/david/pyrodash/libamf) ![License](https://img.shields.io/npm/l/libamf)

## Usage
### Parser/Serializer
```javascript
const libamf = require('libamf');

const data = libamf.serialize(5, libamf.ENCODING.AMF3);
const int = libamf.deserialize(data, libamf.ENCODING.AMF3);
```
### Server
```javascript
const {Server, Service} = require('libamf');

class PizzaService extends Service {
	constructor() {
		super('pizza');
		
		this.register('order', 'handleOrder');
		this.register('cancelOrder', this.cancelOrder.bind(this));
		this.register('asyncMethod', 'asyncMethod');
	}
	
	handleOrder(pizza, message) {
		message.respond({ status: 1, message: pizza.type + ' pizza ordered!'});
	}
	
	cancelOrder(pizza, message) {
		const id = pizza.id;
		
		return { status: 1, message: 'Order ' + id + ' has been cancelled successfully.'};
	}

	asyncMethod(message) {
		return new Promise((resolve, reject) => {
			resolve('this will be sent as a response');
		});
	}
}

const server = new Server();

// You can also just do this
server.on('data', packet => {
    console.log(packet);
});

server.registerService(pizzaService);
server.listen(8080, () => {
	console.log('Listening on port 8080');
});
```
You can stop services from enforcing the `-service` suffix to the name by doing:
```javascript
libamf.Service.ForceSuffix = false;
```
You can also allow any service method to be used without registration by doing:
```javascript
libamf.Service.RequireRegistration = false;
```
If you wish to return other values in your service methods, you can disable responding with return values using:
```javascript
libamf.Service.ReturnResponses = false;
```
To write whole numbers as integers, use this:
```javascript
libamf.AMF3.AssumeIntegers = true;
```
### Client
```javascript
const {Client} = require('libamf');
const client = new Client();

client.connect('http://localhost:8080/');
client.call('pizza-service.order', { type: 'cheese' }).then(res => {
	console.log(res);
});
```

## Supported types
### AMF0
|Type|Read|Write|Note|
|--|--|--|--|
|Null|✔|✔|
|Undefined|✔|✔|
|String|✔|✔|
|Long String|✔|✔|
|Number|✔|✔|
|Boolean|✔|✔|
|Reference|✔|✔|
|Strict Array|✔|✔|
|ECMA Array|✔|✔|
|Typed Object|✔|✔|
|Date|✔|✔|
|AVMPLUS|✔|✔|
|XML|✔|✔|
### AMF3
|Type|Read|Write|Note|
|--|--|--|--|
|Undefined|✔|✔|
|Null|✔|✔|
|String|✔|✔|
|Double|✔|✔|
|Integer|✔|✔|
|Boolean|✔|✔|
|Date|✔|✔|
|Array|✔|✔|
|Dictionary|✔|✔|
|Vector|✔|✔|
|Byte Array|✔|✔|
|Custom object|✔|✔|
|XML|✔|✔|

## TODO
 - Better documentation
 - Better tests
 - Better TODO
