# Smart Publications

Smarter publication for Meteor.

This package exposes methods that make working with publications and joins easier, and also lets you easily create publications that publish data based on your SimpleSchema schema. 

The two main features are:

- **Public/private** fields: specify which fields should be published.
- **Joins**: define publication joins in your schema. 

### Install

~~`meteor add utilities:smart-publications`~~

Atmosphere doesn't yet support the new `api.mainModule` syntax, so you'll have to manually clone this package locally for now. 

You can use a Git submodule, or else (my suggestion) use the [PACKAGE_DIRS](https://github.com/iron-meteor/iron-router#working-locally) technique.

### Schema Definition

In order for the package to work, your schema field definitions need to include the special `publish` and `joins` properties.

```js
Tasks = new Mongo.Collection("tasks");

const tasksSchema = new SimpleSchema({
  _id: {
    type: String,
    publish: true
  },
  text: {
    type: String,
    publish: true
  },
  createdAt: {
    type: Date,
    publish: true
  },
  userId: {
    type: String,
    publish: true,
    join: {
      collection: function () {return Meteor.users},
      fields: ['_id', 'username']
    }
  },
  upvoterIds: {
    type: [String],
    publish: true,
    join: {
      collection: function () {return Meteor.users},
      fields: ['_id', 'username'],
      limit: 5
    }
  },
  username: {
    type: String,
    publish: false
  }
});
Tasks.attachSchema(tasksSchema);
```

#### `publish` (boolean)

Defines if a field is published or not.

#### `join` (object)

An object with the following properties:

- `collection`: either a collection's name if it's a global object, or a function that returns the collection to join with. 
- `fields`: (optional) a list of fields to publish. If not specified, will default to all public fields.
- `limit`: (optional) a limit of how many documents to join.  

Note: fields possessing a `join` property should contain either a single `_id` or an array of `_id`s. 

### Methods

This package also adds the following methods to the `Mongo.Collection` prototype.

#### `Collection.smartPublish(publicationName, options)` (server)

Calling this creates a publication that publishes the public fields of all documents for a given collection. 

When subscribing to the smart publication, it expects a single object argument containing `selector` and `options` properties, which will be passed on to the `Collection.find()` call.

The publication also publishes a count of total results for the current arguments (accessible under the same name as the publication), using the [publish-counts](https://github.com/percolatestudio/publish-counts) package. 

You can also pass an optional `options` argument with the following properties:

- `callback`: a function that will get called on the publication's `terms` argument. Useful to perform checks based on the current user's `_id` (available as `terms.currentUserId`). The callback function should return an object with `selector` and `options` properties.
- `limit`: limit the maximum number of items the publication can return at once. 

#### `Collection.getPublishedFields()`

Returns an array containing the names of all fields where `publish` is `true`.

#### `Collection.getJoins()`

Returns an array containing join objects for the collection.

#### `Collection.getCursorJoins(cursor)`

For a given cursor, returns an array of cursors containing all join data.

### Using with ListContainer

If you're using the [ListContainer](https://github.com/meteor-utilities/react-list-container) package, you can also specify the `joinAs` property on each join to indicate which property you'd like the joined document to be available under:

```js
userId: {
  type: String,
  publish: true,
  join: {
    collection: function () {return Meteor.users},
    fields: ['_id', 'username'],
    joinAs: 'owner'
  }
}
```

You can then pass `myCollection.getJoins()` as the value for `ListContainer`'s `joins` argument.

### Utilities

You can also import the following utilities with

```js
import PublicationUtils from 'meteor/utilities:smart-publications'
```

#### `PublicationUtils.arrayToFields(array)`

Convert an array of field names (`["_id", title", "createdAt"]`) in a Mongo field specifier (`{_id: true, title: true, createdAt: true}`).

#### `PublicationUtils.addToFields(fieldsSpecifier, fieldsArray)`

Add an array of fields to a Mongo fields specifier.