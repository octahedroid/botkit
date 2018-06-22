/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Create a new app via the Slack Developer site:

    -> http://api.slack.com

  Get a Botkit Studio token from Botkit.ai:

    -> https://studio.botkit.ai/

  Run your bot from the command line:

    clientId=<MY SLACK TOKEN> clientSecret=<my client secret> PORT=<3000> studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js

# USE THE BOT:

    Navigate to the built-in login page:

    https://<myhost.com>/login

    This will authenticate you with Slack.

    If successful, your bot will come online and greet you.


# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var env = require('node-env-file');

env(__dirname + '/.env');

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  usage_tip();
  // process.exit(1);
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');
var request = require('request');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    // debug: true,
    scopes: ['bot'],
    studio_token: process.env.studio_token,
    studio_command_uri: process.env.studio_command_uri
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
    var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGO_URI});
    bot_options.storage = mongoStorage;
} else {
    bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);

let incomingEvent = 'direct_message,direct_mention,mention,ambient';

controller.hears(['hi'], incomingEvent, function(bot, message) {
  bot.reply(message, 'Hi ... I heard a message.')
});

controller.hears(['hello'], incomingEvent, function(bot, message) {
  bot.reply(message, 'Hello? Hello? Hello?. Is there anybody in there?')
});

controller.hears(['hola', 'que tal'], incomingEvent, function(bot, message) {
  bot.reply(message, 'Hola que tal.')
});

controller.hears(['Open the pod bay doors'], incomingEvent, function(bot, message) {

  bot.reply(message, '...');

  bot.reply(message, {
      attachments:[
        {
          "title": "I’m sorry, Dave, I’m afraid I can’t do that.",
          "image_url": "https://i.ytimg.com/vi/NJ-CcFcM9Hw/maxresdefault.jpg",
          "color": "#ff0000"
        }
      ]
  });

});

controller.hears(['show crypto prices'], incomingEvent, function(bot, message) {

  bot.reply(message, 'fetching information ...');

  request({
    method: 'get',
    uri: 'https://api.bitso.com/v3/ticker',
    json: true,
  }, function (err, response, json) {
    
    let colors = [ 'good', 'warning', 'danger'];

    controller.log(JSON.stringify(json));

    for(var i = 0; i < json.payload.length; i++) {
        bot.reply(message, {
          attachments: [
            {
              "title": json.payload[i].book,
              "text":  JSON.stringify(json.payload[i], undefined, 2),
              "color":  colors[Math.floor(Math.random()*colors.length)]
            }
          ]
      });
    }

  });

});

// botkit-middleware-witai
// var wit = require('botkit-middleware-witai')({
//   // token: process.env.wit,
//   token: '',
// });

// var bot = controller.spawn({
//   // token: process.env.token,
//   token: 'eOg5Q4lwLYr0Et0y6Jrq5Ge0'
// });

// controller.middleware.receive.use(wit.receive);

// controller.hears('beer', 'direct_message,direct_mention,mention', function(bot, message) {

  // if (JSON.stringify(message) !== undefined) {
  //   controller.log('beer...');
  //   controller.log(JSON.stringify(message.intents.entities.intent.value));
  //   bot.reply(message, 'found')
  // }

// });
// botkit-middleware-witai

// witbot
// var Witbot = require('witbot');
// var witbot = Witbot('');

// // wire up DMs and direct mentions to wit.ai
// controller.hears('.*', incomingEvent, function (bot, message) {

//   bot.reply(message, 'WitAI ...');
//   bot.reply(message, message.text);

//   var wit = witbot.process(message.text, bot, message)

//   wit.hears('beer', 0.53, function (bot, message, outcome) {
    
//     bot.reply(message, message.entities)

//   })
// })
// witbot

// botkit-witai
var wit = require('botkit-witai')({
  // accessToken: 'BMRQUFXI3XQ3FCAOLWFM24QW3YUZ7UA5',
  accessToken: process.env.wit_ai_token,
  minConfidence: 0.6,
  logLevel: 'error'
});

controller.middleware.receive.use(wit.receive);

controller.hears(['.*'], incomingEvent, function (bot, message) {

  // controller.log( JSON.stringify(message) );
  if (message != undefined && message.entities != undefined) {

    var intent = message.entities.intent[0].value;
    var intent_type = intent + '_type';
    var type = message.entities[intent_type][0].value;

    controller.log( intent );
    controller.log( intent_type );

    // var text = intent_text(intent, intent_type);

    if (intent==='wiki') {
      request({
        method: 'get',
        uri: 'https://jsonplaceholder.typicode.com/posts?q='+fake_value,
        json: true,
      }, function (err, response, json) {
    
        controller.log(JSON.stringify(json));

        var attachment_mesages = [];
    
        for(var i = 0; i < json.length; i++) {
          attachment_mesages.push([
            {
              "title": json[i].title,
              "title_link":  'http://wiki.weknoincs.com/'+intent_type,
              "text":  json[i].body,
            }
          ]);
        }

        controller.log( attachment_mesages );


        bot.reply(message, { attachments: attachment_mesages } );      
    
      });
    }

    

    controller.log(text);
  
    bot.reply(message, 'intent: ' + intent + ', type: ' + type);
    if (text) {
      bot.reply(message, text);
    }
  }
  
});
// botkit-witai

controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

if (!process.env.clientId || !process.env.clientSecret) {

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(controller);

  webserver.get('/', function(req, res){
    res.render('installation', {
      studio_enabled: controller.config.studio_token ? true : false,
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })

  var where_its_at = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me/';
  console.log('WARNING: This application is not fully configured to work with Slack. Please see instructions at ' + where_its_at);
} else {

  webserver.get('/', function(req, res){
    res.render('index', {
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })
  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + '/components/user_registration.js')(controller);

  // Send an onboarding message when a new team joins
  require(__dirname + '/components/onboarding.js')(controller);

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(controller);

  // enable advanced botkit studio metrics
  require('botkit-studio-metrics')(controller);

  var normalizedPath = require("path").join(__dirname, "skills");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./skills/" + file)(controller);
  });

  // This captures and evaluates any message sent to the bot as a DM
  // or sent to the bot in the form "@bot message" and passes it to
  // Botkit Studio to evaluate for trigger words and patterns.
  // If a trigger is matched, the conversation will automatically fire!
  // You can tie into the execution of the script using the functions
  // controller.studio.before, controller.studio.after and controller.studio.validate
  if (process.env.studio_token) {
      controller.on('direct_message,direct_mention,mention', function(bot, message) {
          controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).then(function(convo) {
              if (!convo) {
                  // no trigger was matched
                  // If you want your bot to respond to every message,
                  // define a 'fallback' script in Botkit Studio
                  // and uncomment the line below.
                  // controller.studio.run(bot, 'fallback', message.user, message.channel);
              } else {
                  // set variables here that are needed for EVERY script
                  // use controller.studio.before('script') to set variables specific to a script
                  convo.setVar('current_time', new Date());
              }
          }).catch(function(err) {
              bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
              debug('Botkit Studio: ', err);
          });
      });
  } else {
      console.log('~~~~~~~~~~');
      console.log('NOTE: Botkit Studio functionality has not been enabled');
      console.log('To enable, pass in a studio_token parameter with a token from https://studio.botkit.ai/');
  }
}


function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('clientId=<MY SLACK CLIENT ID> clientSecret=<MY CLIENT SECRET> PORT=3000 studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js');
    console.log('Get Slack app credentials here: https://api.slack.com/apps')
    console.log('Get a Botkit Studio token here: https://studio.botkit.ai/')
    console.log('~~~~~~~~~~');
}


// function intent_text(intent, intent_type) {

//   if (intent==='wiki') {
//     return fetch_wiki(intent_type);
//   }

//   return text;
// }

// function fetch_wiki(intent_type) {

//   var values = ['lorem', 'ipsum', 'dolor'];
//   let fake_value = values[Math.floor(Math.random()*values.length)];

//   request({
//     method: 'get',
//     uri: 'https://jsonplaceholder.typicode.com/posts?q='+fake_value,
//     json: true,
//   }, function (err, response, json) {

//     controller.log(JSON.stringify(json));
//     var attachment_mesages = [];

//     for(var i = 0; i < json.length; i++) {
//       attachment_mesages.push([
//         {
//           "title": json[i].title,
//           "title_link":  'http://wiki.weknoincs.com/'+intent_type,
//           "text":  json[i].body,
//         }
//       ]);
//     }    

//     return {
//       attachments: attachment_mesages
//     }

//   });

// }
