Package.describe({
  name: "utilities:smart-publications",
  summary: "Smart publications",
  version: "0.1.1",
  git: "https://github.com/meteor-utilities/smart-publications.git"
});

Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.3-beta.11");

  api.use([
    'mongo',
    'ecmascript@0.1.6',
    'check',
    'modules',
    'underscore',
    'aldeed:simple-schema@1.5.3',
    'aldeed:collection2@2.8.0',
    'tmeasday:publish-counts@0.7.3',
    // 'peerlibrary:reactive-publish@0.2.0'
  ]);

  api.addFiles([
    'lib/smart-publications.js'
  ], ['client', 'server']);

  api.mainModule("lib/export.js", ["client", "server"]);


});
