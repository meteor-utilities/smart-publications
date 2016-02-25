# Smart Publications

Smart publication for Meteor.

This package lets you easily create publications which publish data based on your SimpleSchema schema.

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
    public: true
  },
  text: {
    type: String,
    public: true
  },
  createdAt: {
    type: Date,
    public: true
  },
  owner: {
    type: String,
    public: true,
    join: {
      collection: function () {return Meteor.users}
    }
  },
  username: {
    type: String,
    public: false
  }
});
Tasks.attachSchema(tasksSchema);
```

- `public`: `true` or `false`, defines if a field is published or not.
- `join.collection`: either a collection's name if it's a global object, or a function that returns the collection to join with. 

Note: fields possessing a `join` property should contain either a single `_id` or an array of `_id`s. 

#### Create your publication

(On the server)

```js
Tasks.publish("myPublicationName");
```