'use strict';

/**
 * Generator
 * 
 * @desc    Common Generator
 * @cauthor Mark Jivko
 */
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const mustache = require('mustache');
const logger = require('./util/logger.js');

module.exports = class Generator {
    /**
     * Start time in milliseconds
     * 
     * @type {int}
     */
    startTime = null;

    /**
     * Path to configuration file
     * 
     * @type {string}
     */
    configPath = path.join(__dirname, '../config/config.yaml');

    /**
     * Path to common resources
     * 
     * @type {string}
     */
    resourcesPath = path.join(__dirname, './generator/resource');

    /**
     * Configuration object
     * 
     * @type {object}
     */
    configData = {};

    /**
     * Output directory
     * 
     * @type {string}
     */
    outputPath = path.join(__dirname, '../out');

    /**
     * Initialize the server files
     */
    constructor(args) {
        this.startTime = Date.now();

        // Create the configuration from sample
        if (!fs.existsSync(this.configPath)) {
            logger.debug('Preparing "config.yaml"');
            fs.copyFileSync(
                path.join(__dirname, '../config/config.sample.yaml'),
                this.configPath
            );
        }

        // Get the configuration data
        this.configData = yaml.safeLoad(
            fs.readFileSync(this.configPath, 'utf8')
        );

        // @TODO Validate configuration data

        // Clean-up the output
        if (fs.existsSync(this.outputPath)) {
            logger.debug('Clean-up the output');
            fs.rmSync(this.outputPath, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
            });
        }
        fs.mkdirSync(this.outputPath);
    }

    /**
     * Common runner
     * Go through all defined methods prefixed with "generate" in ascending order
     */
    run() {
        // Prepare the generators in ASC order
        const generators = Object.getOwnPropertyNames(this.__proto__)
            .filter(methodName => 0 === methodName.indexOf('generate'))
            .sort((a, b) => `${a}`.localeCompare(b));

        // Run each one
        generators.forEach(generator => {
            const generatorLabel = generator.replace(/([A-Z])/g, " $1");
            logger.debug(`${generatorLabel[0].toUpperCase()}${generatorLabel.slice(1)}`);

            // Execute the task
            this[generator]();
        });

        logger.info(`> Created project in "./out" in ${Date.now() - this.startTime}ms`);
    }

    /**
     * Parse a mustache file and save it to destination
     * 
     * @param {string} fromPath Source ".mustache" file path
     * @param {string} toPath   (optional) Destination file path
     * @returns {string} Parsed file contents
     */
    mustache(fromPath, toPath) {
        var result = "";

        do {
            if ('string' !== typeof fromPath || '.mustache' !== path.extname(fromPath)) {
                logger.error('Input file must have the ".mustache" extension');
                break;
            }

            if (!fs.existsSync(fromPath)) {
                logger.error(`Could not find input mustache file "${fromPath}"`);
                break;
            }

            /**
             * Export a string as JSON and remove leading and ending quotes
             * 
             * @param {string} string 
             * @param {boolean} stripNewLines Remove new line characters before export
             * @returns {string}
             */
            const exportJsonString = (string, stripNewLines) => {
                return JSON.stringify(
                        stripNewLines
                            ? string.replaceAll(/[\r\n]+/g, '')
                            : string
                    )
                    .replace(/^"|"$/g, '');
            };

            /**
             * Convert a string to camelCase, removing non-word characters
             * 
             * @param {string} string Input string
             * @returns {string} Camel-cased string
             */
            const toCamelCase = (string) => {
                // camelCased method name
                return string.replaceAll(/\W+/g, ' ')
                    .split(' ')
                    .map((word) => {
                        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    })
                    .join('');
            };

            // Parse the .mustache file
            logger.debug(` * Rendering "${path.basename(fromPath)}"...`)
            var $this = this;
            result = mustache.render(
                fs.readFileSync(fromPath).toString(),
                {
                    info: this.configData.info,
                    extra: this.configData.extra,
                    objects: Object.keys(this.configData.object),
                    object: {
                        key: function () {
                            return `${this}`;
                        },
                        method: function () {
                            return toCamelCase(`${this}`);
                        },
                        name: function () {
                            return exportJsonString(`${$this.configData.object[`${this}`].name}`, true);
                        },
                        description: function () {
                            return exportJsonString(`${$this.configData.object[`${this}`].description}`);
                        }
                    },
                    branches: Object.keys(this.configData.tree),
                    branch: {
                        key: function() {
                            return `${this}`;
                        },
                        method: function () {
                            return toCamelCase(`${this}`);
                        },
                        path: function() {
                            return `${this}`.replace(/[\!\s]+/g, '');
                        },
                        args: function() {
                            var result = [];
                            const objects = `${this}`.replace(/[\!\s]+/g, '').split('/');
                            
                            objects.forEach((object, index) => {
                                result.push({
                                    key: object,
                                    varName: `id${toCamelCase(object)}`,
                                    name: exportJsonString(`${$this.configData.object[`${object}`].name}`, true),
                                    last: index === objects.length - 1
                                });
                            });

                            return result;
                        },
                        argList: function() {
                            var list = [];

                            `${this}`.replace(/[\!\s]+/g, '').split('/').forEach(object => {
                                list.push(`id${toCamelCase(object)}`);
                            });

                            return list.join(', ');
                        },
                        objList: function() {
                            return `${this}`.replace(/[\!\s]+/g, '').split('/').join(',');
                        },
                        description: function () {
                            return exportJsonString(`${$this.configData.tree[`${this}`]}`);
                        },
                        cardinality: function() {
                            var htmlList = [];

                            // Get the definition parts
                            const parts = `${this}`.split('/');
                            for (var i = 0; i <= parts.length - 2; i++) {
                                var objectLeft = parts[i].replace(/[\!\s]+/g, '');
                                var objectRight = parts[i + 1].replace(/[\!\s]+/g, '');

                                // Ends with mark
                                var objectLeftCard = (parts[i].length-1 === parts[i].indexOf('!') ? '1 *' : 'N ⁂');

                                // Starts with mark
                                var objectRightCard = (0 === parts[i + 1].indexOf('!') ? '* 1' : '⁂ N');

                                // Append to the HTL list
                                htmlList.push(`<li><b>${objectLeft}</b> to <b>${objectRight}</b>: <b>${objectLeftCard}</b> to <b>${objectRightCard}</b></li>`);
                            }

                            return exportJsonString(`<br/><hr/>Cardinality:<br/><ol>${htmlList.join('')}</ol>`);
                        },
                        last: function () {
                            // Last item in the list
                            return Object.keys($this.configData.tree).indexOf(`${this}`)
                                === Object.keys($this.configData.tree).length - 1;
                        }
                    }
                }
            );

            // Save to file
            if ("string" === typeof toPath) {
                // Create the destination
                const destDir = path.dirname(toPath);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, {recursive: true});
                }

                // Write to file
                logger.debug(` - Saving render to "${toPath.replace(/^.*?\/out\//g, 'out/')}"...`)
                fs.writeFileSync(toPath, result);
            }
        } while(false);

        return result;
    }

    /**
     * Generate the OpenAPI YAML file
     * 
     * @param {string} toPath Destination file path
     * @returns {string} Open API YAML file contents
     */
    openApi(toPath) {
        // JSON is more forgiving than YAML on extra spaces
        const openApiJsonString = this.mustache(`${this.resourcesPath}/openapi.mustache`);

        // Copy the openapi information block
        var openApiJsonObject = JSON.parse(openApiJsonString);
        openApiJsonObject.info = this.configData.info;
        
        // Convert to YAML
        const result = yaml.dump(openApiJsonObject, { quotingType : '"' });
        
        // Save to file
        if ("string" === typeof toPath) {
            // Create the destination
            const destDir = path.dirname(toPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Write to file
            logger.debug(` - Saving OpenAPI specification to "${toPath.replace(/^.*?\/out\//g, 'out/')}"...`)
            fs.writeFileSync(toPath, result);
        }

        return result;
    }
}

/* EOF */