// mp.utils.read_file(sub_file).split("\n")
// mp.utils.write_file(output, parsed_str)
function extractSubs(time_range, save_dir) {
    var sub_file = createSubFile();

    saveSubs(sub_file, time_range, save_dir);

    mp.osd_message("Saved sub file", 1);
}


function saveSubs(sub_file, time_range, save_dir) {
    var script_dir = mp.get_script_directory();
    var sub_time = mp.get_property_native('time-pos') - mp.get_property_native('sub-delay');

    mp.msg.info(
        "Time pos: " + mp.get_property_native('time-pos') + "\n"
        + "Sub delay: " + mp.get_property_native('sub-delay'));

    var args = [
            script_dir + "/extract_subs.awk",
                "-v", "title=" + mp.get_property('filename/no-ext'),
                "-v", "time="  + Math.round(sub_time   * 1000),
                "-v", "range=" + Math.round(time_range * 1000),
                "-v", "output_file=" + save_dir + "/subs.txt",
                "" + sub_file + ""];

    mp.msg.info(args.toString());
    mp.msg.info(args[4]);

    var subs = mp.command_native_async({
        name: "subprocess",
        capture_stdout: true,
        args: args,
    });
}


function subFileSavePath(sub_file_path) {
    var script_dir = mp.get_script_directory();
    var save_name  = sub_file_path.replace(/^.*\//, '')  // Basename
                                  .replace(/ /g, '_')    // Remove spaces
                                  .replace(/\.[^\.]+$/, '.srt');  // Extension to .srt
    mp.command_native({
        name: "subprocess",
        args: ["mkdir", "-p", script_dir + "/subtitles"],
    });

    return script_dir + "/subtitles/" + save_name
}


function fileExists(file_path) {
    return (typeof mp.utils.file_info(file_path) !== 'undefined')
}


function createSubFile() {
    var cw_dir       = mp.get_property_native('working-directory');
    var sub_filename = mp.get_property_native('current-tracks/sub/external-filename');
    var sub_source   = sub_filename ? sub_filename : mp.get_property('filename');

    var from = cw_dir + "/" + sub_source;
    var to   = subFileSavePath(from);

    if (!fileExists(to)) {
        // Use blocking process, otherwise sed will run before file is created
        mp.command_native({
            name: "subprocess",
            capture_stdout: false,
            args: ["ffmpeg", "-i", "" + from + "", "-map", "0:s:0", "" + to + ""],
        });

        // TODO: Linux portability
        // + "\"sed -i 's#<[^>]*>##g' '" + to + "'\"");
        // Strip out html tags
        mp.command("run /usr/bin/env -S bash -c "
                    + "\"sed -i '' 's#<[^>]*>##g' '" + to + "'\"");
    }

    return to
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
