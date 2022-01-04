// Modify to your preference
//var save_directory = mp.utils.getenv('HOME') + '/Desktop/anki_todo';
//
// Roadmap
// - Delete srt on exit
// - Word selection
// - Automatic deinflection
// - Generator script? (audio trimmer, anki upload)
// - Sample card generator
// - Frovo audio integration
// - Autonomous card creation

mp.msg.info("Scripts dir: " + mp.get_script_directory());
var configs_file = mp.get_script_directory().replace(/(\/[^\/]*){2}$/, "/script-opts/anki-aftermath.conf");
mp.msg.info("Path: " + configs_file);
var config_lines = mp.utils.read_file(configs_file).split('\n');


var save_directory = mp.utils.getenv('HOME') + '/Desktop/anki_recordings/mpv';
var time_range     = 10;  // Default: +/-10s from current time


mp.add_key_binding("t", "ankiAftermath", main);


function expandEnvVars(env, envvar, offset, str) {
    var str = str.slice(0, offset)
            + mp.utils.getenv(env)
            + str.slice(offset + env.length);

    return str.replace(/(\$\{.+\})/, expandEnvVars)
}

// Save content at current timestamp. Useful for making Anki cards later
var utils  = require('./utils');
var subs   = require('./extract_subs');
var select = require('./select_word');
var save_dir;


// Save a png screenshot at the current frame
function saveScreenshot() {
    mp.commandv("screenshot-to-file", save_dir + "/img.png", "video");
}


// Save +/-10s of audio from the current position
function saveAudio(time) {
    mp.command_native({
        name: "subprocess",
        capture_stdout: false,
        args: [
            "ffmpeg",
                "-ss", String(Math.floor(time) - 10),
                "-t",  String(20),
                "-i",  mp.get_property('path'),
                save_dir + "/audio.mp3",
        ],
    })
}


function main() {
    var was_paused = mp.get_property_native('pause');
    var pause_time = mp.get_property('time-pos');
    mp.set_property_bool('pause', true);

    save_dir = utils.newSaveDirectory(save_directory);

    select.main();

    // Wait until word selection has gone through before continuing
    mp.add_key_binding("R", "saveSelection", function () {
        var selected = select.saveSelection(save_dir);

        if (selected) {
            mp.osd_message(selected, 1);
            mp.set_property('pause', was_paused ? 'yes' : 'no');

            saveScreenshot();
            saveAudio(pause_time);
            subs.extractSubs(time_range, save_dir);

        }
    });
}


// Referenced from
// https://github.com/Arieleg/mpv-copyTime
