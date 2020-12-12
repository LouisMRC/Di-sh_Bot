let strWidth = require("string-width");


function italic(str)
{
    return "*" + str + "*";
}
function bold(str)
{
    return "**" + str + "**";
}
function underline(str)
{
    return "__" + str + "__";
}
function strikethrough(str)
{
    return "~~" + str + "~~";
}

function codeblock(str)
{
    return "`" + str + "`";
}
function multiline_codeblock(str, language="")
{
    return "```" + language + "\n" + str + "\n```";
}

function quote(str)
{
    return "> " + str;
}
function multiline_quote(str)
{
    return ">>> " + str;
}

/**
 * 
 * @param {string} angleChar 
 * @param {string} horizontalLineChar 
 * @param {string} verticalLineChar 
 * @param {number} horizontalPadding 
 * @param {number} verticalPadding 
 * @param {string} textAlignement
 * @param {string} text 
 */
function windowedText(angleChar, horizontalLineChar, verticalLineChar, horizontalPadding, verticalPadding, textAlignement, text)
{
    const lines = text.split("\n");
    let window = "";
    let windowHeight = lines.length + 2*verticalPadding, windowWidth = horizontalPadding*2;
    for(let line of lines)if(line.length+2*horizontalPadding > windowWidth)
    {
        windowWidth = line.length+2*horizontalPadding;
        break;
    }
    console.log(`${windowHeight}   ${windowWidth}`);
    window += drawHorizontalLine(angleChar, horizontalLineChar, windowWidth);
    for(let i = 0; i < horizontalPadding; i++)window += `\n${drawHorizontalLine(verticalLineChar, " ", windowWidth)}`;
    for(let line of lines)
    {
        switch(textAlignement)
        {
            case "left":
                window += `\n${verticalLineChar}`
                for(let i = 0; i < horizontalPadding; i++)window += " ";
                window += line;
                for(let i = 0; i < windowWidth - (horizontalPadding + line.length); i++)window += " ";
                window += verticalLineChar;
                break;
            case "center":
                break;
            case "right":
                break;
            default:
                break
        }
    }
    for(let i = 0; i < horizontalPadding; i++)window += `\n${drawHorizontalLine(verticalLineChar, " ", windowWidth)}`;
    window += `\n${drawHorizontalLine(angleChar, horizontalLineChar, windowWidth)}`;
    return multiline_codeblock(window);
}

function drawHorizontalLine(extrmChar, lineChar, length)
{
    let line = extrmChar;
    for(let i = 0; i < length; i++)line+=lineChar;
    return line + extrmChar;
}

module.exports = {
    italic,
    bold,
    underline,
    strikethrough,
    
    codeblock,
    multiline_codeblock,
    
    quote,
    multiline_quote,
    windowedText
}