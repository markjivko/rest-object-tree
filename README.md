# REST Object Tree Generator

## Usage

Prepare the new `rest/api/openapi.yaml` specification and generate the controller and service source-code based
on the input `

```
npm run generate
```

## REST API Description

📚 Template {becomes} Draft {published on-chain to} Object.

You cannot **create** objects or object drafts directly.  

1.  `PUT /object/{objectName}/template/{templateId}/{objectId}/` to create a Draft inside Object (added if missing)

You cannot **update** objects or object versions directly.  

1.  `PUT /object/{objectName}/{objectId}/draft/{draftId}/` to publish Draft to Object (append to version chain)
2.  `PUT /object/{objectName}/{objectId}/version/{version}/` to revert Object to version (trim version chain)

Drafts are discarded after publishing.  
Schemas can only be created and modified in Templates.

|          | Template   | Draft       | Object                  |
|----------|------------|-------------|-------------------------|
| Data     | Editable   | Editable    | Read-only (versionized) |
| Schema   | Editable   | Read-only   | Read-only (versionized) |

Data migration is the same as user input so it must be handled at the application level, not at the API level:  

1.  `POST | GET /object/{objectName}/template/{templateId}/` - (once) Prepare new schema and default data
2.  `GET /object/{objectName}/{objectId}/` - Fetch current object data, schema and schema ID
3.  Inside application - migrate data using #1 and #2
4.  `PUT /object/{objectName}/template/{templateId}/{objectId}/` with **publish=true** - Update Object with new data & schema

Applications should display any schema.  
Data migration should be performed on user request.

* * *

**Trees** define relationships between Objects.  
Assign trees using cardinality; use exclamation mark (`!`) for 1:

1.  **many-to-many** Example: `/tree/team/user`
2.  **one-to-many** Example: `/tree/organization!/team`
3.  **many-to-one** Example: `/tree/user/level!`
4.  **one-to-one** Example: `/tree/user!/logo!`

Trees endpoints example:

1.  `/organization!/team` - Teams are assigned to only one organization
2.  `/organization/team!/team` - Teams can have at most 1 parent
3.  **Note:** you cannot register a new `team` tree (at #2) if the `team` is not present in #1!
4.  In other words, if parent roots are defined, they must exist before adding branches
5.  In this example, you can only parent teams that are part of the same organization
  
Removing an **Object** deletes all associated **Trees**.