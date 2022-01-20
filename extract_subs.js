function extractSubs(time_range, save_dir) {
    var save_file = save_dir + "/subtitles.txt";
    var sub_file = createSubFile();

    audioTrimmer(sub_file, time_range, save_dir + "/trim_audio.sh");
    saveSubs(sub_file, time_range, save_file);

    return save_file
}


// Save all the subtitles in a +/- interval of time_range from current time
// Args:
//     sub_file (path):    Path to source subtitle file. Must be .srt format
//     time_range (float): Time range of subtitles to save
//     save_file (path):   Path to file to save
function saveSubs(sub_file, time_range, save_file) {
    var script_dir = mp.get_script_directory();
    var sub_time = mp.get_property_native('time-pos') - mp.get_property_native('sub-delay');

    var args = [
            script_dir + "/extract_subs.awk",
                "-v", "title=" + mp.get_property('filename/no-ext'),
                "-v", "time="  + Math.round(sub_time   * 1000),
                "-v", "range=" + Math.round(time_range * 1000),
                "-v", "output_file=" + save_file,
                "" + sub_file + ""];

    var subs = mp.command_native_async({
        name: "subprocess",
        capture_stdout: true,
        args: args,
    });
}


// Create an executable file for audio_trimmer
// Args:
//     sub_file (path):    Path to source subtitle file. Must be .srt format
//     time_range (float): Time range of subtitles to save
//     save_file (path):   Path to file to save
function audioTrimmer(sub_file, time_range, save_file) {
    var script_dir = mp.get_script_directory();
    var sub_offset = mp.get_property_native('sub-delay');
    var sub_time   = mp.get_property_native('time-pos') - sub_offset;

    mp.command_native_async({
        name: "subprocess",
        args: [
            script_dir + "/audio_trimmer.awk",
                "-v", "title=" + mp.get_property('filename/no-ext'),
                "-v", "time="  + Math.round(sub_time   * 1000),
                "-v", "range=" + Math.round(time_range * 1000),
                "-v", "offset="+ Math.round(sub_offset * 1000),
                "-v", "output_file=" + save_file,
                "" + sub_file + ""],
    });
}


// Path at which to save the source .srt file. This directory is removed when
// mpv exits
function subFileSavePath(sub_file_path) {
    var script_dir = mp.get_script_directory();
    var save_name  = sub_file_path.replace(/^.*\//, '')  // Basename
                                  .replace(/ /g, '_')    // Remove spaces
                                  .replace(/\.[^\.]+$/, '.srt');  // Extension to .srt
    mp.command_native({
        name: "subprocess",
        args: ["mkdir", "-p", script_dir + "/subtitles"],
    });

    // TODO: Only register this event once?
    mp.register_event("shutdown", function () {
        var sub_dir = mp.utils.file_info(script_dir + "/subtitles");

        if (typeof sub_dir != 'undefined' && sub_dir.is_dir) {
            mp.command_native({
                name: "subprocess",
                capture_stdout: "no",
                capture_stderr: "no",
                playback_only: false,
                args: ["rm", "-r", script_dir + "/subtitles"],
            });
        }
    });

    return script_dir + "/subtitles/" + save_name
}


function fileExists(file_path) {
    return (typeof mp.utils.file_info(file_path) !== 'undefined')
}


// Create an .srt file from the current subtitle track. Works with .mkv and
// .ass formats. If the file already exists, that one is used instead
function createSubFile() {
    var cw_dir       = mp.get_property_native('working-directory');
    var sub_filename = mp.get_property_native('current-tracks/sub/external-filename');
    var sub_source   = sub_filename ? sub_filename : mp.get_property('filename');

    var path_from = cw_dir + "/" + sub_source;
    var path_to   = subFileSavePath(path_from);

    if (!fileExists(path_to)) {
        // TODO: Check if this process exits without an error
        var subs = mp.command_native({
            name: "subprocess",
            capture_stdout: true,
            args: ["ffmpeg",
                        "-i", path_from,
                        "-map", "0:s:0",
                        "-f", "srt",
                        "-hide_banner",
                        "-loglevel", "error",
                        "-",
            ],
        });

        // Strip out unessential characters. Makes it easier to read
        var clean_subs = subs.stdout
                             .replace(/<[^>]*>/g, '')  // Html tag
                             .replace(/\u000D/g, '')   // Return carriage
                             .replace(/\u202A/g, '')   // Left to right embed
                             .replace(/\u202C/g, '');  // Right to left embed

        mp.utils.write_file("file://" + path_to, clean_subs);
    }

    return path_to
}


exports.extractSubs = extractSubs;
// ffmpeg -i ${video_file} -map 0:s:0 subs.srt
// sed -i '' 's#<[^>]*>##g' subs.srt
//
// Check if the subs are in an external file:
// current-tracks/sub/external
// current-tracks/sub/external-filename
//
// sub-delay
// options/sub-delay
