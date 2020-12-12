function removeQuote(str)
{
    if(str.startsWith('"') && str.endsWith('"'))return str.slice(1, -1);
    if(str.startsWith("'") && str.endsWith("'"))return str.slice(1, -1);
    return str;
}
function escape(str)
{
    const toEscape = [
        "*",
        "'",
        '"',
        "~",
        "_",
        "-",
        "|",
        "`"
    ];
    let output = "";
    for(let i of str)if(toEscape.includes(i))output += "\\" + i;
    return output;
}

module.exports = {
    removeQuote,
    escape
}