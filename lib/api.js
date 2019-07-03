const mysqlDriver   = require("mysql");
const config = require("config");
const winston = require("winston");



// АПИ



const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(msg => `${msg.timestamp} [${msg.level}]: ${msg.logtoken ? msg.logtoken + " - " + msg.message : msg.message}`)
    ),
    transports: [
        new winston.transports.Console({level: "info"})
    ]
});

const mysql = mysqlDriver.createConnection({
    host     : config.mysql.host,
    user     : config.mysql.user,
    password : config.mysql.password,
    database : config.mysql.database
});
mysql.connect(myerr => {
    if (myerr) {
        logger.error("error connecting: " + myerr.stack);
        process.exit(-1);
    }
    logger.info("mysql connection started"/* , {logtoken: "ABB48DF783E"} */);
});


function API() {
    this.add = async function(ctx) {
        let title = ctx.request.query.title || "",
            author = ctx.request.query.author || "",
            date = ctx.request.query.date || "",
            description = ctx.request.query.description || "";

        await new Promise((resolve, reject) => {
            mysql.query(
                "INSERT INTO `books` (`title`,`author`,`date`,`description`) VALUES (?,?,?,?);",
                [title, author, date, description],
                (myerr, myres) => {
                    if (myerr) {
                        logger.error("add mysql error: " + myerr);
                        return reject("mysql error");
                    }
                    if (myres.affectedRows !== 1) {
                        logger.warn("add error: no affected on row add");
                        return reject("no affected");
                    }

                    console.log(myres);
                    resolve();
                }
            );
        });

        ctx.body = "add ok";
    }
}


module.exports = API;