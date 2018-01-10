# Random chat

This is a simple Node.js chat web app that will allow text communication between two visitors that are randomly selected from a set of visitors connected to the page. Any visitor can communicate only with one person at the time. When visitor leaves the the page (closes browser), the other person he was communicating with will be automatically connected to any other available person. If there isn't any available person to chat with him at the moment (there isn't a pair for him), app will inform visitor about this situation and he will be pending until there will be available some visitor to chat with. 

## Installation
```git clone https://github.com/methuz/random-chat
cd random-chat
npm install
```

## Testing
```npm install -g mocha
npm test
```

## Debugging
```DEBUG=main npm start
DEBUG=main npm test
```
