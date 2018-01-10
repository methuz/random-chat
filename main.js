const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
try {
  config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/config.yml'), 'utf8'));
} catch (e) {
  console.log(e);
}

const http = require(path.join(__dirname, '/server.js'))

http.listen(config.port, () => {
  console.log(`listening on port ${config.port}`)
})
