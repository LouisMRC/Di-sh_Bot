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
        if(this.m_Undo.length)this.m_Redo.push(this.m_Undo.pop());
    }
    redo()
    {
        if(this.m_Redo.length)this.m_Undo.push(this.m_Redo.pop());
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

                            case "insert":
                                if(!digitOnly(args[1]))
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.editors_errors_bad_input))
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
                                if(insert)
                                {
                                    editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, env.serverLocale.script_editors_errors_copy_empty_line))
                                        .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                    break;
                                }
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
                                            if(cursorPos < 0 || script.read().length < cursorPos)
                                            {
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
                                            var actions = [];
                                            for(let i = clipboard.length-1; i >= 0; i--)actions.push(new EditorAction(cursorPos, insert, clipboard[i]));
                                            script.write(actions);
                                            break;
                                        case 2:
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
                                                editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard, "Error"))//hardcoded
                                                    .then(() => setTimeout(() => editorWindow.edit(createDisplay(script.name, displayScript(script.read(), true, insert, cursorPos), env, saved, clipboard)), 5_000));
                                                return;
                                            }
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
                        let line = message.content
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
    ObjEditorBuffer,
    EditorAction,

    displayScript,
    displayObj,
    createDisplay,
    scriptEditor,
    configEditor
};