
SimpleSchema.extendOptions({
  public: Match.Optional(Boolean), // public: true means the field is published freely
  join: Match.Optional(Object)
});

Utils = {};

/**
 * Convert an array of fields to publish into a Mongo fields specifier
 * @param {Array} fieldsArray
 */
Utils.arrayToFields = function (fieldsArray) {
  return _.object(fieldsArray, _.map(fieldsArray, function () {return true}));
};

/**
 * For a given cursor, get an array of all its joins
 */
Mongo.Collection.prototype.getCursorJoins = function (cursor) {

  const collection = this;
  const schema = collection.simpleSchema();
  const joins = schema.getJoins();
  const documents = cursor.fetch();
  let joinsArray = [];
  let collectionsToJoin = {};

  // loop over each join defined in the schema
  joins.forEach(join => {

    // if join collection is a string interpret it as global, if it's a function get its return
    const joinCollection = typeof join.collection === "function" ? join.collection() : (Meteor.isClient ? window[join.collection] : global[join.collection]);
    const collectionName = joinCollection._name;
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

    if (collectionsToJoin[collectionName]) { // if the current collection already has joins, add ids to its joinIDs property
      collectionsToJoin[collectionName].ids = collectionsToJoin[collectionName].ids.concat(joinIDs);
    } else { // else add it to the collectionsToJoin object
      collectionsToJoin[collectionName] = {
        collection: joinCollection,
        ids: joinIDs
      };
    }

  });

  // loop over collectionsToJoin to add each cursor to joinsArray
  _.each(collectionsToJoin, (item) => {

    const publicFields = Utils.arrayToFields(item.collection.simpleSchema().getPublicFields());

    // add cursor for this join to joinsArray
    joinsArray.push(item.collection.find({_id: {$in: _.unique(item.ids)}}, {fields: publicFields}));

  });

  return joinsArray;
};


/**
 * Create a publication function for lists
 */
Mongo.Collection.prototype.publish = function (publicationName) {

  const collection = this;
  publicationName = typeof publicationName === "undefined" ? collection._name+".list" : publicationName;

  Meteor.publish(publicationName, function (terms) {
    
    const emptyTerms = {selector: {}, options: {}};

    if (terms) {
      terms.currentUserId = this.userId;
      ({selector, options} = collection.parameters.get(terms));
    } else {
      ({selector, options} = emptyTerms);
    }

    Counts.publish(this, publicationName, collection.find(selector, options));
    
    options.fields = Utils.arrayToFields(collection.simpleSchema().getPublicFields());

    const cursor = collection.find(selector, options);

    return [cursor].concat(collection.getCursorJoins(cursor));

  });

};

SimpleSchema.prototype.getPublicFields = function () {
  var schema = this._schema;
  var fields = _.filter(_.keys(schema), function (fieldName) {
    var field = schema[fieldName];
    return !!field.public;
  });
  return fields;
};

SimpleSchema.prototype.getJoins = function () {
  const schema = this._schema;
  const joins = [];
  _.each(_.keys(schema), fieldName => {
    var field = schema[fieldName];
    if (field.join) {
      joins.push({
        property: fieldName,
        joinAs: field.join.joinAs,
        collection: field.join.collection
      });
    }
  });
  return joins;
}