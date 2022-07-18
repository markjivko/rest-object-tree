'use strict';

/**
 * Generator
 * 
 * @desc    Local + MySQL Generator
 * @cauthor Mark Jivko
 */
const Generator = require('../generator.js');
const path = require('path');
const logger = require('../util/logger.js');

module.exports = class Generator_LocalMysql extends Generator {

    /**
     * Template path
     * 
     * @type {string}
     */
    templatePath = path.join(__dirname, '../template/local');

    /**
     * Generate the objects
     */
    generateObjects() {
        // Controller
        this.mustache(
            `${this.templatePath}/controller/Object.mustache`,
            `${this.outputPath}/controller/Object.js`
        );

        // Service
        this.mustache(
            `${this.templatePath}/service/Object.mustache`,
            `${this.outputPath}/service/Object.js`
        );
    }

    /**
     * Generate the tree
     */
    generateTree() {
        // Controller
        this.mustache(
            `${this.templatePath}/controller/Tree.mustache`,
            `${this.outputPath}/controller/Tree.js`
        );

        // Service
        this.mustache(
            `${this.templatePath}/service/Tree.mustache`,
            `${this.outputPath}/service/Tree.js`
        );
    }

    /**
     * Generate the OpenAPI file
     */
    generateOpenApi() {
        this.openApi(`${this.outputPath}/api/openapi.yaml`);
    }

    /**
     * Generate common files
     */
    generateCommonFiles() {
        ['index', 'util/writer'].forEach(item => {
            this.mustache(
                `${this.templatePath}/${item}.mustache`,
                `${this.outputPath}/${item}.js`,
                this.configData
            );
        });        
    }
}

/* EOF */