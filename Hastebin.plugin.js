/**
 * @name Hastebin
 * @author CT-1409
 * @version 1.0.0
 */

    const config = {
        info: {
            name: "Hastebin",
            authors: [
                {
                    name: "CT-1409",
                    discord_id: "272875632088842240",
                }
            ],
            version: "1.0.0",
            description: "Uploads text to https://hastebin.com",
        },
        changelog: [
            {"title": "Release", "items":[
                "Uploads text to https://hastebin.com",
                "If there is no message content, button doesn't appear (as there isn't anything to upload)"
            ]}
        ]
        
    };

    module.exports = !global.ZeresPluginLibrary ? class {

        constructor() {
            this._config = config;
        }
    
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, _response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
    
        start() { }
    
        stop() { }
    } : (([Plugin, Library]) => {

        const { Patcher, Toasts, WebpackModules, DCM } = Library;

        const { React } = BdApi
        return class Hastebin extends Plugin {
            constructor() {
                super();
            }

            async onStart() {
                this.patch()

            }

            patch() {
                const item = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")

                Patcher.after(item, "default", (_, args, component) => {
                    let props = args[0]
                    let message = props.message
                    if (message.content) {
                        let item = DCM.buildMenuItem({
                            label: "Create Hastebin",
                            type: "text",
                            action: () => {
                                require("request").post({
                                    url:     'https://hastebin.com/documents',
                                    body:    message.content
                                }, (error, _response, body) => {
                                    let data = JSON.parse(body)
                                    if (error || !data.key) return Toasts.error("There was an issue getting the Hastebin link from the message content")
                                    BdApi.alert("Hastebin Link", "https://hastebin.com/"+data.key)
                                });
                                
                            }
                        })
    
                        component.props.children.push(item)
                    }

                })

            }

            onLoad() {
            }

            onStop() {
                Patcher.unpatchAll();
            }

        }
    })(global.ZeresPluginLibrary.buildPlugin(config));
