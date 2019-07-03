const mysqlDriver   = require("mysql");
const config = require("config");
const winston = require("winston");
const Chance = require("chance");



// Генератор тестовых данных



const chance = new Chance();

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



function prepareDB() {
    return new Promise((resolve, reject) => {
        mysql.connect(myerr => {
            if (myerr) {
                logger.error("error connecting: " + myerr.stack);
                process.exit(-1);
            }
            logger.info("mysql connection started"/* , {logtoken: "ABB48DF783E"} */);

            mysql.query("CREATE TABLE `books` ( \
                `id` int(10) NOT NULL AUTO_INCREMENT, \
                `title` varchar(100) COLLATE utf8_bin NOT NULL DEFAULT '', \
                `author` varchar(100) COLLATE utf8_bin NOT NULL DEFAULT '', \
                `date` date DEFAULT NULL, \
                `description` text COLLATE utf8_bin, \
                `image` varchar(200) COLLATE utf8_bin NOT NULL DEFAULT '', \
                PRIMARY KEY (`id`) \
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin",
            [],
            (myerr) => {
                if (myerr && myerr.code !== "ER_TABLE_EXISTS_ERROR")
                    return reject("prepereDB mysql error: " + myerr);

                logger.info("database structure created");
                resolve();
            });
        });
    });
}

function generateTestData() {
    let query, queryargs,
        ncycles = parseInt(config.data.dataset_size / config.data.gen_chunk_size),
        ncyclesDone = 0;

    for (let i = 0; i < ncycles; i++) {
        queryargs = [];
        for (let j = 0; j < config.data.gen_chunk_size; j++) {
            queryargs.push( chance.sentence({words: chance.integer({min: 1, max: 5})}) );
            queryargs.push( chance.name() );
            queryargs.push( chance.birthday({year: chance.year({min: 1990, max: 2019})}) );
            queryargs.push( chance.sentence() );
        }
        query = "INSERT INTO `books` (`title`,`author`,`date`,`description`) VALUES " + Array(config.data.gen_chunk_size).fill("(?,?,?,?)").join(",") + ";";

        mysql.query(
            query, queryargs,
            (myerr) => {
                if (myerr) {
                    logger.error("generateTestData mysql error: " + myerr);
                    throw myerr;
                }

                ncyclesDone++;
                if (ncyclesDone === ncycles) {
                    logger.info("data generated successfully, bye.");
                    mysql.end();
                }
            }
        );
    }
}


let main = async () => {
    try {
        await prepareDB();
        generateTestData();
    } catch (ex) {
        logger.error("EXCEPTION MAIN: " + ex);
    }
}
main();
