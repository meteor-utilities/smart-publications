import PublicationUtils from "./utils.js";

SimpleSchema.extendOptions({
  publish: Match.Optional(Match.Any), // public: true means the field is published freely
  join: Match.Optional(Object)
});


/**
 * For a given cursor, get an array of all its joins
 */
Mongo.Collection.prototype.getCursorJoins = function (cursor, checkPublish = true, user) {

  const collection = this;
  const schema = collection.simpleSchema();
  const joins = collection.getJoins(checkPublish, user);
  const documents = cursor.fetch();
  let joinsArray = [];
  let collectionsToJoin = {};

  // loop over each join defined in the schema
  joins.forEach(join => {

    // if join collection is a string interpret it as global, if it's a function get its return
    const joinCollection = typeof join.collection === "function" ? join.collection() : (Meteor.isClient ? window[join.collection] : global[join.collection]);
    const collectionName = joinCollection._name;
    const collectionPublicFields = joinCollection.getPublishedFields(user);

    // use join.fields if specified, else default to joining all public fields in the schema
    const fields = join.fields ? join.fields : collectionPublicFields; 

    let joinIDs = [];

    // loop over each document in the cursor
    documents.forEach(document => {

      // get the field containing the join id or ids
      const joinField = document[join.property];
      let idsToAdd = [];

      if (Array.isArray(joinField)) { // join field is an array
        // if the join is limited, only take the first `join.limit` documents

        idsToAdd = join.limit ? _.first(joinField, join.limit) : joinField;
      } else { // join field is a single id, so wrap it in an array
        idsToAdd = [joinField];
      }

      // add id or ids to the list of joined ids
      joinIDs = joinIDs.concat(idsToAdd);
    
    });

    if (collectionsToJoin[collectionName]) { // if the current collection already has joins, add ids and fields to collectionsToJoin
      collectionsToJoin[collectionName].ids = collectionsToJoin[collectionName].ids.concat(joinIDs);
      collectionsToJoin[collectionName].fields = collectionsToJoin[collectionName].fields.concat(join.fields);
    } else { // else add it to the collectionsToJoin object
      collectionsToJoin[collectionName] = {
        collection: joinCollection,
        ids: joinIDs,
        fields: fields
      };
    }
    
  });

  // loop over collectionsToJoin to add each cursor to joinsArray
  _.each(collectionsToJoin, (item) => {

    const fields = PublicationUtils.arrayToFields(_.unique(item.fields));

    // add cursor for this join to joinsArray
    joinsArray.push(item.collection.find({_id: {$in: _.unique(item.ids)}}, {fields: fields}));

  });

  return joinsArray;
};


/**
 * Create a publication function
 */
Mongo.Collection.prototype.smartPublish = function (publicationName, publicationOptions = {}) {

  const collection = this;
  publicationName = typeof publicationName === "undefined" ? collection._name+".list" : publicationName;

  Meteor.publish(publicationName, function (terms) {
    
    const currentUser = Meteor.users.findOne(this.userId);

    if (terms) {
      terms.currentUserId = this.userId;
    }

    // this.autorun(function (computation) { // disable for now until it works with SSR

      let selector = terms && terms.selector ? terms.selector : {};
      let options = terms && terms.options ? terms.options : {};

      // if a callback exists, call it on terms to set selector and options
      if (publicationOptions.callback) {
        ({selector, options} = publicationOptions.callback(terms));
      }

      Counts.publish(this, publicationName, collection.find(selector, options));
      
      if (publicationOptions.limit) {
        options.limit = _.min(publicationOptions.limit, options.limit);
      }

      options.fields = PublicationUtils.arrayToFields(collection.getPublishedFields(currentUser));

      const cursor = collection.find(selector, options);

      return [cursor].concat(collection.getCursorJoins(cursor, currentUser));

    // });

  });
};

Mongo.Collection.prototype.getPublishedFields = function (user) {
  var schema = this.simpleSchema()._schema;
  var fields = _.filter(_.keys(schema), function (fieldName) {
    var field = schema[fieldName];
    return canAccessField(user, field);
  });
  return fields;
};

Mongo.Collection.prototype.getJoins = function (checkPublish = true, user) {
  const schema = this.simpleSchema()._schema;
  const joins = [];
  _.each(_.keys(schema), fieldName => {

    var field = schema[fieldName];

    if (field.join && (!checkPublish || canAccessField(user, field))) {
      joins.push({
        property: fieldName,
        ...field.join
      });
    }
  });
  return joins;
}

const canAccessField = (user, field) => {
  if (typeof field.publish === "undefined") { 
    // field doesn't have a publish property, default to false
    return false;
  } else if (typeof field.publish === "function") {
    // field's publish property is a function, return result
    return field.publish(user);
  } else {
    // publish property is boolean, return it
    return !!field.publish;
  }
}