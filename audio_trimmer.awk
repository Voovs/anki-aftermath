#!/usr/bin/env -S awk -f
# A state machine for creating a audio_trimmer shellscript with subtitle start
# and end times passed as mark options
#
# ARGS:
#   time <int>:  Starting time in milliseconds of cut
#   range <int>: How many milliseconds around the current time stamp to cut
#   offset <int>: Subtitle offset in milliseconds
#   title [str]: Optional. Name of media
#   output_file <str>: File to print all output to
#
# Example output file:
#   #!/usr/bin/env bash
#   # Komi.Cant.Communicate.S01E12.Its.Just.the.Culture.Festival.1080p.NF.WEB-DL.DDP2.0.x264-NanDesuKa
#   audio_trimmer -m '6037' -m '7539' -s '8707' -e '11710' -m '11793' -m '15130' -m '17507' -m '19300' ./audio.mp3

BEGIN {
    time = int(time);
    offset = int(offset);
    lower_time = int(time - range);
    upper_time = int(time + range);

    # Matches .srt time stamp format. In the unlikely case the subtitles
    # themselves match this expression, the output will be odd
    # Examples:
    #     00:00:26,059 --> 00:00:27,560
    #     20:23:35,647 --> 20:23:39,518
    is_time_line = "^[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3} --> [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}[:space:]*$";

    printf "#!/usr/bin/env bash\n" >> output_file;
    if (title) printf "# %s\n", title >> output_file;
    printf "audio_trimmer " >> output_file;
}

$0 ~ is_time_line {
    match($0, / --> /);
    start_time = time_in_ms(substr($0, 0, RSTART));
    end_time   = time_in_ms(substr($0, RSTART + RLENGTH));

    is_printing = !(end_time < lower_time || upper_time < start_time);

    if (start_time <= time && time <= end_time) {
        printf "-s '%s' ", offsetTime(start_time) >> output_file;
        printf "-e '%s' ", offsetTime(end_time) >> output_file;
    } else if (is_printing) {
        printf "-m '%s' ", offsetTime(start_time) >> output_file;
        printf "-m '%s' ", offsetTime(end_time) >> output_file;
    }
}

END {
    printf "./audio.mp3\n" >> output_file;
    system("chmod 744 "output_file);
}


# Fix time to match audio file. Considers the offset of the title and the
# length of the audio file
function offsetTime(ms) {
    new_ms = ms - time + range + offset;

    if (new_ms < 0)
        new_ms = 0

    return new_ms
}

#offset +1s
#range 4s
#curr 8s
#time 10s
#
#new_ms = 8 - 10 + 4 + 1
#
#6-14


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
