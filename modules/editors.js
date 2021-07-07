const ExecEnv = require("./di-sh/interpreter/execEnv");
const { multiline_codeblock } = require("./textDecorations");
const { digitOnly, replace } = require("./string");
const { textInput, promptYesNo } = require("./di-sh/interpreter/input");
const { MessageEmbed } = require("discord.js");
const { saveScript, updateConfig } = require("./system/db");
const { startWithPrefix } = require("./di-sh/interpreter/contentFilters");
const { spawnProcess, createScriptEnv } = require("./di-sh/interpreter/interpreter");
const { stringifyConf } = require("./system/config");
const { removeQuote } = require("./textTransformations");
const { last } = require("./array");

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
        if(this.m_Undo.length)
        {
            const actions = this.m_Undo.pop()
            this.m_Redo.push(actions);
            return actions;
        }
    }
    redo()
    {
        if(this.m_Redo.length)
        {
            const actions = this.m_Redo.pop();
            this.m_Undo.push(actions);
            return actions;
        }
    }
    read()
    {
        let outputText = [...this.m_Content];

        for(let actions of this.m_Undo)outputText = EditorBuffer.apply(outputText, actions)
        return outputText;
    }
    applyOld()
    {
        while(this.m_Undo.length >= 30) this.m_Content = EditorBuffer.apply(this.m_Content, this.m_Undo.splice(0, 1));
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

class ObjEditorBuffer
{
    /**
     * 
     * @param {string} name 
     * @param {Map<string, string>} content 
     */
    constructor(name, content)
    {
        this.m_Name = name;
        this.m_Content = content;
        this.m_Undo = [];
        this.m_Redo = [];
    }
    write(actions)
    {
        this.m_Undo.push(actions);
        this.m_Redo = [];
    }
    undo()
    {
        if(this.m_Undo.length)
        {
            const actions = this.m_Undo.pop()
            this.m_Redo.push(actions);
            return actions;
        }
    }
    redo()
    {
        if(this.m_Redo.length)
        {
            const actions = this.m_Redo.pop();
            this.m_Undo.push(actions);
            return actions;
        }
    }
    read()
    {
        return ObjEditorBuffer.apply(this.m_Content, this.m_Undo);
    }
    applyOld()
    {
        while(this.m_Undo.length >= 30) this.m_Content = ObjEditorBuffer.apply(this.m_Content, this.m_Undo.splice(0, 1));
    }
    static apply(content, actions)
    {
        let updatedContent = new Map(content);
        for(let action of actions)updatedContent.set(action[0], action[1]);
        return updatedContent;
    }
    has(key)
    {
        return this.m_Content.has(key);
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
 * @param {Map} obj 
 */
 function displayObj(obj)
 {
     let editorDisplay = "";
     for(let data of obj)editorDisplay += `${editorDisplay.length ? "\n" : ""}${data[0]} = "${data[1]}"`;
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
    let display = new MessageEmbed().setColor("BLUE");
    
    let editorTitle = scriptName === null ? env.serverLocale.script_editor_title_new : replace(env.serverLocale.script_editor_title, ["$scriptName"], [scriptName]);
    
    let editorWindow = content;
    editorWindow += saved === null ? "" : ("\n" + replace(env.serverLocale.editors_components_save_indicator, ["$isSaved"], [(saved ? "█" : " ")]));
    
    editorWindow += (editorMsg.length ? "\n" + editorMsg : "");
    display.addField(editorTitle, editorWindow);


    if(clipboard !== null)
    {
        let clipboardText = (clipboard.length ? "" : "...");
        for(let i = 0; i < clipboard.length; i++)clipboardText += `${i ? "\n" : ""}${clipboard[i]}`;
        display.addField(env.serverLocale.editors_components_clipboard, multiline_codeblock(clipboardText));
    }

    return display;            
}

/**
 * 
 * @param {Client} client
 * @param {import("mariadb").PoolConnection} connection
 * @param {ExecEnv} env
 * @param {number} idleTimeout
 * @param {boolean} overwrite
 */

function scriptEditor(client, connection, env, idleTimeout, scriptData = {scriptName: null, script: []})//todo: default name
{
    return new Promise((resolve, reject) => {
        let script = new EditorBuffer(scriptData.scriptName, scriptData.script);
        let cursorPos = script.read().length - 1;
        let clipboard = [];
        let insert = true;
        let saved = true;
        env.channel.send(createDisplay(script.name, displayScript(script.read(), true, true, cursorPos), env, saved, clipboard))
            .then(editorWindow => {
                let collectorEnabled = true;
                const filter = msg => msg.author.id === env.user.id && collectorEnabled;
                const collector = env.channel.createMessageCollector(filter, {max: 100, idle: idleTimeout});

                collector.on("collect", async message => {
                    if(startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        const args = message.content.slice(env.serverConfig.getPrefix().length).split(" ");
                        switch(args[0])
                        {
                            case "s":
                            case "save":
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
                                    while((await connection.query("SELECT Script_ID FROM scripts WHERE Server_ID=? AND Script_name=?;", [env.server.id, newName])).length && !(await promptYesNo(env, replace(env.serverLocale.script_editor_save_overwrite_question, ["$scriptName"], [newName]), 12_000)));
                                    script.name = newName;
                                    collectorEnabled = true;
                                }
                                await saveScript(env, script.name, script.read());
                                saved = true;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;
                            case "q":
                            case "quit":
                                collector.stop("close");
                                break;

                            case "exe":
                            case "exec":
                            case "execute":
                                spawnProcess(createScriptEnv(env.copy()), env.processID, script.name + " test", script.read(), [], args.slice(1));//hardcoded process name
                                break;

                            case "i":
                            case "insert":
                                if(!digitOnly(args[1]))
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                        .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                    break;
                                }
                                var newPos = parseInt(args[1]);
                                cursorPos = (newPos - 1 <= script.read().length ? (newPos -1 > -2 ? newPos -1 : -1) : script.read().length);
                                insert = true;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "mv": // args: position
                            case "move":
                                if(!digitOnly(args[1]))
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                        .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                    break;
                                }
                                var newPos = parseInt(args[1]);
                                cursorPos = (newPos - 1 <= script.read().length ? (newPos -1 > -2 ? newPos -1 : -1) : script.read().length);
                                insert = false;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "c": // args: ?pos, ?pos2
                            case "cp":
                            case "copy":
                                if(args.length == 1)
                                {
                                    if(cursorPos < 0 || script.read().length < cursorPos)
                                    {
                                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                            .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                        return;
                                    }
                                    clipboard = [script.read()[cursorPos]];
                                }
                                else if(args.length == 2)
                                {
                                    if(!digitOnly(args[1]))
                                    {
                                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                }
                                else
                                {
                                    if(!digitOnly(args[1]) || !digitOnly(args[2]))
                                    {
                                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                            .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                        return;
                                    }
                                    clipboard = [];
                                    for(let i = selectFirst; i < selectLast+1; i++)clipboard.push(script.read()[i]);
                                }
                                insert = true;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "x": // args: ?pos, ?pos2
                            case "cut":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "\nError:\nCan't copy empty line"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            clipboard = [script.read()[cursorPos]];
                                            cursorPos--;
                                            script.write([new EditorAction(cursorPos, false, null)]);
                                            break;
                                        case 2:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                            if(line <= cursorPos)cursorPos--; 
                                            script.write([new EditorAction(line, false, null)]);
                                            break;
                                        case 3:
                                        default:
                                            if(!digitOnly(args[1]) || !digitOnly(args[2]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                            if(selectFirst < cursorPos && selectLast < cursorPos)cursorPos -= (selectLast+1)-(selectFirst+1)+1;
                                            else if(selectFirst < cursorPos)cursorPos -= (cursorPos+1)-(selectFirst+1)+1;
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    insert = true;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "p": // args: ?pos
                            case "paste":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            var actions = [];
                                            for(let i = 0; i < clipboard.length; i++)actions.push(new EditorAction(cursorPos, insert, clipboard[i]));
                                            cursorPos += clipboard.length;
                                            script.write(actions);
                                            break;
                                        case 2: //args: position
                                        default:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const line = parseInt(args[1])-1;
                                            if(line < 0 || script.read().length < line)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            var actions = [];
                                            for(let i = 0; i < clipboard.length; i++)actions.push(new EditorAction(line, true, clipboard[i]));
                                            if(line < cursorPos | (line == cursorPos && !insert))cursorPos += clipboard.length;
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    insert = true;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "rm": // args: ?pos, ?pos2
                            case "remove":
                                (() => {
                                    switch(args.length)
                                    {
                                        case 1:
                                            if(insert || cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            cursorPos--;
                                            script.write([new EditorAction(cursorPos, false, null)]);
                                            break;
                                        case 2:
                                            if(!digitOnly(args[1]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            const line = parseInt(args[1])-1;
                                            if(line < 0 || script.read().length < line)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            if(line <= cursorPos)cursorPos--;
                                            script.write([new EditorAction(line, false, null)]);
                                            break;
                                        case 3:
                                        default:
                                            if(!digitOnly(args[1]) || !digitOnly(args[2]))
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            let actions = [];
                                            for(let i = selectFirst; i < selectLast+1; i++)actions.push(new EditorAction(i, false, null));
                                            if(selectFirst < cursorPos && selectLast < cursorPos)cursorPos -= (selectLast+1)-(selectFirst+1)+1;
                                            else if(selectFirst < cursorPos)cursorPos -= (cursorPos+1)-(selectFirst+1)+1;
                                            script.write(actions);
                                            break;
                                    }
                                    saved = false;
                                    insert = true;
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                })();
                                break;

                            case "z":
                            case "undo":
                                var actions = script.undo();
                                if(actions[0].line == null)cursorPos = last(actions).pos;
                                else cursorPos = actions[0].pos;
                                insert = true;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;

                            case "y":
                            case "redo":
                                var actions = script.redo();
                                if(actions[0].line == null)cursorPos = last(actions).pos;
                                else cursorPos = actions[0].pos;
                                insert = true;
                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                                break;
                        }
                        message.delete();
                    }
                    else if(!startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        script.write([new EditorAction(cursorPos, insert, message.content)]);
                        message.delete();
                        saved = false;
                        if(insert)cursorPos++;
                        insert = true;
                        editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard));
                    }
                })
        
                collector.on("end", async (collected, reason) => {
                    editorWindow.edit(new MessageEmbed().setColor("BLUE").setTitle(replace(env.serverLocale.editors_closed_message, ["$bufferName"], [script.name])))
                        .then(closedMsg => setTimeout(() => closedMsg.delete(), 5_000));
                    if(reason === "close" || reason == "idle")
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

function configEditor(env, idleTimeout, configData = {name: null, data: new Map()})
{
    return new Promise((resolve, reject) => {
        let config = new ObjEditorBuffer(configData.name, configData.data);
        let saved = true;
        env.channel.send(createDisplay(config.name, displayObj(config.read()), env, saved, null))
            .then(editorWindow => {
                let collectorEnabled = true;
                const filter = msg => msg.author.id === env.user.id && collectorEnabled;
                const collector = env.channel.createMessageCollector(filter, {max: 100, idle: idleTimeout});

                collector.on("collect", async message => {
                    if(startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        const args = message.content.slice(env.serverConfig.getPrefix().length).split(" ");
                        switch(args[0])
                        {
                            case "q":
                            case "quit":
                                collector.stop("close");
                                break;

                            case "s":
                            case "save":
                                await updateConfig(env, config.name, stringifyConf(config.read()));
                                saved = true;
                                break;

                            case "z":
                            case "undo":
                                config.undo();
                                saved = false;
                                break;

                            case "y":
                            case "redo":
                                config.redo();
                                saved = false;
                                break;
                        }
                        editorWindow.edit(createDisplay(config.name, displayObj(config.read()), env, saved, null));
                        message.delete();
                    }
                    else if(!startWithPrefix(env.serverConfig.getPrefix(), message.content))
                    {
                        let editorMessage = "";
                        let line = message.content;
                        if(line.includes("="))
                        {
                            let separatorIndex = line.indexOf("=");
                            config.write([line.slice(0, separatorIndex).trim(), removeQuote(line.slice(separatorIndex+1).trim())]);
                            saved = false;
                        }
                        else editorMessage = "Syntax Error!!!";//hardcoded
                        message.delete();
                        editorWindow.edit(createDisplay(config.name, displayObj(config.read()), env, saved, null, editorMessage));
                    }
                })
        
                collector.on("end", async (collected, reason) => {
                    editorWindow.edit(new MessageEmbed().setColor("BLUE").setTitle(replace(env.serverLocale.editors_closed_message, ["$bufferName"], [script.name])))
                        .then(closedMsg => setTimeout(() => closedMsg.delete(), 5_000));
                    if(reason === "close" || reason == "idle")//todo: error catch
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
    ObjEditorBuffer,
    EditorAction,

    displayScript,
    displayObj,
    createDisplay,
    scriptEditor,
    configEditor
};