Package.describe({
  name: "utilities:smart-publications",
  summary: "Smart publications",
  version: "0.2.0",
  git: "https://github.com/meteor-utilities/smart-publications.git"
});

Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.4.4.1");

  api.use([
    'mongo',
    'ecmascript@0.1.6',
    'check',
    'modules',
    'underscore',
    'aldeed:collection2-core@2.0.0',
    'tmeasday:publish-counts@0.8.0',
    'peerlibrary:reactive-publish@0.3.0'
  ]);

  api.addFiles([
    'lib/smart-publications.js'
  ], ['client', 'server']);

  api.mainModule("lib/export.js", ["client", "server"]);


});
