const AMF = require('../src/');

class Pizza {
    constructor(toppings = []) {
        this.toppings = toppings;
    }
}

AMF.registerClassAlias('Pizza', Pizza);

const client = new AMF.Client();

client.connect('http://localhost:8080/');
client.call('pizza-service.order', new Pizza(['cheese', 'tomato'])).then(res => {
    console.log(res);
});