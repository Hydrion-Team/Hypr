const { Plugin } = require('../../../../dist');

const name = 'Test Plugin';
new Plugin(name, client => {
  if (client.isSelfbotInstance()) {
    console.log('OwO');
  } else {
    console.log('Oha');
  }
});
