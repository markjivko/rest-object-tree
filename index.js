'use strict';

/**
 * Entry point
 * 
 * @desc    REST Object Tree Generator - Entry Point
 * @cauthor Mark Jivko
 */
const fs = require('fs');
const path = require('path');
const logger = require('./src/util/logger.js');

class Runner {
    /**
     * Check node_modules is installed and start the runner
     */
    constructor() {
        logger.info(`\n # REST Object Tree Generator #`);

        do {
            // Probably first run, install node modules
            if (!fs.existsSync(path.join(__dirname, './node_modules'))) {
                logger.debug('Installing node modules');

                const { spawn } = require("child_process");
                const installScript = spawn("npm", ["install"]);
                installScript.stdout.on("data", data => logger.debug(`${data}`));
                installScript.stderr.on("data", data => logger.error(`${data}`));
                installScript.on('error', error => logger.error(`${error}`));
                installScript.on("close", code => 0 === code && this.run());
                break;
            }

            this.run();
        } while (false);
    }

    /**
     * Run the selected tool after node_modules were installed
     */
    run() {
        // List of known tools
        const knownTools = {
            'serve': this._serve, 
            'generate': this._generate
        };

        // Argument supplied to command line
        let argv = process.argv.slice(2);

        do {
            // No tool or invalid tool
            if (!argv.length || "function" !== typeof knownTools[argv[0]]) {
                logger.error(
                    !argv.length
                        ? 'No tool selected'
                        : 'Invalid tool selected'
                    );

                logger.debug('Please use one of the following:');
                console.log(Object.keys(knownTools).map(item => `  * ${item}\n`).join(''));
                break;
            }

            // Run the appropriate tool
            const tool = argv.shift();
            knownTools[tool](argv);
        } while (false);
    }

    /**
     * Serve the documentation and API
     */
    _serve() {
        const indexPath = path.join(__dirname, './out/index.js');

        do {
            if (!fs.existsSync(indexPath)) {
                logger.error(
                    "REST Object Tree API is missing!\n",
                    "Please regenerate the REST API with \`npm run generate\`\n"
                );
                break;
            }

            // Serve the file (`node index.js`)
            logger.debug('Launching REST Server')
            require(indexPath);
        } while (false);
    }

    /**
     * Generate REST Object Tree server code
     */
    _generate(args) {
        const generatorDir = path.join(__dirname, './src/generator/');
        const knownGenerators = fs.readdirSync(generatorDir)
            .map(file => {
                const fileStat = fs.lstatSync(`${generatorDir}/${file}`);

                // Basenames of js files
                return fileStat.isFile() && '.js' === path.extname(file) 
                    ? path.basename(file, '.js') 
                    : null;
            })
            .filter(name => null !== name);

        do {
            // No generator specified
            if (!Array.isArray(args) || !args.length) {
                args = ['local-postgresql'];
            }

            // Invalid generator specified
            if (-1 === knownGenerators.indexOf(args[0])) {
                logger.error('Invalid generator specified');
                logger.debug('Please use one of the following generators:');
                console.log(knownGenerators.map(item => ` % npm run generate ${item}\n`).join(''));
                break;
            }

            // Prepare the generator
            const generatorFile = args.shift();

            // Load the utility
            logger.info(`> Using the "${generatorFile}" generator...`);
            const generatorClass = require(`./src/generator/${generatorFile}.js`);

            // Run it
            (new generatorClass(args)).run();
        } while(false);
    }
}

// Initialize the runner
new Runner();

/* EOF */