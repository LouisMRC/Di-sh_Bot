const ExecEnv = require("./di-sh/interpreter/execEnv");
const { multiline_codeblock } = require("./textDecorations");
const { digitOnly } = require("./string");
const { textInput, promptYesNo } = require("./di-sh/interpreter/input");
const { MessageEmbed } = require("discord.js");
const { saveScript } = require("./system/db");
const { commandFilter, startWithPrefix } = require("./di-sh/interpreter/contentFilters");
const { spawnProcess, createScriptEnv } = require("./di-sh/interpreter/interpreter");

class EditorBuffer
{
    constructor(name, content)
    {
        this.m_Name = name;
        this.m_Content = content;
        this.m_Undo = [];
        this.m_Redo = [];
    }
    write(actions)
    {
        this.m_Undo.push(actions)
        this.m_Redo = [];
    }
    undo()
    {
        if(this.m_Undo.length)this.m_Redo.push(this.m_Undo.pop());
    }
    redo()
    {
        if(this.m_Redo.length)this.m_Undo.push(this.m_Redo.pop());
    }
    read()
    {
        let outputText = [...this.m_Content];

        for(let actions of this.m_Undo)outputText = EditorBuffer.apply(outputText, actions)
        return outputText;
    }
    applyOld()
    {
        let i = 0;
        while(this.m_Undo.length >= 30)
        {
            this.m_Content = EditorBuffer.apply(this.m_Content, this.m_Undo.splice(0, 1));
            i++;
        }
    }
    static apply(content, actions)
    {
        let updatedContent = content;
        for(let i = actions.length - 1; i >= 0; i--)
        {
            if(actions[i].line === null)updatedContent.splice(actions[i].pos, 1);
            else if(actions[i].insert)updatedContent.splice(actions[i].pos + 1, 0, actions[i].line);
            else updatedContent[actions[i].pos] = actions[i].line;
        }
        return updatedContent;
    }

    get name()
    {
        return this.m_Name;
    }
}
class EditorAction
{
    constructor(pos, insert, line)
    {
        this.m_Pos = pos;
        this.m_Insert = insert;
        this.m_Line = line;
    }
    get pos()
    {
        return this.m_Pos;
    }
    get insert()
    {
        return this.m_Insert;
    }
    get line()
    {
        return this.m_Line;
    }
}

/**
 * 
 * @param {Array<string>} script 
 * @param {boolean} withCursor 
 * @param {boolean} insert 
 * @param {number} cursorPos 
 */
function displayScript(script, withCursor, insert, cursorPos = 0)
{
    let editorDisplay = (!script.length || (cursorPos === -1 && withCursor) ? "└>" : "") + (cursorPos === -1 && withCursor ? " \n" : "");
    for(let i = 0; i < script.length; i++)editorDisplay += `${i ? "\n" : ""}${i+1}  ${withCursor && !insert && i === cursorPos ? ">>> " : ""}${script[i]}${withCursor && insert && i === cursorPos ? "\n└> " : ""}`;
    return multiline_codeblock(editorDisplay);
}

/**
 * 
 * @param {string} scriptName
 * @param {string} content 
 * @param {ExecEnv} env
 * @param {boolean} saved
 * @param {Array<string>} clipboard
 * @param {string} editorMsg
 */
function createDisplay(scriptName, content, env, saved, clipboard, editorMsg = "")
{
    let editorTitle = scriptName === null ? env.serverLocale.script_editor_title_new : env.serverLocale.script_editor_title.replace("$scriptName", scriptName);
    
    let clipboardText = (clipboard.length ? "" : "...");
    for(let i = 0; i < clipboard.length; i++)clipboardText += `${i ? "\n" : ""}${clipboard[i]}`;

    let editorWindow = content;
    editorWindow += saved === null ? "" : env.serverLocale.script_editor_save_indicator.replace("$isSaved", saved ? "█" : " ");
    editorWindow += editorMsg;

    return new MessageEmbed()
                .setColor("BLUE")
                .addField(editorTitle, editorWindow)
                .addField("Clipboard:", multiline_codeblock(clipboardText));//hardcoded
}

/**
 * 
 * @param {Client} client
 * @param {import("mariadb").PoolConnection} connection
 * @param {ExecEnv} env
 * @param {number} idleTimeout
 * @param {boolean} overwrite
 */

function scriptEditor(client, connection, env, idleTimeout, scriptData = {scriptName: null, script: []})
{
    return new Promise((resolve, reject) => {
        let script = new EditorBuffer(scriptData.scriptName, scriptData.script)
        let cursorPos = -1;
        let clipboard = [];
        let insert = true;
        let saved = true;
        env.channel.send(createDisplay(script.name, displayScript(script.read(), true, true), env, saved, clipboard))
            .then(editorWindow => {
                let collectorEnabled = true;
                const filter = msg => msg.author.id === env.user.id && collectorEnabled;
                const collector = env.channel.createMessageCollector(filter, {max: 100, idle: idleTimeout});

                collector.on("collect", async message => {
                    if(message.content.startsWith(`${env.serverConfig.getPrefix()}save`))
                    {
                        if(script.name === null)
                        {
                            collectorEnabled = false;
                            let newName;
                            do
                            {
                                    await textInput(env, env.serverLocale.script_editor_save_create_name, 60_000, true)
                                    .then(answer => newName = answer.toLowerCase())
                                    .catch(err => {
                                        collector.stop(`save: ${err}`);
                                        return;
                                    });
                            }
                            while((await connection.query("SELECT Script_ID FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, newName])).length && !(await promptYesNo(env, env.serverLocale.script_editor_save_overwrite_question.replace("$scriptName", newName), 12_000)));
                            script.name = newName;
                            collectorEnabled = true;
                        }
                        await saveScript(env, script.name, script.read());
                        saved = true;
                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                        message.delete();
                    }
                    else if(startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        const args = message.content.slice(env.serverConfig.getPrefix().length).split(" ");
                        switch(args[0])
                        {
                            case "q":
                            case "quit":
                                collector.stop("close");
                                break;

                            case "exe":
                            case "exec":
                            case "execute":
                                spawnProcess(createScriptEnv(env.copy()), env.processID, script.name + " test", script.read());//hardcoded process name
                                break;

                            case "insert":
                                if(!digitOnly(args[1]))
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                        .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                    break;
                                }
                                var newPos = parseInt(args[1]);
                                cursorPos = (newPos - 1 <= script.read().length ? (newPos -1 > -2 ? newPos -1 : -1) : script.read().length);
                                insert = true
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "mv":
                            case "move":
                                if(!digitOnly(args[1]))
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                        .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                    break;
                                }
                                var newPos = parseInt(args[1]);
                                cursorPos = (newPos - 1 <= script.read().length ? (newPos -1 > -2 ? newPos -1 : -1) : script.read().length);
                                insert = false;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "c":
                            case "cp":
                            case "copy":
                                clipboard = [script.read()[cursorPos]];
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "x":
                            case "cut":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(insert || cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            clipboard = [script.read()[cursorPos]];
                                            script.write([new EditorAction(cursorPos, false, null)]);
                                            break;
                                        case 2:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const line = parseInt(args[1])-1;
                                            if(line < 0 || script.read().length < line)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            clipboard = [script.read()[line]];
                                            script.write([new EditorAction(line, false, null)]);
                                            break;
                                        case 3:
                                        default:
                                            if(!digitOnly(args[1]) || !digitOnly(args[2]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const selectFirst = parseInt(args[1])-1;
                                            const selectLast = parseInt(args[2])-1;
                                            if(selectFirst < 0 || script.read().length < selectFirst || selectLast < 0 || script.read().length < selectLast)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            if(selectLast <= selectFirst)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            clipboard = [];
                                            let actions = [];
                                            for(let i = selectFirst; i < selectLast+1; i++)
                                            {
                                                clipboard.push(script.read()[i]);
                                                actions.push(new EditorAction(i, false, null))
                                            }
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "p":
                            case "paste":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(insert || cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            var actions = [];
                                            for(let i = clipboard.length-1; i >= 0; i--)actions.push(new EditorAction(cursorPos, false, clipboard[i]));
                                            script.write(actions);
                                            break;
                                        case 2:
                                        default:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const line = parseInt(args[1])-1;
                                            if(line < 0 || script.read().length < line)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            var actions = [];
                                            for(let i = clipboard.length-1; i >= 0; i--)actions.push(new EditorAction(line, false, clipboard[i]));
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "rm":
                            case "remove":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(insert || cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            script.write([new EditorAction(cursorPos, false, null)]);
                                            break;
                                        case 2:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const line = parseInt(args[1])-1;
                                            if(line < 0 || script.read().length < line)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            script.write([new EditorAction(line, false, null)]);
                                            break;
                                        case 3:
                                        default:
                                            if(!digitOnly(args[1]) || !digitOnly(args[2]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const selectFirst = parseInt(args[1])-1;
                                            const selectLast = parseInt(args[2])-1;
                                            if(selectFirst < 0 || script.read().length < selectFirst || selectLast < 0 || script.read().length < selectLast)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            if(selectLast <= selectFirst)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nBad Input"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            let actions = [];
                                            for(let i = selectFirst; i < selectLast+1; i++)actions.push(new EditorAction(i, false, null));
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "z":
                            case "undo":
                                script.undo();
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "y":
                            case "redo":
                                script.redo();
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;
                        }
                        message.delete();
                    }
                    else if(!startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        script.write([new EditorAction(cursorPos, insert, message.content)]);
                        message.delete();
                        insert = true;
                        saved = false;
                        cursorPos++;
                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                    }
                })
        
                collector.on("end", async (collected, reason) => {
                    if(reason === "close")
                    {
                        resolve(reason);
                    }
                    else
                    {
                        reject(reason);
                    }
                });
            });
    })
}

module.exports = {
    EditorBuffer,
    EditorAction,

    displayScript,
    createDisplay,
    scriptEditor
}