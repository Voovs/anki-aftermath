// Edit these
var key_binds = {
    // Keys to move selection. Letters mean `move<side><plus or minus>`
    moveLP: "1",
    moveLM: "2",
    moveRM: "3",
    moveRP: "4",

    // Keys to exit the selection menu. One of these must be pressed before the
    // next menu can come up
    removeSel: "Q",
    saveSel: "R",
};


var g = {
    osd: mp.create_osd_overlay("ass-events"),
    sub_chars: undefined,
    sub_len: function () { return this.sub_chars.length },
    start: 0,
    end: 0,
};


function main() {
    if (!initSelection()) {
        mp.osd_message('No subtitles found');
        return false;
    }
    mp.add_forced_key_binding(key_binds.moveLP, "moveLP", function () { moveSelection(true, 'left') });
    mp.add_forced_key_binding(key_binds.moveLM, "moveLM", function () { moveSelection(false, 'left') });
    mp.add_forced_key_binding(key_binds.moveRM, "moveRM", function () { moveSelection(false, 'right') });
    mp.add_forced_key_binding(key_binds.moveRP, "moveRP", function () { moveSelection(true, 'right') });

    mp.add_forced_key_binding(key_binds.removeSel, "removeSel",
        function () { mp.command("script-message DiscardSelection") });
    mp.add_forced_key_binding(key_binds.saveSel, "saveSel",
        function () { mp.command("script-message SubmitSelection") });

    return true
}


// Create a new selection printing on OSD
// Returns true when a new selection has been created
function initSelection() {
    g.sub_chars = [];
    var chars = mp.get_property('sub-text')
                  .replace('\n', '\\N')
                  .split('');

    for (var i = 0; i < chars.length; i++) {
        if (chars[i+1] + chars[i+2] === '\\N')
            g.sub_chars.push(chars[i] + chars[++i] + chars[++i])
        else
            g.sub_chars.push(chars[i]);
    }

    if (g.sub_len() === 0) return false;

        // Select middle half of subs, the [1/4, 3/4] range
    g.start = Math.floor(g.sub_len() / 4);
    g.end   = Math.floor(g.sub_len() * 3 / 4);

    renderSelection();
    return true
}


// Write updated selection to osd
function renderSelection() {
    var ass_str = "";

    for (var i = 0; i < g.sub_len(); i++) {
        if (i === g.start) ass_str += "{\\c&H1476B7&}";
        ass_str += g.sub_chars[i];
        if (i === g.end)   ass_str += "{\\c&HFFFFFF&}";
    }

    g.osd.data = ass_str;
    g.osd.update();
}


// Increase or decrease the selection. At least one character must be selected
function moveSelection(is_additive, side) {
    if (is_additive && side === 'left')
        g.start -= (g.start !== 0);
    else if (side === 'left')
        g.start += (g.start < g.end);
    else if (is_additive)
        g.end += (g.end !== g.sub_len());
    else
        g.end -= g.start < g.end;

    renderSelection();
}


// Remove selection from OSD and reset it to as before
function clearSelection() {
    for (var bind in key_binds)
        mp.remove_key_binding(key_binds[bind]);
    g.osd.remove();
    g.sub_chars = [];
}


// Delimit the current selection in subtitles.txt. Clear the selection
function saveSelection(sub_file) {
    if (g.sub_len() === 0) return;

    var selected = g.sub_chars.join('')
                            .replace(/\\N/g, '')    // Removes linebreaks
                            .slice(g.start, g.end + 1);
    clearSelection();

    var selected_str = mp.utils.read_file(sub_file)
                               .replace(
                                   new RegExp(selected, 'g'),
                                   "::" + selected + "::");

    mp.utils.write_file("file://" + sub_file, selected_str);

    return selected
}

exports.main = main;
exports.saveSelection = saveSelection;
exports.clearSelection = clearSelection;

// Reference:
// http://www.tcax.org/docs/ass-specs.htm
