// Modify to your preference
//var root_save_dir = mp.utils.getenv('HOME') + '/Desktop/anki_todo';
//
// Roadmap
// - Delete srt on exit
// - Word selection
// - Automatic deinflection
// - Generator script? (audio trimmer, anki upload)
// - Sample card generator
// - Frovo audio integration
// - Autonomous card creation

// TODO: config file
mp.msg.info("Scripts dir: " + mp.get_script_directory());
var configs_file = mp.get_script_directory().replace(/(\/[^\/]*){2}$/, "/script-opts/anki-aftermath.conf");
mp.msg.info("Path: " + configs_file);
var config_lines = mp.utils.read_file(configs_file).split('\n');


// Save content at current timestamp. Useful for making Anki cards later
var utils  = require('./utils');
var subs   = require('./extract_subs');
var select = require('./select_word');


// Global state
var opts = {
    // Directory where components will be saved. Each screenshot is saved in
    // its own subdirectory
    root_save_dir: mp.utils.getenv('HOME') + '/Desktop/anki_recordings/mpv',
    save_dir: undefined,

    // Amount in seconds to save around screenshot. Used for both subtitles and
    // audio intervals. Default is +/-10s, which saves 20s of audio
    time_range: 10,

    // True when the sub-selection menu is being shown on the OSD. User need to
    // confirm or discard their selection to clear this state
    is_waiting_for_selection: false,

    // True if the player was paused before opening the selection menu. Will
    // restore the previous state after selection menu is cleared
    was_paused: undefined,

    // Time at which the screenshot is taken. Stored in case the user changes
    // this during the selection menu
    pause_time: undefined,

    // Path to the .srt subtitles file for the current subtitles. This is
    // stored in the script directory and cleared when mpv exits
    sub_file: undefined
};


// Proto. Not currently used in script
function expandEnvVars(env, envvar, offset, str) {
    var str = str.slice(0, offset)
            + mp.utils.getenv(env)
            + str.slice(offset + env.length);

    return str.replace(/(\$\{.+\})/, expandEnvVars)
}

// Save a png screenshot at the current frame
function saveScreenshot() {
    mp.command_native_async({
        name: "screenshot-to-file",
        filename: opts.save_dir + "/img.png",
        flags: "video",
    });
}


// Save +/-10s of audio from the current position
function saveAudio(time) {
    mp.command_native_async({
        name: "subprocess",
        capture_stdout: false,
        args: [
            "ffmpeg",
                "-ss", String(Math.floor(time) - 10),
                "-t",  String(20),
                "-i",  mp.get_property('path'),
                "-hide_banner",
                "-loglevel", "error",
                opts.save_dir + "/audio.mp3",
        ],
    })
}


function main() {
    if (opts.is_waiting_for_selection) return;

    opts.was_paused = mp.get_property_native('pause');
    opts.pause_time = mp.get_property('time-pos');
    mp.set_property_bool('pause', true);

    opts.save_dir = utils.newSaveDirectory(opts.root_save_dir);
    opts.is_waiting_for_selection = select.main();
    opts.sub_file = subs.extractSubs(opts.time_range, opts.save_dir);

    saveScreenshot();
    // TODO: a-b loop?
    saveAudio(opts.pause_time);

    if (opts.is_waiting_for_selection) {
        mp.register_script_message("SubmitSelection", function () {
            mp.unregister_script_message("SubmitSelection");
            mp.unregister_script_message("DiscardSelection");

            var selected_text = select.saveSelection(opts.sub_file);
            mp.osd_message(selected_text, opts.was_paused ? 2 : 1);

            mp.set_property('pause', opts.was_paused ? 'yes' : 'no');
            opts.is_waiting_for_selection = false;
        });
        mp.register_script_message("DiscardSelection", function () {
            mp.unregister_script_message("DiscardSelection");
            mp.unregister_script_message("SubmitSelection");

            select.clearSelection();
            mp.commandv("run", "rm", "-r", opts.save_dir);
            mp.osd_message("Discarded", 1);

            mp.set_property('pause', opts.was_paused ? 'yes' : 'no');
            opts.is_waiting_for_selection = false;
        });
    } else {
        mp.set_property('pause', opts.was_paused ? 'yes' : 'no');
    }
}


mp.add_key_binding("t", "ankiAftermath", main);

// Referenced from
// https://github.com/Arieleg/mpv-copyTime
