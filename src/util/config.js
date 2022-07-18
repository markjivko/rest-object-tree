/**
 * Configuration utilities
 * 
 * @desc   Configuration object utilities
 * @author Mark Jivko
 */
module.exports = {

    /**
     * Validate configuration data
     * 
     * @param {object} configData Configuration object
     * @throws {string}
     */
    validate: (configData) => {
        /**
         * Check the input is a non-null object
         * 
         * @param {mixed} item 
         * @returns {boolean}
         */
        const isObject = (item => "object" === typeof item && null !== item);

        // Configuration data must be an object (associative array)
        if (!isObject(configData)) {
            throw `Configuration error: configuration is not a valid object`;
        }

        // Validate items in order
        ['info', 'object', 'tree'].forEach(key => {

            if (!isObject(configData[key])) {
                throw `Configuration error: key "${key}" is missing`;
            }

            switch (key) {
                // OpenAPI information block
                case 'info':
                    var keysMandatory = ['version', 'title', 'description'];
                    var keysOptional = ['contact', 'license'];

                    // Restrict object to these keys
                    Object.keys(configData[key]).forEach(infoKey => {
                        if (-1 === keysMandatory.indexOf(infoKey)
                            && -1 === keysOptional.indexOf(infoKey)) {
                            throw `Configuration error: info.${infoKey} is not allowed`;
                        }
                    })

                    // Validate mandatory keys
                    keysMandatory.forEach(infoKey => {
                        if ("string" !== typeof configData[key][infoKey]) {
                            throw `Configuration error: info.${infoKey} is not a string`;
                        }

                        if ('version' === infoKey && !configData[key][infoKey].match(/^\d+(?:\.\d+)*?$/g)) {
                            throw `Configuration error: info.${infoKey} is not a valid version string`;
                        }
                    });

                    // Validate optional keys
                    keysOptional.forEach(infoKey => {
                        if ("undefined" !== typeof configData[key][infoKey]) {
                            // But not an object
                            if (!isObject(configData[key][infoKey])) {
                                throw `Configuration error: info.${infoKey} is not an object`;
                            }

                            // Restrict object to these keys
                            Object.keys(configData[key][infoKey]).forEach(infoSubKey => {
                                if (-1 === ['name', 'url'].indexOf(infoSubKey)) {
                                    throw `Configuration error: info.${infoKey}.${infoSubKey} is not allowed`;
                                }
                            });

                            // Name is mandatory
                            if ("string" !== typeof configData[key][infoKey]['name']) {
                                throw `Configuration error: info.${infoKey}.name is not a string`;
                            }

                            // URL is optional
                            if ("undefined" !== typeof configData[key][infoKey]['url']
                                && "string" !== typeof configData[key][infoKey]['url']) {
                                throw `Configuration error: optional info.${infoKey}.url is not a string`;
                            }
                        }
                    });
                    break;

                // Object definition
                case 'object':
                    // Allowed and mandatory keys
                    var keysMandatory = ['name', 'description'];
                    Object.keys(configData[key]).forEach(objectKey => {
                        // Validate object key
                        if (!objectKey.match(/^[a-z](?:\-?[a-z\d]+)*?$/g)) {
                            throw `Configuration error: invalid object name "${objectKey}"`;
                        }

                        // Validate type
                        if (!isObject(configData[key][objectKey])) {
                            throw `Configuration error: object.${objectKey} is not an object`;
                        }

                        // Restrict object to these keys
                        Object.keys(configData[key][objectKey]).forEach(objectSubKey => {
                            if (-1 === keysMandatory.indexOf(objectSubKey)) {
                                throw `Configuration error: object.${objectKey}.${objectSubKey} is not allowed`;
                            }
                        });

                        // Validate name and description
                        keysMandatory.forEach(objectSubKey => {
                            if ('undefined' === typeof configData[key][objectKey][objectSubKey]) {
                                throw `Configuration error: object.${objectKey}.${objectSubKey} is missing`;
                            }

                            if ('string' !== typeof configData[key][objectKey][objectSubKey]) {
                                throw `Configuration error: object.${objectKey}.${objectSubKey} is not a string`;
                            }
                        });
                    });
                    break;

                // Tree definition
                case 'tree':
                    Object.keys(configData[key]).forEach(treeKey => {
                        // Get the tree objects without the trailing or leading exclamation mark
                        const treeObjects = treeKey.split('/').map(item => item.replace(/(?:^\!|\!$)/g, ''));

                        // Hasmap for uniqueness check
                        var treeObjectsHashmap = {};
                        treeObjects.forEach(treeObject => {
                            // Object does not exist
                            if ("undefined" === typeof configData.object[treeObject]) {
                                throw `Configuration error: tree.${treeKey} - "object.${treeObject}" was not defined`;
                            }

                            // Object used more than once
                            if ("undefined" !== typeof treeObjectsHashmap[treeObject]) {
                                throw `Configuration error: tree.${treeKey} - "object.${treeObject}" can only be used once`;
                            }
                            treeObjectsHashmap[treeObject] = true;
                        });

                        // Validate description
                        if ("string" !== typeof configData[key][treeKey]) {
                            throw `Configuration error: tree.${treeKey} is not a string`;
                        }
                    });
                    break;
            }
        });
    }
};

/* EOF */