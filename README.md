# Smart Publications

Smarter publication for Meteor.

This package exposes methods that make working with publications and joins easier, and also lets you easily create publications that publish data based on your SimpleSchema schema. 

The two main features are:

- **Public/private** fields: specify which fields should be published.
- **Joins**: define publication joins in your schema. 

### Install

`meteor add utilities:smart-publications`

### Schema Definition

In order to use this package, your schema field definitions need to include the special `publish` and `joins` properties.

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
  status: {
    type: String,
    publish: function (user) {return user.admin === true}
  },
  username: {
    type: String,
    publish: false
  }
});
Tasks.attachSchema(tasksSchema);
```

#### `publish` (boolean|function)

Defines if a field is published or not. Either a boolean, or a function that takes in a user and returns a boolean. 

If a boolean is used, the result will be the same for all users. If a function is used, it will expect the user to be passed to it. If no user is passed, the field will not be published. 

If the `publish` property is not specified, the field will be considered **unpublished** by default.

#### `join` (object)

An object with the following properties:

- `collection`: either a collection's name if it's a global object, or a function that returns the collection to join with. 
- `fields`: (optional) a list of fields to publish for the joined cursor. If not specified, will default to all public fields available to the current user. Note that if you manually specify a field here, it will be published whether it's otherwise available to the user or not. 
- `limit`: (optional) a limit of how many documents to join.  

Note: fields possessing a `join` property should contain either a single `_id` or an array of `_id`s. 

### Local vs Foreign Joins

There are two types of joins: 

- **Local** joins, such as a post that has a `categoriesIDs` property containing a list of category IDs. In this case, references to the related objects are stored *locally* on the document. 
- **Foreign** joins, such as multiple comments all pointing back to the same post via their `userId` property. In this case, references to the post are stored *remotely* on each comment itself. 

Note that at this time, this package only supports **local** joins, since you can't easily express foreign joins on a collection's schema.

### Methods

Out of the box this package doesn't do anything, it only adds the following methods to the `Mongo.Collection` prototype:

#### `Collection.getPublishedFields(user)`

Returns an array containing the names of all fields that can be published.

- `user` (object): optionally, a `user` argument can be passed to narrow the list down to fields that are available to a specific user (if `publish` properties are using functions). 

```js
Posts.getPublishedFields(Meteor.user());
```

#### `Collection.getJoins(checkPublish = true, user)`

Returns an array containing join objects for the collection, optionally narrowed down to a specific user. 

- `checkPublish` (boolean): whether to check the fields' `publish` values or ignore them (defaults to `true`). If you want to use the package's "join" feature but don't care about the published/unpublished aspect, just set this to `false`. 
- `user` (object): if provided, will be passed to the `publish` functions of each join field to narrow down joins to those available to a specific user. 

```js
Posts.getJoins();
```

#### `Collection.getCursorJoins(cursor, checkPublish = true, user)`

For a given collection and cursor, returns an array of cursors containing all join data.

- `cursor` (object) [required]: the cursor on which to look up joins. 
- `checkPublish` (boolean): whether to check the fields' `publish` values or ignore them (defaults to `true`).
- `user` (object): optionally, a `user` argument can also be passed to narrow the join down to fields that are available to a specific user (if `publish` properties are using functions). 

```js
Meteor.publish('posts', function (postsLimit) {
  const cursor = Posts.find({}, {limit: postsLimit});
  const joinedCursors = Posts.getCursorJoins(cursor);
  return [cursor].concat(joinedCursors);
});
```

#### `Collection.smartPublish(publicationName, options)` (server)

Calling this creates a publication that publishes the public fields of all documents for a given collection. 

When subscribing to the smart publication, it expects a single object argument containing `selector` and `options` properties, which will be passed on to the `Collection.find()` call.

The publication also publishes a count of total results for the current arguments (accessible under the same name as the publication), using the [publish-counts](https://github.com/percolatestudio/publish-counts) package. 

You can also pass an optional `options` argument with the following properties:

- `callback`: a function that will get called on the publication's `terms` argument. Useful to perform checks based on the current user's `_id` (available as `terms.currentUserId`). The callback function should return an object with `selector` and `options` properties. If the callback throws an error, the publication will return an empty array, making it a good place for authentication and authorization.
- `limit`: limit the maximum number of items the publication can return at once.

**Note: this method does not currently support foreign joins (e.g. getting all comments belonging to a post).**

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