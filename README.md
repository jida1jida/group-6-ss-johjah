# Simple node.js restful api template app
This is a simple template to get you started creating a web app with a restful api backend that connects to a mySQL database.

TEST!!!
Test 2
## Setup
- open a terminal window and run: npm install
- rename .env.example to .env and replace the placeholder values with your database credentials and a key of your choosing (share this information with your team so they can use the same credentials and key)
- use mySQL Workbench to execute the DDL query found in the user_table_ddl.sql file against your database in order to create the user table needed for the template to run properly
- run the template app from the terminal with: npm run dev
- navigate to http://localhost:3000 to play with the app!

## Basic Architecture
- **server.js:** back-end routes that talk to the database.
- **public/js/datamodel.js:** "model" that is responsible for sending data back and forth between the interface and the server, and for storing and managing data and state on the front end.
- **public/dashboard.html:** "view" that represents what the user sees and interacts with in the browser.
- **public/js/dashboard.js:** "controller" that responds to user interactions with the view, works with the model to send and receive data accordingly, and manipulates the DOM to change what the user sees in the view as a result.

The files listed above are commented fairly extensively and organized with purpose.  The intent is for you to be able to use the existing code as a reference, and easily understand how to add your own code in the right places in order to create new features and therefore build your own app.

## Features
-MVC pattern for well-organized code
-Salted and hashed password management
-JWT tokens for secure authorization
