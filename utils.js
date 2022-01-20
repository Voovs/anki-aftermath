// Format seconds to time string
// Example:
//   formatTime(3661) === "01:01:01"
//   formatTime(10)   === "00:00:10"
function formatTime(secs) {
    var hours = Math.floor(secs / 3600);
    secs -= hours * 3600;

    var mins = Math.floor(secs / 60);
    secs -= mins * 60;

    var h0 = hours < 10 ? '0' : '';
    var m0 = mins  < 10 ? '0' : '';
    var s0 = secs  < 10 ? '0' : '';

    return h0 + hours + ':' + m0 + mins + ':' + s0 + secs
}


// Create a new directory at given path that won't conflict with previous names
function newSaveDirectory(save_root) {
    var prev_saves = mp.utils.readdir(save_root, 'dirs');
    var suffix = prev_saves ? prev_saves.length : 0;

    if (prev_saves) while (prev_saves.indexOf("word_save_" + suffix) !== -1)
        suffix++;

    var save_dir = save_root + "/word_save_" + suffix;

    mp.command_native({
        name: "subprocess",
        args: ["mkdir", "-p", save_dir],
    });
    return save_dir
}


// Slice out a clip of audio from the current video
// Args:
//  start: Starting time in seconds of audio clip
//  length: Duration of audio clip. (end_time - start_time)
//  save_path: File to write audio into. Should be an mp3 or similar
function ffmpeg_audio(start, length, save_path) {
    mp.command_native_async({
        name: "subprocess",
        capture_stdout: false,
        args: [
            "ffmpeg",
                "-ss", String(start),
                "-t",  String(length),
                "-i",  mp.get_property('path'),
                "-hide_banner",
                "-loglevel", "error",
                save_path,
        ],
    })
}


exports.newSaveDirectory = newSaveDirectory;
exports.formatTime = formatTime;
exports.ffmpeg_audio = ffmpeg_audio;
