Package.describe({
  name: "utilities:smart-publications",
  summary: "Smart publications",
  version: "0.0.1",
  git: "https://github.com/meteor-utilities/smart-publications.git"
});

Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'meteor-base',
    'mongo',
    'ecmascript',
    'check',
    'aldeed:simple-schema@1.5.3',
    'aldeed:collection2@2.8.0',
    'tmeasday:publish-counts@0.7.3'
  ]);

  api.addFiles([
    'lib/smart-publications.js'
  ], ['client', 'server']);

  api.addFiles([
  ], ['server']);

});
