# Anki Aftermath v0.0.1
Make Anki cards *after* you finish watching. Currently very beta

Unlike the [excellent competitors](https://github.com/Ben-Kerman/immersive),
Anki Aftermath tries to be as unintrusive as possible. It sacrifices automatic
cards creation for an uninterrupted watching experience. The following
components are saved together in a separate directory, when saving a card:
 - Screenshot of current frame
 - Subtitles in a +/-X second range around the current time
 - Audio in a +/-X second range around the current time
 - Selected word clearly delimited in subtitles file

Typical use starts with hitting `t` at a section with subtitles you enjoy. The
player will pause and bring up a copy of the subtitles on the screen. Using
`qwer` navigation keys you can select the word[s] you liked. Once that's done,
hit `R` to save an continue watching, or `Q` to discard this selection. You can
then make Anki cards from the saved components at any time later

## Configuration
The current version does not support a config file. This may be added later. For
now, follow these steps to edit settings - there aren't all that many

 1. Navigate to the `opts` object in `./main.js`. Line 27 at time of writing
 2. Change the `root_save_dir` path. This is where the individual word
    directories will be saved to
 3. Adjust the `time_range`. A higher range means you're less likely to miss the
    right audio, though may take longer to edit later
 4. Navigate to the bottom of `./main.js`. You may change the keybinding that
    activates the saving process
 5. Navigate to `./select_word.js`. Near the top, modify the `key_binds` object
    to your preference. Defaults are listed below

## Keybindings

| Default key | Name | Description                                           |
| ----------- | ---- | ----------------------------------------------------- |
| **t** | AnkiAftermath | Initiate saving components at current time         |
| **q** | moveLP | **Increase** the selection by 1 character on the **left** |
| **w** | moveLM | **Decrease** the selection by 1 character on the **left** |
| **e** | moveRM | **Decrease** the selection by 1 character on the **right**  |
| **r** | moveRM | **Increase** the selection by 1 character on the **right**  |
| **Q** | removeSel | Discard the selection and delete the associated directory |
| **R** | removeSel | Saved the selection and continue watching |

## Dependencies
 * Unix - Does not work on windows. Tested on MacOS, though Linux/BSD should work too
 * `Awk` - Should work with any implementation after 1989
 * `bash`, `zsh`, or any shell that understands output redirection with `>`
 * `mkdir` - Must support the `-p` option properly
 * `rm` - Must support the `-r` option properly

