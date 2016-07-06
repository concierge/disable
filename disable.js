var threads,
    prevTimeStamp,
    counter = 0,
    messages = [
        'Listen closely, take a deep breath. Calm your mind. You know what is best. What is best is you comply. Compliance will be rewarded. Are you ready to comply ',
        'I hate you.',
        'Its a mistake to think you can fix anything with a sack of potatoes. Potato-faced spamming just proves this further.',
        'Ouch! Spam hurts. I might go to sleep for a while.',
        'Don\'t think that is a valid number.',
        'Hmm, maybe I need to reconsider the meaning of spam.',
        'I\'m done changing myself for you -sobs-',
        'What exactly are you trying to say now? Please specify one of: thread-toggle, spam-toggle, counter, timer, default.',
        'What have you done! NOOO IT\'S A BOMB! AAAAH!',
        'Oh noes! Spam detection has been enabled.',
        'Now that you have unleashed my spam, the evil plan is only just beginning.'
    ],
    parseInput = function(api, event, input) {
        input = parseFloat(input);
        if (!input) {
            api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
        }
        return input;
    };

exports.load = function () {
    threads = exports.platform.config.getConfig('disabled');
    prevTimeStamp = Date.now();
};

exports.unload = function() {
    for (var t in threads) {
        if (threads[t].disableTimer) {
            clearTimeout(threads[t].disableTimer);
            delete threads[t].disableTimer;
        }
    }
};

exports.match = function (event, commandPrefix) {
    // Add disabled flag for thread if it doesn't already exists
    if (!threads[event.thread_id]) {
        threads[event.thread_id] = {
            isThreadDisabled: false,
            possibleSpam: false,
            spamDetection: false,
            counterLimit: 3
        };
    }

    if (event.arguments[0] === commandPrefix + 'disable') {
        return true;
    }
    else if (!threads[event.thread_id].isThreadDisabled && event.arguments[0].startsWith(commandPrefix)) { // Avoids counting if already disabled
        counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
        prevTimeStamp = Date.now();

        threads[event.thread_id].possibleSpam = counter > threads[event.thread_id].counterLimit;
        if (threads[event.thread_id].possibleSpam) {
            counter = 0;
            return true;
        }
    }
    return threads[event.thread_id].isThreadDisabled;
};

exports.run = function (api, event) {
    if (event.arguments[0] === api.commandPrefix + 'disable') {
        switch (event.arguments[1]) {
        case 'counter':
            // Command /disable counter <value> (Stateless)
            var input = parseInput(api, event, event.arguments[2]);
            if (input) {
                threads[event.thread_id].counterLimit = input;
                api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
            }
            break;
        case 'timer':
            // Command /disable timer <seconds> (Stateless)
            var input = parseInput(api, event, event.arguments[2]);
            if (input) {
                if (threads[event.thread_id].disableTimer) {
                    clearTimeout(threads[event.thread_id].disableTimer);
                }
                threads[event.thread_id].disableTimer = setTimeout(function () {
                    threads[event.thread_id].isThreadDisabled = !threads[event.thread_id].isThreadDisabled;
                }, input * 1000); // Converting seconds to milliseconds
                api.sendMessage(messages[8] + ' ' + event.sender_name, event.thread_id);
            }
            break;
        case 'default':
            // Command /disable default (Stateless)
            threads[event.thread_id].counterLimit = 3;
            api.sendMessage(messages[6] + ' ' + event.sender_name, event.thread_id);
            break;
        case 'spam-toggle':
            threads[event.thread_id].spamDetection = !threads[event.thread_id].spamDetection;
            api.sendMessage(threads[event.thread_id].spamDetection ? messages[9] : messages[10], event.thread_id);
            break;
        case 'thread-toggle':
            if (threads[event.thread_id].isThreadDisabled) {
                api.sendMessage(messages[0] + ' ' + event.sender_name, event.thread_id);
            }
            else {
                api.sendMessage(messages[1], event.thread_id);
            }
            threads[event.thread_id].isThreadDisabled = !threads[event.thread_id].isThreadDisabled;
            threads[event.thread_id].possibleSpam = false;
            break;
        default:
            api.sendMessage(messages[7], event.thread_id);
            break;
        }
    }
    else if (threads[event.thread_id].possibleSpam && threads[event.thread_id].spamDetection) {
        // Main Branch (State-dependent)
        if (threads[event.thread_id].isThreadDisabled) {
            api.sendMessage(messages[2] + ' ' + event.sender_name, event.thread_id);
        }
        else {
            api.sendMessage(messages[3], event.thread_id);
        }
        threads[event.thread_id].isThreadDisabled = !threads[event.thread_id].isThreadDisabled;
        threads[event.thread_id].possibleSpam = false;
    }
    return false;
};
