// http://www.tcax.org/docs/ass-specs.htm
var osd = mp.create_osd_overlay("ass-events");
var sub_chars;
var start = 0, end = 0;


function main() {
    if (!initSelection()) {
        mp.osd_message('No subtitles found');
        return false;
    }
    mp.add_key_binding("q", "move1", function () { moveSelection(true, 'left') });
    mp.add_key_binding("w", "move2", function () { moveSelection(false, 'left') });
    mp.add_key_binding("e", "move3", function () { moveSelection(false, 'right') });
    mp.add_key_binding("r", "move4", function () { moveSelection(true, 'right') });
}


// Create a new selection printing on osd
function initSelection() {
    sub_chars = [];
    var chars = mp.get_property('sub-text')
                  .replace('\n', '\\N')
                  .split('');

    for (var i = 0; i < chars.length; i++) {
        if (chars[i+1] + chars[i+2] === '\\N')
            sub_chars.push(chars[i] + chars[++i] + chars[++i])
        else
            sub_chars.push(chars[i]);
    }

    if (sub_chars.length === 0) return false;

    start = end = Math.floor(sub_chars.length / 2);   // Select middle character

    renderSelection();
    return true
}


// Write updated selection to osd
function renderSelection() {
    var ass_str = "";

    for (var i = 0; i < sub_chars.length; i++) {
        //if (i === start) ass_str += "{\\c&H530052&}";
        //if (i === start) ass_str += "{\\c&H60009D&}";
        //if (i === start) ass_str += "{\\c&H0F0F0F&}";

        if (i === start) ass_str += "{\\c&H1476B7&}";
        ass_str += sub_chars[i];
        if (i === end)   ass_str += "{\\c&HFFFFFF&}";
    }

    osd.data = ass_str;
    osd.update();
}


// Increase or decrease the selection. At least one character must be selected
function moveSelection(is_additive, side) {
    if (is_additive && side === 'left')
        start -= (start !== 0);
    else if (side === 'left')
        start += (start < end);
    else if (is_additive)
        end += (end !== sub_chars.length);
    else
        end -= start < end;

    renderSelection();
}


function saveSelection(save_dir) {
    if (sub_chars.length === 0) return;

    var save_file = "file://" + save_dir + "/word.txt";

    var selected = sub_chars.join('')
                            .replace(/\\N/g, '')    // Removes linebreaks
                            .slice(start, end + 1);
    osd.remove();
    sub_chars = [];

    mp.utils.append_file(save_file, selected);

    return selected
}

exports.main = main;
exports.saveSelection = saveSelection;
