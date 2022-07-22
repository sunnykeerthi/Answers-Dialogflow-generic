# Yext-Dialogflow

### Softwares Required

- [VS Code](https://code.visualstudio.com/Download) (or any other IDE)
- [Node.js](https://nodejs.org/en/download/)
- [ngrok](https://ngrok.com/download)

## Instructions

### Part 1

- Clone the Repository into local.
- Open it in your favourite editor.
- Open the folder by typing `cd Yext-Dialogflow`.
- Open the index.js file and add your `apiKey` and `experienceKey`. These can be found in **Experience Details** when we open any Experience.
- run `npm install`.
- once all the dependencies are installed, type in **node index.js**

### Part 2

- Unzip ngrok
- paste the file in `/usr/local/bin`
- In terminal, type `ngrok http 3000`
- Copy the **Forwarding https** link into a notepad.

### Part 3

- Open dialogflow in browser.
- Click on the created agent, navigate to fulfillment section.
- Enable the webhook by toggling in top right(If disabled).
- Under _url_ paste the link copied in _Part 2_ appending `/webhook` and save it.
- It should look something like `https://{someNumbers}.ngrok.io/webhook`.

### Part 4

- Click _Integrations_ from the left menu bar.
- Scroll down and select _Dialogflow Messenger Beta_
- In the popup click _Try now_
- This pops up a messenger where we can test the bot.
