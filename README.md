# Smart Publications

Smart publication for Meteor.

#### [Watch 5-min Intro Video](https://www.youtube.com/watch?v=WgO6uUO3L4s&feature=youtu.be)

This package lets you easily create publications which publish data based on your SimpleSchema schema. 

In other words, it's a little like an `autopublish` that first looks at your schema before deciding what should or shouldn't be published. 

The two main features are:

- **Public/private** fields: specify which fields should be published.
- **Joins**: define publication joins in your schema (note: not reactive at this time). 

### Install

```
meteor add utilities:smart-publications
```

### Usage

#### Define your collection & schema

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
  username: {
    type: String,
    publish: false
  }
});
Tasks.attachSchema(tasksSchema);
```

- `publish`: `true` or `false`, defines if a field is published or not.
- `join.collection`: either a collection's name if it's a global object, or a function that returns the collection to join with. 
- `join.fields`: a list of fields to publish. If not specified, will default to all public fields.

Note: fields possessing a `join` property should contain either a single `_id` or an array of `_id`s. 

#### Create your publication

(On the server)

```js
Tasks.publish("myPublicationName");
```

#### Using with ListContainer

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

You can then pass `myCollection.simpleSchema.getJoins()` as the value for `ListContainer`'s `joins` argument.