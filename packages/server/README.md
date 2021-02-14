# Persistr Server

Event-driven data store, used for building applications that follow Event-Driven Design (EDD), Event-Driven Architectures (EDA), or event sourcing.

Persistr Server has an event-driven push model where it notifies applications of any changes made in the data store. Data in the store is saved as change events organized into event streams.

## Prerequisites

#### Node.js and NPM

Persistr Server is built using Node.js. It has been tested with `Node.js v14` and `NPM 7`. Make sure that you have both installed before installing Persistr Server.

The easiest way to install Node.js is to [install Node.js via package manager](https://nodejs.org/en/download/package-manager/) for your platform. NPM should come bundled with Node.js but if for some reason it doesn't, you can review [NPM install instructions here](https://www.npmjs.com/get-npm).

#### MySQL

You must have a MySQL server already installed and an appropriate account created for Persistr Server to use. On first-run, you will be prompted to enter in your MySQL connection string. Persistr Server will create a database called "persistr" and will also create all the needed database tables. You just need to make sure that you have an appropriate MySQL user account for Persistr Server to use and provide the MySQL connection string when prompted.

## Install

Install the server using `npm`

```
npm install -g @persistr/server
```

Run the server. It will detect that it is running for the first time and will prompt you for configuration settings.

```
$ persistr-server
✔ Configure? … yes
✔ Port? … 3010
✔ Root username? … root
✔ Root password? … 
✔ Log folder? … /Users/me/.persistr-server/logs/
✔ MySQL connection string? … mysql://root@localhost:3306/persistr
✔ Wrote configuration to /Users/me/.persistr-server/config.yaml
✔ Created MySQL 'persistr' database and tables
✔ Created root account
✔ Create demo account & database? … yes
✔ Created demo account & database

Persistr Server v4.5.7
Running on port 3010
```

Configuration settings that you will be prompted for:

- **Port:** TCP port number that the server will listen to.
- **Root username and password:** There is only one root user. Root user has ability to manage the server configuration and user accounts. Choose a secure username and password.
- **Log folder:** Server error logs will be stored in this folder. Default is `~/.persistr-server/logs`
- **MySQL connection string:** Backing database is MySQL. Enter your MySQL connection string here. Note that the connection string must specify `persistr` as the initial database or it will be rejected.
- **Demo account:** If you say `yes` then a demo user will be created with `demo` username and `demo` password. Persistr examples are designed to run out of the box with the demo account. If you're installing the server for development, it's recommended to create the demo account. If you're using the server for production then either don't create the demo account or deactivate/delete the demo account.

Configuration file is saved to `~/.persistr-server/config.yaml`

## CLI

There is a command-line interface for Persistr Server that can be used to manage the server and event streams. Read on for [CLI install instructions](https://github.com/persistr/cli).

## Client Libraries

Official [Javascript client library is available](https://github.com/persistr/js). It can be used client-side in all modern browsers and server-side with Node.js.

## Examples

An official collection of example code is [available here](https://github.com/persistr/examples). All examples run out-of-the-box with a default install of Persistr Server on a local machine.

## License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).
