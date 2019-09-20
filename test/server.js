const AMF = require('../src/');

class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}

AMF.registerClassAlias('Person', Person);

const server = new AMF.Server();

/*server.on('data', packet => {
    const message = packet.messages[0];
    const vector = new AMF.Vector(Person);

    vector.push(new Person('Zaseth', 17));

    packet.respond(vector);
});*/

class Pizza {
    constructor(toppings = []) {
        this.toppings = toppings;
    }
}

AMF.registerClassAlias('Pizza', Pizza);
AMF.Service.RequireRegistration = false;

class PizzaService extends AMF.Service {
    constructor() {
        super('pizza');
    }

    order(message, packet) {
        const pizza = message.shift();

        packet.respond('Successfully created order with toppings ' + pizza.toppings.join(', ') + '.');
    }
}

const service = new PizzaService();

server.registerService(service);
server.listen(() => {
    console.log('AMF server listening on port ' + server.port);
});