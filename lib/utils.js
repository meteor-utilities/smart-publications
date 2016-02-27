const PublicationUtils = {
  /**
   * Convert an array of fields to publish into a Mongo fields specifier
   * @param {Array} fieldsArray
   */
  arrayToFields(fieldsArray) {
    return _.object(fieldsArray, _.map(fieldsArray, function () {return true}));
  },
  /**
   * Add an array of fields to a Mongo fields specifier
   * @param {Array} fieldsSpecifier
   * @param {Array} fieldsArray
   */
  addToFields(fieldsSpecifier, fieldsArray) {
    fieldsSpecifier = _.extend(fieldsSpecifier, this.arrayToFields(fieldsArray));
  }
};

export default PublicationUtils;