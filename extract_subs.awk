#!/usr/bin/env -S awk -f
# A stage machine for copying out a time range of subtitles from an .srt file.
# Should work with any >1989 awk implementation
#
# ARGS:
#   time <int>:  Starting time in milliseconds of cut
#   range <int>: How many milliseconds around the current time stamp to cut
#   title [str]: Optional. Name of file
#   output_file <str>: File to print all output to

BEGIN {
    time = int(time);
    lower_time = int(time - range);
    upper_time = int(time + range);

    relative_pos = "Before";  # Track if interval is [Before, In, After] `time`

    # Matches .srt time stamp format. In the unlikely case the subtitles
    # themselves match this expression, the output will be odd
    # Examples:
    #     00:00:26,059 --> 00:00:27,560
    #     20:23:35,647 --> 20:23:39,518
    is_time_line = "^[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3} --> [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}[:space:]*$";

    if (title) printf "%s\n", title >> output_file;

    printf "Subs from: %s to %s\n====\n\n",
               format_ms(lower_time),
               format_ms(upper_time) >> output_file;
}

$0 ~ is_time_line {
    match($0, / --> /);
    start_time = time_in_ms(substr($0, 0, RSTART));
    end_time   = time_in_ms(substr($0, RSTART + RLENGTH));

    # Prints any lines that are shown in the interval, even if only for 1ms
    is_printing = !(end_time < lower_time || upper_time < start_time);

    # Clearly delimits the subtitles that were displayed during the screenshot
    if (start_time <= time && time <= end_time) {
        print "Screenshot subs ====>>> "format_ms(start_time) >> output_file;
        prev_end = end_time;
        relative_pos = "In";
    } else if (relative_pos == "Before" && time < start_time) {
        print "Screenshot time (no subs) ====>>> "format_ms(time) >> output_file;
        relative_pos = "After";
    } else if (relative_pos == "In") {
        printf "======================= %s\n\n", format_ms(prev_end) >> output_file;
        relative_pos = "After";
    }

}

# Doesn't print .str file's subtitle timestamp and number
$0 !~ is_time_line && is_printing && !/^[0-9]+[:space:]*$/ {
    if ($0 !~ /^$/ || relative_pos != "In")
        print $0 >> output_file;
}


# Converts the .srt time format to milliseconds
# Examples:
#     time_in_ms("00:00:26,059") == 26059
#     time_in_ms("20:23:35,647") == 73415647
function time_in_ms(time,    a, b, secs) {
    split(time, a, ",");

    split(a[1], b, ":");
    secs = (b[1] * 3600) + (b[2] * 60) + b[3];

    return int(secs * 1000 + a[2])
}


# Human readable string for milliseconds
# Examples:
#     format_ms(42709)   == "00:00:42.709"
#     format_ms(3738472) == "01:02:18.472"
function format_ms(milli,    hours, mins, secs, ms) {
    secs  = int(substr(milli, 0, length(milli) - 3));
    ms    = substr(milli, length(milli) - 2);

    while (secs >= 3600) {
        secs -= 3600;
        hours++;
    }
    while (secs >= 60) {
        secs -= 60;
        mins++;
    }

    return sprintf("%.2d:%.2d:%.2d.%.3d", hours, mins, secs, ms)
}


# Printing logic:
    # < start_time
    # > end_time
    # || lower_time upper_time
    # Note that || are fixed while <> move
    #if (end_time < lower_time) {
    #    is_printing = 0;
    #    # - <>||
    #} else if (start_time <= lower_time && end_time <= upper_time) {
    #    is_printing = 1;
    #    # - <|>|
    #} else if (lower_time <= start_time && start_time <= upper_time && lower_time <= end_time && end_time <= upper_time) {
    #    is_printing = 1;
    #    # - |<>|
    #} else if (lower_time <= start_time && start_time <= upper_time && upper_time <= end_time) {
    #    is_printing = 1;
    #    # - |<|>
    #} else if (start_time <= lower_time && upper_time <= end_time) {
    #    is_printing = 1;
    #    # - <||>
    #} else if (upper_time < start_time) {
    #    is_printing = 0;
    #    # - ||<>
    #} else {
    #    printf "ERROR:\n\tSubtitle interval: %s --> %s\n\tTime Range: %s : %s\n", \
    #           format_ms(start_time), format_ms(end_time),\
    #           format_ms(lower_time), format_ms(upper_time) >> output_file;
    #}
